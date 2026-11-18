import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  Prisma,
  RolePlateforme,
  RoleMembre,
  StatutAnnonce,
  StatutAdhesion,
  StatutAvis,
  StatutMagasin,
  StatutUtilisateur,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { STORE_PERMISSION_CATALOG } from '../common/guards/store-permissions';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsCacheService } from '../products/products-cache.service';
import {
  AdminDirectoryQueryDto,
  AdminOrdersQueryDto,
} from './dto/admin-directory-query.dto';
import { AuditQueryDto } from './dto/audit-query.dto';
import {
  AdvertisementDto,
  CampaignDto,
  PlatformControlsDto,
} from './dto/admin-actions.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Optional() private readonly productsCache?: ProductsCacheService,
  ) {}

  async advertisements() {
    const [data, eventCounts] = await Promise.all([
      this.prisma.publicitePlateforme.findMany({
        orderBy: { cree_le: 'desc' },
        include: {
          campagne: { select: { id: true, nom: true, statut: true } },
          _count: { select: { evenements: true } },
        },
      }),
      this.prisma.evenementPublicite.groupBy({
        by: ['publicite_id', 'type'],
        _count: { _all: true },
      }),
    ]);
    const counts = new Map<string, { impressions: number; clicks: number }>();
    for (const event of eventCounts) {
      const current = counts.get(event.publicite_id) ?? {
        impressions: 0,
        clicks: 0,
      };
      if (event.type === 'IMPRESSION') current.impressions = event._count._all;
      if (event.type === 'CLICK') current.clicks = event._count._all;
      counts.set(event.publicite_id, current);
    }
    return data.map(({ _count, ...advertisement }) => {
      const metrics = counts.get(advertisement.id) ?? {
        impressions: 0,
        clicks: 0,
      };
      return {
        ...advertisement,
        events: _count.evenements,
        ...metrics,
        clickThroughRate:
          metrics.impressions === 0
            ? null
            : Number(((metrics.clicks / metrics.impressions) * 100).toFixed(2)),
      };
    });
  }

  async createAdvertisement(actorId: string, input: AdvertisementDto) {
    const reason = requiredAdminReason(input.reason);
    const schedule = validatedSchedule(input.startsAt, input.endsAt);
    if (input.campaignId) {
      const campaign = await this.prisma.campagnePublicitaire.findUnique({
        where: { id: input.campaignId },
        select: { id: true },
      });
      if (!campaign) throw new NotFoundException('Advertisement campaign not found');
    }
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.publicitePlateforme.create({
        data: {
          campagne_id: input.campaignId ?? null,
          titre: input.title.trim(),
          description: input.description ?? null,
          url_image: input.imageUrl ?? null,
          url_destination: input.destinationUrl,
          annonceur: input.advertiser.trim(),
          type: input.type,
          statut: input.status,
          date_debut: schedule.startsAt,
          date_fin: schedule.endsAt,
          notes_internes: input.internalNotes ?? null,
          cree_par_id: actorId,
        },
      });
      await this.audit.record(tx, {
        actorId,
        action: 'advertisement.created',
        entityType: 'advertisement',
        entityId: created.id,
        description: `Advertisement "${created.titre}" created`,
        reason,
        after: { title: created.titre, status: created.statut },
      });
      return created;
    });
  }

  async updateAdvertisement(
    actorId: string,
    advertisementId: string,
    input: AdvertisementDto,
  ) {
    const reason = requiredAdminReason(input.reason);
    const schedule = validatedSchedule(input.startsAt, input.endsAt);
    const existing = await this.prisma.publicitePlateforme.findUnique({
      where: { id: advertisementId },
      select: { id: true, titre: true, statut: true },
    });
    if (!existing) throw new NotFoundException('Advertisement not found');
    if (input.campaignId) {
      const campaign = await this.prisma.campagnePublicitaire.findUnique({
        where: { id: input.campaignId },
        select: { id: true },
      });
      if (!campaign) throw new NotFoundException('Advertisement campaign not found');
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.publicitePlateforme.update({
        where: { id: advertisementId },
        data: {
          campagne_id: input.campaignId ?? null,
          titre: input.title.trim(),
          description: input.description ?? null,
          url_image: input.imageUrl ?? null,
          url_destination: input.destinationUrl,
          annonceur: input.advertiser.trim(),
          type: input.type,
          statut: input.status,
          date_debut: schedule.startsAt,
          date_fin: schedule.endsAt,
          notes_internes: input.internalNotes ?? null,
        },
      });
      await this.audit.record(tx, {
        actorId,
        action:
          input.status === 'ARCHIVED'
            ? 'advertisement.archived'
            : 'advertisement.updated',
        entityType: 'advertisement',
        entityId: advertisementId,
        description: `Advertisement "${updated.titre}" updated`,
        reason,
        before: existing,
        after: { title: updated.titre, status: updated.statut },
      });
      return updated;
    });
  }

  async advertisementCampaigns() {
    return this.prisma.campagnePublicitaire.findMany({
      orderBy: { cree_le: 'desc' },
      include: { _count: { select: { publicites: true } } },
    });
  }

  async createAdvertisementCampaign(actorId: string, input: CampaignDto) {
    const reason = requiredAdminReason(input.reason);
    const schedule = validatedSchedule(input.startsAt, input.endsAt);
    if (input.budget !== undefined && input.budget !== null && input.budget < 0) {
      throw new BadRequestException('Campaign budget cannot be negative');
    }
    return this.prisma.$transaction(async (tx) => {
      const campaign = await tx.campagnePublicitaire.create({
        data: {
          nom: input.name.trim(),
          statut: input.status,
          public_cible: input.targetAudience ?? null,
          lieu_cible: input.targetLocation ?? null,
          date_debut: schedule.startsAt,
          date_fin: schedule.endsAt,
          budget: input.budget ?? null,
          notes_internes: input.internalNotes ?? null,
          cree_par_id: actorId,
        },
      });
      await this.audit.record(tx, {
        actorId,
        action: 'advertisement_campaign.created',
        entityType: 'advertisement_campaign',
        entityId: campaign.id,
        description: `Advertisement campaign "${campaign.nom}" created`,
        reason,
        after: { name: campaign.nom, status: campaign.statut },
      });
      return campaign;
    });
  }

  async updateAdvertisementCampaign(
    actorId: string,
    campaignId: string,
    input: CampaignDto,
  ) {
    const reason = requiredAdminReason(input.reason);
    const schedule = validatedSchedule(input.startsAt, input.endsAt);
    if (input.budget !== undefined && input.budget !== null && input.budget < 0) {
      throw new BadRequestException('Campaign budget cannot be negative');
    }
    const existing = await this.prisma.campagnePublicitaire.findUnique({
      where: { id: campaignId },
      select: { id: true, nom: true, statut: true },
    });
    if (!existing) throw new NotFoundException('Advertisement campaign not found');
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.campagnePublicitaire.update({
        where: { id: campaignId },
        data: {
          nom: input.name.trim(),
          statut: input.status,
          public_cible: input.targetAudience ?? null,
          lieu_cible: input.targetLocation ?? null,
          date_debut: schedule.startsAt,
          date_fin: schedule.endsAt,
          budget: input.budget ?? null,
          notes_internes: input.internalNotes ?? null,
        },
      });
      await this.audit.record(tx, {
        actorId,
        action: 'advertisement_campaign.updated',
        entityType: 'advertisement_campaign',
        entityId: campaignId,
        description: `Advertisement campaign "${updated.nom}" updated`,
        reason,
        before: existing,
        after: { name: updated.nom, status: updated.statut },
      });
      return updated;
    });
  }

  async platformControls() {
    return this.prisma.parametresPlateforme.upsert({
      where: { id: 'global' },
      create: { id: 'global' },
      update: {},
      select: {
        inscriptions_magasins: true,
        publicites_activees: true,
        modifie_le: true,
      },
    });
  }

  async updatePlatformControls(actorId: string, input: PlatformControlsDto) {
    const reason = requiredAdminReason(input.reason);
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.parametresPlateforme.upsert({
        where: { id: 'global' },
        create: { id: 'global' },
        update: {},
      });
      const updated = await tx.parametresPlateforme.update({
        where: { id: 'global' },
        data: {
          inscriptions_magasins: input.storeRegistrationsEnabled,
          publicites_activees: input.advertisementsEnabled,
          modifie_par_id: actorId,
        },
        select: {
          inscriptions_magasins: true,
          publicites_activees: true,
          modifie_le: true,
        },
      });
      await this.audit.record(tx, {
        actorId,
        action: 'platform.emergency_controls_updated',
        entityType: 'platform_settings',
        entityId: 'global',
        description: 'Platform emergency controls changed',
        reason,
        before: {
          storeRegistrationsEnabled: existing.inscriptions_magasins,
          advertisementsEnabled: existing.publicites_activees,
        },
        after: {
          storeRegistrationsEnabled: updated.inscriptions_magasins,
          advertisementsEnabled: updated.publicites_activees,
        },
      });
      return updated;
    });
  }

  async overview() {
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const [
      users,
      clients,
      opticians,
      stores,
      activeStores,
      employees,
      orders,
      clicks,
      aiUsage,
      auditEvents,
    ] = await this.prisma.$transaction([
      this.prisma.utilisateur.count({ where: { supprime_le: null } }),
      this.prisma.profilClient.count({
        where: { utilisateur: { is: { supprime_le: null } } },
      }),
      this.prisma.profilOpticien.count({
        where: { utilisateur: { is: { supprime_le: null } } },
      }),
      this.prisma.magasin.count({ where: { supprime_le: null } }),
      this.prisma.magasin.count({
        where: { supprime_le: null, statut: StatutMagasin.ACTIVE },
      }),
      this.prisma.membreMagasin.count({
        where: {
          statut: StatutAdhesion.ACTIVE,
          role: { not: RoleMembre.PROPRIETAIRE },
          magasin: { is: { supprime_le: null } },
        },
      }),
      this.prisma.commande.count(),
      this.prisma.clicMagasin.count(),
      this.prisma.utilisationIA.aggregate({
        where: { cree_le: { gte: monthStart } },
        _sum: { jetons_entree: true, jetons_sortie: true },
        _count: { _all: true },
      }),
      this.prisma.journalAudit.count(),
    ]);

    return {
      users,
      clients,
      opticians,
      stores,
      activeStores,
      employees,
      orders,
      clicks,
      aiTokensThisMonth:
        (aiUsage._sum.jetons_entree ?? 0) +
        (aiUsage._sum.jetons_sortie ?? 0),
      aiRequestsThisMonth: aiUsage._count._all,
      auditEvents,
    };
  }

  async storesDirectory(query: AdminDirectoryQueryDto) {
    const where: Prisma.MagasinWhereInput = {
      supprime_le: null,
      ...(query.search
        ? {
            OR: [
              { nom: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.magasin.findMany({
        where,
        select: {
          id: true,
          nom: true,
          slug: true,
          email: true,
          statut: true,
          cree_le: true,
          adhesions: {
            where: { role: RoleMembre.PROPRIETAIRE, statut: StatutAdhesion.ACTIVE },
            take: 1,
            select: {
              utilisateur: {
                select: { id: true, prenom: true, nom: true, email: true },
              },
            },
          },
          plateforme_abonnement: {
            select: { plan: { select: { id: true, code: true, nom: true } } },
          },
          _count: {
            select: {
              commandes: true,
              annonces: true,
              adhesions: {
                where: {
                  statut: StatutAdhesion.ACTIVE,
                  role: { not: RoleMembre.PROPRIETAIRE },
                },
              },
            },
          },
        },
        orderBy: { cree_le: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.magasin.count({ where }),
    ]);
    const storeIds = data.map(({ id }) => id);
    const [clicks, aiUsage] = storeIds.length
      ? await Promise.all([
          this.prisma.clicMagasin.groupBy({
            by: ['magasin_id'],
            where: { magasin_id: { in: storeIds } },
            _count: { _all: true },
          }),
          this.prisma.utilisationIA.groupBy({
            by: ['magasin_id'],
            where: { magasin_id: { in: storeIds } },
            _sum: { jetons_entree: true, jetons_sortie: true },
          }),
        ])
      : [[], []];
    const clickCounts = new Map(clicks.map((row) => [row.magasin_id, row._count._all]));
    const tokenCounts = new Map(
      aiUsage.map((row) => [
        row.magasin_id,
        (row._sum.jetons_entree ?? 0) + (row._sum.jetons_sortie ?? 0),
      ]),
    );
    return {
      data: data.map((store) => ({
        ...store,
        owner: store.adhesions[0]?.utilisateur ?? null,
        plan: store.plateforme_abonnement?.plan ?? null,
        clicks: clickCounts.get(store.id) ?? 0,
        aiTokens: tokenCounts.get(store.id) ?? 0,
        employees: store._count.adhesions,
        orders: store._count.commandes,
        listings: store._count.annonces,
        adhesions: undefined,
        plateforme_abonnement: undefined,
        _count: undefined,
      })),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async usersDirectory(query: AdminDirectoryQueryDto) {
    const conditions: Prisma.UtilisateurWhereInput[] = [];
    if (query.search) {
      conditions.push({
        OR: [
          { prenom: { contains: query.search, mode: 'insensitive' } },
          { nom: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
          {
            nom_utilisateur: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
        ],
      });
    }
    if (query.kind === 'clients') {
      conditions.push({ profil_client: { isNot: null } });
    } else if (query.kind === 'opticians') {
      conditions.push({
        OR: [
          { profil_opticien: { isNot: null } },
          {
            adhesions: {
              some: { role: RoleMembre.PROPRIETAIRE },
            },
          },
        ],
      });
    } else if (query.kind === 'employees') {
      conditions.push({
        adhesions: {
          some: { role: { not: RoleMembre.PROPRIETAIRE } },
        },
      });
    }
    const where: Prisma.UtilisateurWhereInput = {
      supprime_le: null,
      ...(conditions.length ? { AND: conditions } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.utilisateur.findMany({
        where,
        select: {
          id: true,
          role: true,
          statut: true,
          prenom: true,
          nom: true,
          nom_utilisateur: true,
          email: true,
          telephone: true,
          derniere_connexion_le: true,
          cree_le: true,
          profil_client: { select: { id: true } },
          profil_opticien: { select: { id: true } },
          adhesions: {
            select: {
              id: true,
              role: true,
              statut: true,
              magasin: { select: { id: true, nom: true, slug: true } },
            },
            orderBy: { cree_le: 'desc' },
          },
          plateforme_abonnement: {
            select: { plan: { select: { id: true, code: true, nom: true } } },
          },
          _count: { select: { commandes: true } },
        },
        orderBy: { cree_le: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.utilisateur.count({ where }),
    ]);
    const userIds = data.map(({ id }) => id);
    const aiUsage = userIds.length
      ? await this.prisma.utilisationIA.groupBy({
          by: ['utilisateur_id'],
          where: { utilisateur_id: { in: userIds } },
          _sum: { jetons_entree: true, jetons_sortie: true },
        })
      : [];
    const tokenCounts = new Map(
      aiUsage.map((row) => [
        row.utilisateur_id,
        (row._sum.jetons_entree ?? 0) + (row._sum.jetons_sortie ?? 0),
      ]),
    );
    return {
      data: data.map((user) => ({
        ...user,
        plan: user.plateforme_abonnement?.plan ?? null,
        aiTokens: tokenCounts.get(user.id) ?? 0,
        orders: user._count.commandes,
        plateforme_abonnement: undefined,
        _count: undefined,
      })),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async ordersDirectory(query: AdminOrdersQueryDto) {
    const where: Prisma.CommandeWhereInput = query.search
      ? {
          OR: [
            {
              numero_commande: {
                contains: query.search,
                mode: 'insensitive',
              },
            },
            {
              magasin: {
                is: { nom: { contains: query.search, mode: 'insensitive' } },
              },
            },
            {
              utilisateur: {
                is: {
                  OR: [
                    {
                      email: {
                        contains: query.search,
                        mode: 'insensitive',
                      },
                    },
                    {
                      nom: {
                        contains: query.search,
                        mode: 'insensitive',
                      },
                    },
                  ],
                },
              },
            },
          ],
        }
      : {};
    const [data, total] = await this.prisma.$transaction([
      this.prisma.commande.findMany({
        where,
        select: {
          id: true,
          numero_commande: true,
          statut: true,
          devise: true,
          total_general: true,
          cree_le: true,
          magasin: { select: { id: true, nom: true } },
          utilisateur: {
            select: { id: true, prenom: true, nom: true, email: true },
          },
        },
        orderBy: { cree_le: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.commande.count({ where }),
    ]);
    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async clickStats(query: AdminDirectoryQueryDto) {
    const rows = await this.prisma.clicMagasin.groupBy({
      by: ['magasin_id', 'type'],
      _count: { _all: true },
      orderBy: { _count: { id: 'desc' } },
    });
    const storeIds = [...new Set(rows.map(({ magasin_id }) => magasin_id))];
    const stores = storeIds.length
      ? await this.prisma.magasin.findMany({
          where: { id: { in: storeIds } },
          select: { id: true, nom: true, slug: true },
        })
      : [];
    const storeNames = new Map(stores.map(({ id, ...store }) => [id, store]));
    const grouped = new Map<
      string,
      { magasin_id: string; store: { nom: string; slug: string } | undefined; profileClicks: number; listingClicks: number }
    >();
    for (const row of rows) {
      if (query.search && !storeNames.get(row.magasin_id)?.nom.toLowerCase().includes(query.search.toLowerCase())) {
        continue;
      }
      const current = grouped.get(row.magasin_id) ?? {
        magasin_id: row.magasin_id,
        store: storeNames.get(row.magasin_id),
        profileClicks: 0,
        listingClicks: 0,
      };
      if (row.type === 'STORE_PROFILE') current.profileClicks = row._count._all;
      if (row.type === 'STORE_LISTING') current.listingClicks = row._count._all;
      grouped.set(row.magasin_id, current);
    }
    const all = [...grouped.values()].sort(
      (a, b) => b.profileClicks + b.listingClicks - (a.profileClicks + a.listingClicks),
    );
    return {
      data: all.slice(query.skip, query.skip + query.limit),
      meta: {
        page: query.page,
        limit: query.limit,
        total: all.length,
        totalPages: Math.ceil(all.length / query.limit),
      },
    };
  }

  async recordClick(input: {
    storeId: string;
    type: 'STORE_PROFILE' | 'STORE_LISTING';
    listingId?: string;
  }) {
    const store = await this.prisma.magasin.findFirst({
      where: {
        id: input.storeId,
        statut: StatutMagasin.ACTIVE,
        supprime_le: null,
      },
      select: { id: true },
    });
    if (!store) throw new NotFoundException('Active store not found');
    let listingId: string | null = null;
    if (input.type === 'STORE_LISTING') {
      if (!input.listingId) {
        throw new BadRequestException('listingId is required for listing clicks');
      }
      const listing = await this.prisma.annonceMagasin.findFirst({
        where: {
          id: input.listingId,
          magasin_id: input.storeId,
          statut: StatutAnnonce.ACTIVE,
          supprime_le: null,
        },
        select: { id: true },
      });
      if (!listing) throw new NotFoundException('Active store listing not found');
      listingId = listing.id;
    } else if (input.listingId) {
      throw new BadRequestException('listingId is not valid for profile clicks');
    }
    return this.prisma.clicMagasin.create({
      data: {
        magasin_id: input.storeId,
        annonce_id: listingId,
        type: input.type,
      },
      select: { id: true },
    });
  }

  async aiUsage() {
    const since = new Date();
    since.setUTCDate(1);
    since.setUTCHours(0, 0, 0, 0);
    const [stores, users] = await Promise.all([
      this.prisma.utilisationIA.groupBy({
        by: ['magasin_id'],
        where: { magasin_id: { not: null }, cree_le: { gte: since } },
        _sum: { jetons_entree: true, jetons_sortie: true },
        _count: { _all: true },
        orderBy: { _sum: { jetons_entree: 'desc' } },
      }),
      this.prisma.utilisationIA.groupBy({
        by: ['utilisateur_id'],
        where: { utilisateur_id: { not: null }, cree_le: { gte: since } },
        _sum: { jetons_entree: true, jetons_sortie: true },
        _count: { _all: true },
        orderBy: { _sum: { jetons_entree: 'desc' } },
      }),
    ]);
    const storeIds = stores.flatMap(({ magasin_id }) => magasin_id ? [magasin_id] : []);
    const userIds = users.flatMap(({ utilisateur_id }) => utilisateur_id ? [utilisateur_id] : []);
    const [storeDetails, userDetails] = await Promise.all([
      storeIds.length
        ? this.prisma.magasin.findMany({
            where: { id: { in: storeIds } },
            select: {
              id: true,
              nom: true,
              plateforme_abonnement: {
                select: { plan: { select: { tokens_ia_mensuels: true } } },
              },
            },
          })
        : [],
      userIds.length
        ? this.prisma.utilisateur.findMany({
            where: { id: { in: userIds } },
            select: {
              id: true,
              prenom: true,
              nom: true,
              email: true,
              plateforme_abonnement: {
                select: { plan: { select: { tokens_ia_mensuels: true } } },
              },
            },
          })
        : [],
    ]);
    const storeMap = new Map(storeDetails.map((store) => [store.id, store]));
    const userMap = new Map(userDetails.map((user) => [user.id, user]));
    return {
      month: since.toISOString(),
      stores: stores.map((row) => {
        const store = row.magasin_id ? storeMap.get(row.magasin_id) : null;
        const tokens =
          (row._sum.jetons_entree ?? 0) + (row._sum.jetons_sortie ?? 0);
        const limit = store?.plateforme_abonnement?.plan.tokens_ia_mensuels ?? null;
        return {
          id: row.magasin_id,
          name: store?.nom ?? 'Deleted store',
          tokens,
          requests: row._count._all,
          limit,
          overLimit: limit !== null && tokens > limit,
        };
      }),
      users: users.map((row) => {
        const user = row.utilisateur_id ? userMap.get(row.utilisateur_id) : null;
        const tokens =
          (row._sum.jetons_entree ?? 0) + (row._sum.jetons_sortie ?? 0);
        const limit =
          user?.plateforme_abonnement?.plan.tokens_ia_mensuels ?? null;
        return {
          id: row.utilisateur_id,
          name: user ? `${user.prenom} ${user.nom}` : 'Deleted user',
          email: user?.email ?? null,
          tokens,
          requests: row._count._all,
          limit,
          overLimit: limit !== null && tokens > limit,
        };
      }),
    };
  }

  async plans() {
    return this.prisma.planPlateforme.findMany({
      orderBy: { nom: 'asc' },
      include: { _count: { select: { attributions: true } } },
    });
  }

  async createPlan(actorId: string, input: unknown) {
    const plan = validatePlan(input);
    const reason = requiredAdminReason(
      isRecord(input) ? input.reason : undefined,
    );
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.planPlateforme.create({ data: plan });
      await this.audit.record(tx, {
        actorId,
        action: 'subscription.plan_created',
        entityType: 'subscription_plan',
        entityId: created.id,
        description: 'Subscription plan created',
        reason,
        after: { code: created.code, name: created.nom },
      });
      return created;
    });
  }

  async updatePlan(actorId: string, planId: string, input: unknown) {
    const plan = validatePlan(input);
    const reason = requiredAdminReason(
      isRecord(input) ? input.reason : undefined,
    );
    const existing = await this.prisma.planPlateforme.findUnique({
      where: { id: planId },
      select: { id: true, code: true, nom: true, actif: true },
    });
    if (!existing) throw new NotFoundException('Subscription plan not found');
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.planPlateforme.update({
        where: { id: planId },
        data: plan,
      });
      await this.audit.record(tx, {
        actorId,
        action: 'subscription.plan_updated',
        entityType: 'subscription_plan',
        entityId: planId,
        description: 'Subscription plan settings changed',
        reason,
        before: existing,
        after: {
          code: result.code,
          name: result.nom,
          active: result.actif,
        },
      });
      return result;
    });
    return updated;
  }

  async assignStorePlan(
    actorId: string,
    storeId: string,
    planId: string,
    reason: string,
  ) {
    return this.assignPlan(actorId, 'store', storeId, planId, reason);
  }

  async assignUserPlan(
    actorId: string,
    userId: string,
    planId: string,
    reason: string,
  ) {
    return this.assignPlan(actorId, 'user', userId, planId, reason);
  }

  async removeStorePlan(actorId: string, storeId: string, reason: string) {
    return this.removePlan(actorId, 'store', storeId, reason);
  }

  async removeUserPlan(actorId: string, userId: string, reason: string) {
    return this.removePlan(actorId, 'user', userId, reason);
  }

  private async removePlan(
    actorId: string,
    targetType: 'store' | 'user',
    targetId: string,
    reason: string,
  ) {
    const auditReason = requiredAdminReason(reason);
    const attribution = await this.prisma.attributionPlanPlateforme.findFirst({
      where:
        targetType === 'store'
          ? { magasin_id: targetId }
          : { utilisateur_id: targetId },
      select: { id: true, plan: { select: { code: true, nom: true } } },
    });
    if (!attribution) throw new NotFoundException('Plan assignment not found');
    return this.prisma.$transaction(async (tx) => {
      await tx.attributionPlanPlateforme.delete({
        where: { id: attribution.id },
      });
      await this.audit.record(tx, {
        ...(targetType === 'store' ? { storeId: targetId } : {}),
        actorId,
        action: 'subscription.plan_removed',
        entityType: targetType,
        entityId: targetId,
        description: `Subscription plan ${attribution.plan.code} removed`,
        reason: auditReason,
        before: {
          planCode: attribution.plan.code,
          planName: attribution.plan.nom,
        },
      });
      return { removed: true };
    });
  }

  private async assignPlan(
    actorId: string,
    targetType: 'store' | 'user',
    targetId: string,
    planId: string,
    reason: string,
  ) {
    const auditReason = requiredAdminReason(reason);
    const plan = await this.prisma.planPlateforme.findFirst({
      where: { id: planId, actif: true },
      select: { id: true, code: true, nom: true },
    });
    if (!plan) throw new NotFoundException('Active subscription plan not found');
    if (targetType === 'store') {
      const store = await this.prisma.magasin.findFirst({
        where: { id: targetId, supprime_le: null },
        select: { id: true, nom: true },
      });
      if (!store) throw new NotFoundException('Store not found');
    } else {
      const user = await this.prisma.utilisateur.findFirst({
        where: { id: targetId, supprime_le: null },
        select: { id: true, prenom: true, nom: true },
      });
      if (!user) throw new NotFoundException('User not found');
    }
    return this.prisma.$transaction(async (tx) => {
      const attribution = await tx.attributionPlanPlateforme.upsert({
        where:
          targetType === 'store'
            ? { magasin_id: targetId }
            : { utilisateur_id: targetId },
        create: {
          plan_id: planId,
          attribue_par_id: actorId,
          ...(targetType === 'store'
            ? { magasin_id: targetId }
            : { utilisateur_id: targetId }),
        },
        update: { plan_id: planId, attribue_par_id: actorId },
      });
      await this.audit.record(tx, {
        ...(targetType === 'store' ? { storeId: targetId } : {}),
        actorId,
        action: 'subscription.plan_assigned',
        entityType: targetType,
        entityId: targetId,
        description: `Subscription plan ${plan.code} assigned`,
        reason: auditReason,
        after: { planId: plan.id, planCode: plan.code, planName: plan.nom },
      });
      return attribution;
    });
  }

  async updateStoreStatus(
    actorId: string,
    storeId: string,
    status: string,
    reason: string,
  ) {
    const auditReason = requiredAdminReason(reason);
    if (!Object.values(StatutMagasin).includes(status as StatutMagasin)) {
      throw new BadRequestException('Unsupported store status');
    }
    const store = await this.prisma.magasin.findFirst({
      where: { id: storeId, supprime_le: null },
      select: { id: true, statut: true },
    });
    if (!store) throw new NotFoundException('Store not found');
    const updated = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.magasin.update({
        where: { id: storeId },
        data: { statut: status as StatutMagasin },
        select: { id: true, statut: true },
      });
      await this.audit.record(tx, {
        storeId,
        actorId,
        action: 'store.status_changed',
        entityType: 'store',
        entityId: storeId,
        description: 'Store status changed by platform administrator',
        reason: auditReason,
        before: { status: store.statut },
        after: { status: updated.statut },
      });
      return updated;
    });
    if (updated.statut !== store.statut) {
      await this.productsCache?.invalidateLists();
    }
    return updated;
  }

  async updateUserStatus(
    actorId: string,
    userId: string,
    status: string,
    reason: string,
  ) {
    const auditReason = requiredAdminReason(reason);
    if (!Object.values(StatutUtilisateur).includes(status as StatutUtilisateur)) {
      throw new BadRequestException('Unsupported user status');
    }
    const user = await this.prisma.utilisateur.findFirst({
      where: { id: userId, supprime_le: null },
      select: { id: true, statut: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (actorId === userId && status !== StatutUtilisateur.ACTIVE) {
      throw new ForbiddenException('You cannot disable your own administrator account');
    }
    if (
      user.statut === StatutUtilisateur.ACTIVE &&
      status !== StatutUtilisateur.ACTIVE
    ) {
      const activeAdministrators = await this.prisma.utilisateur.count({
        where: {
          id: { not: userId },
          role: { in: [RolePlateforme.ADMIN, RolePlateforme.SUPER_ADMIN] },
          statut: StatutUtilisateur.ACTIVE,
          supprime_le: null,
        },
      });
      const target = await this.prisma.utilisateur.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (
        target &&
        (target.role === RolePlateforme.ADMIN ||
          target.role === RolePlateforme.SUPER_ADMIN) &&
        activeAdministrators === 0
      ) {
        throw new ForbiddenException(
          'The last active platform administrator cannot be disabled',
        );
      }
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.utilisateur.update({
        where: { id: userId },
        data: { statut: status as StatutUtilisateur },
        select: { id: true, statut: true },
      });
      await this.audit.record(tx, {
        actorId,
        action: 'user.status_changed',
        entityType: 'user',
        entityId: userId,
        description: 'User status changed by platform administrator',
        reason: auditReason,
        before: { status: user.statut },
        after: { status: updated.statut },
      });
      return updated;
    });
  }

  async auditLogs(query: AuditQueryDto) {
    const where: Prisma.JournalAuditWhereInput = {
      ...(query.type_entite ? { type_entite: query.type_entite } : {}),
      ...(query.acteur_id ? { acteur_id: query.acteur_id } : {}),
      ...(query.magasin_id ? { magasin_id: query.magasin_id } : {}),
      ...(query.entite_id ? { entite_id: query.entite_id } : {}),
      ...(query.utilisateur_id
        ? {
            OR: [
              { acteur_id: query.utilisateur_id },
              { entite_id: query.utilisateur_id },
            ],
          }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.journalAudit.findMany({
        where,
        select: {
          id: true,
          acteur_id: true,
          magasin_id: true,
          action: true,
          type_entite: true,
          entite_id: true,
          acteur_identite: true,
          description: true,
          valeurs_precedentes: true,
          nouvelles_valeurs: true,
          raison: true,
          cree_le: true,
          acteur: {
            select: { prenom: true, nom: true, email: true },
          },
        },
        orderBy: { cree_le: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.journalAudit.count({ where }),
    ]);
    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async moderateProductReview(
    actorId: string,
    reviewId: string,
    status: StatutAvis,
  ) {
    const review = await this.prisma.avisProduit.findUnique({
      where: { id: reviewId },
      select: { id: true, statut: true },
    });
    if (!review) throw new NotFoundException('Product review not found');
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.avisProduit.update({
        where: { id: reviewId },
        data: { statut: status },
        select: { id: true, statut: true },
      });
      await this.audit.record(tx, {
        actorId,
        action: 'review.moderated',
        entityType: 'product_review',
        entityId: reviewId,
        description: 'Product review moderation status changed',
        before: { status: review.statut },
        after: { status },
      });
      return updated;
    });
  }

  async moderateStoreReview(
    actorId: string,
    reviewId: string,
    status: StatutAvis,
  ) {
    const review = await this.prisma.avisMagasin.findUnique({
      where: { id: reviewId },
      select: { id: true, magasin_id: true, statut: true },
    });
    if (!review) throw new NotFoundException('Store review not found');
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.avisMagasin.update({
        where: { id: reviewId },
        data: { statut: status },
        select: { id: true, statut: true },
      });
      await this.audit.record(tx, {
        storeId: review.magasin_id,
        actorId,
        action: 'review.moderated',
        entityType: 'store_review',
        entityId: reviewId,
        description: 'Store review moderation status changed',
        before: { status: review.statut },
        after: { status },
      });
      return updated;
    });
  }
}

function validatePlan(input: unknown): Prisma.PlanPlateformeUncheckedCreateInput {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new BadRequestException('A JSON object is required');
  }
  const record = input as Record<string, unknown>;
  const code = requiredPlanString(record.code, 'code', 60).toLowerCase();
  const name = requiredPlanString(record.name, 'name', 100);
  const modules = record.modules;
  const allowedModules = new Set<string>(
    STORE_PERMISSION_CATALOG.map(({ module }) => module),
  );
  if (
    !Array.isArray(modules) ||
    modules.some(
      (module) => typeof module !== 'string' || !allowedModules.has(module),
    )
  ) {
    throw new BadRequestException('modules contains an unsupported module');
  }
  const limit = (field: string, mappedField: string) => {
    const value = record[field];
    if (value === null || value === undefined || value === '') return null;
    if (!Number.isInteger(value) || (value as number) < 0) {
      throw new BadRequestException(`${field} must be a non-negative integer or null`);
    }
    return { [mappedField]: value as number };
  };
  if (record.active !== undefined && typeof record.active !== 'boolean') {
    throw new BadRequestException('active must be a boolean');
  }
  return {
    code,
    nom: name,
    description:
      typeof record.description === 'string' ? record.description : null,
    modules: modules as Prisma.InputJsonValue,
    ...limit('maxEmployees', 'max_employes'),
    ...limit('maxListings', 'max_annonces'),
    ...limit('monthlyAiTokens', 'tokens_ia_mensuels'),
    actif: record.active === undefined ? true : record.active,
  };
}

function requiredPlanString(
  value: unknown,
  field: string,
  maxLength: number,
): string {
  if (
    typeof value !== 'string' ||
    value.trim().length === 0 ||
    value.length > maxLength
  ) {
    throw new BadRequestException(
      `${field} must be a non-empty string of at most ${maxLength} characters`,
    );
  }
  return value.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requiredAdminReason(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length < 3 || value.length > 1000) {
    throw new BadRequestException(
      'A reason of 3 to 1000 characters is required for this administrative action',
    );
  }
  return value.trim();
}

function validatedSchedule(
  startsAt?: string | null,
  endsAt?: string | null,
): { startsAt: Date | null; endsAt: Date | null } {
  const startsAtDate = startsAt ? new Date(startsAt) : null;
  const endsAtDate = endsAt ? new Date(endsAt) : null;
  if (
    startsAtDate &&
    Number.isNaN(startsAtDate.getTime())
  ) {
    throw new BadRequestException('startsAt must be a valid date');
  }
  if (endsAtDate && Number.isNaN(endsAtDate.getTime())) {
    throw new BadRequestException('endsAt must be a valid date');
  }
  if (startsAtDate && endsAtDate && endsAtDate < startsAtDate) {
    throw new BadRequestException('endsAt must not be before startsAt');
  }
  return { startsAt: startsAtDate, endsAt: endsAtDate };
}
