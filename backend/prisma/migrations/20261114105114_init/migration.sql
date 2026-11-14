-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'MANAGER', 'OPTICIAN', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'REMOVED');

-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('HOME', 'BILLING', 'SHIPPING', 'STORE', 'OTHER');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('FRAME', 'LENS', 'CONTACT_LENS', 'ACCESSORY');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Audience" AS ENUM ('WOMEN', 'MEN', 'UNISEX', 'CHILDREN');

-- CreateEnum
CREATE TYPE "LensDesign" AS ENUM ('SINGLE_VISION', 'BIFOCAL', 'PROGRESSIVE', 'READING', 'OTHER');

-- CreateEnum
CREATE TYPE "LensTreatment" AS ENUM ('BLUE_LIGHT', 'PHOTOCHROMIC', 'POLARIZED', 'ANTI_REFLECTIVE', 'SCRATCH_RESISTANT', 'UV_PROTECTION', 'OTHER');

-- CreateEnum
CREATE TYPE "ContactLensReplacement" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY', 'OTHER');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'OUT_OF_STOCK', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "StockLocationType" AS ENUM ('STORE', 'WAREHOUSE', 'OTHER');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('RECEIPT', 'SALE', 'RETURN', 'ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT', 'DAMAGE', 'RESERVED', 'RELEASED');

-- CreateEnum
CREATE TYPE "InventoryItemType" AS ENUM ('PRESCRIPTION_GLASSES', 'SUN_GLASSES', 'FRAME');

-- CreateEnum
CREATE TYPE "StockLensDesign" AS ENUM ('SIMPLE', 'PROGRESSIF');

-- CreateEnum
CREATE TYPE "StockLensTreatment" AS ENUM ('BLUE_LIGHT', 'PHOTOCHROMIC', 'HYBRID_PHOTO');

-- CreateEnum
CREATE TYPE "FrameAgeGroup" AS ENUM ('ADULTE', 'ENFANT');

-- CreateEnum
CREATE TYPE "EyeSide" AS ENUM ('RIGHT', 'LEFT');

-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'CONVERTED', 'ABANDONED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'REQUIRES_ACTION', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'PAYPAL', 'FLOUCI', 'KONNECT', 'OTHER');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'PUBLISHED', 'HIDDEN', 'REJECTED');

-- CreateEnum
CREATE TYPE "PostVisibility" AS ENUM ('PUBLIC', 'FOLLOWERS', 'STORE_CUSTOMERS', 'PRIVATE');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "TryOnStatus" AS ENUM ('CREATED', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED', 'DELETED');

-- CreateEnum
CREATE TYPE "TryOnAssetType" AS ENUM ('INPUT_IMAGE', 'OUTPUT_IMAGE', 'VIDEO', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORDER_UPDATE', 'PAYMENT_UPDATE', 'APPOINTMENT_UPDATE', 'NEW_FOLLOWER', 'POST_INTERACTION', 'PROMOTION', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" UUID NOT NULL,
    "role" "PlatformRole" NOT NULL DEFAULT 'USER',
    "prenom" VARCHAR(100) NOT NULL,
    "nom_famille" VARCHAR(100) NOT NULL,
    "username" VARCHAR(50),
    "email" VARCHAR(255) NOT NULL,
    "empreinte_mot_de_passe" VARCHAR(255) NOT NULL,
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "phone" VARCHAR(30),
    "phone_verified_at" TIMESTAMPTZ(6),
    "email_verified_at" TIMESTAMPTZ(6),
    "profile_image_url" VARCHAR(2048),
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "last_login_at" TIMESTAMPTZ(6),
    "preferred_language" VARCHAR(10) NOT NULL DEFAULT 'fr',
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,
    "supprime_le" TIMESTAMPTZ(6),

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profils_clients" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "date_naissance" DATE,
    "marketing_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "profils_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profils_opticiens" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "professional_title" VARCHAR(120),
    "professional_number" VARCHAR(100),
    "bio" TEXT,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "profils_opticiens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magasins" (
    "id" UUID NOT NULL,
    "nom" VARCHAR(160) NOT NULL,
    "identifiant_url" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "logo_url" VARCHAR(2048),
    "cover_image_url" VARCHAR(2048),
    "email" VARCHAR(255),
    "phone" VARCHAR(30),
    "website_url" VARCHAR(2048),
    "registration_code" VARCHAR(100),
    "status" "StoreStatus" NOT NULL DEFAULT 'DRAFT',
    "timezone" VARCHAR(80) NOT NULL DEFAULT 'Africa/Tunis',
    "currency" CHAR(3) NOT NULL DEFAULT 'TND',
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,
    "supprime_le" TIMESTAMPTZ(6),

    CONSTRAINT "magasins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adhesions_magasins" (
    "id" UUID NOT NULL,
    "magasin_id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'EMPLOYEE',
    "status" "MembershipStatus" NOT NULL DEFAULT 'INVITED',
    "invited_at" TIMESTAMPTZ(6),
    "joined_at" TIMESTAMPTZ(6),
    "permission_preset" VARCHAR(60),
    "permissions_updated_at" TIMESTAMPTZ(6),
    "permissions_updated_by" UUID,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adhesions_magasins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions_membres_magasins" (
    "id" UUID NOT NULL,
    "membre_magasin_id" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "autorise" BOOLEAN NOT NULL,
    "modifie_par" UUID,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "permissions_membres_magasins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adresses" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID,
    "magasin_id" UUID,
    "type" "AddressType" NOT NULL DEFAULT 'OTHER',
    "label" VARCHAR(80),
    "recipient_name" VARCHAR(160),
    "phone" VARCHAR(30),
    "line1" VARCHAR(255) NOT NULL,
    "line2" VARCHAR(255),
    "city" VARCHAR(100) NOT NULL,
    "region" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "country_code" CHAR(2) NOT NULL DEFAULT 'TN',
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emplacements_stock" (
    "id" UUID NOT NULL,
    "magasin_id" UUID NOT NULL,
    "nom" VARCHAR(120) NOT NULL,
    "code" VARCHAR(40),
    "type" "StockLocationType" NOT NULL DEFAULT 'STORE',
    "type_personnalise_id" UUID,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "emplacements_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "types_emplacements_magasins" (
    "id" UUID NOT NULL,
    "magasin_id" UUID NOT NULL,
    "nom" VARCHAR(80) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "types_emplacements_magasins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produits" (
    "id" UUID NOT NULL,
    "nom" VARCHAR(200) NOT NULL,
    "identifiant_url" VARCHAR(220) NOT NULL,
    "description" TEXT,
    "brand" VARCHAR(120),
    "manufacturer" VARCHAR(120),
    "type" "ProductType" NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "audience" "Audience" NOT NULL DEFAULT 'UNISEX',
    "category" VARCHAR(100),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attributes" JSONB,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,
    "supprime_le" TIMESTAMP(3),

    CONSTRAINT "produits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variantes_produits" (
    "id" UUID NOT NULL,
    "produit_id" UUID NOT NULL,
    "variant_name" VARCHAR(120),
    "global_sku" VARCHAR(100),
    "barcode" VARCHAR(100),
    "color" VARCHAR(80),
    "size" VARCHAR(80),
    "material" VARCHAR(100),
    "image_url" VARCHAR(2048),
    "attributes" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "variantes_produits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specifications_montures" (
    "id" UUID NOT NULL,
    "variante_id" UUID NOT NULL,
    "frame_shape" VARCHAR(80),
    "frame_type" VARCHAR(80),
    "frame_width_mm" DECIMAL(6,2),
    "lens_width_mm" DECIMAL(6,2),
    "bridge_width_mm" DECIMAL(6,2),
    "temple_length_mm" DECIMAL(6,2),
    "lens_height_mm" DECIMAL(6,2),

    CONSTRAINT "specifications_montures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specifications_verres" (
    "id" UUID NOT NULL,
    "variante_id" UUID NOT NULL,
    "design" "LensDesign" NOT NULL,
    "material" VARCHAR(100),
    "index_of_refraction" DECIMAL(4,2),
    "treatments" "LensTreatment"[] DEFAULT ARRAY[]::"LensTreatment"[],

    CONSTRAINT "specifications_verres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specifications_lentilles_contact" (
    "id" UUID NOT NULL,
    "variante_id" UUID NOT NULL,
    "replacement" "ContactLensReplacement" NOT NULL,
    "base_curve" DECIMAL(4,2),
    "diameter_mm" DECIMAL(4,2),
    "water_content" DECIMAL(5,2),
    "material" VARCHAR(100),

    CONSTRAINT "specifications_lentilles_contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annonces_magasins" (
    "id" UUID NOT NULL,
    "magasin_id" UUID NOT NULL,
    "produit_id" UUID NOT NULL,
    "created_by_id" UUID,
    "title_override" VARCHAR(200),
    "description_override" TEXT,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(6),
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,
    "supprime_le" TIMESTAMP(3),

    CONSTRAINT "annonces_magasins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variantes_annonces" (
    "id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "variante_id" UUID NOT NULL,
    "store_sku" VARCHAR(100),
    "store_barcode" VARCHAR(100),
    "price" DECIMAL(12,3) NOT NULL,
    "compare_at_price" DECIMAL(12,3),
    "currency" CHAR(3) NOT NULL DEFAULT 'TND',
    "is_available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "variantes_annonces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stocks" (
    "id" UUID NOT NULL,
    "store_listing_variant_id" UUID,
    "location_id" UUID NOT NULL,
    "item_type" "InventoryItemType",
    "lens_design" "StockLensDesign",
    "lens_treatment" "StockLensTreatment",
    "right_power" DECIMAL(5,2),
    "left_power" DECIMAL(5,2),
    "brand_reference" VARCHAR(160),
    "frame_age_group" "FrameAgeGroup",
    "target_audience" "Audience",
    "frame_size" VARCHAR(60),
    "quantity_on_hand" INTEGER NOT NULL DEFAULT 0,
    "quantity_reserved" INTEGER NOT NULL DEFAULT 0,
    "reorder_level" INTEGER NOT NULL DEFAULT 0,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mouvements_stock" (
    "id" UUID NOT NULL,
    "inventory_id" UUID NOT NULL,
    "actor_id" UUID,
    "type" "InventoryMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "quantity_before" INTEGER,
    "quantity_after" INTEGER,
    "reserved_before" INTEGER,
    "reserved_after" INTEGER,
    "reference" VARCHAR(120),
    "note" TEXT,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mouvements_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordonnances" (
    "id" UUID NOT NULL,
    "client_profile_id" UUID NOT NULL,
    "prescribing_store_id" UUID,
    "title" VARCHAR(120),
    "prescribed_at" DATE,
    "expires_at" DATE,
    "notes" TEXT,
    "source_document_key" VARCHAR(1024),
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ordonnances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "details_yeux_ordonnance" (
    "id" UUID NOT NULL,
    "prescription_id" UUID NOT NULL,
    "side" "EyeSide" NOT NULL,
    "sphere" DECIMAL(5,2),
    "cylinder" DECIMAL(5,2),
    "axis" INTEGER,
    "addition" DECIMAL(5,2),
    "prism" DECIMAL(5,2),
    "base" VARCHAR(20),
    "pupillary_distance" DECIMAL(5,2),

    CONSTRAINT "details_yeux_ordonnance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paniers" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "status" "CartStatus" NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMPTZ(6),
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "paniers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles_panier" (
    "id" UUID NOT NULL,
    "panier_id" UUID NOT NULL,
    "listing_variant_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "articles_panier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commandes" (
    "id" UUID NOT NULL,
    "order_number" VARCHAR(40) NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "client_profile_id" UUID,
    "magasin_id" UUID NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "currency" CHAR(3) NOT NULL DEFAULT 'TND',
    "subtotal" DECIMAL(12,3) NOT NULL,
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
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "commandes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles_commande" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "listing_variant_id" UUID,
    "instantane_nom_produit" VARCHAR(200) NOT NULL,
    "variant_snapshot" JSONB,
    "sku_snapshot" VARCHAR(100),
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,3) NOT NULL,
    "discount_amount" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "line_total" DECIMAL(12,3) NOT NULL,
    "prescription_id" UUID,

    CONSTRAINT "articles_commande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historique_statuts_commande" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "from_status" "OrderStatus",
    "to_status" "OrderStatus" NOT NULL,
    "note" TEXT,
    "changed_by_id" UUID,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historique_statuts_commande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paiements" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "amount" DECIMAL(12,3) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'TND',
    "provider_payment_id" VARCHAR(180),
    "checkout_url" VARCHAR(2048),
    "idempotency_key" VARCHAR(180),
    "failure_code" VARCHAR(100),
    "failure_message" TEXT,
    "provider_payload" JSONB,
    "paid_at" TIMESTAMPTZ(6),
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "paiements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remboursements" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "amount" DECIMAL(12,3) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'TND',
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "provider_refund_id" VARCHAR(180),
    "reason" TEXT,
    "processed_at" TIMESTAMPTZ(6),
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "remboursements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evenements_webhook_paiement" (
    "id" UUID NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "provider_event_id" VARCHAR(200) NOT NULL,
    "event_type" VARCHAR(150) NOT NULL,
    "payload" JSONB NOT NULL,
    "processed_at" TIMESTAMPTZ(6),
    "processing_error" TEXT,
    "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evenements_webhook_paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rendez_vous" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "magasin_id" UUID NOT NULL,
    "order_id" UUID,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'REQUESTED',
    "service_type" VARCHAR(100) NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "customer_note" TEXT,
    "internal_note" TEXT,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rendez_vous_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avis_produits" (
    "id" UUID NOT NULL,
    "produit_id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" VARCHAR(160),
    "body" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "verified_purchase" BOOLEAN NOT NULL DEFAULT false,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "avis_produits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avis_magasins" (
    "id" UUID NOT NULL,
    "magasin_id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "order_id" UUID,
    "rating" INTEGER NOT NULL,
    "title" VARCHAR(160),
    "body" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avis_magasins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produits_favoris" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "produit_id" UUID NOT NULL,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produits_favoris_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magasins_favoris" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "magasin_id" UUID NOT NULL,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "magasins_favoris_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publications" (
    "id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "magasin_id" UUID,
    "caption" TEXT,
    "visibility" "PostVisibility" NOT NULL DEFAULT 'PUBLIC',
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "published_at" TIMESTAMPTZ(6),
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,
    "supprime_le" TIMESTAMP(3),

    CONSTRAINT "publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medias_publication" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "type" "MediaType" NOT NULL,
    "storage_key" VARCHAR(1024) NOT NULL,
    "thumbnail_key" VARCHAR(1024),
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "medias_publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commentaires_publication" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "parent_id" UUID,
    "body" TEXT NOT NULL,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "commentaires_publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentions_j_aime_publication" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentions_j_aime_publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abonnements_utilisateurs" (
    "id" UUID NOT NULL,
    "follower_id" UUID NOT NULL,
    "followed_id" UUID NOT NULL,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abonnements_utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abonnements_magasins" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "magasin_id" UUID NOT NULL,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abonnements_magasins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partages_publication" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "caption" TEXT,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partages_publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions_essayage" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "variante_id" UUID,
    "status" "TryOnStatus" NOT NULL DEFAULT 'CREATED',
    "metadata" JSONB,
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
    "type" "TryOnAssetType" NOT NULL,
    "storage_key" VARCHAR(1024) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size_bytes" BIGINT,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "fichiers_essayage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consentements_essayage" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "consent_version" VARCHAR(40) NOT NULL,
    "purpose" VARCHAR(255) NOT NULL,
    "accepted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawn_at" TIMESTAMPTZ(6),

    CONSTRAINT "consentements_essayage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "read_at" TIMESTAMPTZ(6),
    "sent_at" TIMESTAMPTZ(6),
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preferences_notifications" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "preferences_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journaux_audit" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "magasin_id" UUID,
    "action" VARCHAR(120) NOT NULL,
    "entity_type" VARCHAR(120) NOT NULL,
    "entity_id" VARCHAR(100),
    "actor_identity" VARCHAR(255),
    "description" TEXT,
    "before_values" JSONB,
    "after_values" JSONB,
    "reason" TEXT,
    "ip_address" VARCHAR(64),
    "user_agent" VARCHAR(512),
    "metadata" JSONB,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journaux_audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_username_key" ON "utilisateurs"("username");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE INDEX "utilisateurs_status_supprime_le_idx" ON "utilisateurs"("status", "supprime_le");

-- CreateIndex
CREATE UNIQUE INDEX "profils_clients_utilisateur_id_key" ON "profils_clients"("utilisateur_id");

-- CreateIndex
CREATE UNIQUE INDEX "profils_opticiens_utilisateur_id_key" ON "profils_opticiens"("utilisateur_id");

-- CreateIndex
CREATE UNIQUE INDEX "magasins_identifiant_url_key" ON "magasins"("identifiant_url");

-- CreateIndex
CREATE UNIQUE INDEX "magasins_registration_code_key" ON "magasins"("registration_code");

-- CreateIndex
CREATE INDEX "magasins_status_supprime_le_idx" ON "magasins"("status", "supprime_le");

-- CreateIndex
CREATE INDEX "adhesions_magasins_utilisateur_id_status_idx" ON "adhesions_magasins"("utilisateur_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "adhesions_magasins_magasin_id_utilisateur_id_key" ON "adhesions_magasins"("magasin_id", "utilisateur_id");

-- CreateIndex
CREATE INDEX "permissions_membres_magasins_code_idx" ON "permissions_membres_magasins"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_membres_magasins_membre_magasin_id_code_key" ON "permissions_membres_magasins"("membre_magasin_id", "code");

-- CreateIndex
CREATE INDEX "adresses_utilisateur_id_is_default_idx" ON "adresses"("utilisateur_id", "is_default");

-- CreateIndex
CREATE INDEX "adresses_magasin_id_idx" ON "adresses"("magasin_id");

-- CreateIndex
CREATE INDEX "emplacements_stock_type_personnalise_id_idx" ON "emplacements_stock"("type_personnalise_id");

-- CreateIndex
CREATE UNIQUE INDEX "emplacements_stock_magasin_id_code_key" ON "emplacements_stock"("magasin_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "types_emplacements_magasins_magasin_id_nom_key" ON "types_emplacements_magasins"("magasin_id", "nom");

-- CreateIndex
CREATE UNIQUE INDEX "produits_identifiant_url_key" ON "produits"("identifiant_url");

-- CreateIndex
CREATE INDEX "produits_type_status_idx" ON "produits"("type", "status");

-- CreateIndex
CREATE INDEX "produits_brand_category_idx" ON "produits"("brand", "category");

-- CreateIndex
CREATE UNIQUE INDEX "variantes_produits_global_sku_key" ON "variantes_produits"("global_sku");

-- CreateIndex
CREATE UNIQUE INDEX "variantes_produits_barcode_key" ON "variantes_produits"("barcode");

-- CreateIndex
CREATE INDEX "variantes_produits_produit_id_is_active_idx" ON "variantes_produits"("produit_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "specifications_montures_variante_id_key" ON "specifications_montures"("variante_id");

-- CreateIndex
CREATE UNIQUE INDEX "specifications_verres_variante_id_key" ON "specifications_verres"("variante_id");

-- CreateIndex
CREATE UNIQUE INDEX "specifications_lentilles_contact_variante_id_key" ON "specifications_lentilles_contact"("variante_id");

-- CreateIndex
CREATE INDEX "annonces_magasins_magasin_id_status_supprime_le_idx" ON "annonces_magasins"("magasin_id", "status", "supprime_le");

-- CreateIndex
CREATE UNIQUE INDEX "annonces_magasins_magasin_id_produit_id_key" ON "annonces_magasins"("magasin_id", "produit_id");

-- CreateIndex
CREATE INDEX "variantes_annonces_listing_id_is_available_idx" ON "variantes_annonces"("listing_id", "is_available");

-- CreateIndex
CREATE UNIQUE INDEX "variantes_annonces_listing_id_variante_id_key" ON "variantes_annonces"("listing_id", "variante_id");

-- CreateIndex
CREATE UNIQUE INDEX "variantes_annonces_store_sku_key" ON "variantes_annonces"("store_sku");

-- CreateIndex
CREATE UNIQUE INDEX "variantes_annonces_store_barcode_key" ON "variantes_annonces"("store_barcode");

-- CreateIndex
CREATE INDEX "stocks_location_id_item_type_idx" ON "stocks"("location_id", "item_type");

-- CreateIndex
CREATE UNIQUE INDEX "stocks_store_listing_variant_id_location_id_key" ON "stocks"("store_listing_variant_id", "location_id");

-- CreateIndex
CREATE INDEX "mouvements_stock_inventory_id_cree_le_idx" ON "mouvements_stock"("inventory_id", "cree_le");

-- CreateIndex
CREATE INDEX "ordonnances_client_profile_id_prescribed_at_idx" ON "ordonnances"("client_profile_id", "prescribed_at");

-- CreateIndex
CREATE UNIQUE INDEX "details_yeux_ordonnance_prescription_id_side_key" ON "details_yeux_ordonnance"("prescription_id", "side");

-- CreateIndex
CREATE INDEX "paniers_utilisateur_id_status_idx" ON "paniers"("utilisateur_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "articles_panier_panier_id_listing_variant_id_key" ON "articles_panier"("panier_id", "listing_variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "commandes_order_number_key" ON "commandes"("order_number");

-- CreateIndex
CREATE INDEX "commandes_utilisateur_id_cree_le_idx" ON "commandes"("utilisateur_id", "cree_le");

-- CreateIndex
CREATE INDEX "commandes_magasin_id_status_cree_le_idx" ON "commandes"("magasin_id", "status", "cree_le");

-- CreateIndex
CREATE INDEX "articles_commande_order_id_idx" ON "articles_commande"("order_id");

-- CreateIndex
CREATE INDEX "historique_statuts_commande_order_id_cree_le_idx" ON "historique_statuts_commande"("order_id", "cree_le");

-- CreateIndex
CREATE UNIQUE INDEX "paiements_provider_payment_id_key" ON "paiements"("provider_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "paiements_idempotency_key_key" ON "paiements"("idempotency_key");

-- CreateIndex
CREATE INDEX "paiements_order_id_cree_le_idx" ON "paiements"("order_id", "cree_le");

-- CreateIndex
CREATE UNIQUE INDEX "remboursements_provider_refund_id_key" ON "remboursements"("provider_refund_id");

-- CreateIndex
CREATE INDEX "remboursements_order_id_status_idx" ON "remboursements"("order_id", "status");

-- CreateIndex
CREATE INDEX "evenements_webhook_paiement_processed_at_received_at_idx" ON "evenements_webhook_paiement"("processed_at", "received_at");

-- CreateIndex
CREATE UNIQUE INDEX "evenements_webhook_paiement_provider_provider_event_id_key" ON "evenements_webhook_paiement"("provider", "provider_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "rendez_vous_order_id_key" ON "rendez_vous"("order_id");

-- CreateIndex
CREATE INDEX "rendez_vous_magasin_id_starts_at_status_idx" ON "rendez_vous"("magasin_id", "starts_at", "status");

-- CreateIndex
CREATE INDEX "rendez_vous_utilisateur_id_starts_at_idx" ON "rendez_vous"("utilisateur_id", "starts_at");

-- CreateIndex
CREATE INDEX "avis_produits_produit_id_status_cree_le_idx" ON "avis_produits"("produit_id", "status", "cree_le");

-- CreateIndex
CREATE UNIQUE INDEX "avis_magasins_order_id_key" ON "avis_magasins"("order_id");

-- CreateIndex
CREATE INDEX "avis_magasins_magasin_id_status_cree_le_idx" ON "avis_magasins"("magasin_id", "status", "cree_le");

-- CreateIndex
CREATE UNIQUE INDEX "produits_favoris_utilisateur_id_produit_id_key" ON "produits_favoris"("utilisateur_id", "produit_id");

-- CreateIndex
CREATE UNIQUE INDEX "magasins_favoris_utilisateur_id_magasin_id_key" ON "magasins_favoris"("utilisateur_id", "magasin_id");

-- CreateIndex
CREATE INDEX "publications_magasin_id_is_published_published_at_idx" ON "publications"("magasin_id", "is_published", "published_at");

-- CreateIndex
CREATE INDEX "publications_author_id_cree_le_idx" ON "publications"("author_id", "cree_le");

-- CreateIndex
CREATE INDEX "medias_publication_post_id_position_idx" ON "medias_publication"("post_id", "position");

-- CreateIndex
CREATE INDEX "commentaires_publication_post_id_cree_le_idx" ON "commentaires_publication"("post_id", "cree_le");

-- CreateIndex
CREATE UNIQUE INDEX "mentions_j_aime_publication_post_id_utilisateur_id_key" ON "mentions_j_aime_publication"("post_id", "utilisateur_id");

-- CreateIndex
CREATE UNIQUE INDEX "abonnements_utilisateurs_follower_id_followed_id_key" ON "abonnements_utilisateurs"("follower_id", "followed_id");

-- CreateIndex
CREATE UNIQUE INDEX "abonnements_magasins_utilisateur_id_magasin_id_key" ON "abonnements_magasins"("utilisateur_id", "magasin_id");

-- CreateIndex
CREATE UNIQUE INDEX "partages_publication_post_id_utilisateur_id_key" ON "partages_publication"("post_id", "utilisateur_id");

-- CreateIndex
CREATE INDEX "sessions_essayage_utilisateur_id_started_at_idx" ON "sessions_essayage"("utilisateur_id", "started_at");

-- CreateIndex
CREATE INDEX "sessions_essayage_status_expires_at_idx" ON "sessions_essayage"("status", "expires_at");

-- CreateIndex
CREATE INDEX "fichiers_essayage_session_id_type_idx" ON "fichiers_essayage"("session_id", "type");

-- CreateIndex
CREATE INDEX "fichiers_essayage_expires_at_idx" ON "fichiers_essayage"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "consentements_essayage_session_id_key" ON "consentements_essayage"("session_id");

-- CreateIndex
CREATE INDEX "notifications_utilisateur_id_status_cree_le_idx" ON "notifications"("utilisateur_id", "status", "cree_le");

-- CreateIndex
CREATE UNIQUE INDEX "preferences_notifications_utilisateur_id_type_channel_key" ON "preferences_notifications"("utilisateur_id", "type", "channel");

-- CreateIndex
CREATE INDEX "journaux_audit_actor_id_cree_le_idx" ON "journaux_audit"("actor_id", "cree_le");

-- CreateIndex
CREATE INDEX "journaux_audit_magasin_id_cree_le_idx" ON "journaux_audit"("magasin_id", "cree_le");

-- CreateIndex
CREATE INDEX "journaux_audit_entity_type_entity_id_idx" ON "journaux_audit"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "journaux_audit_action_cree_le_idx" ON "journaux_audit"("action", "cree_le");

-- AddForeignKey
ALTER TABLE "profils_clients" ADD CONSTRAINT "profils_clients_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profils_opticiens" ADD CONSTRAINT "profils_opticiens_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adhesions_magasins" ADD CONSTRAINT "adhesions_magasins_magasin_id_fkey" FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adhesions_magasins" ADD CONSTRAINT "adhesions_magasins_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions_membres_magasins" ADD CONSTRAINT "permissions_membres_magasins_membre_magasin_id_fkey" FOREIGN KEY ("membre_magasin_id") REFERENCES "adhesions_magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adresses" ADD CONSTRAINT "adresses_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adresses" ADD CONSTRAINT "adresses_magasin_id_fkey" FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emplacements_stock" ADD CONSTRAINT "emplacements_stock_magasin_id_fkey" FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emplacements_stock" ADD CONSTRAINT "emplacements_stock_type_personnalise_id_fkey" FOREIGN KEY ("type_personnalise_id") REFERENCES "types_emplacements_magasins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "types_emplacements_magasins" ADD CONSTRAINT "types_emplacements_magasins_magasin_id_fkey" FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variantes_produits" ADD CONSTRAINT "variantes_produits_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "specifications_montures" ADD CONSTRAINT "specifications_montures_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes_produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "specifications_verres" ADD CONSTRAINT "specifications_verres_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes_produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "specifications_lentilles_contact" ADD CONSTRAINT "specifications_lentilles_contact_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes_produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annonces_magasins" ADD CONSTRAINT "annonces_magasins_magasin_id_fkey" FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annonces_magasins" ADD CONSTRAINT "annonces_magasins_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "produits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annonces_magasins" ADD CONSTRAINT "annonces_magasins_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variantes_annonces" ADD CONSTRAINT "variantes_annonces_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "annonces_magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variantes_annonces" ADD CONSTRAINT "variantes_annonces_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes_produits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_store_listing_variant_id_fkey" FOREIGN KEY ("store_listing_variant_id") REFERENCES "variantes_annonces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "emplacements_stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mouvements_stock" ADD CONSTRAINT "mouvements_stock_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "stocks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mouvements_stock" ADD CONSTRAINT "mouvements_stock_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordonnances" ADD CONSTRAINT "ordonnances_client_profile_id_fkey" FOREIGN KEY ("client_profile_id") REFERENCES "profils_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordonnances" ADD CONSTRAINT "ordonnances_prescribing_store_id_fkey" FOREIGN KEY ("prescribing_store_id") REFERENCES "magasins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "details_yeux_ordonnance" ADD CONSTRAINT "details_yeux_ordonnance_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "ordonnances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paniers" ADD CONSTRAINT "paniers_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles_panier" ADD CONSTRAINT "articles_panier_panier_id_fkey" FOREIGN KEY ("panier_id") REFERENCES "paniers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles_panier" ADD CONSTRAINT "articles_panier_listing_variant_id_fkey" FOREIGN KEY ("listing_variant_id") REFERENCES "variantes_annonces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_client_profile_id_fkey" FOREIGN KEY ("client_profile_id") REFERENCES "profils_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_magasin_id_fkey" FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles_commande" ADD CONSTRAINT "articles_commande_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles_commande" ADD CONSTRAINT "articles_commande_listing_variant_id_fkey" FOREIGN KEY ("listing_variant_id") REFERENCES "variantes_annonces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles_commande" ADD CONSTRAINT "articles_commande_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "ordonnances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historique_statuts_commande" ADD CONSTRAINT "historique_statuts_commande_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historique_statuts_commande" ADD CONSTRAINT "historique_statuts_commande_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "commandes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remboursements" ADD CONSTRAINT "remboursements_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "commandes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remboursements" ADD CONSTRAINT "remboursements_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "paiements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rendez_vous" ADD CONSTRAINT "rendez_vous_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rendez_vous" ADD CONSTRAINT "rendez_vous_magasin_id_fkey" FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rendez_vous" ADD CONSTRAINT "rendez_vous_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "commandes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis_produits" ADD CONSTRAINT "avis_produits_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "produits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis_produits" ADD CONSTRAINT "avis_produits_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis_magasins" ADD CONSTRAINT "avis_magasins_magasin_id_fkey" FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis_magasins" ADD CONSTRAINT "avis_magasins_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis_magasins" ADD CONSTRAINT "avis_magasins_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "commandes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produits_favoris" ADD CONSTRAINT "produits_favoris_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produits_favoris" ADD CONSTRAINT "produits_favoris_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magasins_favoris" ADD CONSTRAINT "magasins_favoris_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magasins_favoris" ADD CONSTRAINT "magasins_favoris_magasin_id_fkey" FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publications" ADD CONSTRAINT "publications_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publications" ADD CONSTRAINT "publications_magasin_id_fkey" FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medias_publication" ADD CONSTRAINT "medias_publication_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentaires_publication" ADD CONSTRAINT "commentaires_publication_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentaires_publication" ADD CONSTRAINT "commentaires_publication_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentaires_publication" ADD CONSTRAINT "commentaires_publication_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "commentaires_publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentions_j_aime_publication" ADD CONSTRAINT "mentions_j_aime_publication_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentions_j_aime_publication" ADD CONSTRAINT "mentions_j_aime_publication_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonnements_utilisateurs" ADD CONSTRAINT "abonnements_utilisateurs_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonnements_utilisateurs" ADD CONSTRAINT "abonnements_utilisateurs_followed_id_fkey" FOREIGN KEY ("followed_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonnements_magasins" ADD CONSTRAINT "abonnements_magasins_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonnements_magasins" ADD CONSTRAINT "abonnements_magasins_magasin_id_fkey" FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partages_publication" ADD CONSTRAINT "partages_publication_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partages_publication" ADD CONSTRAINT "partages_publication_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions_essayage" ADD CONSTRAINT "sessions_essayage_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions_essayage" ADD CONSTRAINT "sessions_essayage_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes_produits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichiers_essayage" ADD CONSTRAINT "fichiers_essayage_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions_essayage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consentements_essayage" ADD CONSTRAINT "consentements_essayage_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions_essayage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preferences_notifications" ADD CONSTRAINT "preferences_notifications_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journaux_audit" ADD CONSTRAINT "journaux_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
