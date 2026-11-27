"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { formatCurrency } from "./formatters";
import {
  IconCatalog,
  IconPlus,
  IconSearch,
  IconX,
  IconEyeglasses,
} from "../ui/Icons";

interface OpticianProductsProps {
  listingsData: unknown;
  inventoryData: unknown;
  inventoryError?: string;
  currency?: string;
  onReadFrameImage?: (imageId: string) => Promise<Blob>;
  onAddListingVariant: (listingId: string, input: Record<string, unknown>) => Promise<void>;
  onUpdateStock: (stockId: string, input: Record<string, unknown>) => Promise<void>;
  onBulkUpdateStocks: (
    stockIds: string[],
    input: Record<string, unknown>,
  ) => Promise<void>;
}

export function OpticianProducts({
  listingsData,
  inventoryData,
  inventoryError = "",
  currency = "",
  onReadFrameImage,
  onAddListingVariant,
  onUpdateStock,
  onBulkUpdateStocks,
}: OpticianProductsProps) {
  const [activeMode, setActiveMode] = useState<"manage" | "showcase" | "prices" | "legacy">("manage");

  // Modal: Add Priced Variant to existing listing
  const [addVariantModal, setAddVariantModal] = useState<{
    listingId: string;
    listingTitle: string;
  } | null>(null);
  const [variantCatalogId, setVariantCatalogId] = useState("");
  const [variantPrice, setVariantPrice] = useState("");
  const [variantComparePrice, setVariantComparePrice] = useState("");
  const [variantSku, setVariantSku] = useState("");
  const variantCurrency = currency;
  const [variantAvailable, setVariantAvailable] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  // Extract store listings
  const rawListings = Array.isArray(listingsData)
    ? listingsData
    : (listingsData as Record<string, unknown>)?.data &&
      Array.isArray((listingsData as Record<string, unknown>).data)
      ? ((listingsData as Record<string, unknown>).data as Array<Record<string, unknown>>)
      : [];
  const rawInventory = Array.isArray(inventoryData)
    ? inventoryData
    : (inventoryData as Record<string, unknown>)?.data &&
      Array.isArray((inventoryData as Record<string, unknown>).data)
      ? ((inventoryData as Record<string, unknown>).data as Array<Record<string, unknown>>)
      : [];
  const frameStocks = rawInventory.filter(
    (item) => item.type_article === "MONTURE",
  );
  const publishedFrameStocks = frameStocks.filter(isPublicStock);
  const validVariantPrice = isPositivePriceInput(variantPrice);

  return (
    <div className="opt-products-page">
      <div className="opt-card">
        <div className="opt-products-main-tabs" role="tablist" aria-label="Gestion des produits">
          <button
            className={`opt-products-main-tab ${activeMode === "manage" ? "active" : ""}`}
            onClick={() => setActiveMode("manage")}
            type="button"
          >
            <strong>Gérer mes produits</strong>
            <span>Publier, masquer ou modifier vos montures en stock ({frameStocks.length})</span>
          </button>
          <button
            className={`opt-products-main-tab ${activeMode === "showcase" ? "active" : ""}`}
            onClick={() => setActiveMode("showcase")}
            type="button"
          >
            <strong>Vitrine publique</strong>
            <span>Montures visibles sur cette page d’inventaire ({publishedFrameStocks.length})</span>
          </button>
        </div>
      </div>

      {activeMode === "manage" ? (
        <>
          <StockCataloguePanel
            key={frameStocks.map((item) => String(item.id ?? "")).join("|")}
            items={frameStocks}
            error={inventoryError}
            currency={currency}
            onUpdateStock={onUpdateStock}
            onBulkUpdateStocks={onBulkUpdateStocks}
            onReadFrameImage={onReadFrameImage}
          />
          <div className="opt-products-secondary-tools">
            <span>Autres outils :</span>
            <button className="button secondary small" onClick={() => setActiveMode("prices")} type="button">
              Modifier les tarifs de tous les articles ({rawInventory.length})
            </button>
            <button className="button secondary small" onClick={() => setActiveMode("legacy")} type="button">
              Gérer mes annonces boutique
            </button>
          </div>
        </>
      ) : activeMode === "showcase" ? (
        <PublicProductShowcase
          items={publishedFrameStocks}
          currency={currency}
          onReadFrameImage={onReadFrameImage}
        />
      ) : activeMode === "prices" ? (
        <>
          <button className="button secondary small opt-products-back" onClick={() => setActiveMode("manage")} type="button">
            ← Retour à mes produits
          </button>
        <StockPricePanel
          items={rawInventory}
          currency={currency}
          error={inventoryError}
          onUpdateStock={onUpdateStock}
        />
        </>
      ) : (
      <>
      <button className="button secondary small opt-products-back" onClick={() => setActiveMode("manage")} type="button">
        ← Retour à mes produits
      </button>
        <div className="opt-card">
          <div className="opt-card-header">
            <div>
              <h3>Annonces de ma boutique ({rawListings.length})</h3>
              <p className="opt-card-sub">Gérez les variantes et tarifs de vos annonces boutique.</p>
            </div>
          </div>

          <div className="opt-card-body-tight">
            {rawListings.length > 0 ? (
              <div className="opt-listing-grid">
                {rawListings.map((listing) => {
                  const product = listing.produit as Record<string, unknown> | undefined;
                  const variants = Array.isArray(listing.variantes)
                    ? (listing.variantes as Array<Record<string, unknown>>)
                    : [];
                  const status = String(listing.statut || "ACTIVE");
                  const title = String(listing.titre_personnalise || product?.nom || "Monture");

                  return (
                    <div key={listing.id as string} className="opt-listing-card">
                      <div className="opt-listing-top">
                        <div className="opt-listing-icon">
                          <IconEyeglasses height={24} width={24} />
                        </div>
                        <div className="opt-listing-head">
                          <h4>{title}</h4>
                          <span className={`opt-status-pill ${status === "ACTIVE" ? "badge-emerald" : "badge-gray"}`}>
                            {status}
                          </span>
                        </div>
                      </div>

                      {listing.description_personnalisee ? (
                        <p className="opt-listing-desc">{String(listing.description_personnalisee)}</p>
                      ) : null}

                      {/* Variants with prices */}
                      <div className="opt-listing-variants">
                        <span className="opt-variants-title">Variantes tarifées ({variants.length})</span>
                        {variants.length > 0 ? (
                          <div className="opt-variant-pills">
                            {variants.map((v) => (
                              <div key={v.id as string} className="opt-variant-chip">
                                <span className="opt-var-sku">{String(v.reference_magasin || "Ref").slice(0, 10)}</span>
                                <span className="opt-var-price">{formatCurrency(v.prix, (v.devise as string) || "TND")}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="muted">Aucun tarif défini pour le moment.</p>
                        )}
                      </div>

                      <div className="opt-listing-footer">
                        <button
                          className="button secondary small"
                          onClick={() => {
                            setAddVariantModal({
                              listingId: String(listing.id),
                              listingTitle: title,
                            });
                            setVariantPrice("");
                            setVariantComparePrice("");
                            setVariantSku("");
                            setVariantCatalogId("");
                          }}
                          type="button"
                        >
                          <IconPlus height={12} width={12} /> Ajouter un tarif / variante
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="opt-empty-state">
                <IconCatalog height={36} width={36} />
                <h4>Aucune annonce boutique</h4>
                <p>Les montures publiées depuis votre inventaire sont gérées dans « Gérer mes produits ».</p>
              </div>
            )}
          </div>
        </div>

      {/* Modal: Add Priced Variant */}
      {addVariantModal && (
        <div className="opt-modal-overlay" onClick={() => setAddVariantModal(null)} role="dialog" aria-modal="true">
          <div className="opt-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="opt-modal-header">
              <div className="opt-modal-title-wrap">
                <div className="opt-icon-bubble">
                  <IconPlus height={18} width={18} />
                </div>
                <div>
                  <h3>Ajouter une variante tarifée</h3>
                  <p className="opt-modal-sub">{addVariantModal.listingTitle}</p>
                </div>
              </div>
              <button className="opt-modal-close" onClick={() => setAddVariantModal(null)} type="button">
                <IconX height={18} width={18} />
              </button>
            </div>

            <div className="opt-modal-body">
              <div className="field">
                <span>ID UUID de la variante catalogue maître</span>
                <input
                  value={variantCatalogId}
                  onChange={(e) => setVariantCatalogId(e.target.value)}
                  placeholder="ID de la variante maître"
                  required
                />
              </div>

              <div className="opt-row-2">
                <div className="field">
                  <span>Prix boutique{variantCurrency ? ` (${variantCurrency})` : ""} *</span>
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={variantPrice}
                    onChange={(e) => setVariantPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <span>Prix barré (comparatif)</span>
                  <input
                    type="number"
                    min={0}
                    step="0.001"
                    value={variantComparePrice}
                    onChange={(e) => setVariantComparePrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="field">
                <span>Référence magasin (SKU boutique)</span>
                <input
                  value={variantSku}
                  onChange={(e) => setVariantSku(e.target.value)}
                  placeholder="Ex: RAY-AVIATOR-GOLD-52"
                />
              </div>

              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={variantAvailable}
                  onChange={(e) => setVariantAvailable(e.target.checked)}
                />
                <span>Disponible à la vente en boutique</span>
              </label>
            </div>

            <div className="opt-modal-footer">
              <button className="button secondary" onClick={() => setAddVariantModal(null)} type="button">
                Annuler
              </button>
              <button
                className="button primary"
                disabled={submitting || !variantCatalogId || !validVariantPrice}
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    await onAddListingVariant(addVariantModal.listingId, {
                      variante_id: variantCatalogId,
                      prix: Number(variantPrice),
                      prix_compare: variantComparePrice ? Number(variantComparePrice) : undefined,
                      reference_magasin: variantSku || undefined,
                      ...(variantCurrency ? { devise: variantCurrency } : {}),
                      est_disponible: variantAvailable,
                    });
                    setAddVariantModal(null);
                  } finally {
                    setSubmitting(false);
                  }

                }}
                type="button"
              >
                {submitting ? "Ajout…" : "Enregistrer la variante"}
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}

function StockCataloguePanel({
  items,
  error,
  currency,
  onUpdateStock,
  onBulkUpdateStocks,
  onReadFrameImage,
}: {
  items: Array<Record<string, unknown>>;
  error: string;
  currency: string;
  onUpdateStock: (stockId: string, input: Record<string, unknown>) => Promise<void>;
  onBulkUpdateStocks: (
    stockIds: string[],
    input: Record<string, unknown>,
  ) => Promise<void>;
  onReadFrameImage?: (imageId: string) => Promise<Blob>;
}) {
  const [savingId, setSavingId] = useState("");
  const [saveError, setSaveError] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState<"all" | "published" | "hidden">("all");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<Record<string, unknown> | null>(null);


  const visibleItems = items.filter((item) => {
    const published = item.est_publie === true;
    if (visibility === "published" && !published) return false;
    if (visibility === "hidden" && published) return false;
    const query = search.trim().toLocaleLowerCase("fr");
    if (!query) return true;
    return [stockTitle(item), stockReference(item), stockColor(item)]
      .join(" ")
      .toLocaleLowerCase("fr")
      .includes(query);
  });
  const visibleIds = visibleItems.map((item) => String(item.id ?? ""));
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const selectedItems = items.filter((item) =>
    selectedIds.includes(String(item.id ?? "")),
  );
  const hasUnpublishedSelection = selectedItems.some(
    (item) => item.est_publie !== true,
  );
  const hasPublishedSelection = selectedItems.some(
    (item) => item.est_publie === true,
  );
  const selectedWithoutPrice = selectedItems.some(
    (item) =>
      item.est_publie !== true &&
      !isPositivePriceInput(String(item.prix_vente ?? "")),
  );

  async function updateSelection(published: boolean) {
    const targets = selectedItems.filter(
      (item) => (item.est_publie === true) !== published,
    );
    if (!targets.length) return;
    setBulkSaving(true);
    setSaveError("");
    try {
      await onBulkUpdateStocks(
        targets.map((item) => String(item.id ?? "")),
        { est_publie: published },
      );
      setSelectedIds([]);
    } catch (reason) {
      setSaveError(reason instanceof Error ? reason.message : "Impossible de modifier la visibilité des produits.");
    } finally {
      setBulkSaving(false);
    }
  }

  return (
    <div className="opt-card">
      <div className="opt-card-header">
        <div>
          <h3>Gérer mes montures</h3>
          <p className="opt-card-sub">Choisissez les articles à afficher aux clients. Vous pouvez les modifier un par un ou par sélection.</p>
        </div>
      </div>
      <div className="opt-card-body-tight">
        {(error || saveError) && <p className="error-message" role="alert">{saveError || error}</p>}
        {items.length ? (
          <>
            <div className="opt-products-toolbar">
              <label className="opt-products-search">
                <IconSearch height={16} width={16} />
                <input
                  aria-label="Rechercher une monture"
                  placeholder="Rechercher par nom, référence ou coloris"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label className="opt-products-filter">
                <span>Afficher</span>
                <select
                  value={visibility}
                  onChange={(event) => setVisibility(event.target.value as typeof visibility)}
                >
                  <option value="all">Tous les produits</option>
                  <option value="published">Publiés</option>
                  <option value="hidden">Masqués</option>
                </select>
              </label>
            </div>
            <div className="opt-products-selection">
              <div>
                <button
                  className="button secondary small"
                  type="button"
                  disabled={!visibleIds.length}
                  onClick={() =>
                    setSelectedIds((current) =>
                      allVisibleSelected
                        ? current.filter((id) => !visibleIds.includes(id))
                        : [...new Set([...current, ...visibleIds])],
                    )
                  }
                >
                  {allVisibleSelected ? "Désélectionner la liste" : "Tout sélectionner dans la liste"}
                </button>
                <span>{selectedIds.length} sélectionné{selectedIds.length === 1 ? "" : "s"}</span>
              </div>
              <div className="opt-products-bulk-actions">
                <button
                  className="button primary small"
                  type="button"
                  disabled={!hasUnpublishedSelection || selectedWithoutPrice || bulkSaving}
                  onClick={() => void updateSelection(true)}
                  title={selectedWithoutPrice ? "Ajoutez un prix avant de publier les produits sélectionnés." : undefined}
                >
                  {bulkSaving ? "Mise à jour…" : "Publier la sélection"}
                </button>
                <button
                  className="button secondary small"
                  type="button"
                  disabled={!hasPublishedSelection || bulkSaving}
                  onClick={() => void updateSelection(false)}
                >
                  Masquer la sélection
                </button>
              </div>
            </div>
            <p className="opt-products-selection-note">La sélection concerne uniquement les résultats affichés sur cette page d’inventaire.</p>
            {selectedWithoutPrice && (
              <p className="opt-products-hint">Un prix de vente est nécessaire avant de publier la sélection.</p>
            )}
            <div className="opt-table-wrap">
            <table className="opt-table">
              <thead>
                <tr>
                  <th>Choisir</th>
                  <th>Monture</th>
                  <th>Coloris</th>
                  <th>Stock disponible</th>
                  <th>Prix unitaire</th>
                  <th>Visibilité client</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item) => {
                  const id = String(item.id ?? "");
                  const available = Math.max(
                    0,
                    Number(item.quantite_disponible ?? 0) -
                      Number(item.quantite_reservee ?? 0),
                  );
                  const price = item.prix_vente;
                  const published = item.est_publie === true;
                  const canPublish = isPositivePriceInput(String(price ?? ""));

                  return (
                    <tr key={id}>
                        <td data-label="Sélection">
                          <input
                            aria-label={`Sélectionner ${stockTitle(item)}`}
                            checked={selectedIds.includes(id)}
                            onChange={(event) =>
                              setSelectedIds((current) =>
                                event.target.checked
                                  ? [...current, id]
                                  : current.filter((selectedId) => selectedId !== id),
                              )
                            }
                            type="checkbox"
                          />
                        </td>
                      <td data-label="Monture">
                        <div className="opt-table-cell-title">
                          <StockImagePreview item={item} onReadFrameImage={onReadFrameImage} />
                          <div>
                            <strong>{stockTitle(item)}</strong>
                            <span className="opt-table-cell-sub">{stockReference(item)}</span>
                          </div>
                        </div>
                      </td>
                      <td data-label="Coloris">{stockColor(item)}</td>
                      <td data-label="Stock disponible">
                        {available > 0 ? `${available} unité${available === 1 ? "" : "s"}` : "Rupture"}
                      </td>
                      <td data-label="Prix unitaire">
                        {canPublish
                          ? currency
                            ? formatCurrency(price, currency)
                            : String(price)
                          : "Aucun prix"}
                      </td>
                      <td data-label="Visibilité client">
                        <span className={`opt-status-pill ${published ? "badge-emerald" : "badge-gray"}`}>
                          {published ? "Publié" : "Masqué"}
                        </span>
                        {published && available === 0 && (
                          <span className="opt-table-cell-sub">Non proposé sans stock disponible</span>
                        )}
                      </td>
                      <td data-label="Action">
                        <div className="opt-products-row-actions">
                          <button
                            className="button secondary small"
                            type="button"
                            disabled={savingId === id || (!published && !canPublish)}
                            onClick={async () => {
                              setSavingId(id);
                              setSaveError("");
                              try {
                                await onUpdateStock(id, { est_publie: !published });
                              } catch (reason) {
                                setSaveError(reason instanceof Error ? reason.message : "Impossible de modifier la visibilité.");
                              } finally {
                                setSavingId("");
                              }
                            }}
                          >
                            {savingId === id ? "Enregistrement…" : published ? "Masquer" : "Publier"}
                          </button>
                          <button
                            className="button primary small"
                            type="button"
                            onClick={() => setEditingItem(item)}
                          >
                            Modifier
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            {!visibleItems.length && <p className="opt-products-hint">Aucun produit ne correspond à cette recherche.</p>}
          </>
        ) : (
          <div className="opt-empty-state">
            <IconEyeglasses height={36} width={36} />
            <h4>Aucune monture en stock</h4>
            <p>Les montures ajoutées dans l’inventaire apparaîtront ici. Elles restent masquées tant qu’elles ne sont pas publiées.</p>
          </div>
        )}
      </div>
      {editingItem && (
        <StockEditModal
          item={editingItem}
          currency={currency}
          onClose={() => setEditingItem(null)}
          onSave={async (id, input) => {
            await onUpdateStock(id, input);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}

function PublicProductShowcase({
  items,
  currency,
  onReadFrameImage,
}: {
  items: Array<Record<string, unknown>>;
  currency: string;
  onReadFrameImage?: (imageId: string) => Promise<Blob>;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const categories = [...new Set(items.map(stockCategory))].sort((a, b) =>
    a.localeCompare(b, "fr"),
  );
  const filteredItems = items.filter((item) => {
    if (category !== "all" && stockCategory(item) !== category) return false;
    const query = search.trim().toLocaleLowerCase("fr");
    return !query || [stockTitle(item), stockReference(item), stockColor(item)]
      .join(" ")
      .toLocaleLowerCase("fr")
      .includes(query);
  });
  const unitsAvailable = items.reduce(
    (total, item) =>
      total +
      Math.max(
        0,
        Number(item.quantite_disponible ?? 0) -
          Number(item.quantite_reservee ?? 0),
      ),
    0,
  );
  const categoryCounts = categories.map((name) => ({
    name,
    count: items.filter((item) => stockCategory(item) === name).length,
  }));

  return (
    <div className="opt-card">
      <div className="opt-card-header">
        <div>
          <h3>Vitrine publique</h3>
          <p className="opt-card-sub">Montures publiées et disponibles sur cette page. Utilisez la pagination en haut pour parcourir les autres produits.</p>
        </div>
      </div>
      <div className="opt-card-body-tight">
        <div className="opt-products-summary">
          <div><strong>{items.length}</strong><span>Produits visibles</span></div>
          <div><strong>{unitsAvailable}</strong><span>Unités disponibles</span></div>
          <div><strong>{categories.length}</strong><span>Catégories</span></div>
        </div>
        <section className="opt-products-categories" aria-label="Résumé par catégorie">
          <h4>Résumé des catégories</h4>
          {categoryCounts.length ? (
            <div className="opt-products-category-list">
              {categoryCounts.map(({ name, count }) => (
                <button
                  className={`opt-products-category-chip ${category === name ? "active" : ""}`}
                  key={name}
                  onClick={() => setCategory(category === name ? "all" : name)}
                  type="button"
                >
                  <strong>{name}</strong>
                  <span>{count} produit{count === 1 ? "" : "s"}</span>
                  <small>Vues — · Clics — · Favoris — · Commandes —</small>
                </button>
              ))}
            </div>
          ) : (
            <p className="muted">Aucune catégorie publiée pour le moment.</p>
          )}
        </section>
        <div className="opt-products-toolbar">
          <label className="opt-products-search">
            <IconSearch height={16} width={16} />
            <input
              aria-label="Rechercher dans la vitrine"
              placeholder="Rechercher une monture"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label className="opt-products-filter">
            <span>Catégorie</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="all">Toutes</option>
              {categories.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
        </div>
        <div className="opt-products-metrics-note" role="note">
          Les vues, clics, favoris et commandes ne sont pas encore suivis pour les produits de l’inventaire. Aucun chiffre n’est estimé.
        </div>
        {filteredItems.length ? (
          <div className="opt-products-showcase-grid">
            {filteredItems.map((item) => {
              const id = String(item.id ?? "");
              const available = Math.max(
                0,
                Number(item.quantite_disponible ?? 0) -
                  Number(item.quantite_reservee ?? 0),
              );
              return (
                <article className="opt-products-showcase-card" key={id}>
                  <div className="opt-products-showcase-image">
                    <StockImagePreview
                      className="opt-products-showcase-image-content"
                      item={item}
                      onReadFrameImage={onReadFrameImage}
                      size={180}
                    />
                    <span className="opt-products-showcase-badge">En vitrine</span>
                  </div>
                  <div className="opt-products-showcase-content">
                    <span className="opt-products-showcase-category">{stockCategory(item)}</span>
                    <h4>{stockTitle(item)}</h4>
                    <p>{stockReference(item)}{stockColor(item) !== "—" ? ` · ${stockColor(item)}` : ""}</p>
                    <div className="opt-products-showcase-footer">
                      <strong>{currency ? formatCurrency(item.prix_vente, currency) : String(item.prix_vente ?? "Prix non défini")}</strong>
                      <span>{available} disponible{available === 1 ? "" : "s"}</span>
                    </div>
                    <div className="opt-products-card-metrics" aria-label={`Statistiques de ${stockTitle(item)}`}>
                      <span>Vues <strong>—</strong></span>
                      <span>Clics <strong>—</strong></span>
                      <span>Favoris <strong>—</strong></span>
                      <span>Commandes <strong>—</strong></span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="opt-empty-state">
            <IconEyeglasses height={36} width={36} />
            <h4>{items.length ? "Aucun résultat" : "Votre vitrine est vide"}</h4>
            <p>{items.length ? "Essayez une autre recherche ou catégorie." : "Publiez une monture disponible pour la faire apparaître ici."}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StockEditModal({
  item,
  currency,
  onClose,
  onSave,
}: {
  item: Record<string, unknown>;
  currency: string;
  onClose: () => void;
  onSave: (id: string, input: Record<string, unknown>) => Promise<void>;
}) {
  const id = String(item.id ?? "");
  const [price, setPrice] = useState(
    item.prix_vente === null || item.prix_vente === undefined
      ? ""
      : String(item.prix_vente),
  );
  const [published, setPublished] = useState(item.est_publie === true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const validPrice = isPositivePriceInput(price);

  return (
    <div className="opt-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="stock-edit-title">
      <div className="opt-modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="opt-modal-header">
          <div>
            <h3 id="stock-edit-title">Modifier le produit</h3>
            <p className="opt-modal-sub">{stockTitle(item)}</p>
          </div>
          <button className="opt-modal-close" onClick={onClose} type="button" aria-label="Fermer">
            <IconX height={18} width={18} />
          </button>
        </div>
        <div className="opt-modal-body">
          {error && <p className="error-message" role="alert">{error}</p>}
          <label className="field">
            <span>Prix de vente{currency ? ` (${currency})` : ""}</span>
            <input
              type="number"
              min="0.001"
              step="0.001"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
          </label>
          <label className="checkbox-field">
            <input
              checked={published}
              onChange={(event) => setPublished(event.target.checked)}
              type="checkbox"
            />
            <span>Afficher ce produit aux clients</span>
          </label>
          {published && !validPrice && <p className="opt-products-hint">Saisissez un prix supérieur à zéro pour publier ce produit.</p>}
        </div>
        <div className="opt-modal-footer">
          <button className="button secondary" onClick={onClose} type="button">Annuler</button>
          <button
            className="button primary"
            disabled={saving || (published && !validPrice)}
            onClick={async () => {
              setSaving(true);
              setError("");
              try {
                await onSave(id, {
                  ...(price.trim() ? { prix_vente: Number(price) } : {}),
                  est_publie: published,
                });
              } catch (reason) {
                setError(reason instanceof Error ? reason.message : "Impossible d’enregistrer ce produit.");
              } finally {
                setSaving(false);
              }
            }}
            type="button"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StockPricePanel({
  items,
  currency,
  error,
  onUpdateStock,
}: {
  items: Array<Record<string, unknown>>;
  currency: string;
  error: string;
  onUpdateStock: (stockId: string, input: Record<string, unknown>) => Promise<void>;
}) {
  return (
    <div className="opt-card">
      <div className="opt-card-header">
        <div>
          <h3>Tarifs de l’inventaire</h3>
          <p className="opt-card-sub">Prix de vente par unité pour montures, verres et lentilles.</p>
        </div>
      </div>
      <div className="opt-card-body-tight">
        {error && <p className="error-message" role="alert">{error}</p>}
        {items.length ? (
          <div className="opt-table-wrap">
            <table className="opt-table">
              <thead>
                <tr>
                  <th>Article</th>
                  <th>Type</th>
                  <th>Prix actuel</th>
                  <th>Modifier le prix unitaire</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <StockPriceRow
                    key={String(item.id)}
                    item={item}
                    currency={currency}
                    onUpdateStock={onUpdateStock}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="opt-empty-state">
            <IconCatalog height={36} width={36} />
            <h4>Aucun article en inventaire</h4>
            <p>Ajoutez des montures, verres ou lentilles pour gérer leurs prix de vente.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StockPriceRow({
  item,
  currency,
  onUpdateStock,
}: {
  item: Record<string, unknown>;
  currency: string;
  onUpdateStock: (stockId: string, input: Record<string, unknown>) => Promise<void>;
}) {
  const id = String(item.id ?? "");
  const currentPrice = item.prix_vente;
  const currentPriceText =
    currentPrice === null || currentPrice === undefined ? "" : String(currentPrice);
  const [priceDraft, setPriceDraft] = useState({
    source: currentPriceText,
    value: currentPriceText,
  });
  const value =
    priceDraft.source === currentPriceText
      ? priceDraft.value
      : currentPriceText;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const valid = isPositivePriceInput(value);
  const unchanged =
    currentPrice !== null &&
    currentPrice !== undefined &&
    Number(currentPrice) === Number(value);
  const typeNames: Record<string, string> = {
    MONTURE: "Monture",
    VERRE_VUE: "Verre de vue",
    VERRE_SOLEIL: "Verre solaire",
    LENTILLE: "Lentille",
  };

  return (
    <tr>
      <td data-label="Article">
        <strong>{stockTitle(item)}</strong>
        <span className="opt-table-cell-sub">{stockReference(item)}</span>
      </td>
      <td data-label="Type">{typeNames[String(item.type_article)] ?? "Article"}</td>
      <td data-label="Prix actuel">
        {currentPrice === null || currentPrice === undefined
          ? "Aucun prix"
          : currency
            ? formatCurrency(currentPrice, currency)
            : String(currentPrice)}
      </td>
      <td data-label="Modifier le prix unitaire">
        <div className="opt-row-action-group">
          <input
            aria-label={`Prix unitaire de ${stockTitle(item)}`}
            type="number"
            min="0.001"
            step="0.001"
            value={value}
            onChange={(event) =>
              setPriceDraft({ source: currentPriceText, value: event.target.value })
            }
          />
          <button
            className="button primary small"
            type="button"
            disabled={!valid || unchanged || saving}
            onClick={async () => {
              setSaving(true);
              setError("");
              try {
                await onUpdateStock(id, { prix_vente: Number(value) });
              } catch (reason) {
                setError(reason instanceof Error ? reason.message : "Impossible d’enregistrer ce prix.");
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
        {error && <small className="error-message" role="alert">{error}</small>}
        {value && !valid && (
          <small className="error-message" role="alert">
            Montant positif requis, avec au plus trois décimales.
          </small>
        )}
      </td>
    </tr>
  );
}

function StockImagePreview({
  item,
  onReadFrameImage,
  size = 52,
  className,
}: {
  item: Record<string, unknown>;
  onReadFrameImage?: (imageId: string) => Promise<Blob>;
  size?: number;
  className?: string;
}) {
  const image = item.catalogueImage as Record<string, unknown> | null | undefined;
  const upload = item.frameImageUpload as Record<string, unknown> | null | undefined;
  const uploadId = typeof upload?.id === "string" ? upload.id : "";
  const [privateImage, setPrivateImage] = useState<{
    uploadId: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    if (!uploadId || !onReadFrameImage) return;
    let active = true;
    let objectUrl = "";
    onReadFrameImage(uploadId)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setPrivateImage({ uploadId, url: objectUrl });
      })
      .catch(() => {
        if (active) setPrivateImage(null);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [onReadFrameImage, uploadId]);

  const privateImageUrl =
    privateImage?.uploadId === uploadId ? privateImage.url : "";
  const imageUrl =
    typeof image?.imageUrl === "string"
      ? image.imageUrl
      : privateImageUrl || "/images/frame-placeholder.svg";

  return (
    <Image
      src={imageUrl}
      alt={`Image de ${stockTitle(item)}`}
      width={size}
      height={size}
      unoptimized
      className={className ?? "h-[52px] w-[52px] rounded-md bg-[#eee7dc] object-contain"}
    />
  );
}

function stockTitle(item: Record<string, unknown>): string {
  const product = item.catalogueProduct as Record<string, unknown> | null | undefined;
  const productModel = typeof product?.model === "string" ? product.model : "";
  const brand = typeof product?.brand === "string" ? product.brand : "";
  const reference = stockReference(item);
  return productModel || [brand, reference].filter(Boolean).join(" ") || "Article d’optique";
}

function stockReference(item: Record<string, unknown>): string {
  const product = item.catalogueProduct as Record<string, unknown> | null | undefined;
  const reference = typeof product?.reference === "string" ? product.reference : "";
  return typeof item.marque_reference === "string" ? item.marque_reference : reference;
}

function stockColor(item: Record<string, unknown>): string {
  const variant = item.catalogueVariant as Record<string, unknown> | null | undefined;
  return typeof variant?.colorName === "string" ? variant.colorName : "—";
}

function stockCategory(item: Record<string, unknown>): string {
  const product = item.catalogueProduct as Record<string, unknown> | null | undefined;
  const category = product?.productType ?? item.type_article;
  if (typeof category !== "string" || !category.trim()) return "Montures";
  const names: Record<string, string> = {
    MONTURE: "Montures",
    SUNGLASSES: "Lunettes de soleil",
    OPTICAL: "Lunettes de vue",
  };
  return names[category] ?? category.replaceAll("_", " ");
}

function isPublicStock(item: Record<string, unknown>): boolean {
  const available =
    Number(item.quantite_disponible ?? 0) - Number(item.quantite_reservee ?? 0);
  return (
    item.est_publie === true &&
    available > 0 &&
    isPositivePriceInput(String(item.prix_vente ?? ""))
  );
}

function isPositivePriceInput(value: string): boolean {
  if (!/^\d+(?:\.\d{1,3})?$/.test(value.trim())) return false;
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 && amount <= 999999999.999;
}
