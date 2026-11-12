/*
  Warnings:

  - You are about to drop the column `cree_le` on the `abonnements_magasins` table. All the data in the column will be lost.
  - You are about to drop the column `magasin_id` on the `abonnements_magasins` table. All the data in the column will be lost.
  - You are about to drop the column `utilisateur_id` on the `abonnements_magasins` table. All the data in the column will be lost.
  - You are about to drop the column `cree_le` on the `abonnements_utilisateurs` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `adresses` table. All the data in the column will be lost.
  - You are about to drop the column `cree_le` on the `adresses` table. All the data in the column will be lost.
  - You are about to drop the column `label` on the `adresses` table. All the data in the column will be lost.
  - You are about to drop the column `line1` on the `adresses` table. All the data in the column will be lost.
  - You are about to drop the column `line2` on the `adresses` table. All the data in the column will be lost.
  - You are about to drop the column `magasin_id` on the `adresses` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `adresses` table. All the data in the column will be lost.
  - You are about to drop the column `utilisateur_id` on the `adresses` table. All the data in the column will be lost.
  - The `type` column on the `adresses` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `cree_le` on the `annonces_magasins` table. All the data in the column will be lost.
  - You are about to drop the column `magasin_id` on the `annonces_magasins` table. All the data in the column will be lost.
  - You are about to drop the column `modifie_le` on the `annonces_magasins` table. All the data in the column will be lost.
  - You are about to drop the column `produit_id` on the `annonces_magasins` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `annonces_magasins` table. All the data in the column will be lost.
  - You are about to drop the column `supprime_le` on the `annonces_magasins` table. All the data in the column will be lost.
  - You are about to drop the column `body` on the `avis_magasins` table. All the data in the column will be lost.
  - You are about to drop the column `cree_le` on the `avis_magasins` table. All the data in the column will be lost.
  - You are about to drop the column `magasin_id` on the `avis_magasins` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `avis_magasins` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `avis_magasins` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `avis_magasins` table. All the data in the column will be lost.
  - You are about to drop the column `utilisateur_id` on the `avis_magasins` table. All the data in the column will be lost.
  - You are about to drop the column `body` on the `avis_produits` table. All the data in the column will be lost.
  - You are about to drop the column `cree_le` on the `avis_produits` table. All the data in the column will be lost.
  - You are about to drop the column `modifie_le` on the `avis_produits` table. All the data in the column will be lost.
  - You are about to drop the column `produit_id` on the `avis_produits` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `avis_produits` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `avis_produits` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `avis_produits` table. All the data in the column will be lost.
  - You are about to drop the column `utilisateur_id` on the `avis_produits` table. All the data in the column will be lost.
  - You are about to drop the column `cree_le` on the `commandes` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `commandes` table. All the data in the column will be lost.
  - You are about to drop the column `magasin_id` on the `commandes` table. All the data in the column will be lost.
  - You are about to drop the column `modifie_le` on the `commandes` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `commandes` table. All the data in the column will be lost.
  - You are about to drop the column `subtotal` on the `commandes` table. All the data in the column will be lost.
  - You are about to drop the column `utilisateur_id` on the `commandes` table. All the data in the column will be lost.
  - You are about to drop the column `purpose` on the `consentements_essayage` table. All the data in the column will be lost.
  - You are about to drop the column `payload` on the `evenements_webhook_paiement` table. All the data in the column will be lost.
  - You are about to drop the column `provider` on the `evenements_webhook_paiement` table. All the data in the column will be lost.
  - You are about to drop the column `cree_le` on the `fichiers_essayage` table. All the data in the column will be lost.
  - You are about to drop the column `cree_le` on the `journaux_audit` table. All the data in the column will be lost.
  - You are about to drop the column `magasin_id` on the `journaux_audit` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `journaux_audit` table. All the data in the column will be lost.
  - You are about to drop the column `cree_le` on the `magasins` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `magasins` table. All the data in the column will be lost.
  - You are about to drop the column `identifiant_url` on the `magasins` table. All the data in the column will be lost.
  - You are about to drop the column `modifie_le` on the `magasins` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `magasins` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `magasins` table. All the data in the column will be lost.
  - You are about to drop the column `supprime_le` on the `magasins` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `magasins` table. All the data in the column will be lost.
  - You are about to drop the column `cree_le` on the `magasins_favoris` table. All the data in the column will be lost.
  - You are about to drop the column `magasin_id` on the `magasins_favoris` table. All the data in the column will be lost.
  - You are about to drop the column `utilisateur_id` on the `magasins_favoris` table. All the data in the column will be lost.
  - You are about to drop the column `cree_le` on the `mouvements_stock` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `mouvements_stock` table. All the data in the column will be lost.
  - You are about to drop the column `body` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `cree_le` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `utilisateur_id` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `cree_le` on the `ordonnances` table. All the data in the column will be lost.
  - You are about to drop the column `modifie_le` on the `ordonnances` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `ordonnances` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `paiements` table. All the data in the column will be lost.
  - You are about to drop the column `cree_le` on the `paiements` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `paiements` table. All the data in the column will be lost.
  - You are about to drop the column `modifie_le` on the `paiements` table. All the data in the column will be lost.
  - You are about to drop the column `provider` on the `paiements` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `paiements` table. All the data in the column will be lost.
  - You are about to drop the column `cree_le` on the `paniers` table. All the data in the column will be lost.
  - You are about to drop the column `modifie_le` on the `paniers` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `paniers` table. All the data in the column will be lost.
  - You are about to drop the column `utilisateur_id` on the `paniers` table. All the data in the column will be lost.
  - You are about to drop the column `channel` on the `preferences_notifications` table. All the data in the column will be lost.
  - You are about to drop the column `enabled` on the `preferences_notifications` table. All the data in the column will be lost.
  - You are about to drop the column `utilisateur_id` on the `preferences_notifications` table. All the data in the column will be lost.
  - You are about to drop the column `attributes` on the `produits` table. All the data in the column will be lost.
  - You are about to drop the column `audience` on the `produits` table. All the data in the column will be lost.
  - You are about to drop the column `brand` on the `produits` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `produits` table. All the data in the column will be lost.
  - You are about to drop the column `cree_le` on the `produits` table. All the data in the column will be lost.
  - You are about to drop the column `identifiant_url` on the `produits` table. All the data in the column will be lost.
  - You are about to drop the column `manufacturer` on the `produits` table. All the data in the column will be lost.
  - You are about to drop the column `modifie_le` on the `produits` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `produits` table. All the data in the column will be lost.
  - You are about to drop the column `supprime_le` on the `produits` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `produits` table. All the data in the column will be lost.
  - You are about to drop the column `cree_le` on the `produits_favoris` table. All the data in the column will be lost.
  - You are about to drop the column `produit_id` on the `produits_favoris` table. All the data in the column will be lost.
  - You are about to drop the column `utilisateur_id` on the `produits_favoris` table. All the data in the column will be lost.
  - You are about to drop the column `cree_le` on the `profils_clients` table. All the data in the column will be lost.
  - You are about to drop the column `date_naissance` on the `profils_clients` table. All the data in the column will be lost.
  - You are about to drop the column `modifie_le` on the `profils_clients` table. All the data in the column will be lost.
  - You are about to drop the column `utilisateur_id` on the `profils_clients` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `profils_opticiens` table. All the data in the column will be lost.
  - You are about to drop the column `cree_le` on the `profils_opticiens` table. All the data in the column will be lost.
  - You are about to drop the column `modifie_le` on the `profils_opticiens` table. All the data in the column will be lost.
  - You are about to drop the column `utilisateur_id` on the `profils_opticiens` table. All the data in the column will be lost.
  - You are about to drop the column `caption` on the `publications` table. All the data in the column will be lost.
  - You are about to drop the column `cree_le` on the `publications` table. All the data in the column will be lost.
  - You are about to drop the column `magasin_id` on the `publications` table. All the data in the column will be lost.
  - You are about to drop the column `modifie_le` on the `publications` table. All the data in the column will be lost.
  - You are about to drop the column `supprime_le` on the `publications` table. All the data in the column will be lost.
  - You are about to drop the column `visibility` on the `publications` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `remboursements` table. All the data in the column will be lost.
  - You are about to drop the column `cree_le` on the `remboursements` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `remboursements` table. All the data in the column will be lost.
  - You are about to drop the column `reason` on the `remboursements` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `remboursements` table. All the data in the column will be lost.
  - You are about to drop the column `cree_le` on the `rendez_vous` table. All the data in the column will be lost.
  - You are about to drop the column `magasin_id` on the `rendez_vous` table. All the data in the column will be lost.
  - You are about to drop the column `modifie_le` on the `rendez_vous` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `rendez_vous` table. All the data in the column will be lost.
  - You are about to drop the column `utilisateur_id` on the `rendez_vous` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `sessions_essayage` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `sessions_essayage` table. All the data in the column will be lost.
  - You are about to drop the column `utilisateur_id` on the `sessions_essayage` table. All the data in the column will be lost.
  - You are about to drop the column `variante_id` on the `sessions_essayage` table. All the data in the column will be lost.
  - You are about to drop the column `cree_le` on the `stocks` table. All the data in the column will be lost.
  - You are about to drop the column `modifie_le` on the `stocks` table. All the data in the column will be lost.
  - You are about to drop the column `cree_le` on the `utilisateurs` table. All the data in the column will be lost.
  - You are about to drop the column `empreinte_mot_de_passe` on the `utilisateurs` table. All the data in the column will be lost.
  - You are about to drop the column `modifie_le` on the `utilisateurs` table. All the data in the column will be lost.
  - You are about to drop the column `nom_famille` on the `utilisateurs` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `utilisateurs` table. All the data in the column will be lost.
  - You are about to drop the column `prenom` on the `utilisateurs` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `utilisateurs` table. All the data in the column will be lost.
  - You are about to drop the column `supprime_le` on the `utilisateurs` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `utilisateurs` table. All the data in the column will be lost.
  - The `role` column on the `utilisateurs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `attributes` on the `variantes_produits` table. All the data in the column will be lost.
  - You are about to drop the column `barcode` on the `variantes_produits` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `variantes_produits` table. All the data in the column will be lost.
  - You are about to drop the column `material` on the `variantes_produits` table. All the data in the column will be lost.
  - You are about to drop the column `produit_id` on the `variantes_produits` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `variantes_produits` table. All the data in the column will be lost.
  - You are about to drop the `adhesions_magasins` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `articles_commande` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `articles_panier` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `commentaires_publication` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `details_yeux_ordonnance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `emplacements_stock` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `historique_statuts_commande` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `medias_publication` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mentions_j_aime_publication` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `partages_publication` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `specifications_lentilles_contact` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `specifications_montures` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `specifications_verres` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `variantes_annonces` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[user_id,store_id]` on the table `abonnements_magasins` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[store_id,product_id]` on the table `annonces_magasins` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[fournisseur,provider_event_id]` on the table `evenements_webhook_paiement` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `magasins` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,store_id]` on the table `magasins_favoris` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,type,canal]` on the table `preferences_notifications` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `produits` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,product_id]` on the table `produits_favoris` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id]` on the table `profils_clients` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id]` on the table `profils_opticiens` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nom_utilisateur]` on the table `utilisateurs` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code_barres]` on the table `variantes_produits` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `store_id` to the `abonnements_magasins` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `abonnements_magasins` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ligne_1` to the `adresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ville` to the `adresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_id` to the `annonces_magasins` table without a default value. This is not possible if the table is not empty.
  - Added the required column `store_id` to the `annonces_magasins` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `annonces_magasins` table without a default value. This is not possible if the table is not empty.
  - Added the required column `note` to the `avis_magasins` table without a default value. This is not possible if the table is not empty.
  - Added the required column `store_id` to the `avis_magasins` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `avis_magasins` table without a default value. This is not possible if the table is not empty.
  - Added the required column `note` to the `avis_produits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_id` to the `avis_produits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `avis_produits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `avis_produits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sous_total` to the `commandes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `store_id` to the `commandes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `commandes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `commandes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `objectif` to the `consentements_essayage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `donnees` to the `evenements_webhook_paiement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fournisseur` to the `evenements_webhook_paiement` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `fichiers_essayage` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `slug` to the `magasins` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `magasins` table without a default value. This is not possible if the table is not empty.
  - Added the required column `store_id` to the `magasins_favoris` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `magasins_favoris` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantite` to the `mouvements_stock` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `mouvements_stock` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `contenu` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `titre` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `notifications` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updated_at` to the `ordonnances` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fournisseur` to the `paiements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `montant` to the `paiements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `paiements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `paniers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `paniers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `canal` to the `preferences_notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `preferences_notifications` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `preferences_notifications` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `slug` to the `produits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `produits` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `produits` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `product_id` to the `produits_favoris` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `produits_favoris` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `profils_clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `profils_clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `profils_opticiens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `profils_opticiens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `publications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `montant` to the `remboursements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `store_id` to the `rendez_vous` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `rendez_vous` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `rendez_vous` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `sessions_essayage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `stocks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `first_name` to the `utilisateurs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `utilisateurs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password_hash` to the `utilisateurs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `utilisateurs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_id` to the `variantes_produits` table without a default value. This is not possible if the table is not empty.

*/
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

-- DropForeignKey
ALTER TABLE "abonnements_magasins" DROP CONSTRAINT "abonnements_magasins_magasin_id_fkey";

-- DropForeignKey
ALTER TABLE "abonnements_magasins" DROP CONSTRAINT "abonnements_magasins_utilisateur_id_fkey";

-- DropForeignKey
ALTER TABLE "adhesions_magasins" DROP CONSTRAINT "adhesions_magasins_magasin_id_fkey";

-- DropForeignKey
ALTER TABLE "adhesions_magasins" DROP CONSTRAINT "adhesions_magasins_utilisateur_id_fkey";

-- DropForeignKey
ALTER TABLE "adresses" DROP CONSTRAINT "adresses_magasin_id_fkey";

-- DropForeignKey
ALTER TABLE "adresses" DROP CONSTRAINT "adresses_utilisateur_id_fkey";

-- DropForeignKey
ALTER TABLE "annonces_magasins" DROP CONSTRAINT "annonces_magasins_magasin_id_fkey";

-- DropForeignKey
ALTER TABLE "annonces_magasins" DROP CONSTRAINT "annonces_magasins_produit_id_fkey";

-- DropForeignKey
ALTER TABLE "articles_commande" DROP CONSTRAINT "articles_commande_listing_variant_id_fkey";

-- DropForeignKey
ALTER TABLE "articles_commande" DROP CONSTRAINT "articles_commande_order_id_fkey";

-- DropForeignKey
ALTER TABLE "articles_commande" DROP CONSTRAINT "articles_commande_prescription_id_fkey";

-- DropForeignKey
ALTER TABLE "articles_panier" DROP CONSTRAINT "articles_panier_listing_variant_id_fkey";

-- DropForeignKey
ALTER TABLE "articles_panier" DROP CONSTRAINT "articles_panier_panier_id_fkey";

-- DropForeignKey
ALTER TABLE "avis_magasins" DROP CONSTRAINT "avis_magasins_magasin_id_fkey";

-- DropForeignKey
ALTER TABLE "avis_magasins" DROP CONSTRAINT "avis_magasins_utilisateur_id_fkey";

-- DropForeignKey
ALTER TABLE "avis_produits" DROP CONSTRAINT "avis_produits_produit_id_fkey";

-- DropForeignKey
ALTER TABLE "avis_produits" DROP CONSTRAINT "avis_produits_utilisateur_id_fkey";

-- DropForeignKey
ALTER TABLE "commandes" DROP CONSTRAINT "commandes_magasin_id_fkey";

-- DropForeignKey
ALTER TABLE "commandes" DROP CONSTRAINT "commandes_utilisateur_id_fkey";

-- DropForeignKey
ALTER TABLE "commentaires_publication" DROP CONSTRAINT "commentaires_publication_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "commentaires_publication" DROP CONSTRAINT "commentaires_publication_post_id_fkey";

-- DropForeignKey
ALTER TABLE "commentaires_publication" DROP CONSTRAINT "commentaires_publication_utilisateur_id_fkey";

-- DropForeignKey
ALTER TABLE "details_yeux_ordonnance" DROP CONSTRAINT "details_yeux_ordonnance_prescription_id_fkey";

-- DropForeignKey
ALTER TABLE "emplacements_stock" DROP CONSTRAINT "emplacements_stock_magasin_id_fkey";

-- DropForeignKey
ALTER TABLE "historique_statuts_commande" DROP CONSTRAINT "historique_statuts_commande_changed_by_id_fkey";

-- DropForeignKey
ALTER TABLE "historique_statuts_commande" DROP CONSTRAINT "historique_statuts_commande_order_id_fkey";

-- DropForeignKey
ALTER TABLE "magasins_favoris" DROP CONSTRAINT "magasins_favoris_magasin_id_fkey";

-- DropForeignKey
ALTER TABLE "magasins_favoris" DROP CONSTRAINT "magasins_favoris_utilisateur_id_fkey";

-- DropForeignKey
ALTER TABLE "medias_publication" DROP CONSTRAINT "medias_publication_post_id_fkey";

-- DropForeignKey
ALTER TABLE "mentions_j_aime_publication" DROP CONSTRAINT "mentions_j_aime_publication_post_id_fkey";

-- DropForeignKey
ALTER TABLE "mentions_j_aime_publication" DROP CONSTRAINT "mentions_j_aime_publication_utilisateur_id_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_utilisateur_id_fkey";

-- DropForeignKey
ALTER TABLE "paniers" DROP CONSTRAINT "paniers_utilisateur_id_fkey";

-- DropForeignKey
ALTER TABLE "partages_publication" DROP CONSTRAINT "partages_publication_post_id_fkey";

-- DropForeignKey
ALTER TABLE "partages_publication" DROP CONSTRAINT "partages_publication_utilisateur_id_fkey";

-- DropForeignKey
ALTER TABLE "preferences_notifications" DROP CONSTRAINT "preferences_notifications_utilisateur_id_fkey";

-- DropForeignKey
ALTER TABLE "produits_favoris" DROP CONSTRAINT "produits_favoris_produit_id_fkey";

-- DropForeignKey
ALTER TABLE "produits_favoris" DROP CONSTRAINT "produits_favoris_utilisateur_id_fkey";

-- DropForeignKey
ALTER TABLE "profils_clients" DROP CONSTRAINT "profils_clients_utilisateur_id_fkey";

-- DropForeignKey
ALTER TABLE "profils_opticiens" DROP CONSTRAINT "profils_opticiens_utilisateur_id_fkey";

-- DropForeignKey
ALTER TABLE "publications" DROP CONSTRAINT "publications_magasin_id_fkey";

-- DropForeignKey
ALTER TABLE "rendez_vous" DROP CONSTRAINT "rendez_vous_magasin_id_fkey";

-- DropForeignKey
ALTER TABLE "rendez_vous" DROP CONSTRAINT "rendez_vous_utilisateur_id_fkey";

-- DropForeignKey
ALTER TABLE "sessions_essayage" DROP CONSTRAINT "sessions_essayage_utilisateur_id_fkey";

-- DropForeignKey
ALTER TABLE "sessions_essayage" DROP CONSTRAINT "sessions_essayage_variante_id_fkey";

-- DropForeignKey
ALTER TABLE "specifications_lentilles_contact" DROP CONSTRAINT "specifications_lentilles_contact_variante_id_fkey";

-- DropForeignKey
ALTER TABLE "specifications_montures" DROP CONSTRAINT "specifications_montures_variante_id_fkey";

-- DropForeignKey
ALTER TABLE "specifications_verres" DROP CONSTRAINT "specifications_verres_variante_id_fkey";

-- DropForeignKey
ALTER TABLE "stocks" DROP CONSTRAINT "stocks_location_id_fkey";

-- DropForeignKey
ALTER TABLE "stocks" DROP CONSTRAINT "stocks_store_listing_variant_id_fkey";

-- DropForeignKey
ALTER TABLE "variantes_annonces" DROP CONSTRAINT "variantes_annonces_listing_id_fkey";

-- DropForeignKey
ALTER TABLE "variantes_annonces" DROP CONSTRAINT "variantes_annonces_variante_id_fkey";

-- DropForeignKey
ALTER TABLE "variantes_produits" DROP CONSTRAINT "variantes_produits_produit_id_fkey";

-- DropIndex
DROP INDEX "abonnements_magasins_utilisateur_id_magasin_id_key";

-- DropIndex
DROP INDEX "adresses_magasin_id_idx";

-- DropIndex
DROP INDEX "adresses_utilisateur_id_is_default_idx";

-- DropIndex
DROP INDEX "annonces_magasins_magasin_id_produit_id_key";

-- DropIndex
DROP INDEX "annonces_magasins_magasin_id_status_supprime_le_idx";

-- DropIndex
DROP INDEX "avis_magasins_magasin_id_status_cree_le_idx";

-- DropIndex
DROP INDEX "avis_produits_produit_id_status_cree_le_idx";

-- DropIndex
DROP INDEX "commandes_magasin_id_status_cree_le_idx";

-- DropIndex
DROP INDEX "commandes_utilisateur_id_cree_le_idx";

-- DropIndex
DROP INDEX "evenements_webhook_paiement_provider_provider_event_id_key";

-- DropIndex
DROP INDEX "journaux_audit_actor_id_cree_le_idx";

-- DropIndex
DROP INDEX "journaux_audit_magasin_id_cree_le_idx";

-- DropIndex
DROP INDEX "magasins_identifiant_url_key";

-- DropIndex
DROP INDEX "magasins_status_supprime_le_idx";

-- DropIndex
DROP INDEX "magasins_favoris_utilisateur_id_magasin_id_key";

-- DropIndex
DROP INDEX "mouvements_stock_inventory_id_cree_le_idx";

-- DropIndex
DROP INDEX "notifications_utilisateur_id_status_cree_le_idx";

-- DropIndex
DROP INDEX "paiements_order_id_cree_le_idx";

-- DropIndex
DROP INDEX "paniers_utilisateur_id_status_idx";

-- DropIndex
DROP INDEX "preferences_notifications_utilisateur_id_type_channel_key";

-- DropIndex
DROP INDEX "produits_brand_category_idx";

-- DropIndex
DROP INDEX "produits_identifiant_url_key";

-- DropIndex
DROP INDEX "produits_type_status_idx";

-- DropIndex
DROP INDEX "produits_favoris_utilisateur_id_produit_id_key";

-- DropIndex
DROP INDEX "profils_clients_utilisateur_id_key";

-- DropIndex
DROP INDEX "profils_opticiens_utilisateur_id_key";

-- DropIndex
DROP INDEX "publications_author_id_cree_le_idx";

-- DropIndex
DROP INDEX "publications_magasin_id_is_published_published_at_idx";

-- DropIndex
DROP INDEX "remboursements_order_id_status_idx";

-- DropIndex
DROP INDEX "rendez_vous_magasin_id_starts_at_status_idx";

-- DropIndex
DROP INDEX "rendez_vous_utilisateur_id_starts_at_idx";

-- DropIndex
DROP INDEX "sessions_essayage_status_expires_at_idx";

-- DropIndex
DROP INDEX "sessions_essayage_utilisateur_id_started_at_idx";

-- DropIndex
DROP INDEX "utilisateurs_status_supprime_le_idx";

-- DropIndex
DROP INDEX "utilisateurs_username_key";

-- DropIndex
DROP INDEX "variantes_produits_barcode_key";

-- DropIndex
DROP INDEX "variantes_produits_produit_id_is_active_idx";

-- AlterTable
ALTER TABLE "abonnements_magasins" DROP COLUMN "cree_le",
DROP COLUMN "magasin_id",
DROP COLUMN "utilisateur_id",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "store_id" UUID NOT NULL,
ADD COLUMN     "user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "abonnements_utilisateurs" DROP COLUMN "cree_le",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "adresses" DROP COLUMN "city",
DROP COLUMN "cree_le",
DROP COLUMN "label",
DROP COLUMN "line1",
DROP COLUMN "line2",
DROP COLUMN "magasin_id",
DROP COLUMN "phone",
DROP COLUMN "utilisateur_id",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "libelle" VARCHAR(80),
ADD COLUMN     "ligne_1" VARCHAR(255) NOT NULL,
ADD COLUMN     "ligne_2" VARCHAR(255),
ADD COLUMN     "store_id" UUID,
ADD COLUMN     "telephone" VARCHAR(30),
ADD COLUMN     "user_id" UUID,
ADD COLUMN     "ville" VARCHAR(100) NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "TypeAdresse" NOT NULL DEFAULT 'AUTRE';

-- AlterTable
ALTER TABLE "annonces_magasins" DROP COLUMN "cree_le",
DROP COLUMN "magasin_id",
DROP COLUMN "modifie_le",
DROP COLUMN "produit_id",
DROP COLUMN "status",
DROP COLUMN "supprime_le",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMPTZ(6),
ADD COLUMN     "product_id" UUID NOT NULL,
ADD COLUMN     "statut" "StatutAnnonce" NOT NULL DEFAULT 'BROUILLON',
ADD COLUMN     "store_id" UUID NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL;

-- AlterTable
ALTER TABLE "avis_magasins" DROP COLUMN "body",
DROP COLUMN "cree_le",
DROP COLUMN "magasin_id",
DROP COLUMN "rating",
DROP COLUMN "status",
DROP COLUMN "title",
DROP COLUMN "utilisateur_id",
ADD COLUMN     "contenu" TEXT,
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "note" INTEGER NOT NULL,
ADD COLUMN     "statut" "StatutAvis" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "store_id" UUID NOT NULL,
ADD COLUMN     "titre" VARCHAR(160),
ADD COLUMN     "user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "avis_produits" DROP COLUMN "body",
DROP COLUMN "cree_le",
DROP COLUMN "modifie_le",
DROP COLUMN "produit_id",
DROP COLUMN "rating",
DROP COLUMN "status",
DROP COLUMN "title",
DROP COLUMN "utilisateur_id",
ADD COLUMN     "contenu" TEXT,
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "note" INTEGER NOT NULL,
ADD COLUMN     "product_id" UUID NOT NULL,
ADD COLUMN     "statut" "StatutAvis" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "titre" VARCHAR(160),
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "commandes" DROP COLUMN "cree_le",
DROP COLUMN "currency",
DROP COLUMN "magasin_id",
DROP COLUMN "modifie_le",
DROP COLUMN "status",
DROP COLUMN "subtotal",
DROP COLUMN "utilisateur_id",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "devise" CHAR(3) NOT NULL DEFAULT 'TND',
ADD COLUMN     "sous_total" DECIMAL(12,3) NOT NULL,
ADD COLUMN     "statut" "StatutCommande" NOT NULL DEFAULT 'EN_ATTENTE_PAIEMENT',
ADD COLUMN     "store_id" UUID NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "consentements_essayage" DROP COLUMN "purpose",
ADD COLUMN     "objectif" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "evenements_webhook_paiement" DROP COLUMN "payload",
DROP COLUMN "provider",
ADD COLUMN     "donnees" JSONB NOT NULL,
ADD COLUMN     "fournisseur" "FournisseurPaiement" NOT NULL;

-- AlterTable
ALTER TABLE "fichiers_essayage" DROP COLUMN "cree_le",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "type",
ADD COLUMN     "type" "TypeFichierEssayage" NOT NULL;

-- AlterTable
ALTER TABLE "journaux_audit" DROP COLUMN "cree_le",
DROP COLUMN "magasin_id",
DROP COLUMN "metadata",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "metadonnees" JSONB,
ADD COLUMN     "store_id" UUID;

-- AlterTable
ALTER TABLE "magasins" DROP COLUMN "cree_le",
DROP COLUMN "currency",
DROP COLUMN "identifiant_url",
DROP COLUMN "modifie_le",
DROP COLUMN "phone",
DROP COLUMN "status",
DROP COLUMN "supprime_le",
DROP COLUMN "timezone",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMPTZ(6),
ADD COLUMN     "devise" CHAR(3) NOT NULL DEFAULT 'TND',
ADD COLUMN     "fuseau_horaire" VARCHAR(80) NOT NULL DEFAULT 'Africa/Tunis',
ADD COLUMN     "slug" VARCHAR(180) NOT NULL,
ADD COLUMN     "statut" "StatutMagasin" NOT NULL DEFAULT 'BROUILLON',
ADD COLUMN     "telephone" VARCHAR(30),
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL;

-- AlterTable
ALTER TABLE "magasins_favoris" DROP COLUMN "cree_le",
DROP COLUMN "magasin_id",
DROP COLUMN "utilisateur_id",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "store_id" UUID NOT NULL,
ADD COLUMN     "user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "mouvements_stock" DROP COLUMN "cree_le",
DROP COLUMN "quantity",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "quantite" INTEGER NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "TypeMouvementStock" NOT NULL;

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "body",
DROP COLUMN "cree_le",
DROP COLUMN "data",
DROP COLUMN "status",
DROP COLUMN "title",
DROP COLUMN "utilisateur_id",
ADD COLUMN     "contenu" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "donnees" JSONB,
ADD COLUMN     "statut" "StatutNotification" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "titre" VARCHAR(180) NOT NULL,
ADD COLUMN     "user_id" UUID NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "TypeNotification" NOT NULL;

-- AlterTable
ALTER TABLE "ordonnances" DROP COLUMN "cree_le",
DROP COLUMN "modifie_le",
DROP COLUMN "title",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "titre" VARCHAR(120),
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL;

-- AlterTable
ALTER TABLE "paiements" DROP COLUMN "amount",
DROP COLUMN "cree_le",
DROP COLUMN "currency",
DROP COLUMN "modifie_le",
DROP COLUMN "provider",
DROP COLUMN "status",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "devise" CHAR(3) NOT NULL DEFAULT 'TND',
ADD COLUMN     "fournisseur" "FournisseurPaiement" NOT NULL,
ADD COLUMN     "montant" DECIMAL(12,3) NOT NULL,
ADD COLUMN     "statut" "StatutPaiement" NOT NULL DEFAULT 'CREE',
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL;

-- AlterTable
ALTER TABLE "paniers" DROP COLUMN "cree_le",
DROP COLUMN "modifie_le",
DROP COLUMN "status",
DROP COLUMN "utilisateur_id",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "statut" "StatutPanier" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "preferences_notifications" DROP COLUMN "channel",
DROP COLUMN "enabled",
DROP COLUMN "utilisateur_id",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "canal" "CanalNotification" NOT NULL,
ADD COLUMN     "user_id" UUID NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "TypeNotification" NOT NULL;

-- AlterTable
ALTER TABLE "produits" DROP COLUMN "attributes",
DROP COLUMN "audience",
DROP COLUMN "brand",
DROP COLUMN "category",
DROP COLUMN "cree_le",
DROP COLUMN "identifiant_url",
DROP COLUMN "manufacturer",
DROP COLUMN "modifie_le",
DROP COLUMN "status",
DROP COLUMN "supprime_le",
DROP COLUMN "tags",
ADD COLUMN     "attributs" JSONB,
ADD COLUMN     "categorie" VARCHAR(100),
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMPTZ(6),
ADD COLUMN     "etiquettes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "fabricant" VARCHAR(120),
ADD COLUMN     "marque" VARCHAR(120),
ADD COLUMN     "public_cible" "PublicCible" NOT NULL DEFAULT 'MIXTE',
ADD COLUMN     "slug" VARCHAR(220) NOT NULL,
ADD COLUMN     "statut" "StatutProduit" NOT NULL DEFAULT 'BROUILLON',
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "TypeProduit" NOT NULL;

-- AlterTable
ALTER TABLE "produits_favoris" DROP COLUMN "cree_le",
DROP COLUMN "produit_id",
DROP COLUMN "utilisateur_id",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "product_id" UUID NOT NULL,
ADD COLUMN     "user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "profils_clients" DROP COLUMN "cree_le",
DROP COLUMN "date_naissance",
DROP COLUMN "modifie_le",
DROP COLUMN "utilisateur_id",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "date_of_birth" DATE,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "profils_opticiens" DROP COLUMN "bio",
DROP COLUMN "cree_le",
DROP COLUMN "modifie_le",
DROP COLUMN "utilisateur_id",
ADD COLUMN     "biographie" TEXT,
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "publications" DROP COLUMN "caption",
DROP COLUMN "cree_le",
DROP COLUMN "magasin_id",
DROP COLUMN "modifie_le",
DROP COLUMN "supprime_le",
DROP COLUMN "visibility",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMPTZ(6),
ADD COLUMN     "legende" TEXT,
ADD COLUMN     "store_id" UUID,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "visibilite" "VisibilitePublication" NOT NULL DEFAULT 'PUBLIC';

-- AlterTable
ALTER TABLE "remboursements" DROP COLUMN "amount",
DROP COLUMN "cree_le",
DROP COLUMN "currency",
DROP COLUMN "reason",
DROP COLUMN "status",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "devise" CHAR(3) NOT NULL DEFAULT 'TND',
ADD COLUMN     "montant" DECIMAL(12,3) NOT NULL,
ADD COLUMN     "raison" TEXT,
ADD COLUMN     "statut" "StatutRemboursement" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "rendez_vous" DROP COLUMN "cree_le",
DROP COLUMN "magasin_id",
DROP COLUMN "modifie_le",
DROP COLUMN "status",
DROP COLUMN "utilisateur_id",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "statut" "StatutRendezVous" NOT NULL DEFAULT 'DEMANDE',
ADD COLUMN     "store_id" UUID NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "sessions_essayage" DROP COLUMN "metadata",
DROP COLUMN "status",
DROP COLUMN "utilisateur_id",
DROP COLUMN "variante_id",
ADD COLUMN     "metadonnees" JSONB,
ADD COLUMN     "product_variant_id" UUID,
ADD COLUMN     "statut" "StatutEssayage" NOT NULL DEFAULT 'CREE',
ADD COLUMN     "user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "stocks" DROP COLUMN "cree_le",
DROP COLUMN "modifie_le",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL;

-- AlterTable
ALTER TABLE "utilisateurs" DROP COLUMN "cree_le",
DROP COLUMN "empreinte_mot_de_passe",
DROP COLUMN "modifie_le",
DROP COLUMN "nom_famille",
DROP COLUMN "phone",
DROP COLUMN "prenom",
DROP COLUMN "status",
DROP COLUMN "supprime_le",
DROP COLUMN "username",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMPTZ(6),
ADD COLUMN     "first_name" VARCHAR(100) NOT NULL,
ADD COLUMN     "last_name" VARCHAR(100) NOT NULL,
ADD COLUMN     "nom_utilisateur" VARCHAR(50),
ADD COLUMN     "password_hash" VARCHAR(255) NOT NULL,
ADD COLUMN     "statut" "StatutUtilisateur" NOT NULL DEFAULT 'EN_ATTENTE_VERIFICATION',
ADD COLUMN     "telephone" VARCHAR(30),
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "RolePlateforme" NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE "variantes_produits" DROP COLUMN "attributes",
DROP COLUMN "barcode",
DROP COLUMN "color",
DROP COLUMN "material",
DROP COLUMN "produit_id",
DROP COLUMN "size",
ADD COLUMN     "attributs" JSONB,
ADD COLUMN     "code_barres" VARCHAR(100),
ADD COLUMN     "couleur" VARCHAR(80),
ADD COLUMN     "materiau" VARCHAR(100),
ADD COLUMN     "product_id" UUID NOT NULL,
ADD COLUMN     "taille" VARCHAR(80);

-- DropTable
DROP TABLE "adhesions_magasins";

-- DropTable
DROP TABLE "articles_commande";

-- DropTable
DROP TABLE "articles_panier";

-- DropTable
DROP TABLE "commentaires_publication";

-- DropTable
DROP TABLE "details_yeux_ordonnance";

-- DropTable
DROP TABLE "emplacements_stock";

-- DropTable
DROP TABLE "historique_statuts_commande";

-- DropTable
DROP TABLE "medias_publication";

-- DropTable
DROP TABLE "mentions_j_aime_publication";

-- DropTable
DROP TABLE "partages_publication";

-- DropTable
DROP TABLE "specifications_lentilles_contact";

-- DropTable
DROP TABLE "specifications_montures";

-- DropTable
DROP TABLE "specifications_verres";

-- DropTable
DROP TABLE "variantes_annonces";

-- DropEnum
DROP TYPE "AddressType";

-- DropEnum
DROP TYPE "AppointmentStatus";

-- DropEnum
DROP TYPE "Audience";

-- DropEnum
DROP TYPE "CartStatus";

-- DropEnum
DROP TYPE "ContactLensReplacement";

-- DropEnum
DROP TYPE "EyeSide";

-- DropEnum
DROP TYPE "InventoryMovementType";

-- DropEnum
DROP TYPE "LensDesign";

-- DropEnum
DROP TYPE "LensTreatment";

-- DropEnum
DROP TYPE "ListingStatus";

-- DropEnum
DROP TYPE "MediaType";

-- DropEnum
DROP TYPE "MembershipRole";

-- DropEnum
DROP TYPE "MembershipStatus";

-- DropEnum
DROP TYPE "NotificationChannel";

-- DropEnum
DROP TYPE "NotificationStatus";

-- DropEnum
DROP TYPE "NotificationType";

-- DropEnum
DROP TYPE "OrderStatus";

-- DropEnum
DROP TYPE "PaymentProvider";

-- DropEnum
DROP TYPE "PaymentStatus";

-- DropEnum
DROP TYPE "PlatformRole";

-- DropEnum
DROP TYPE "PostVisibility";

-- DropEnum
DROP TYPE "ProductStatus";

-- DropEnum
DROP TYPE "ProductType";

-- DropEnum
DROP TYPE "RefundStatus";

-- DropEnum
DROP TYPE "ReviewStatus";

-- DropEnum
DROP TYPE "StockLocationType";

-- DropEnum
DROP TYPE "StoreStatus";

-- DropEnum
DROP TYPE "TryOnAssetType";

-- DropEnum
DROP TYPE "TryOnStatus";

-- DropEnum
DROP TYPE "UserStatus";

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
CREATE TABLE "articles_paniers" (
    "id" UUID NOT NULL,
    "cart_id" UUID NOT NULL,
    "listing_variant_id" UUID NOT NULL,
    "quantite" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "articles_paniers_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "partages_publications" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "legende" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partages_publications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "membres_magasins_user_id_statut_idx" ON "membres_magasins"("user_id", "statut");

-- CreateIndex
CREATE UNIQUE INDEX "membres_magasins_store_id_user_id_key" ON "membres_magasins"("store_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "emplacements_magasins_store_id_code_key" ON "emplacements_magasins"("store_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "caracteristiques_montures_variant_id_key" ON "caracteristiques_montures"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "caracteristiques_verres_variant_id_key" ON "caracteristiques_verres"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "caracteristiques_lentilles_contact_variant_id_key" ON "caracteristiques_lentilles_contact"("variant_id");

-- CreateIndex
CREATE INDEX "variantes_annonces_magasins_listing_id_is_available_idx" ON "variantes_annonces_magasins"("listing_id", "is_available");

-- CreateIndex
CREATE UNIQUE INDEX "variantes_annonces_magasins_listing_id_variant_id_key" ON "variantes_annonces_magasins"("listing_id", "variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "variantes_annonces_magasins_store_sku_key" ON "variantes_annonces_magasins"("store_sku");

-- CreateIndex
CREATE UNIQUE INDEX "variantes_annonces_magasins_store_barcode_key" ON "variantes_annonces_magasins"("store_barcode");

-- CreateIndex
CREATE UNIQUE INDEX "yeux_ordonnances_prescription_id_cote_key" ON "yeux_ordonnances"("prescription_id", "cote");

-- CreateIndex
CREATE UNIQUE INDEX "articles_paniers_cart_id_listing_variant_id_key" ON "articles_paniers"("cart_id", "listing_variant_id");

-- CreateIndex
CREATE INDEX "articles_commandes_order_id_idx" ON "articles_commandes"("order_id");

-- CreateIndex
CREATE INDEX "historique_statuts_commandes_order_id_created_at_idx" ON "historique_statuts_commandes"("order_id", "created_at");

-- CreateIndex
CREATE INDEX "medias_publications_post_id_position_idx" ON "medias_publications"("post_id", "position");

-- CreateIndex
CREATE INDEX "commentaires_publications_post_id_created_at_idx" ON "commentaires_publications"("post_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "aimes_publications_post_id_user_id_key" ON "aimes_publications"("post_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "partages_publications_post_id_user_id_key" ON "partages_publications"("post_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "abonnements_magasins_user_id_store_id_key" ON "abonnements_magasins"("user_id", "store_id");

-- CreateIndex
CREATE INDEX "adresses_user_id_is_default_idx" ON "adresses"("user_id", "is_default");

-- CreateIndex
CREATE INDEX "adresses_store_id_idx" ON "adresses"("store_id");

-- CreateIndex
CREATE INDEX "annonces_magasins_store_id_statut_deleted_at_idx" ON "annonces_magasins"("store_id", "statut", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "annonces_magasins_store_id_product_id_key" ON "annonces_magasins"("store_id", "product_id");

-- CreateIndex
CREATE INDEX "avis_magasins_store_id_statut_created_at_idx" ON "avis_magasins"("store_id", "statut", "created_at");

-- CreateIndex
CREATE INDEX "avis_produits_product_id_statut_created_at_idx" ON "avis_produits"("product_id", "statut", "created_at");

-- CreateIndex
CREATE INDEX "commandes_user_id_created_at_idx" ON "commandes"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "commandes_store_id_statut_created_at_idx" ON "commandes"("store_id", "statut", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "evenements_webhook_paiement_fournisseur_provider_event_id_key" ON "evenements_webhook_paiement"("fournisseur", "provider_event_id");

-- CreateIndex
CREATE INDEX "fichiers_essayage_session_id_type_idx" ON "fichiers_essayage"("session_id", "type");

-- CreateIndex
CREATE INDEX "journaux_audit_actor_id_created_at_idx" ON "journaux_audit"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "journaux_audit_store_id_created_at_idx" ON "journaux_audit"("store_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "magasins_slug_key" ON "magasins"("slug");

-- CreateIndex
CREATE INDEX "magasins_statut_deleted_at_idx" ON "magasins"("statut", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "magasins_favoris_user_id_store_id_key" ON "magasins_favoris"("user_id", "store_id");

-- CreateIndex
CREATE INDEX "mouvements_stock_inventory_id_created_at_idx" ON "mouvements_stock"("inventory_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_statut_created_at_idx" ON "notifications"("user_id", "statut", "created_at");

-- CreateIndex
CREATE INDEX "paiements_order_id_created_at_idx" ON "paiements"("order_id", "created_at");

-- CreateIndex
CREATE INDEX "paniers_user_id_statut_idx" ON "paniers"("user_id", "statut");

-- CreateIndex
CREATE UNIQUE INDEX "preferences_notifications_user_id_type_canal_key" ON "preferences_notifications"("user_id", "type", "canal");

-- CreateIndex
CREATE UNIQUE INDEX "produits_slug_key" ON "produits"("slug");

-- CreateIndex
CREATE INDEX "produits_type_statut_idx" ON "produits"("type", "statut");

-- CreateIndex
CREATE INDEX "produits_marque_categorie_idx" ON "produits"("marque", "categorie");

-- CreateIndex
CREATE UNIQUE INDEX "produits_favoris_user_id_product_id_key" ON "produits_favoris"("user_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "profils_clients_user_id_key" ON "profils_clients"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "profils_opticiens_user_id_key" ON "profils_opticiens"("user_id");

-- CreateIndex
CREATE INDEX "publications_store_id_is_published_published_at_idx" ON "publications"("store_id", "is_published", "published_at");

-- CreateIndex
CREATE INDEX "publications_author_id_created_at_idx" ON "publications"("author_id", "created_at");

-- CreateIndex
CREATE INDEX "remboursements_order_id_statut_idx" ON "remboursements"("order_id", "statut");

-- CreateIndex
CREATE INDEX "rendez_vous_store_id_starts_at_statut_idx" ON "rendez_vous"("store_id", "starts_at", "statut");

-- CreateIndex
CREATE INDEX "rendez_vous_user_id_starts_at_idx" ON "rendez_vous"("user_id", "starts_at");

-- CreateIndex
CREATE INDEX "sessions_essayage_user_id_started_at_idx" ON "sessions_essayage"("user_id", "started_at");

-- CreateIndex
CREATE INDEX "sessions_essayage_statut_expires_at_idx" ON "sessions_essayage"("statut", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_nom_utilisateur_key" ON "utilisateurs"("nom_utilisateur");

-- CreateIndex
CREATE INDEX "utilisateurs_statut_deleted_at_idx" ON "utilisateurs"("statut", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "variantes_produits_code_barres_key" ON "variantes_produits"("code_barres");

-- CreateIndex
CREATE INDEX "variantes_produits_product_id_is_active_idx" ON "variantes_produits"("product_id", "is_active");

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
ALTER TABLE "variantes_annonces_magasins" ADD CONSTRAINT "variantes_annonces_magasins_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "annonces_magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variantes_annonces_magasins" ADD CONSTRAINT "variantes_annonces_magasins_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variantes_produits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_store_listing_variant_id_fkey" FOREIGN KEY ("store_listing_variant_id") REFERENCES "variantes_annonces_magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "emplacements_magasins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "rendez_vous" ADD CONSTRAINT "rendez_vous_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rendez_vous" ADD CONSTRAINT "rendez_vous_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "magasins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis_produits" ADD CONSTRAINT "avis_produits_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "produits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis_produits" ADD CONSTRAINT "avis_produits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis_magasins" ADD CONSTRAINT "avis_magasins_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "magasins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis_magasins" ADD CONSTRAINT "avis_magasins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produits_favoris" ADD CONSTRAINT "produits_favoris_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produits_favoris" ADD CONSTRAINT "produits_favoris_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magasins_favoris" ADD CONSTRAINT "magasins_favoris_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magasins_favoris" ADD CONSTRAINT "magasins_favoris_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preferences_notifications" ADD CONSTRAINT "preferences_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
