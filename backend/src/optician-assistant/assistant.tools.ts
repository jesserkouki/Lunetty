export const OPTICIAN_ASSISTANT_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'search_inventory',
      description:
        'Recherche les stocks de la boutique par référence, code-barres, marque, couleur ou nom de produit.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Terme à rechercher' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_low_stock',
      description:
        'Liste les articles dont la quantité disponible (en stock moins réservée) est au seuil de réapprovisionnement ou en dessous.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'stock_movements',
      description:
        'Affiche l’historique des mouvements d’un article identifié par search_inventory.',
      parameters: {
        type: 'object',
        properties: {
          stock_id: { type: 'string', description: 'Identifiant retourné par search_inventory' },
          days: { type: 'integer', minimum: 1, maximum: 365 },
        },
        required: ['stock_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_orders',
      description:
        'Liste les commandes à traiter ou recherche une commande par numéro.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Numéro ou partie du numéro de commande' },
          status: { type: 'string', description: 'Statut de commande facultatif' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'order_details',
      description:
        'Récupère le détail non personnel d’une commande identifiée par son numéro ou son identifiant.',
      parameters: {
        type: 'object',
        properties: {
          reference: { type: 'string', description: 'Numéro ou identifiant de commande' },
        },
        required: ['reference'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'failed_payments',
      description: 'Liste les paiements échoués de la boutique, sans données client.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'refunds',
      description: 'Recherche les remboursements de la boutique sur une période.',
      parameters: {
        type: 'object',
        properties: {
          from: { type: 'string', description: 'Date de début au format AAAA-MM-JJ' },
          to: { type: 'string', description: 'Date de fin au format AAAA-MM-JJ' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'appointments',
      description:
        'Affiche le planning des rendez-vous de la boutique sur une période.',
      parameters: {
        type: 'object',
        properties: {
          from: { type: 'string', description: 'Date de début au format AAAA-MM-JJ' },
          to: { type: 'string', description: 'Date de fin au format AAAA-MM-JJ' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'revenue',
      description:
        'Calcule le chiffre d’affaires brut, les remboursements, le net, le nombre de commandes, le panier moyen et le détail journalier. Réservé au propriétaire et au gérant.',
      parameters: {
        type: 'object',
        properties: {
          from: { type: 'string', description: 'Date de début au format AAAA-MM-JJ' },
          to: { type: 'string', description: 'Date de fin au format AAAA-MM-JJ' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'my_profile',
      description:
        'Affiche le profil professionnel, le rôle et les permissions effectives de l’utilisateur connecté dans cette boutique.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'team_member',
      description:
        'Recherche le rôle, le statut et les permissions d’un membre de l’équipe. Réservé au propriétaire et au gérant.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Prénom ou nom du membre' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'recent_activity',
      description:
        'Affiche les dernières actions d’audit. Un employé ne peut consulter que sa propre activité.',
      parameters: {
        type: 'object',
        properties: {
          member_id: { type: 'string', description: 'Identifiant facultatif d’un membre' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'prepare_stock_adjustment',
      description:
        'Prépare, sans l’appliquer, une proposition de nouvelle quantité en stock. Utiliser uniquement après avoir identifié l’article et la quantité actuelle.',
      parameters: {
        type: 'object',
        properties: {
          stock_id: { type: 'string' },
          quantity_after: { type: 'integer', minimum: 0 },
          reason: { type: 'string', description: 'Motif de l’ajustement' },
        },
        required: ['stock_id', 'quantity_after', 'reason'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'prepare_order_status_change',
      description:
        'Prépare, sans l’appliquer, une proposition de changement de statut de commande.',
      parameters: {
        type: 'object',
        properties: {
          order_id: { type: 'string' },
          status: {
            type: 'string',
            enum: [
              'CONFIRME',
              'EN_TRAITEMENT',
              'PRET_A_RETIRER',
              'EXPEDIE',
              'TERMINE',
              'ANNULE',
            ],
          },
          reason: { type: 'string', description: 'Motif du changement' },
        },
        required: ['order_id', 'status', 'reason'],
      },
    },
  },
] as const;
