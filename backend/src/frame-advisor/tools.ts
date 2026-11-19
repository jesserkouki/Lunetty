// Définitions d'outils au format OpenAI/Groq (function calling).
export const TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'search_catalog',
      description:
        "Recherche des montures en stock dans le catalogue Lunnety. Les résultats sont triés par pertinence (visage, style, usage). Utiliser avant toute recommandation.",
      parameters: {
        type: 'object',
        properties: {
          max_price: { type: 'number', description: 'Budget maximum en dinars tunisiens (TND)' },
          min_price: { type: 'number', description: 'Prix minimum en dinars tunisiens (TND)' },
          audience: {
            type: 'string',
            enum: ['femme', 'homme', 'mixte', 'enfant'],
            description: 'Pour qui est la monture. Omettre si le client ne précise pas (les montures enfant sont alors exclues).',
          },
          face_shape: {
            type: 'string',
            enum: ['oval', 'round', 'square', 'heart', 'long'],
            description: 'Forme du visage du client',
          },
          shapes: {
            type: 'array',
            items: {
              type: 'string',
              enum: [
                'round', 'oval', 'rectangular', 'square', 'aviator', 'geometric',
                'cat-eye', 'butterfly', 'oversize', 'panto', 'wrap',
              ],
            },
            description:
              "Formes de monture exigées (filtre strict). À omettre si le client n'a pas de préférence.",
          },
          materials: {
            type: 'array',
            items: { type: 'string', enum: ['metal', 'acetate', 'titanium', 'plastic'] },
            description: 'Matières exigées (filtre strict)',
          },
          styles: {
            type: 'array',
            items: { type: 'string', enum: ['classique', 'tendance', 'discret', 'affirmé'] },
          },
          usage: {
            type: 'string',
            enum: ['quotidien', 'travail', 'ecran', 'sport', 'conduite'],
          },
          width: { type: 'string', enum: ['small', 'medium', 'large'] },
          limit: { type: 'integer', description: 'Nombre de résultats (1-10, défaut 6)' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'show_recommendations',
      description:
        'Affiche au client les cartes produits des montures recommandées (3 maximum). À appeler avec les ids issus de search_catalog.',
      parameters: {
        type: 'object',
        properties: {
          product_ids: { type: 'array', items: { type: 'string' }, maxItems: 3 },
        },
        required: ['product_ids'],
      },
    },
  },
];