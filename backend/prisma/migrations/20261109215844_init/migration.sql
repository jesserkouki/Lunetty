-- CreateEnum
CREATE TYPE "RolePlateforme" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "StatutUtilisateur" AS ENUM ('ACTIVE', 'EN_ATTENTE_VERIFICATION', 'SUSPENDU', 'DESACTIVE');

-- CreateEnum
CREATE TYPE "RoleMembre" AS ENUM ('PROPRIETAIRE', 'GERANT', 'OPTICIEN', 'EMPLOYE');

-- CreateEnum
CREATE TYPE "StatutAdhesion" AS ENUM ('INVITE', 'ACTIVE', 'SUSPENDU', 'RETIRE');

-- CreateEnum
CREATE TYPE "StatutMagasin" AS ENUM ('BROUILLON', 'ACTIVE', 'EN_PAUSE', 'SUSPENDU', 'FERME');

-- CreateEnum
CREATE TYPE "TypeAdresse" AS ENUM ('DOMICILE', 'FACTURATION', 'LIVRAISON', 'STORE', 'AUTRE');

-- CreateEnum
CREATE TYPE "TypeProduit" AS ENUM ('MONTURE', 'VERRE', 'LENTILLE_CONTACT', 'ACCESSOIRE');

-- CreateEnum
CREATE TYPE "StatutProduit" AS ENUM ('BROUILLON', 'ACTIVE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "PublicCible" AS ENUM ('FEMME', 'HOMME', 'MIXTE', 'ENFANT');

-- CreateEnum
CREATE TYPE "TypeConceptionVerre" AS ENUM ('UNIFOCALE', 'BIFOCALE', 'PROGRESSIF', 'LECTURE', 'AUTRE');

-- CreateEnum
CREATE TYPE "TraitementVerre" AS ENUM ('LUMIERE_BLEUE', 'PHOTOCHROMIQUE', 'POLARISE', 'ANTI_REFLET', 'ANTI_RAYURE', 'PROTECTION_UV', 'AUTRE');

-- CreateEnum
CREATE TYPE "FrequenceRemplacementLentille" AS ENUM ('QUOTIDIEN', 'HEBDOMADAIRE', 'BIMENSUEL', 'MENSUEL', 'ANNUEL', 'AUTRE');

-- CreateEnum
CREATE TYPE "StatutAnnonce" AS ENUM ('BROUILLON', 'ACTIVE', 'EN_PAUSE', 'RUPTURE_STOCK', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "TypeEmplacementStock" AS ENUM ('STORE', 'ENTREPOT', 'AUTRE');

-- CreateEnum
CREATE TYPE "TypeMouvementStock" AS ENUM ('RECEPTION', 'VENTE', 'RETOUR', 'AJUSTEMENT', 'TRANSFERT_ENTRANT', 'TRANSFERT_SORTANT', 'ENDOMMAGE', 'RESERVE', 'LIBERE');

-- CreateEnum
CREATE TYPE "CoteOeil" AS ENUM ('DROIT', 'GAUCHE');

-- CreateEnum
CREATE TYPE "StatutPanier" AS ENUM ('ACTIVE', 'CONVERTI', 'ABANDONNE', 'EXPIRE');

-- CreateEnum
CREATE TYPE "StatutCommande" AS ENUM ('EN_ATTENTE_PAIEMENT', 'PAYE', 'CONFIRME', 'EN_TRAITEMENT', 'PRET_A_RETIRER', 'EXPEDIE', 'TERMINE', 'ANNULE', 'REMBOURSE', 'PARTIELLEMENT_REMBOURSE');

-- CreateEnum
CREATE TYPE "StatutPaiement" AS ENUM ('CREE', 'ACTION_REQUISE', 'EN_TRAITEMENT', 'REUSSI', 'ECHOUE', 'ANNULE', 'REMBOURSE', 'PARTIELLEMENT_REMBOURSE');

-- CreateEnum
CREATE TYPE "FournisseurPaiement" AS ENUM ('STRIPE', 'PAYPAL', 'FLOUCI', 'KONNECT', 'AUTRE');

-- CreateEnum
CREATE TYPE "StatutRemboursement" AS ENUM ('PENDING', 'REUSSI', 'ECHOUE', 'ANNULE');

-- CreateEnum
CREATE TYPE "StatutRendezVous" AS ENUM ('DEMANDE', 'CONFIRME', 'REPLANIFIE', 'TERMINE', 'ANNULE', 'ABSENT');

-- CreateEnum
CREATE TYPE "StatutAvis" AS ENUM ('PENDING', 'PUBLIE', 'MASQUE', 'REJETE');

-- CreateEnum
CREATE TYPE "VisibilitePublication" AS ENUM ('PUBLIC', 'ABONNES', 'CLIENTS_MAGASIN', 'PRIVE');

-- CreateEnum
CREATE TYPE "TypeMedia" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "StatutEssayage" AS ENUM ('CREE', 'EN_TRAITEMENT', 'TERMINE', 'ECHOUE', 'EXPIRE', 'DELETED');

-- CreateEnum
CREATE TYPE "TypeFichierEssayage" AS ENUM ('IMAGE_ENTREE', 'IMAGE_SORTIE', 'VIDEO', 'AUTRE');

-- CreateEnum
CREATE TYPE "TypeNotification" AS ENUM ('MISE_A_JOUR_COMMANDE', 'MISE_A_JOUR_PAIEMENT', 'MISE_A_JOUR_RENDEZ_VOUS', 'NOUVEL_ABONNE', 'INTERACTION_PUBLICATION', 'PROMOTION', 'SYSTEME');

-- CreateEnum
CREATE TYPE "CanalNotification" AS ENUM ('DANS_APPLICATION', 'EMAIL', 'PUSH');

-- CreateEnum
CREATE TYPE "StatutNotification" AS ENUM ('PENDING', 'ENVOYE', 'ECHOUE', 'LU');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" UUID NOT NULL,
    "role" "RolePlateforme" NOT NULL DEFAULT 'USER',
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "nom_utilisateur" VARCHAR(50),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "telephone" VARCHAR(30),
    "phone_verified_at" TIMESTAMPTZ(6),
    "email_verified_at" TIMESTAMPTZ(6),
    "profile_image_url" VARCHAR(2048),
    "statut" "StatutUtilisateur" NOT NULL DEFAULT 'EN_ATTENTE_VERIFICATION',
    "last_login_at" TIMESTAMPTZ(6),
    "preferred_language" VARCHAR(10) NOT NULL DEFAULT 'fr',
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profils_clients" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "date_of_birth" DATE,
    "marketing_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "profils_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profils_opticiens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "professional_title" VARCHAR(120),
    "professional_number" VARCHAR(100),
    "biographie" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "profils_opticiens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magasins" (
    "id" UUID NOT NULL,
    "nom" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "logo_url" VARCHAR(2048),
    "cover_image_url" VARCHAR(2048),
    "email" VARCHAR(255),
    "telephone" VARCHAR(30),
    "website_url" VARCHAR(2048),
    "registration_code" VARCHAR(100),
    "statut" "StatutMagasin" NOT NULL DEFAULT 'BROUILLON',
    "fuseau_horaire" VARCHAR(80) NOT NULL DEFAULT 'Africa/Tunis',
    "devise" CHAR(3) NOT NULL DEFAULT 'TND',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "magasins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membres_magasins" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "RoleMembre" NOT NULL DEFAULT 'EMPLOYE',
    "statut" "StatutAdhesion" NOT NULL DEFAULT 'INVITE',
    "invited_at" TIMESTAMPTZ(6),
    "joined_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membres_magasins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adresses" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "store_id" UUID,
    "type" "TypeAdresse" NOT NULL DEFAULT 'AUTRE',
    "libelle" VARCHAR(80),
    "recipient_name" VARCHAR(160),
    "telephone" VARCHAR(30),
    "ligne_1" VARCHAR(255) NOT NULL,
    "ligne_2" VARCHAR(255),
    "ville" VARCHAR(100) NOT NULL,
    "region" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "country_code" CHAR(2) NOT NULL DEFAULT 'TN',
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emplacements_magasins" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "nom" VARCHAR(120) NOT NULL,
    "code" VARCHAR(40),
    "type" "TypeEmplacementStock" NOT NULL DEFAULT 'STORE',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "emplacements_magasins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produits" (
    "id" UUID NOT NULL,
    "nom" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "description" TEXT,
    "marque" VARCHAR(120),
    "fabricant" VARCHAR(120),
    "type" "TypeProduit" NOT NULL,
    "statut" "StatutProduit" NOT NULL DEFAULT 'BROUILLON',
    "public_cible" "PublicCible" NOT NULL DEFAULT 'MIXTE',
    "categorie" VARCHAR(100),
    "etiquettes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attributs" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "produits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variantes_produits" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "variant_name" VARCHAR(120),
    "global_sku" VARCHAR(100),
    "code_barres" VARCHAR(100),
    "couleur" VARCHAR(80),
    "taille" VARCHAR(80),
    "materiau" VARCHAR(100),
    "image_url" VARCHAR(2048),
    "attributs" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "variantes_produits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caracteristiques_montures" (
    "id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "frame_shape" VARCHAR(80),
    "frame_type" VARCHAR(80),
    "frame_width_mm" DECIMAL(6,2),
    "lens_width_mm" DECIMAL(6,2),
    "bridge_width_mm" DECIMAL(6,2),
    "temple_length_mm" DECIMAL(6,2),
    "lens_height_mm" DECIMAL(6,2),

    CONSTRAINT "caracteristiques_montures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caracteristiques_verres" (
    "id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "conception" "TypeConceptionVerre" NOT NULL,
    "materiau" VARCHAR(100),
    "index_of_refraction" DECIMAL(4,2),
    "traitements" "TraitementVerre"[] DEFAULT ARRAY[]::"TraitementVerre"[],

    CONSTRAINT "caracteristiques_verres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caracteristiques_lentilles_contact" (
    "id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "remplacement" "FrequenceRemplacementLentille" NOT NULL,
    "base_curve" DECIMAL(4,2),
    "diameter_mm" DECIMAL(4,2),
    "water_content" DECIMAL(5,2),
    "materiau" VARCHAR(100),

    CONSTRAINT "caracteristiques_lentilles_contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annonces_magasins" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "created_by_id" UUID,
    "title_override" VARCHAR(200),
    "description_override" TEXT,
    "statut" "StatutAnnonce" NOT NULL DEFAULT 'BROUILLON',
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "annonces_magasins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variantes_annonces_magasins" (
    "id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "store_sku" VARCHAR(100),
    "store_barcode" VARCHAR(100),
    "prix" DECIMAL(12,3) NOT NULL,
    "compare_at_price" DECIMAL(12,3),
    "devise" CHAR(3) NOT NULL DEFAULT 'TND',
    "is_available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "variantes_annonces_magasins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stocks" (
    "id" UUID NOT NULL,
    "store_listing_variant_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "quantity_on_hand" INTEGER NOT NULL DEFAULT 0,
    "quantity_reserved" INTEGER NOT NULL DEFAULT 0,
    "reorder_level" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mouvements_stock" (
    "id" UUID NOT NULL,
    "inventory_id" UUID NOT NULL,
    "actor_id" UUID,
    "type" "TypeMouvementStock" NOT NULL,
    "quantite" INTEGER NOT NULL,
    "reference" VARCHAR(120),
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mouvements_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordonnances" (
    "id" UUID NOT NULL,
    "client_profile_id" UUID NOT NULL,
    "prescribing_store_id" UUID,
    "titre" VARCHAR(120),
    "prescribed_at" DATE,
    "expires_at" DATE,
    "notes" TEXT,
    "source_document_key" VARCHAR(1024),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ordonnances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yeux_ordonnances" (
    "id" UUID NOT NULL,
    "prescription_id" UUID NOT NULL,
    "cote" "CoteOeil" NOT NULL,
    "sphere" DECIMAL(5,2),
    "cylindre" DECIMAL(5,2),
    "axe" INTEGER,
    "addition" DECIMAL(5,2),
    "prisme" DECIMAL(5,2),
    "base" VARCHAR(20),
    "pupillary_distance" DECIMAL(5,2),

    CONSTRAINT "yeux_ordonnances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paniers" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "statut" "StatutPanier" NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "paniers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles_paniers" (
    "id" UUID NOT NULL,
    "cart_id" UUID NOT NULL,
    "listing_variant_id" UUID NOT NULL,
    "quantite" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "articles_paniers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commandes" (
    "id" UUID NOT NULL,
    "order_number" VARCHAR(40) NOT NULL,
    "user_id" UUID NOT NULL,
    "client_profile_id" UUID,
    "store_id" UUID NOT NULL,
    "statut" "StatutCommande" NOT NULL DEFAULT 'EN_ATTENTE_PAIEMENT',
    "devise" CHAR(3) NOT NULL DEFAULT 'TND',
    "sous_total" DECIMAL(12,3) NOT NULL,
    "discount_total" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "tax_total" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "shipping_total" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "grand_total" DECIMAL(12,3) NOT NULL,
    "customer_note" TEXT,
    "billing_address_snapshot" JSONB,
    "shipping_address_snapshot" JSONB,
    "placed_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "commandes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles_commandes" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "listing_variant_id" UUID,
    "product_name_snapshot" VARCHAR(200) NOT NULL,
    "variant_snapshot" JSONB,
    "sku_snapshot" VARCHAR(100),
    "quantite" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,3) NOT NULL,
    "discount_amount" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "line_total" DECIMAL(12,3) NOT NULL,
    "prescription_id" UUID,

    CONSTRAINT "articles_commandes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historique_statuts_commandes" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "from_status" "StatutCommande",
    "to_status" "StatutCommande" NOT NULL,
    "note" TEXT,
    "changed_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historique_statuts_commandes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paiements" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "fournisseur" "FournisseurPaiement" NOT NULL,
    "statut" "StatutPaiement" NOT NULL DEFAULT 'CREE',
    "montant" DECIMAL(12,3) NOT NULL,
    "devise" CHAR(3) NOT NULL DEFAULT 'TND',
    "provider_payment_id" VARCHAR(180),
    "checkout_url" VARCHAR(2048),
    "idempotency_key" VARCHAR(180),
    "failure_code" VARCHAR(100),
    "failure_message" TEXT,
    "provider_payload" JSONB,
    "paid_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "paiements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remboursements" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "montant" DECIMAL(12,3) NOT NULL,
    "devise" CHAR(3) NOT NULL DEFAULT 'TND',
    "statut" "StatutRemboursement" NOT NULL DEFAULT 'PENDING',
    "provider_refund_id" VARCHAR(180),
    "raison" TEXT,
    "processed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "remboursements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evenements_webhook_paiement" (
    "id" UUID NOT NULL,
    "fournisseur" "FournisseurPaiement" NOT NULL,
    "provider_event_id" VARCHAR(200) NOT NULL,
    "event_type" VARCHAR(150) NOT NULL,
    "donnees" JSONB NOT NULL,
    "processed_at" TIMESTAMPTZ(6),
    "processing_error" TEXT,
    "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evenements_webhook_paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rendez_vous" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "order_id" UUID,
    "statut" "StatutRendezVous" NOT NULL DEFAULT 'DEMANDE',
    "service_type" VARCHAR(100) NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "customer_note" TEXT,
    "internal_note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rendez_vous_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avis_produits" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "note" INTEGER NOT NULL,
    "titre" VARCHAR(160),
    "contenu" TEXT,
    "statut" "StatutAvis" NOT NULL DEFAULT 'PENDING',
    "verified_purchase" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "avis_produits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avis_magasins" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "order_id" UUID,
    "note" INTEGER NOT NULL,
    "titre" VARCHAR(160),
    "contenu" TEXT,
    "statut" "StatutAvis" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avis_magasins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produits_favoris" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produits_favoris_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magasins_favoris" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "magasins_favoris_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publications" (
    "id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "store_id" UUID,
    "legende" TEXT,
    "visibilite" "VisibilitePublication" NOT NULL DEFAULT 'PUBLIC',
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medias_publications" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "type" "TypeMedia" NOT NULL,
    "storage_key" VARCHAR(1024) NOT NULL,
    "thumbnail_key" VARCHAR(1024),
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "medias_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commentaires_publications" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "parent_id" UUID,
    "contenu" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "commentaires_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aimes_publications" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aimes_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abonnements_utilisateurs" (
    "id" UUID NOT NULL,
    "follower_id" UUID NOT NULL,
    "followed_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abonnements_utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abonnements_magasins" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abonnements_magasins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partages_publications" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "legende" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partages_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions_essayage" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "product_variant_id" UUID,
    "statut" "StatutEssayage" NOT NULL DEFAULT 'CREE',
    "metadonnees" JSONB,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "sessions_essayage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fichiers_essayage" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "type" "TypeFichierEssayage" NOT NULL,
    "storage_key" VARCHAR(1024) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size_bytes" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "fichiers_essayage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consentements_essayage" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "consent_version" VARCHAR(40) NOT NULL,
    "objectif" VARCHAR(255) NOT NULL,
    "accepted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawn_at" TIMESTAMPTZ(6),

    CONSTRAINT "consentements_essayage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "TypeNotification" NOT NULL,
    "titre" VARCHAR(180) NOT NULL,
    "contenu" TEXT NOT NULL,
    "donnees" JSONB,
    "statut" "StatutNotification" NOT NULL DEFAULT 'PENDING',
    "read_at" TIMESTAMPTZ(6),
    "sent_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preferences_notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "TypeNotification" NOT NULL,
    "canal" "CanalNotification" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "preferences_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journaux_audit" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "store_id" UUID,
    "action" VARCHAR(120) NOT NULL,
    "entity_type" VARCHAR(120) NOT NULL,
    "entity_id" VARCHAR(100),
    "ip_address" VARCHAR(64),
    "user_agent" VARCHAR(512),
    "metadonnees" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journaux_audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_nom_utilisateur_key" ON "utilisateurs"("nom_utilisateur");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE INDEX "utilisateurs_statut_deleted_at_idx" ON "utilisateurs"("statut", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "profils_clients_user_id_key" ON "profils_clients"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "profils_opticiens_user_id_key" ON "profils_opticiens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "magasins_slug_key" ON "magasins"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "magasins_registration_code_key" ON "magasins"("registration_code");

-- CreateIndex
CREATE INDEX "magasins_statut_deleted_at_idx" ON "magasins"("statut", "deleted_at");

-- CreateIndex
CREATE INDEX "membres_magasins_user_id_statut_idx" ON "membres_magasins"("user_id", "statut");

-- CreateIndex
CREATE UNIQUE INDEX "membres_magasins_store_id_user_id_key" ON "membres_magasins"("store_id", "user_id");

-- CreateIndex
CREATE INDEX "adresses_user_id_is_default_idx" ON "adresses"("user_id", "is_default");

-- CreateIndex
CREATE INDEX "adresses_store_id_idx" ON "adresses"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "emplacements_magasins_store_id_code_key" ON "emplacements_magasins"("store_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "produits_slug_key" ON "produits"("slug");

-- CreateIndex
CREATE INDEX "produits_type_statut_idx" ON "produits"("type", "statut");

-- CreateIndex
CREATE INDEX "produits_marque_categorie_idx" ON "produits"("marque", "categorie");

-- CreateIndex
CREATE UNIQUE INDEX "variantes_produits_global_sku_key" ON "variantes_produits"("global_sku");

-- CreateIndex
CREATE UNIQUE INDEX "variantes_produits_code_barres_key" ON "variantes_produits"("code_barres");

-- CreateIndex
CREATE INDEX "variantes_produits_product_id_is_active_idx" ON "variantes_produits"("product_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "caracteristiques_montures_variant_id_key" ON "caracteristiques_montures"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "caracteristiques_verres_variant_id_key" ON "caracteristiques_verres"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "caracteristiques_lentilles_contact_variant_id_key" ON "caracteristiques_lentilles_contact"("variant_id");

-- CreateIndex
CREATE INDEX "annonces_magasins_store_id_statut_deleted_at_idx" ON "annonces_magasins"("store_id", "statut", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "annonces_magasins_store_id_product_id_key" ON "annonces_magasins"("store_id", "product_id");

-- CreateIndex
CREATE INDEX "variantes_annonces_magasins_listing_id_is_available_idx" ON "variantes_annonces_magasins"("listing_id", "is_available");

-- CreateIndex
CREATE UNIQUE INDEX "variantes_annonces_magasins_listing_id_variant_id_key" ON "variantes_annonces_magasins"("listing_id", "variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "variantes_annonces_magasins_store_sku_key" ON "variantes_annonces_magasins"("store_sku");

-- CreateIndex
CREATE UNIQUE INDEX "variantes_annonces_magasins_store_barcode_key" ON "variantes_annonces_magasins"("store_barcode");

-- CreateIndex
CREATE UNIQUE INDEX "stocks_store_listing_variant_id_location_id_key" ON "stocks"("store_listing_variant_id", "location_id");

-- CreateIndex
CREATE INDEX "mouvements_stock_inventory_id_created_at_idx" ON "mouvements_stock"("inventory_id", "created_at");

-- CreateIndex
CREATE INDEX "ordonnances_client_profile_id_prescribed_at_idx" ON "ordonnances"("client_profile_id", "prescribed_at");

-- CreateIndex
CREATE UNIQUE INDEX "yeux_ordonnances_prescription_id_cote_key" ON "yeux_ordonnances"("prescription_id", "cote");

-- CreateIndex
CREATE INDEX "paniers_user_id_statut_idx" ON "paniers"("user_id", "statut");

-- CreateIndex
CREATE UNIQUE INDEX "articles_paniers_cart_id_listing_variant_id_key" ON "articles_paniers"("cart_id", "listing_variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "commandes_order_number_key" ON "commandes"("order_number");

-- CreateIndex
CREATE INDEX "commandes_user_id_created_at_idx" ON "commandes"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "commandes_store_id_statut_created_at_idx" ON "commandes"("store_id", "statut", "created_at");

-- CreateIndex
CREATE INDEX "articles_commandes_order_id_idx" ON "articles_commandes"("order_id");

-- CreateIndex
CREATE INDEX "historique_statuts_commandes_order_id_created_at_idx" ON "historique_statuts_commandes"("order_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "paiements_provider_payment_id_key" ON "paiements"("provider_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "paiements_idempotency_key_key" ON "paiements"("idempotency_key");

-- CreateIndex
CREATE INDEX "paiements_order_id_created_at_idx" ON "paiements"("order_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "remboursements_provider_refund_id_key" ON "remboursements"("provider_refund_id");

-- CreateIndex
CREATE INDEX "remboursements_order_id_statut_idx" ON "remboursements"("order_id", "statut");

-- CreateIndex
CREATE INDEX "evenements_webhook_paiement_processed_at_received_at_idx" ON "evenements_webhook_paiement"("processed_at", "received_at");

-- CreateIndex
CREATE UNIQUE INDEX "evenements_webhook_paiement_fournisseur_provider_event_id_key" ON "evenements_webhook_paiement"("fournisseur", "provider_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "rendez_vous_order_id_key" ON "rendez_vous"("order_id");

-- CreateIndex
CREATE INDEX "rendez_vous_store_id_starts_at_statut_idx" ON "rendez_vous"("store_id", "starts_at", "statut");

-- CreateIndex
CREATE INDEX "rendez_vous_user_id_starts_at_idx" ON "rendez_vous"("user_id", "starts_at");

-- CreateIndex
CREATE INDEX "avis_produits_product_id_statut_created_at_idx" ON "avis_produits"("product_id", "statut", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "avis_magasins_order_id_key" ON "avis_magasins"("order_id");

-- CreateIndex
CREATE INDEX "avis_magasins_store_id_statut_created_at_idx" ON "avis_magasins"("store_id", "statut", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "produits_favoris_user_id_product_id_key" ON "produits_favoris"("user_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "magasins_favoris_user_id_store_id_key" ON "magasins_favoris"("user_id", "store_id");

-- CreateIndex
CREATE INDEX "publications_store_id_is_published_published_at_idx" ON "publications"("store_id", "is_published", "published_at");

-- CreateIndex
CREATE INDEX "publications_author_id_created_at_idx" ON "publications"("author_id", "created_at");

-- CreateIndex
CREATE INDEX "medias_publications_post_id_position_idx" ON "medias_publications"("post_id", "position");

-- CreateIndex
CREATE INDEX "commentaires_publications_post_id_created_at_idx" ON "commentaires_publications"("post_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "aimes_publications_post_id_user_id_key" ON "aimes_publications"("post_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "abonnements_utilisateurs_follower_id_followed_id_key" ON "abonnements_utilisateurs"("follower_id", "followed_id");

-- CreateIndex
CREATE UNIQUE INDEX "abonnements_magasins_user_id_store_id_key" ON "abonnements_magasins"("user_id", "store_id");

-- CreateIndex
CREATE UNIQUE INDEX "partages_publications_post_id_user_id_key" ON "partages_publications"("post_id", "user_id");

-- CreateIndex
CREATE INDEX "sessions_essayage_user_id_started_at_idx" ON "sessions_essayage"("user_id", "started_at");

-- CreateIndex
CREATE INDEX "sessions_essayage_statut_expires_at_idx" ON "sessions_essayage"("statut", "expires_at");

-- CreateIndex
CREATE INDEX "fichiers_essayage_session_id_type_idx" ON "fichiers_essayage"("session_id", "type");

-- CreateIndex
CREATE INDEX "fichiers_essayage_expires_at_idx" ON "fichiers_essayage"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "consentements_essayage_session_id_key" ON "consentements_essayage"("session_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_statut_created_at_idx" ON "notifications"("user_id", "statut", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "preferences_notifications_user_id_type_canal_key" ON "preferences_notifications"("user_id", "type", "canal");

-- CreateIndex
CREATE INDEX "journaux_audit_actor_id_created_at_idx" ON "journaux_audit"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "journaux_audit_store_id_created_at_idx" ON "journaux_audit"("store_id", "created_at");

-- CreateIndex
CREATE INDEX "journaux_audit_entity_type_entity_id_idx" ON "journaux_audit"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "profils_clients" ADD CONSTRAINT "profils_clients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profils_opticiens" ADD CONSTRAINT "profils_opticiens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membres_magasins" ADD CONSTRAINT "membres_magasins_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membres_magasins" ADD CONSTRAINT "membres_magasins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adresses" ADD CONSTRAINT "adresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adresses" ADD CONSTRAINT "adresses_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emplacements_magasins" ADD CONSTRAINT "emplacements_magasins_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variantes_produits" ADD CONSTRAINT "variantes_produits_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caracteristiques_montures" ADD CONSTRAINT "caracteristiques_montures_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variantes_produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caracteristiques_verres" ADD CONSTRAINT "caracteristiques_verres_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variantes_produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caracteristiques_lentilles_contact" ADD CONSTRAINT "caracteristiques_lentilles_contact_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variantes_produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annonces_magasins" ADD CONSTRAINT "annonces_magasins_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annonces_magasins" ADD CONSTRAINT "annonces_magasins_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "produits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annonces_magasins" ADD CONSTRAINT "annonces_magasins_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variantes_annonces_magasins" ADD CONSTRAINT "variantes_annonces_magasins_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "annonces_magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variantes_annonces_magasins" ADD CONSTRAINT "variantes_annonces_magasins_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variantes_produits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_store_listing_variant_id_fkey" FOREIGN KEY ("store_listing_variant_id") REFERENCES "variantes_annonces_magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "emplacements_magasins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mouvements_stock" ADD CONSTRAINT "mouvements_stock_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "stocks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mouvements_stock" ADD CONSTRAINT "mouvements_stock_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordonnances" ADD CONSTRAINT "ordonnances_client_profile_id_fkey" FOREIGN KEY ("client_profile_id") REFERENCES "profils_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordonnances" ADD CONSTRAINT "ordonnances_prescribing_store_id_fkey" FOREIGN KEY ("prescribing_store_id") REFERENCES "magasins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yeux_ordonnances" ADD CONSTRAINT "yeux_ordonnances_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "ordonnances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paniers" ADD CONSTRAINT "paniers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles_paniers" ADD CONSTRAINT "articles_paniers_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "paniers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles_paniers" ADD CONSTRAINT "articles_paniers_listing_variant_id_fkey" FOREIGN KEY ("listing_variant_id") REFERENCES "variantes_annonces_magasins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_client_profile_id_fkey" FOREIGN KEY ("client_profile_id") REFERENCES "profils_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "magasins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles_commandes" ADD CONSTRAINT "articles_commandes_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles_commandes" ADD CONSTRAINT "articles_commandes_listing_variant_id_fkey" FOREIGN KEY ("listing_variant_id") REFERENCES "variantes_annonces_magasins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles_commandes" ADD CONSTRAINT "articles_commandes_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "ordonnances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historique_statuts_commandes" ADD CONSTRAINT "historique_statuts_commandes_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historique_statuts_commandes" ADD CONSTRAINT "historique_statuts_commandes_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "commandes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remboursements" ADD CONSTRAINT "remboursements_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "commandes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remboursements" ADD CONSTRAINT "remboursements_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "paiements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rendez_vous" ADD CONSTRAINT "rendez_vous_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rendez_vous" ADD CONSTRAINT "rendez_vous_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "magasins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rendez_vous" ADD CONSTRAINT "rendez_vous_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "commandes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis_produits" ADD CONSTRAINT "avis_produits_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "produits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis_produits" ADD CONSTRAINT "avis_produits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis_magasins" ADD CONSTRAINT "avis_magasins_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "magasins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis_magasins" ADD CONSTRAINT "avis_magasins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis_magasins" ADD CONSTRAINT "avis_magasins_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "commandes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produits_favoris" ADD CONSTRAINT "produits_favoris_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produits_favoris" ADD CONSTRAINT "produits_favoris_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magasins_favoris" ADD CONSTRAINT "magasins_favoris_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magasins_favoris" ADD CONSTRAINT "magasins_favoris_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publications" ADD CONSTRAINT "publications_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publications" ADD CONSTRAINT "publications_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medias_publications" ADD CONSTRAINT "medias_publications_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentaires_publications" ADD CONSTRAINT "commentaires_publications_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentaires_publications" ADD CONSTRAINT "commentaires_publications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentaires_publications" ADD CONSTRAINT "commentaires_publications_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "commentaires_publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aimes_publications" ADD CONSTRAINT "aimes_publications_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aimes_publications" ADD CONSTRAINT "aimes_publications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonnements_utilisateurs" ADD CONSTRAINT "abonnements_utilisateurs_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonnements_utilisateurs" ADD CONSTRAINT "abonnements_utilisateurs_followed_id_fkey" FOREIGN KEY ("followed_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonnements_magasins" ADD CONSTRAINT "abonnements_magasins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonnements_magasins" ADD CONSTRAINT "abonnements_magasins_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partages_publications" ADD CONSTRAINT "partages_publications_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partages_publications" ADD CONSTRAINT "partages_publications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions_essayage" ADD CONSTRAINT "sessions_essayage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions_essayage" ADD CONSTRAINT "sessions_essayage_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "variantes_produits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichiers_essayage" ADD CONSTRAINT "fichiers_essayage_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions_essayage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consentements_essayage" ADD CONSTRAINT "consentements_essayage_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions_essayage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preferences_notifications" ADD CONSTRAINT "preferences_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journaux_audit" ADD CONSTRAINT "journaux_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
