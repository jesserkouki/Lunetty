-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."AddressType" AS ENUM ('HOME', 'BILLING', 'SHIPPING', 'STORE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."AppointmentStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "public"."Audience" AS ENUM ('WOMEN', 'MEN', 'UNISEX', 'CHILDREN');

-- CreateEnum
CREATE TYPE "public"."CartStatus" AS ENUM ('ACTIVE', 'CONVERTED', 'ABANDONED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."ContactLensReplacement" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."EyeSide" AS ENUM ('RIGHT', 'LEFT');

-- CreateEnum
CREATE TYPE "public"."InventoryMovementType" AS ENUM ('RECEIPT', 'SALE', 'RETURN', 'ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT', 'DAMAGE', 'RESERVED', 'RELEASED');

-- CreateEnum
CREATE TYPE "public"."LensDesign" AS ENUM ('SINGLE_VISION', 'BIFOCAL', 'PROGRESSIVE', 'READING', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."LensTreatment" AS ENUM ('BLUE_LIGHT', 'PHOTOCHROMIC', 'POLARIZED', 'ANTI_REFLECTIVE', 'SCRATCH_RESISTANT', 'UV_PROTECTION', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ListingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'OUT_OF_STOCK', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "public"."MembershipRole" AS ENUM ('OWNER', 'MANAGER', 'OPTICIAN', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "public"."MembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'REMOVED');

-- CreateEnum
CREATE TYPE "public"."NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'PUSH');

-- CreateEnum
CREATE TYPE "public"."NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('ORDER_UPDATE', 'PAYMENT_UPDATE', 'APPOINTMENT_UPDATE', 'NEW_FOLLOWER', 'POST_INTERACTION', 'PROMOTION', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "public"."PaymentProvider" AS ENUM ('STRIPE', 'PAYPAL', 'FLOUCI', 'KONNECT', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('CREATED', 'REQUIRES_ACTION', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "public"."PlatformRole" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "public"."PostVisibility" AS ENUM ('PUBLIC', 'FOLLOWERS', 'STORE_CUSTOMERS', 'PRIVATE');

-- CreateEnum
CREATE TYPE "public"."ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."ProductType" AS ENUM ('FRAME', 'LENS', 'CONTACT_LENS', 'ACCESSORY');

-- CreateEnum
CREATE TYPE "public"."RefundStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ReviewStatus" AS ENUM ('PENDING', 'PUBLISHED', 'HIDDEN', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."StockLocationType" AS ENUM ('STORE', 'WAREHOUSE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."StoreStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."TryOnAssetType" AS ENUM ('INPUT_IMAGE', 'OUTPUT_IMAGE', 'VIDEO', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."TryOnStatus" AS ENUM ('CREATED', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED', 'DEACTIVATED');

-- CreateTable
CREATE TABLE "public"."abonnements_magasins" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "magasin_id" UUID NOT NULL,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abonnements_magasins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."abonnements_utilisateurs" (
    "id" UUID NOT NULL,
    "follower_id" UUID NOT NULL,
    "followed_id" UUID NOT NULL,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abonnements_utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."adhesions_magasins" (
    "id" UUID NOT NULL,
    "magasin_id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "role" "public"."MembershipRole" NOT NULL DEFAULT 'EMPLOYEE',
    "status" "public"."MembershipStatus" NOT NULL DEFAULT 'INVITED',
    "invited_at" TIMESTAMPTZ(6),
    "joined_at" TIMESTAMPTZ(6),
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adhesions_magasins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."adresses" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID,
    "magasin_id" UUID,
    "type" "public"."AddressType" NOT NULL DEFAULT 'OTHER',
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
CREATE TABLE "public"."annonces_magasins" (
    "id" UUID NOT NULL,
    "magasin_id" UUID NOT NULL,
    "produit_id" UUID NOT NULL,
    "created_by_id" UUID,
    "title_override" VARCHAR(200),
    "description_override" TEXT,
    "status" "public"."ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(6),
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,
    "supprime_le" TIMESTAMPTZ(6),

    CONSTRAINT "annonces_magasins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."articles_commande" (
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
CREATE TABLE "public"."articles_panier" (
    "id" UUID NOT NULL,
    "panier_id" UUID NOT NULL,
    "listing_variant_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "articles_panier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."avis_magasins" (
    "id" UUID NOT NULL,
    "magasin_id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "order_id" UUID,
    "rating" INTEGER NOT NULL,
    "title" VARCHAR(160),
    "body" TEXT,
    "status" "public"."ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avis_magasins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."avis_produits" (
    "id" UUID NOT NULL,
    "produit_id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" VARCHAR(160),
    "body" TEXT,
    "status" "public"."ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "verified_purchase" BOOLEAN NOT NULL DEFAULT false,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "avis_produits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."commandes" (
    "id" UUID NOT NULL,
    "order_number" VARCHAR(40) NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "client_profile_id" UUID,
    "magasin_id" UUID NOT NULL,
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
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
CREATE TABLE "public"."commentaires_publication" (
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
CREATE TABLE "public"."consentements_essayage" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "consent_version" VARCHAR(40) NOT NULL,
    "purpose" VARCHAR(255) NOT NULL,
    "accepted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawn_at" TIMESTAMPTZ(6),

    CONSTRAINT "consentements_essayage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."details_yeux_ordonnance" (
    "id" UUID NOT NULL,
    "prescription_id" UUID NOT NULL,
    "side" "public"."EyeSide" NOT NULL,
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
CREATE TABLE "public"."emplacements_stock" (
    "id" UUID NOT NULL,
    "magasin_id" UUID NOT NULL,
    "nom" VARCHAR(120) NOT NULL,
    "code" VARCHAR(40),
    "type" "public"."StockLocationType" NOT NULL DEFAULT 'STORE',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "emplacements_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."evenements_webhook_paiement" (
    "id" UUID NOT NULL,
    "provider" "public"."PaymentProvider" NOT NULL,
    "provider_event_id" VARCHAR(200) NOT NULL,
    "event_type" VARCHAR(150) NOT NULL,
    "payload" JSONB NOT NULL,
    "processed_at" TIMESTAMPTZ(6),
    "processing_error" TEXT,
    "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evenements_webhook_paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fichiers_essayage" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "type" "public"."TryOnAssetType" NOT NULL,
    "storage_key" VARCHAR(1024) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size_bytes" BIGINT,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "fichiers_essayage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."historique_statuts_commande" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "from_status" "public"."OrderStatus",
    "to_status" "public"."OrderStatus" NOT NULL,
    "note" TEXT,
    "changed_by_id" UUID,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historique_statuts_commande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."journaux_audit" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "magasin_id" UUID,
    "action" VARCHAR(120) NOT NULL,
    "entity_type" VARCHAR(120) NOT NULL,
    "entity_id" VARCHAR(100),
    "ip_address" VARCHAR(64),
    "user_agent" VARCHAR(512),
    "metadata" JSONB,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journaux_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."magasins" (
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
    "status" "public"."StoreStatus" NOT NULL DEFAULT 'DRAFT',
    "timezone" VARCHAR(80) NOT NULL DEFAULT 'Africa/Tunis',
    "currency" CHAR(3) NOT NULL DEFAULT 'TND',
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,
    "supprime_le" TIMESTAMPTZ(6),

    CONSTRAINT "magasins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."magasins_favoris" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "magasin_id" UUID NOT NULL,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "magasins_favoris_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."medias_publication" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "type" "public"."MediaType" NOT NULL,
    "storage_key" VARCHAR(1024) NOT NULL,
    "thumbnail_key" VARCHAR(1024),
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "medias_publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."mentions_j_aime_publication" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentions_j_aime_publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."mouvements_stock" (
    "id" UUID NOT NULL,
    "inventory_id" UUID NOT NULL,
    "actor_id" UUID,
    "type" "public"."InventoryMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reference" VARCHAR(120),
    "note" TEXT,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mouvements_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" UUID NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "status" "public"."NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "read_at" TIMESTAMPTZ(6),
    "sent_at" TIMESTAMPTZ(6),
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "utilisateur_id" UUID NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ordonnances" (
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
CREATE TABLE "public"."paiements" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "provider" "public"."PaymentProvider" NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'CREATED',
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
CREATE TABLE "public"."paniers" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "status" "public"."CartStatus" NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMPTZ(6),
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "paniers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."partages_publication" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "caption" TEXT,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partages_publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."preferences_notifications" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "channel" "public"."NotificationChannel" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "preferences_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."produits" (
    "id" UUID NOT NULL,
    "nom" VARCHAR(200) NOT NULL,
    "identifiant_url" VARCHAR(220) NOT NULL,
    "description" TEXT,
    "brand" VARCHAR(120),
    "manufacturer" VARCHAR(120),
    "type" "public"."ProductType" NOT NULL,
    "status" "public"."ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "audience" "public"."Audience" NOT NULL DEFAULT 'UNISEX',
    "category" VARCHAR(100),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attributes" JSONB,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,
    "supprime_le" TIMESTAMPTZ(6),

    CONSTRAINT "produits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."produits_favoris" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "produit_id" UUID NOT NULL,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produits_favoris_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."profils_clients" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "date_naissance" DATE,
    "marketing_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "profils_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."profils_opticiens" (
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
CREATE TABLE "public"."publications" (
    "id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "magasin_id" UUID,
    "caption" TEXT,
    "visibility" "public"."PostVisibility" NOT NULL DEFAULT 'PUBLIC',
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "published_at" TIMESTAMPTZ(6),
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,
    "supprime_le" TIMESTAMPTZ(6),

    CONSTRAINT "publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."remboursements" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "amount" DECIMAL(12,3) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'TND',
    "status" "public"."RefundStatus" NOT NULL DEFAULT 'PENDING',
    "provider_refund_id" VARCHAR(180),
    "reason" TEXT,
    "processed_at" TIMESTAMPTZ(6),
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "remboursements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rendez_vous" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "magasin_id" UUID NOT NULL,
    "order_id" UUID,
    "status" "public"."AppointmentStatus" NOT NULL DEFAULT 'REQUESTED',
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
CREATE TABLE "public"."sessions_essayage" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "variante_id" UUID,
    "status" "public"."TryOnStatus" NOT NULL DEFAULT 'CREATED',
    "metadata" JSONB,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "sessions_essayage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."specifications_lentilles_contact" (
    "id" UUID NOT NULL,
    "variante_id" UUID NOT NULL,
    "replacement" "public"."ContactLensReplacement" NOT NULL,
    "base_curve" DECIMAL(4,2),
    "diameter_mm" DECIMAL(4,2),
    "water_content" DECIMAL(5,2),
    "material" VARCHAR(100),

    CONSTRAINT "specifications_lentilles_contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."specifications_montures" (
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
CREATE TABLE "public"."specifications_verres" (
    "id" UUID NOT NULL,
    "variante_id" UUID NOT NULL,
    "design" "public"."LensDesign" NOT NULL,
    "material" VARCHAR(100),
    "index_of_refraction" DECIMAL(4,2),
    "treatments" "public"."LensTreatment"[] DEFAULT ARRAY[]::"public"."LensTreatment"[],

    CONSTRAINT "specifications_verres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stocks" (
    "id" UUID NOT NULL,
    "store_listing_variant_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "quantity_on_hand" INTEGER NOT NULL DEFAULT 0,
    "quantity_reserved" INTEGER NOT NULL DEFAULT 0,
    "reorder_level" INTEGER NOT NULL DEFAULT 0,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."utilisateurs" (
    "id" UUID NOT NULL,
    "role" "public"."PlatformRole" NOT NULL DEFAULT 'USER',
    "prenom" VARCHAR(100) NOT NULL,
    "nom_famille" VARCHAR(100) NOT NULL,
    "username" VARCHAR(50),
    "email" VARCHAR(255) NOT NULL,
    "empreinte_mot_de_passe" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(30),
    "phone_verified_at" TIMESTAMPTZ(6),
    "email_verified_at" TIMESTAMPTZ(6),
    "profile_image_url" VARCHAR(2048),
    "status" "public"."UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "last_login_at" TIMESTAMPTZ(6),
    "preferred_language" VARCHAR(10) NOT NULL DEFAULT 'fr',
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,
    "supprime_le" TIMESTAMPTZ(6),

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."variantes_annonces" (
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
CREATE TABLE "public"."variantes_produits" (
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

-- CreateIndex
CREATE UNIQUE INDEX "abonnements_magasins_utilisateur_id_magasin_id_key" ON "public"."abonnements_magasins"("utilisateur_id" ASC, "magasin_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "abonnements_utilisateurs_follower_id_followed_id_key" ON "public"."abonnements_utilisateurs"("follower_id" ASC, "followed_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "adhesions_magasins_magasin_id_utilisateur_id_key" ON "public"."adhesions_magasins"("magasin_id" ASC, "utilisateur_id" ASC);

-- CreateIndex
CREATE INDEX "adhesions_magasins_utilisateur_id_status_idx" ON "public"."adhesions_magasins"("utilisateur_id" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "adresses_magasin_id_idx" ON "public"."adresses"("magasin_id" ASC);

-- CreateIndex
CREATE INDEX "adresses_utilisateur_id_is_default_idx" ON "public"."adresses"("utilisateur_id" ASC, "is_default" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "annonces_magasins_magasin_id_produit_id_key" ON "public"."annonces_magasins"("magasin_id" ASC, "produit_id" ASC);

-- CreateIndex
CREATE INDEX "annonces_magasins_magasin_id_status_supprime_le_idx" ON "public"."annonces_magasins"("magasin_id" ASC, "status" ASC, "supprime_le" ASC);

-- CreateIndex
CREATE INDEX "articles_commande_order_id_idx" ON "public"."articles_commande"("order_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "articles_panier_panier_id_listing_variant_id_key" ON "public"."articles_panier"("panier_id" ASC, "listing_variant_id" ASC);

-- CreateIndex
CREATE INDEX "avis_magasins_magasin_id_status_cree_le_idx" ON "public"."avis_magasins"("magasin_id" ASC, "status" ASC, "cree_le" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "avis_magasins_order_id_key" ON "public"."avis_magasins"("order_id" ASC);

-- CreateIndex
CREATE INDEX "avis_produits_produit_id_status_cree_le_idx" ON "public"."avis_produits"("produit_id" ASC, "status" ASC, "cree_le" ASC);

-- CreateIndex
CREATE INDEX "commandes_magasin_id_status_cree_le_idx" ON "public"."commandes"("magasin_id" ASC, "status" ASC, "cree_le" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "commandes_order_number_key" ON "public"."commandes"("order_number" ASC);

-- CreateIndex
CREATE INDEX "commandes_utilisateur_id_cree_le_idx" ON "public"."commandes"("utilisateur_id" ASC, "cree_le" ASC);

-- CreateIndex
CREATE INDEX "commentaires_publication_post_id_cree_le_idx" ON "public"."commentaires_publication"("post_id" ASC, "cree_le" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "consentements_essayage_session_id_key" ON "public"."consentements_essayage"("session_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "details_yeux_ordonnance_prescription_id_side_key" ON "public"."details_yeux_ordonnance"("prescription_id" ASC, "side" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "emplacements_stock_magasin_id_code_key" ON "public"."emplacements_stock"("magasin_id" ASC, "code" ASC);

-- CreateIndex
CREATE INDEX "evenements_webhook_paiement_processed_at_received_at_idx" ON "public"."evenements_webhook_paiement"("processed_at" ASC, "received_at" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "evenements_webhook_paiement_provider_provider_event_id_key" ON "public"."evenements_webhook_paiement"("provider" ASC, "provider_event_id" ASC);

-- CreateIndex
CREATE INDEX "fichiers_essayage_expires_at_idx" ON "public"."fichiers_essayage"("expires_at" ASC);

-- CreateIndex
CREATE INDEX "fichiers_essayage_session_id_type_idx" ON "public"."fichiers_essayage"("session_id" ASC, "type" ASC);

-- CreateIndex
CREATE INDEX "historique_statuts_commande_order_id_cree_le_idx" ON "public"."historique_statuts_commande"("order_id" ASC, "cree_le" ASC);

-- CreateIndex
CREATE INDEX "journaux_audit_actor_id_cree_le_idx" ON "public"."journaux_audit"("actor_id" ASC, "cree_le" ASC);

-- CreateIndex
CREATE INDEX "journaux_audit_entity_type_entity_id_idx" ON "public"."journaux_audit"("entity_type" ASC, "entity_id" ASC);

-- CreateIndex
CREATE INDEX "journaux_audit_magasin_id_cree_le_idx" ON "public"."journaux_audit"("magasin_id" ASC, "cree_le" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "magasins_identifiant_url_key" ON "public"."magasins"("identifiant_url" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "magasins_registration_code_key" ON "public"."magasins"("registration_code" ASC);

-- CreateIndex
CREATE INDEX "magasins_status_supprime_le_idx" ON "public"."magasins"("status" ASC, "supprime_le" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "magasins_favoris_utilisateur_id_magasin_id_key" ON "public"."magasins_favoris"("utilisateur_id" ASC, "magasin_id" ASC);

-- CreateIndex
CREATE INDEX "medias_publication_post_id_position_idx" ON "public"."medias_publication"("post_id" ASC, "position" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "mentions_j_aime_publication_post_id_utilisateur_id_key" ON "public"."mentions_j_aime_publication"("post_id" ASC, "utilisateur_id" ASC);

-- CreateIndex
CREATE INDEX "mouvements_stock_inventory_id_cree_le_idx" ON "public"."mouvements_stock"("inventory_id" ASC, "cree_le" ASC);

-- CreateIndex
CREATE INDEX "notifications_utilisateur_id_status_cree_le_idx" ON "public"."notifications"("utilisateur_id" ASC, "status" ASC, "cree_le" ASC);

-- CreateIndex
CREATE INDEX "ordonnances_client_profile_id_prescribed_at_idx" ON "public"."ordonnances"("client_profile_id" ASC, "prescribed_at" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "paiements_idempotency_key_key" ON "public"."paiements"("idempotency_key" ASC);

-- CreateIndex
CREATE INDEX "paiements_order_id_cree_le_idx" ON "public"."paiements"("order_id" ASC, "cree_le" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "paiements_provider_payment_id_key" ON "public"."paiements"("provider_payment_id" ASC);

-- CreateIndex
CREATE INDEX "paniers_utilisateur_id_status_idx" ON "public"."paniers"("utilisateur_id" ASC, "status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "partages_publication_post_id_utilisateur_id_key" ON "public"."partages_publication"("post_id" ASC, "utilisateur_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "preferences_notifications_utilisateur_id_type_channel_key" ON "public"."preferences_notifications"("utilisateur_id" ASC, "type" ASC, "channel" ASC);

-- CreateIndex
CREATE INDEX "produits_brand_category_idx" ON "public"."produits"("brand" ASC, "category" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "produits_identifiant_url_key" ON "public"."produits"("identifiant_url" ASC);

-- CreateIndex
CREATE INDEX "produits_type_status_idx" ON "public"."produits"("type" ASC, "status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "produits_favoris_utilisateur_id_produit_id_key" ON "public"."produits_favoris"("utilisateur_id" ASC, "produit_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "profils_clients_utilisateur_id_key" ON "public"."profils_clients"("utilisateur_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "profils_opticiens_utilisateur_id_key" ON "public"."profils_opticiens"("utilisateur_id" ASC);

-- CreateIndex
CREATE INDEX "publications_author_id_cree_le_idx" ON "public"."publications"("author_id" ASC, "cree_le" ASC);

-- CreateIndex
CREATE INDEX "publications_magasin_id_is_published_published_at_idx" ON "public"."publications"("magasin_id" ASC, "is_published" ASC, "published_at" ASC);

-- CreateIndex
CREATE INDEX "remboursements_order_id_status_idx" ON "public"."remboursements"("order_id" ASC, "status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "remboursements_provider_refund_id_key" ON "public"."remboursements"("provider_refund_id" ASC);

-- CreateIndex
CREATE INDEX "rendez_vous_magasin_id_starts_at_status_idx" ON "public"."rendez_vous"("magasin_id" ASC, "starts_at" ASC, "status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "rendez_vous_order_id_key" ON "public"."rendez_vous"("order_id" ASC);

-- CreateIndex
CREATE INDEX "rendez_vous_utilisateur_id_starts_at_idx" ON "public"."rendez_vous"("utilisateur_id" ASC, "starts_at" ASC);

-- CreateIndex
CREATE INDEX "sessions_essayage_status_expires_at_idx" ON "public"."sessions_essayage"("status" ASC, "expires_at" ASC);

-- CreateIndex
CREATE INDEX "sessions_essayage_utilisateur_id_started_at_idx" ON "public"."sessions_essayage"("utilisateur_id" ASC, "started_at" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "specifications_lentilles_contact_variante_id_key" ON "public"."specifications_lentilles_contact"("variante_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "specifications_montures_variante_id_key" ON "public"."specifications_montures"("variante_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "specifications_verres_variante_id_key" ON "public"."specifications_verres"("variante_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "stocks_store_listing_variant_id_location_id_key" ON "public"."stocks"("store_listing_variant_id" ASC, "location_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "public"."utilisateurs"("email" ASC);

-- CreateIndex
CREATE INDEX "utilisateurs_status_supprime_le_idx" ON "public"."utilisateurs"("status" ASC, "supprime_le" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_username_key" ON "public"."utilisateurs"("username" ASC);

-- CreateIndex
CREATE INDEX "variantes_annonces_listing_id_is_available_idx" ON "public"."variantes_annonces"("listing_id" ASC, "is_available" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "variantes_annonces_listing_id_variante_id_key" ON "public"."variantes_annonces"("listing_id" ASC, "variante_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "variantes_annonces_store_barcode_key" ON "public"."variantes_annonces"("store_barcode" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "variantes_annonces_store_sku_key" ON "public"."variantes_annonces"("store_sku" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "variantes_produits_barcode_key" ON "public"."variantes_produits"("barcode" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "variantes_produits_global_sku_key" ON "public"."variantes_produits"("global_sku" ASC);

-- CreateIndex
CREATE INDEX "variantes_produits_produit_id_is_active_idx" ON "public"."variantes_produits"("produit_id" ASC, "is_active" ASC);

-- AddForeignKey
ALTER TABLE "public"."abonnements_magasins" ADD CONSTRAINT "abonnements_magasins_magasin_id_fkey" FOREIGN KEY ("magasin_id") REFERENCES "public"."magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."abonnements_magasins" ADD CONSTRAINT "abonnements_magasins_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."abonnements_utilisateurs" ADD CONSTRAINT "abonnements_utilisateurs_followed_id_fkey" FOREIGN KEY ("followed_id") REFERENCES "public"."utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."abonnements_utilisateurs" ADD CONSTRAINT "abonnements_utilisateurs_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "public"."utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adhesions_magasins" ADD CONSTRAINT "adhesions_magasins_magasin_id_fkey" FOREIGN KEY ("magasin_id") REFERENCES "public"."magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adhesions_magasins" ADD CONSTRAINT "adhesions_magasins_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adresses" ADD CONSTRAINT "adresses_magasin_id_fkey" FOREIGN KEY ("magasin_id") REFERENCES "public"."magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adresses" ADD CONSTRAINT "adresses_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."annonces_magasins" ADD CONSTRAINT "annonces_magasins_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."annonces_magasins" ADD CONSTRAINT "annonces_magasins_magasin_id_fkey" FOREIGN KEY ("magasin_id") REFERENCES "public"."magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."annonces_magasins" ADD CONSTRAINT "annonces_magasins_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "public"."produits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."articles_commande" ADD CONSTRAINT "articles_commande_listing_variant_id_fkey" FOREIGN KEY ("listing_variant_id") REFERENCES "public"."variantes_annonces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."articles_commande" ADD CONSTRAINT "articles_commande_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."articles_commande" ADD CONSTRAINT "articles_commande_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "public"."ordonnances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."articles_panier" ADD CONSTRAINT "articles_panier_listing_variant_id_fkey" FOREIGN KEY ("listing_variant_id") REFERENCES "public"."variantes_annonces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."articles_panier" ADD CONSTRAINT "articles_panier_panier_id_fkey" FOREIGN KEY ("panier_id") REFERENCES "public"."paniers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."avis_magasins" ADD CONSTRAINT "avis_magasins_magasin_id_fkey" FOREIGN KEY ("magasin_id") REFERENCES "public"."magasins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."avis_magasins" ADD CONSTRAINT "avis_magasins_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."commandes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."avis_magasins" ADD CONSTRAINT "avis_magasins_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."avis_produits" ADD CONSTRAINT "avis_produits_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "public"."produits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."avis_produits" ADD CONSTRAINT "avis_produits_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."commandes" ADD CONSTRAINT "commandes_client_profile_id_fkey" FOREIGN KEY ("client_profile_id") REFERENCES "public"."profils_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."commandes" ADD CONSTRAINT "commandes_magasin_id_fkey" FOREIGN KEY ("magasin_id") REFERENCES "public"."magasins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."commandes" ADD CONSTRAINT "commandes_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."commentaires_publication" ADD CONSTRAINT "commentaires_publication_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."commentaires_publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."commentaires_publication" ADD CONSTRAINT "commentaires_publication_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."commentaires_publication" ADD CONSTRAINT "commentaires_publication_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consentements_essayage" ADD CONSTRAINT "consentements_essayage_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions_essayage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."details_yeux_ordonnance" ADD CONSTRAINT "details_yeux_ordonnance_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "public"."ordonnances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."emplacements_stock" ADD CONSTRAINT "emplacements_stock_magasin_id_fkey" FOREIGN KEY ("magasin_id") REFERENCES "public"."magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fichiers_essayage" ADD CONSTRAINT "fichiers_essayage_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions_essayage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."historique_statuts_commande" ADD CONSTRAINT "historique_statuts_commande_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "public"."utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."historique_statuts_commande" ADD CONSTRAINT "historique_statuts_commande_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journaux_audit" ADD CONSTRAINT "journaux_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."magasins_favoris" ADD CONSTRAINT "magasins_favoris_magasin_id_fkey" FOREIGN KEY ("magasin_id") REFERENCES "public"."magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."magasins_favoris" ADD CONSTRAINT "magasins_favoris_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medias_publication" ADD CONSTRAINT "medias_publication_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mentions_j_aime_publication" ADD CONSTRAINT "mentions_j_aime_publication_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mentions_j_aime_publication" ADD CONSTRAINT "mentions_j_aime_publication_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mouvements_stock" ADD CONSTRAINT "mouvements_stock_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mouvements_stock" ADD CONSTRAINT "mouvements_stock_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "public"."stocks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ordonnances" ADD CONSTRAINT "ordonnances_client_profile_id_fkey" FOREIGN KEY ("client_profile_id") REFERENCES "public"."profils_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ordonnances" ADD CONSTRAINT "ordonnances_prescribing_store_id_fkey" FOREIGN KEY ("prescribing_store_id") REFERENCES "public"."magasins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."paiements" ADD CONSTRAINT "paiements_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."commandes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."paniers" ADD CONSTRAINT "paniers_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."partages_publication" ADD CONSTRAINT "partages_publication_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."partages_publication" ADD CONSTRAINT "partages_publication_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."preferences_notifications" ADD CONSTRAINT "preferences_notifications_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."produits_favoris" ADD CONSTRAINT "produits_favoris_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "public"."produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."produits_favoris" ADD CONSTRAINT "produits_favoris_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."profils_clients" ADD CONSTRAINT "profils_clients_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."profils_opticiens" ADD CONSTRAINT "profils_opticiens_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."publications" ADD CONSTRAINT "publications_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."publications" ADD CONSTRAINT "publications_magasin_id_fkey" FOREIGN KEY ("magasin_id") REFERENCES "public"."magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."remboursements" ADD CONSTRAINT "remboursements_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."commandes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."remboursements" ADD CONSTRAINT "remboursements_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."paiements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rendez_vous" ADD CONSTRAINT "rendez_vous_magasin_id_fkey" FOREIGN KEY ("magasin_id") REFERENCES "public"."magasins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rendez_vous" ADD CONSTRAINT "rendez_vous_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."commandes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rendez_vous" ADD CONSTRAINT "rendez_vous_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions_essayage" ADD CONSTRAINT "sessions_essayage_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions_essayage" ADD CONSTRAINT "sessions_essayage_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "public"."variantes_produits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."specifications_lentilles_contact" ADD CONSTRAINT "specifications_lentilles_contact_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "public"."variantes_produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."specifications_montures" ADD CONSTRAINT "specifications_montures_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "public"."variantes_produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."specifications_verres" ADD CONSTRAINT "specifications_verres_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "public"."variantes_produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stocks" ADD CONSTRAINT "stocks_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."emplacements_stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stocks" ADD CONSTRAINT "stocks_store_listing_variant_id_fkey" FOREIGN KEY ("store_listing_variant_id") REFERENCES "public"."variantes_annonces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."variantes_annonces" ADD CONSTRAINT "variantes_annonces_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."annonces_magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."variantes_annonces" ADD CONSTRAINT "variantes_annonces_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "public"."variantes_produits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."variantes_produits" ADD CONSTRAINT "variantes_produits_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "public"."produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
