import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  Prisma,
  RoleMembre,
  StatutAdhesion,
  StatutCommande,
  StatutPaiement,
  StatutRemboursement,
  TypeMouvementStock,
} from '@prisma/client';
import Groq from 'groq-sdk';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { StoreOrdersService } from '../orders/store-orders.service';
import { UpdateStoreOrderStatusDto } from '../orders/dto/update-store-order-status.dto';
import { OpticianAssistantMessageDto } from './assistant.dto';
import { buildOpticianAssistantPrompt } from './assistant.prompt';
import { OPTICIAN_ASSISTANT_TOOLS } from './assistant.tools';

type AssistantProposal = {
  token: string;
  type: 'stock_adjustment' | 'order_status_change';
  label: string;
  from: number | string;
  to: number | string;
  reason: string;
  expiresAt: string;
};

type ProposalPayload = {
  version: 1;
  sub: string;
  storeId: string;
  proposalId: string;
  type: AssistantProposal['type'];
  entityId: string;
  before: number | string;
  after: number | string;
  reason: string;
  exp: number;
};

type StoreContext = {
  storeName: string;
  firstName: string;
  lastName: string;
  role: RoleMembre;
  permissions: Set<string>;
};

type DateRange = { from: Date; to: Date; fromLabel: string; toLabel: string };

const ORDER_WORK_STATUSES = [
  StatutCommande.PAYE,
  StatutCommande.CONFIRME,
  StatutCommande.EN_TRAITEMENT,
  StatutCommande.PRET_A_RETIRER,
  StatutCommande.EXPEDIE,
] as const;

const REVENUE_ORDER_STATUSES = [
  StatutCommande.PAYE,
  StatutCommande.CONFIRME,
  StatutCommande.EN_TRAITEMENT,
  StatutCommande.PRET_A_RETIRER,
  StatutCommande.EXPEDIE,
  StatutCommande.TERMINE,
  StatutCommande.REMBOURSE,
  StatutCommande.PARTIELLEMENT_REMBOURSE,
] as const;

const ORDER_TRANSITIONS: Partial<Record<StatutCommande, StatutCommande[]>> = {
  [StatutCommande.EN_ATTENTE_PAIEMENT]: [StatutCommande.ANNULE],
  [StatutCommande.PAYE]: [StatutCommande.CONFIRME],
  [StatutCommande.CONFIRME]: [StatutCommande.EN_TRAITEMENT],
  [StatutCommande.EN_TRAITEMENT]: [
    StatutCommande.PRET_A_RETIRER,
    StatutCommande.EXPEDIE,
  ],
  [StatutCommande.PRET_A_RETIRER]: [StatutCommande.TERMINE],
  [StatutCommande.EXPEDIE]: [StatutCommande.TERMINE],
};

const MAX_TOOL_LOOPS = 6;
const MAX_HISTORY = 12;

@Injectable()
export class OpticianAssistantService {
  private readonly logger = new Logger(OpticianAssistantService.name);
  private client?: Groq;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storeAuthorization: StoreAuthorizationService,
    private readonly inventory: InventoryService,
    private readonly storeOrders: StoreOrdersService,
  ) {}

  get hasKey(): boolean {
    return Boolean(process.env.GROQ_API_KEY);
  }

  private getClient(): Groq {
    if (!this.client) {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        throw new InternalServerErrorException(
          'GROQ_API_KEY manquante côté serveur.',
        );
      }
      this.client = new Groq({ apiKey });
    }
    return this.client;
  }

  async run(
    userId: string,
    storeId: string,
    rawMessages: OpticianAssistantMessageDto[],
  ): Promise<{ reply: string; proposals: AssistantProposal[] }> {
    const storeContext = await this.getStoreContext(userId, storeId);
    const messages = this.sanitizeMessages(rawMessages);
    const context = {
      storeName: storeContext.storeName,
      firstName: storeContext.firstName,
      lastName: storeContext.lastName,
      role: storeContext.role,
      permissions: [...storeContext.permissions].sort(),
      dateTime: new Intl.DateTimeFormat('fr-TN', {
        timeZone: 'Africa/Tunis',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date()),
    };
    const conversation: Array<Record<string, unknown>> = [
      { role: 'system', content: buildOpticianAssistantPrompt(context) },
      ...messages,
    ];
    const proposals: AssistantProposal[] = [];

    for (let loop = 0; loop < MAX_TOOL_LOOPS; loop += 1) {
      let completion;
      try {
        completion = await this.getClient().chat.completions.create({
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages: conversation as never,
          tools: [...OPTICIAN_ASSISTANT_TOOLS],
          tool_choice: 'auto',
          temperature: 0.2,
          max_tokens: 1200,
        });
      } catch (error) {
        this.logger.error(
          'Groq request failed',
          error instanceof Error ? error.stack : undefined,
        );
        if (
          typeof error === 'object' &&
          error !== null &&
          'status' in error &&
          error.status === 429
        ) {
          throw new BadGatewayException(
            'Le service IA est temporairement saturé. Réessayez dans quelques secondes.',
          );
        }
        throw new BadGatewayException(
          'Le service IA est momentanément indisponible.',
        );
      }

      const message = completion.choices[0]?.message;
      if (!message) {
        throw new BadGatewayException(
          'Le service IA n’a pas retourné de réponse exploitable.',
        );
      }
      const calls = message.tool_calls ?? [];
      if (calls.length === 0) {
        const reply = (message.content ?? '').trim();
        if (!reply) {
          throw new BadGatewayException(
            'Le service IA a retourné une réponse vide.',
          );
        }
        return { reply, proposals };
      }

      conversation.push({
        role: 'assistant',
        content: message.content ?? '',
        tool_calls: calls,
      });

      for (const call of calls) {
        const args = this.parseToolArguments(call.function.arguments);
        const result = await this.executeTool(
          userId,
          storeId,
          call.function.name,
          args,
        );
        if (result.proposal) proposals.push(result.proposal);
        conversation.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(
            result.proposal
              ? {
                  proposal_prepared: true,
                  type: result.proposal.type,
                  label: result.proposal.label,
                  from: result.proposal.from,
                  to: result.proposal.to,
                  reason: result.proposal.reason,
                }
              : result.data,
          ),
        });
      }
    }

    throw new BadGatewayException(
      'L’assistant n’a pas pu finaliser la réponse. Reformulez votre demande.',
    );
  }

  async confirmProposal(
    userId: string,
    storeId: string,
    token: string,
  ): Promise<Record<string, unknown>> {
    const proposal = this.verifyProposal(token, userId, storeId);
    if (proposal.type === 'stock_adjustment') {
      const before = this.requireInteger(proposal.before, 'quantité initiale');
      const after = this.requireInteger(proposal.after, 'quantité proposée');
      const delta = after - before;
      if (delta === 0) {
        throw new ConflictException(
          'La quantité proposée est identique à la quantité actuelle.',
        );
      }
      await this.inventory.createMovement(
        userId,
        storeId,
        proposal.entityId,
        {
          type: TypeMouvementStock.AJUSTEMENT,
          quantite: delta,
          note: proposal.reason,
        },
        before,
      );
      const updated = await this.inventory.find(
        userId,
        storeId,
        proposal.entityId,
      );
      return {
        confirmed: true,
        type: proposal.type,
        quantityOnHand: updated.quantite_disponible,
      };
    }

    if (proposal.type === 'order_status_change') {
      const before = this.requireOrderStatus(proposal.before);
      const after = this.requireOrderStatus(proposal.after);
      const input: UpdateStoreOrderStatusDto = {
        status: after,
        note: proposal.reason,
      };
      const updated = await this.storeOrders.updateStatus(
        userId,
        storeId,
        proposal.entityId,
        input,
        before,
      );
      return {
        confirmed: true,
        type: proposal.type,
        orderNumber: updated.numero_commande,
        status: updated.statut,
      };
    }

    throw new BadRequestException('Type de proposition invalide.');
  }

  private async getStoreContext(
    userId: string,
    storeId: string,
  ): Promise<StoreContext & { storeName: string }> {
    const membership = await this.storeAuthorization.requireActiveMembership(
      userId,
      storeId,
    );
    const store = await this.prisma.magasin.findFirst({
      where: { id: storeId, supprime_le: null },
      select: { nom: true },
    });
    const user = await this.prisma.utilisateur.findFirst({
      where: { id: userId, supprime_le: null },
      select: { prenom: true, nom: true },
    });
    if (!store || !user) {
      throw new NotFoundException('Boutique ou utilisateur introuvable.');
    }
    return {
      storeName: store.nom,
      firstName: user.prenom,
      lastName: user.nom,
      role: membership.role,
      permissions: this.storeAuthorization.effectivePermissions(membership),
    };
  }

  private sanitizeMessages(
    messages: OpticianAssistantMessageDto[],
  ): Array<{ role: 'user'; content: string }> {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new BadRequestException('Un message utilisateur est requis.');
    }
    const userMessages = messages
      .filter(
        (message): message is OpticianAssistantMessageDto =>
          message?.role === 'user' && typeof message.content === 'string',
      )
      .slice(-MAX_HISTORY)
      .map((message) => ({
        role: 'user' as const,
        content: message.content.slice(0, 2000),
      }));
    if (userMessages.length === 0) {
      throw new BadRequestException('Un message utilisateur est requis.');
    }
    return userMessages;
  }

  private parseToolArguments(raw: string): Record<string, unknown> {
    let value: unknown;
    try {
      value = JSON.parse(raw || '{}');
    } catch {
      throw new BadRequestException('Arguments d’outil invalides.');
    }
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new BadRequestException('Arguments d’outil invalides.');
    }
    return value as Record<string, unknown>;
  }

  private async executeTool(
    userId: string,
    storeId: string,
    name: string,
    args: Record<string, unknown>,
  ): Promise<{ data: unknown; proposal?: AssistantProposal }> {
    switch (name) {
      case 'search_inventory':
        return { data: await this.searchInventory(userId, storeId, args) };
      case 'list_low_stock':
        return { data: await this.listLowStock(userId, storeId) };
      case 'stock_movements':
        return { data: await this.stockMovements(userId, storeId, args) };
      case 'list_orders':
        return { data: await this.listOrders(userId, storeId, args) };
      case 'order_details':
        return { data: await this.orderDetails(userId, storeId, args) };
      case 'failed_payments':
        return { data: await this.failedPayments(userId, storeId) };
      case 'refunds':
        return { data: await this.refunds(userId, storeId, args) };
      case 'appointments':
        return { data: await this.appointments(userId, storeId, args) };
      case 'revenue':
        return { data: await this.revenue(userId, storeId, args) };
      case 'my_profile':
        return { data: await this.myProfile(userId, storeId) };
      case 'team_member':
        return { data: await this.teamMember(userId, storeId, args) };
      case 'recent_activity':
        return { data: await this.recentActivity(userId, storeId, args) };
      case 'prepare_stock_adjustment':
        return {
          data: null,
          proposal: await this.prepareStockAdjustment(
            userId,
            storeId,
            args,
          ),
        };
      case 'prepare_order_status_change':
        return {
          data: null,
          proposal: await this.prepareOrderStatusChange(
            userId,
            storeId,
            args,
          ),
        };
      default:
        throw new BadRequestException('Outil assistant inconnu.');
    }
  }

  private async searchInventory(
    userId: string,
    storeId: string,
    args: Record<string, unknown>,
  ) {
    await this.storeAuthorization.requirePermission(
      userId,
      storeId,
      'inventory.view',
    );
    const query = this.stringArgument(args, 'query', 120);
    const contains = { contains: query, mode: 'insensitive' as const };
    const stocks = await this.prisma.stock.findMany({
      where: {
        location: { magasin_id: storeId },
        OR: [
          { marque_reference: contains },
          {
            variante_annonce: {
              is: {
                reference_magasin: contains,
              },
            },
          },
          {
            variante_annonce: {
              is: {
                code_barres_magasin: contains,
              },
            },
          },
          {
            variante_annonce: {
              is: {
                variante: {
                  is: {
                    OR: [
                      { code_barres: contains },
                      { couleur: contains },
                      { variantName: contains },
                      {
                        produit: {
                          is: {
                            OR: [
                              { nom: contains },
                              { marque: contains },
                            ],
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        quantite_disponible: true,
        quantite_reservee: true,
        seuil_reapprovisionnement: true,
        marque_reference: true,
        type_article: true,
        variante_annonce: {
          select: {
            reference_magasin: true,
            code_barres_magasin: true,
            variante: {
              select: {
                variantName: true,
                code_barres: true,
                couleur: true,
                produit: { select: { nom: true, marque: true } },
              },
            },
          },
        },
        location: { select: { nom: true } },
      },
      orderBy: { modifie_le: 'desc' },
      take: 10,
    });
    return stocks.map((stock) => ({
      id: stock.id,
      produit:
        stock.variante_annonce?.variante.produit.nom ??
        stock.variante_annonce?.variante.variantName ??
        'Article sans nom',
      reference:
        stock.variante_annonce?.reference_magasin ??
        stock.marque_reference ??
        null,
      codeBarres:
        stock.variante_annonce?.code_barres_magasin ??
        stock.variante_annonce?.variante.code_barres ??
        null,
      marque: stock.variante_annonce?.variante.produit.marque ?? null,
      couleur: stock.variante_annonce?.variante.couleur ?? null,
      type: stock.type_article,
      emplacement: stock.location.nom,
      quantityOnHand: stock.quantite_disponible,
      quantityReserved: stock.quantite_reservee,
      available:
        stock.quantite_disponible - stock.quantite_reservee,
      reorderThreshold: stock.seuil_reapprovisionnement,
    }));
  }

  private async listLowStock(userId: string, storeId: string) {
    await this.storeAuthorization.requirePermission(
      userId,
      storeId,
      'inventory.view',
    );
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        product_name: string | null;
        reference: string | null;
        barcode: string | null;
        brand: string | null;
        color: string | null;
        location_name: string;
        quantity_on_hand: number;
        quantity_reserved: number;
        reorder_level: number;
      }>
    >(Prisma.sql`
      SELECT s.id,
        COALESCE(p.nom, vp."variant_name", s."brand_reference") AS product_name,
        COALESCE(va."store_sku", s."brand_reference") AS reference,
        COALESCE(va."store_barcode", vp."barcode") AS barcode,
        p."brand" AS brand,
        vp."color" AS color,
        l.nom AS location_name,
        s."quantity_on_hand" AS quantity_on_hand,
        s."quantity_reserved" AS quantity_reserved,
        s."reorder_level" AS reorder_level
      FROM "stocks" s
      INNER JOIN "emplacements_stock" l ON l.id = s."location_id"
      LEFT JOIN "variantes_annonces" va ON va.id = s."store_listing_variant_id"
      LEFT JOIN "annonces_magasins" a ON a.id = va."listing_id"
      LEFT JOIN "produits" p ON p.id = a."produit_id"
      LEFT JOIN "variantes_produits" vp ON vp.id = va."variante_id"
      WHERE l."magasin_id" = ${storeId}::uuid
        AND l."is_active" = true
        AND s."quantity_on_hand" - s."quantity_reserved" <= s."reorder_level"
      ORDER BY (s."quantity_on_hand" - s."quantity_reserved") ASC, product_name ASC
      LIMIT 20
    `);
    return rows.map((row) => ({
      id: row.id,
      product: row.product_name ?? 'Article sans nom',
      reference: row.reference,
      barcode: row.barcode,
      brand: row.brand,
      color: row.color,
      location: row.location_name,
      available: row.quantity_on_hand - row.quantity_reserved,
      reorderThreshold: row.reorder_level,
    }));
  }

  private async stockMovements(
    userId: string,
    storeId: string,
    args: Record<string, unknown>,
  ) {
    await this.storeAuthorization.requirePermission(
      userId,
      storeId,
      'inventory.view_history',
    );
    const stockId = this.uuidArgument(args, 'stock_id');
    const days =
      args.days === undefined ? 30 : this.integerArgument(args, 'days', 1, 365);
    const stock = await this.prisma.stock.findFirst({
      where: { id: stockId, location: { magasin_id: storeId } },
      select: { id: true },
    });
    if (!stock) throw new NotFoundException('Article introuvable dans cette boutique.');
    const from = new Date();
    from.setDate(from.getDate() - days);
    const movements = await this.prisma.mouvementStock.findMany({
      where: { stock_id: stockId, cree_le: { gte: from } },
      select: {
        type: true,
        quantite: true,
        quantite_precedente: true,
        quantite_suivante: true,
        reserve_precedente: true,
        reserve_suivante: true,
        cree_le: true,
      },
      orderBy: { cree_le: 'desc' },
      take: 30,
    });
    return movements;
  }

  private async listOrders(
    userId: string,
    storeId: string,
    args: Record<string, unknown>,
  ) {
    await this.storeAuthorization.requirePermission(
      userId,
      storeId,
      'orders.view',
    );
    const where: Prisma.CommandeWhereInput = {
      magasin_id: storeId,
      statut: { in: [...ORDER_WORK_STATUSES] },
    };
    if (typeof args.status === 'string' && args.status.length > 0) {
      const status = this.orderStatus(args.status);
      where.statut = status;
    }
    if (typeof args.query === 'string' && args.query.trim()) {
      const query = args.query.trim().slice(0, 80);
      where.numero_commande = { contains: query, mode: 'insensitive' };
    }
    const orders = await this.prisma.commande.findMany({
      where,
      select: {
        id: true,
        numero_commande: true,
        statut: true,
        cree_le: true,
        devise: true,
      },
      orderBy: { cree_le: 'desc' },
      take: 10,
    });
    return orders;
  }

  private async orderDetails(
    userId: string,
    storeId: string,
    args: Record<string, unknown>,
  ) {
    const membership = await this.storeAuthorization.requirePermission(
      userId,
      storeId,
      'orders.view',
    );
    const reference = this.stringArgument(args, 'reference', 80);
    const canViewFinancials =
      (membership.role === RoleMembre.PROPRIETAIRE ||
        membership.role === RoleMembre.GERANT) &&
      this.storeAuthorization
        .effectivePermissions(membership)
        .has('dashboard.view_financials');
    const order = await this.prisma.commande.findFirst({
      where: {
        magasin_id: storeId,
        OR: [
          { numero_commande: { equals: reference, mode: 'insensitive' } },
          ...(isUuid(reference) ? [{ id: reference }] : []),
        ],
      },
      select: {
        id: true,
        numero_commande: true,
        statut: true,
        devise: true,
        cree_le: true,
        articles: {
          select: {
            instantane_nom_produit: true,
            instantane_reference: true,
            quantite: true,
          },
        },
        ...(canViewFinancials ? { total_general: true } : {}),
      },
    });
    if (!order) throw new NotFoundException('Commande introuvable dans cette boutique.');
    return order;
  }

  private async failedPayments(userId: string, storeId: string) {
    await this.requireFinanceAccess(userId, storeId, 'transactions.view');
    const payments = await this.prisma.paiement.findMany({
      where: {
        statut: StatutPaiement.ECHOUE,
        order: { magasin_id: storeId },
      },
      select: {
        statut: true,
        cree_le: true,
        order: { select: { numero_commande: true } },
      },
      orderBy: { cree_le: 'desc' },
      take: 20,
    });
    return payments.map((payment) => ({
      orderNumber: payment.order.numero_commande,
      status: payment.statut,
      date: payment.cree_le,
    }));
  }

  private async refunds(
    userId: string,
    storeId: string,
    args: Record<string, unknown>,
  ) {
    await this.requireFinanceAccess(
      userId,
      storeId,
      'transactions.view_refunds',
    );
    const range = this.dateRange(args);
    const rows = await this.prisma.remboursement.findMany({
      where: {
        order: { magasin_id: storeId },
        cree_le: { gte: range.from, lte: range.to },
      },
      select: {
        montant: true,
        devise: true,
        statut: true,
        cree_le: true,
        traite_le: true,
        order: { select: { numero_commande: true } },
      },
      orderBy: { cree_le: 'desc' },
      take: 30,
    });
    return {
      period: { from: range.fromLabel, to: range.toLabel },
      refunds: rows.map((refund) => ({
        orderNumber: refund.order.numero_commande,
        amount: roundAmount(Number(refund.montant)),
        currency: refund.devise,
        status: refund.statut,
        createdAt: refund.cree_le,
        processedAt: refund.traite_le,
      })),
    };
  }

  private async appointments(
    userId: string,
    storeId: string,
    args: Record<string, unknown>,
  ) {
    await this.storeAuthorization.requirePermission(
      userId,
      storeId,
      'appointments.view',
    );
    const range = this.dateRange(args, 1);
    const rows = await this.prisma.rendezVous.findMany({
      where: {
        magasin_id: storeId,
        commence_le: { gte: range.from, lte: range.to },
      },
      select: {
        statut: true,
        type_service: true,
        commence_le: true,
        termine_le: true,
      },
      orderBy: { commence_le: 'asc' },
      take: 30,
    });
    return {
      period: { from: range.fromLabel, to: range.toLabel },
      appointments: rows,
    };
  }

  private async revenue(
    userId: string,
    storeId: string,
    args: Record<string, unknown>,
  ) {
    await this.requireFinanceAccess(
      userId,
      storeId,
      'dashboard.view_financials',
    );
    const range = this.dateRange(args);
    const [payments, refunds, orders, daily] = await Promise.all([
      this.prisma.paiement.groupBy({
        by: ['devise'],
        where: {
          order: { magasin_id: storeId },
          statut: {
            in: [
              StatutPaiement.REUSSI,
              StatutPaiement.REMBOURSE,
              StatutPaiement.PARTIELLEMENT_REMBOURSE,
            ],
          },
          paye_le: { gte: range.from, lte: range.to },
        },
        _sum: { montant: true },
      }),
      this.prisma.remboursement.groupBy({
        by: ['devise'],
        where: {
          order: { magasin_id: storeId },
          statut: StatutRemboursement.REUSSI,
          traite_le: { gte: range.from, lte: range.to },
        },
        _sum: { montant: true },
      }),
      this.prisma.commande.groupBy({
        by: ['devise'],
        where: {
          magasin_id: storeId,
          statut: { in: [...REVENUE_ORDER_STATUSES] },
          cree_le: { gte: range.from, lte: range.to },
        },
        _count: { _all: true },
        _sum: { total_general: true },
      }),
      this.prisma.$queryRaw<
        Array<{
          day: string;
          currency: string;
          gross: Prisma.Decimal;
          refunds: Prisma.Decimal;
        }>
      >(Prisma.sql`
        SELECT ledger.day, ledger.currency,
          COALESCE(SUM(ledger.amount) FILTER (WHERE ledger.kind = 'PAYMENT'), 0)::numeric(12, 3) AS gross,
          COALESCE(SUM(ledger.amount) FILTER (WHERE ledger.kind = 'REFUND'), 0)::numeric(12, 3) AS refunds
        FROM (
          SELECT to_char((p."paid_at" AT TIME ZONE 'Africa/Tunis')::date, 'YYYY-MM-DD') AS day,
            p."currency" AS currency, p."amount" AS amount, 'PAYMENT' AS kind
          FROM "paiements" p
          INNER JOIN "commandes" o ON o.id = p."order_id"
          WHERE o."magasin_id" = ${storeId}::uuid
            AND p."paid_at" >= ${range.from} AND p."paid_at" <= ${range.to}
            AND p."status"::text IN ('SUCCEEDED', 'REFUNDED', 'PARTIALLY_REFUNDED')
          UNION ALL
          SELECT to_char((r."processed_at" AT TIME ZONE 'Africa/Tunis')::date, 'YYYY-MM-DD') AS day,
            r."currency" AS currency, r."amount" AS amount, 'REFUND' AS kind
          FROM "remboursements" r
          INNER JOIN "commandes" o ON o.id = r."order_id"
          WHERE o."magasin_id" = ${storeId}::uuid
            AND r."processed_at" >= ${range.from} AND r."processed_at" <= ${range.to}
            AND r."status"::text = 'SUCCEEDED'
        ) ledger
        GROUP BY ledger.day, ledger.currency
        ORDER BY ledger.day, ledger.currency
      `),
    ]);

    const grossByCurrency = new Map(
      payments.map((row) => [row.devise, Number(row._sum.montant ?? 0)]),
    );
    const refundsByCurrency = new Map(
      refunds.map((row) => [row.devise, Number(row._sum.montant ?? 0)]),
    );
    const orderByCurrency = new Map(
      orders.map((row) => [
        row.devise,
        {
          count: row._count._all,
          total: Number(row._sum.total_general ?? 0),
        },
      ]),
    );
    const currencies = new Set([
      ...grossByCurrency.keys(),
      ...refundsByCurrency.keys(),
      ...orderByCurrency.keys(),
    ]);
    return {
      period: { from: range.fromLabel, to: range.toLabel },
      byCurrency: [...currencies].map((currency) => {
        const gross = grossByCurrency.get(currency) ?? 0;
        const refunded = refundsByCurrency.get(currency) ?? 0;
        const orderStats = orderByCurrency.get(currency) ?? {
          count: 0,
          total: 0,
        };
        return {
          currency,
          gross: roundAmount(gross),
          refunds: roundAmount(refunded),
          net: roundAmount(gross - refunded),
          orderCount: orderStats.count,
          averageBasket:
            orderStats.count > 0
              ? roundAmount(orderStats.total / orderStats.count)
              : 0,
        };
      }),
      daily: daily.map((row) => ({
        day: row.day,
        currency: row.currency,
        gross: roundAmount(Number(row.gross)),
        refunds: roundAmount(Number(row.refunds)),
        net: roundAmount(Number(row.gross) - Number(row.refunds)),
      })),
    };
  }

  private async myProfile(userId: string, storeId: string) {
    const membership = await this.storeAuthorization.requireActiveMembership(
      userId,
      storeId,
    );
    const user = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
      select: {
        prenom: true,
        nom: true,
        profil_opticien: { select: { titre_professionnel: true } },
      },
    });
    if (!user) throw new NotFoundException('Profil introuvable.');
    return {
      firstName: user.prenom,
      lastName: user.nom,
      professionalTitle: user.profil_opticien?.titre_professionnel ?? null,
      role: membership.role,
      permissions: [
        ...this.storeAuthorization.effectivePermissions(membership),
      ].sort(),
    };
  }

  private async teamMember(
    userId: string,
    storeId: string,
    args: Record<string, unknown>,
  ) {
    const membership = await this.storeAuthorization.requireActiveMembership(
      userId,
      storeId,
    );
    if (
      membership.role !== RoleMembre.PROPRIETAIRE &&
      membership.role !== RoleMembre.GERANT
    ) {
      throw new ForbiddenException(
        'Les informations des autres membres sont réservées au propriétaire et au gérant.',
      );
    }
    const permissions = this.storeAuthorization.effectivePermissions(membership);
    if (!permissions.has('employees.view')) {
      throw new ForbiddenException('Accès refusé aux informations de l’équipe.');
    }
    const query = this.stringArgument(args, 'query', 100);
    const members = await this.prisma.membreMagasin.findMany({
      where: {
        magasin_id: storeId,
        statut: { in: [StatutAdhesion.ACTIVE, StatutAdhesion.INVITE] },
        utilisateur: {
          OR: [
            { prenom: { contains: query, mode: 'insensitive' } },
            { nom: { contains: query, mode: 'insensitive' } },
          ],
        },
      },
      select: {
        id: true,
        role: true,
        statut: true,
        permission_preset: true,
        permissions: { select: { code: true, autorise: true } },
        utilisateur: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            profil_opticien: { select: { titre_professionnel: true } },
          },
        },
      },
      take: 5,
    });
    return members.map((member) => ({
      id: member.utilisateur.id,
      firstName: member.utilisateur.prenom,
      lastName: member.utilisateur.nom,
      professionalTitle:
        member.utilisateur.profil_opticien?.titre_professionnel ?? null,
      role: member.role,
      membershipStatus: member.statut,
      permissions: [
        ...this.storeAuthorization.effectivePermissions({
          id: member.id,
          role: member.role,
          permission_preset: member.permission_preset,
          permissions: member.permissions,
        }),
      ].sort(),
    }));
  }

  private async recentActivity(
    userId: string,
    storeId: string,
    args: Record<string, unknown>,
  ) {
    const membership = await this.storeAuthorization.requireActiveMembership(
      userId,
      storeId,
    );
    const requestedMemberId =
      typeof args.member_id === 'string' && args.member_id.trim()
        ? this.uuidArgument(args, 'member_id')
        : userId;
    const isManager =
      membership.role === RoleMembre.PROPRIETAIRE ||
      membership.role === RoleMembre.GERANT;
    if (requestedMemberId !== userId && !isManager) {
      throw new ForbiddenException(
        'Vous ne pouvez consulter que votre propre activité.',
      );
    }
    const permissions =
      this.storeAuthorization.effectivePermissions(membership);
    const hasActivityAccess =
      requestedMemberId === userId
        ? permissions.has('activity.view_own') ||
          (isManager && permissions.has('activity.view_all'))
        : permissions.has('activity.view_all');
    if (!hasActivityAccess) {
      throw new ForbiddenException('Accès refusé au journal d’activité.');
    }
    const rows = await this.prisma.journalAudit.findMany({
      where: { magasin_id: storeId, acteur_id: requestedMemberId },
      select: { action: true, type_entite: true, cree_le: true },
      orderBy: { cree_le: 'desc' },
      take: 10,
    });
    return rows;
  }

  private async prepareStockAdjustment(
    userId: string,
    storeId: string,
    args: Record<string, unknown>,
  ): Promise<AssistantProposal> {
    await this.storeAuthorization.requirePermission(
      userId,
      storeId,
      'inventory.adjust_stock',
    );
    const stockId = this.uuidArgument(args, 'stock_id');
    const quantityAfter = this.integerArgument(args, 'quantity_after', 0, 100000);
    const reason = this.stringArgument(args, 'reason', 500);
    const stock = await this.prisma.stock.findFirst({
      where: { id: stockId, location: { magasin_id: storeId } },
      select: {
        id: true,
        quantite_disponible: true,
        quantite_reservee: true,
      },
    });
    if (!stock) throw new NotFoundException('Article introuvable dans cette boutique.');
    if (quantityAfter < stock.quantite_reservee) {
      throw new BadRequestException(
        'La quantité proposée ne peut pas être inférieure à la quantité réservée.',
      );
    }
    return this.createProposal(
      userId,
      storeId,
      'stock_adjustment',
      stock.id,
      stock.quantite_disponible,
      quantityAfter,
      reason,
      `Ajustement du stock ${stock.id.slice(0, 8)}`,
    );
  }

  private async prepareOrderStatusChange(
    userId: string,
    storeId: string,
    args: Record<string, unknown>,
  ): Promise<AssistantProposal> {
    const orderId = this.uuidArgument(args, 'order_id');
    const status = this.orderStatus(this.stringArgument(args, 'status', 60));
    const reason = this.stringArgument(args, 'reason', 500);
    const requiredPermission =
      status === StatutCommande.ANNULE
        ? 'orders.cancel'
        : status === StatutCommande.CONFIRME
          ? 'orders.accept'
          : 'orders.update_status';
    await this.storeAuthorization.requirePermission(
      userId,
      storeId,
      requiredPermission,
    );
    const order = await this.prisma.commande.findFirst({
      where: { id: orderId, magasin_id: storeId },
      select: { id: true, numero_commande: true, statut: true },
    });
    if (!order) throw new NotFoundException('Commande introuvable dans cette boutique.');
    if (!ORDER_TRANSITIONS[order.statut]?.includes(status)) {
      throw new ConflictException(
        `Transition impossible de ${order.statut} à ${status}.`,
      );
    }
    return this.createProposal(
      userId,
      storeId,
      'order_status_change',
      order.id,
      order.statut,
      status,
      reason,
      `Commande ${order.numero_commande}`,
    );
  }

  private async requireFinanceAccess(
    userId: string,
    storeId: string,
    permission: 'transactions.view' | 'transactions.view_refunds' | 'dashboard.view_financials',
  ) {
    await this.requireManager(userId, storeId);
    return this.storeAuthorization.requirePermission(
      userId,
      storeId,
      permission,
    );
  }

  private requireManager(userId: string, storeId: string) {
    return this.storeAuthorization.requireMembership(userId, storeId, [
      RoleMembre.PROPRIETAIRE,
      RoleMembre.GERANT,
    ]);
  }

  private createProposal(
    userId: string,
    storeId: string,
    type: AssistantProposal['type'],
    entityId: string,
    before: number | string,
    after: number | string,
    reason: string,
    label: string,
  ): AssistantProposal {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const payload: ProposalPayload = {
      version: 1,
      sub: userId,
      storeId,
      proposalId: randomUUID(),
      type,
      entityId,
      before,
      after,
      reason,
      exp: Math.floor(expiresAt.getTime() / 1000),
    };
    return {
      token: this.signProposal(payload),
      type,
      label,
      from: before,
      to: after,
      reason,
      expiresAt: expiresAt.toISOString(),
    };
  }

  private signProposal(payload: ProposalPayload): string {
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = createHmac('sha256', this.proposalSecret())
      .update(encoded)
      .digest('base64url');
    return `${encoded}.${signature}`;
  }

  private verifyProposal(
    token: string,
    userId: string,
    storeId: string,
  ): ProposalPayload {
    const [encoded, signature, extra] = token.split('.');
    if (!encoded || !signature || extra !== undefined) {
      throw new UnauthorizedException('Proposition invalide ou expirée.');
    }
    const expected = createHmac('sha256', this.proposalSecret())
      .update(encoded)
      .digest();
    const actual = Buffer.from(signature, 'base64url');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      throw new UnauthorizedException('Proposition invalide ou expirée.');
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    } catch {
      throw new UnauthorizedException('Proposition invalide ou expirée.');
    }
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('version' in parsed) ||
      parsed.version !== 1 ||
      !('sub' in parsed) ||
      parsed.sub !== userId ||
      !('storeId' in parsed) ||
      parsed.storeId !== storeId ||
      !('exp' in parsed) ||
      typeof parsed.exp !== 'number' ||
      parsed.exp <= Math.floor(Date.now() / 1000) ||
      !('proposalId' in parsed) ||
      typeof parsed.proposalId !== 'string' ||
      !('entityId' in parsed) ||
      typeof parsed.entityId !== 'string' ||
      !isUuid(parsed.entityId) ||
      !('reason' in parsed) ||
      typeof parsed.reason !== 'string' ||
      parsed.reason.length === 0 ||
      !('before' in parsed) ||
      !('after' in parsed) ||
      !('type' in parsed) ||
      (parsed.type !== 'stock_adjustment' &&
        parsed.type !== 'order_status_change')
    ) {
      throw new UnauthorizedException('Proposition invalide ou expirée.');
    }
    return parsed as ProposalPayload;
  }

  private proposalSecret(): string {
    const secret = process.env.AUTH_JWT_SECRET;
    if (!secret || secret.length < 32) {
      throw new InternalServerErrorException(
        'AUTH_JWT_SECRET doit contenir au moins 32 caractères.',
      );
    }
    return secret;
  }

  private dateRange(
    args: Record<string, unknown>,
    defaultDays = 30,
  ): DateRange {
    const now = new Date();
    const today = tunisDateString(now);
    if (
      (args.from !== undefined && typeof args.from !== 'string') ||
      (args.to !== undefined && typeof args.to !== 'string')
    ) {
      throw new BadRequestException('Les dates doivent être au format AAAA-MM-JJ.');
    }
    const fromLabel =
      typeof args.from === 'string'
        ? validateDateString(args.from)
        : addDaysToDateString(today, -(defaultDays - 1));
    const toLabel =
      typeof args.to === 'string' ? validateDateString(args.to) : today;
    if (fromLabel > toLabel) {
      throw new BadRequestException(
        'La date de début doit précéder la date de fin.',
      );
    }
    const daySpan =
      (Date.parse(`${toLabel}T00:00:00Z`) -
        Date.parse(`${fromLabel}T00:00:00Z`)) /
      86_400_000;
    if (daySpan > 365) {
      throw new BadRequestException(
        'La période ne peut pas dépasser 366 jours.',
      );
    }
    return {
      from: new Date(`${fromLabel}T00:00:00+01:00`),
      to: new Date(`${toLabel}T23:59:59.999+01:00`),
      fromLabel,
      toLabel,
    };
  }

  private stringArgument(
    args: Record<string, unknown>,
    key: string,
    maxLength: number,
  ): string {
    const value = args[key];
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new BadRequestException(`Le champ ${key} est requis.`);
    }
    return value.trim().slice(0, maxLength);
  }

  private uuidArgument(args: Record<string, unknown>, key: string): string {
    const value = this.stringArgument(args, key, 64);
    if (!isUuid(value)) {
      throw new BadRequestException(`Le champ ${key} doit être un identifiant valide.`);
    }
    return value;
  }

  private integerArgument(
    args: Record<string, unknown>,
    key: string,
    min: number,
    max: number,
  ): number {
    const value = args[key];
    if (
      typeof value !== 'number' ||
      !Number.isInteger(value) ||
      value < min ||
      value > max
    ) {
      throw new BadRequestException(`Le champ ${key} est invalide.`);
    }
    return value;
  }

  private orderStatus(value: string): StatutCommande {
    if (!Object.values(StatutCommande).includes(value as StatutCommande)) {
      throw new BadRequestException('Statut de commande invalide.');
    }
    return value as StatutCommande;
  }

  private requireOrderStatus(value: unknown): StatutCommande {
    if (typeof value !== 'string') {
      throw new BadRequestException('Statut de commande invalide.');
    }
    return this.orderStatus(value);
  }

  private requireInteger(value: unknown, label: string): number {
    if (typeof value !== 'number' || !Number.isInteger(value)) {
      throw new BadRequestException(`${label} invalide.`);
    }
    return value;
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function tunisDateString(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Tunis',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get('year')}-${values.get('month')}-${values.get('day')}`;
}

function validateDateString(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException('Les dates doivent être au format AAAA-MM-JJ.');
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new BadRequestException('Date invalide.');
  }
  return value;
}

function addDaysToDateString(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function roundAmount(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}
