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
  catalogData: unknown;
  listingsData: unknown;
  inventoryData: unknown;
  inventoryError?: string;
  currency?: string;
  onReadFrameImage?: (imageId: string) => Promise<Blob>;
  storeId?: string;
  resourceId?: string;
  onCreateListing: (input: Record<string, unknown>) => Promise<void>;
  onAddListingVariant: (listingId: string, input: Record<string, unknown>) => Promise<void>;
  onUpdateStock: (stockId: string, input: Record<string, unknown>) => Promise<void>;
}

export function OpticianProducts({
  catalogData,
  listingsData,
  inventoryData,
  inventoryError = "",
  currency = "",
  onReadFrameImage,
  onCreateListing,
  onAddListingVariant,
  onUpdateStock,
}: OpticianProductsProps) {
  const [activeMode, setActiveMode] = useState<"catalogue" | "prices" | "legacy">("catalogue");
  const [activeTab, setActiveTab] = useState<"listings" | "catalog">("listings");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal: Create Listing from catalog item
  const [createListingModal, setCreateListingModal] = useState<{
    productId: string;
    productName: string;
  } | null>(null);
  const [listingTitle, setListingTitle] = useState("");
  const [listingDesc, setListingDesc] = useState("");
  const [listingStatus, setListingStatus] = useState("BROUILLON");

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

  // Extract catalog items
  const rawCatalog = Array.isArray(catalogData)
    ? catalogData
    : (catalogData as Record<string, unknown>)?.data &&
      Array.isArray((catalogData as Record<string, unknown>).data)
      ? ((catalogData as Record<string, unknown>).data as Array<Record<string, unknown>>)
      : [];

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
  const validVariantPrice = isPositivePriceInput(variantPrice);

  return (
    <div className="opt-products-page">
      <div className="opt-card">
        <div className="opt-status-tabs" role="tablist" aria-label="Gestion des produits">
          <button
            className={`opt-tab-pill ${activeMode === "catalogue" ? "active" : ""}`}
            onClick={() => setActiveMode("catalogue")}
            type="button"
          >
            Catalogue · montures en stock ({frameStocks.length})
          </button>
          <button
            className={`opt-tab-pill ${activeMode === "prices" ? "active" : ""}`}
            onClick={() => setActiveMode("prices")}
            type="button"
          >
            Tarifs · tous les stocks ({rawInventory.length})
          </button>
          <button
            className={`opt-tab-pill ${activeMode === "legacy" ? "active" : ""}`}
            onClick={() => setActiveMode("legacy")}
            type="button"
          >
            Catalogue général
          </button>
        </div>
      </div>

      {activeMode === "catalogue" ? (
        <StockCataloguePanel
          items={frameStocks}
          error={inventoryError}
          currency={currency}
          onUpdateStock={onUpdateStock}
          onReadFrameImage={onReadFrameImage}
        />
      ) : activeMode === "prices" ? (
        <StockPricePanel
          items={rawInventory}
          currency={currency}
          error={inventoryError}
          onUpdateStock={onUpdateStock}
        />
      ) : (
      <>
      {/* Top Tab Switcher */}
      <div className="opt-card">
        <div className="opt-filter-bar">
          <div className="opt-status-tabs">
            <button
              className={`opt-tab-pill ${activeTab === "listings" ? "active" : ""}`}
              onClick={() => setActiveTab("listings")}
              type="button"
            >
              Annonces de ma boutique ({rawListings.length})
            </button>
            <button
              className={`opt-tab-pill ${activeTab === "catalog" ? "active" : ""}`}
              onClick={() => setActiveTab("catalog")}
              type="button"
            >
              Catalogue général Lunetty ({rawCatalog.length})
            </button>
          </div>

          <div className="opt-search-input-wrap">
            <IconSearch className="opt-search-icon" height={16} width={16} />
            <input
              className="opt-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher monture, marque, modèle…"
            />
          </div>
        </div>
      </div>

      {/* Tab 1: Store Listings */}
      {activeTab === "listings" && (
        <div className="opt-card">
          <div className="opt-card-header">
            <div>
              <h3>Annonces et tarifs de votre magasin</h3>
              <p className="opt-card-sub">Montures et verres proposés aux clients avec vos tarifs personnalisés</p>
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
                <h4>Aucune annonce active</h4>
                <p>Consultez le catalogue général pour sélectionner des montures et créer vos annonces boutique.</p>
                <button
                  className="button primary"
                  onClick={() => setActiveTab("catalog")}
                  type="button"
                >
                  Parcourir le catalogue
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Global Master Catalog */}
      {activeTab === "catalog" && (
        <div className="opt-card">
          <div className="opt-card-header">
            <div>
              <h3>Catalogue général des montures & verres</h3>
              <p className="opt-card-sub">Base de données de modèles approuvés. Ajoutez-les en un clic à vos rayons.</p>
            </div>
          </div>

          <div className="opt-card-body-tight">
            {rawCatalog.length > 0 ? (
              <div className="opt-catalog-grid">
                {rawCatalog.map((prod) => {
                  const id = String(prod.id);
                  const name = String(prod.nom || prod.titre || "Monture optique");
                  const brand = String(prod.marque || "Lunetty Collection");
                  const ref = String(prod.reference || prod.sku || id.slice(0, 8));

                  return (
                    <div key={id} className="opt-catalog-item-card">
                      <div className="opt-catalog-item-badge">
                        <IconEyeglasses height={20} width={20} />
                      </div>
                      <div className="opt-catalog-item-info">
                        <span className="opt-brand-tag">{brand}</span>
                        <h4 className="opt-prod-name">{name}</h4>
                        <span className="opt-prod-ref">Réf: {ref}</span>
                      </div>
                      <div className="opt-catalog-item-action">
                        <button
                          className="button primary small full-width"
                          onClick={() => {
                            setCreateListingModal({ productId: id, productName: name });
                            setListingTitle(name);
                            setListingDesc("");
                            setListingStatus("BROUILLON");
                          }}
                          type="button"
                        >
                          <IconPlus height={14} width={14} /> Mettre en rayon
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="opt-empty-state">
                <IconCatalog height={36} width={36} />
                <h4>Catalogue en cours de synchronisation</h4>
                <p>Aucun produit maître n&apos;est actuellement chargé.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Create Listing */}
      {createListingModal && (
        <div className="opt-modal-overlay" onClick={() => setCreateListingModal(null)} role="dialog" aria-modal="true">
          <div className="opt-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="opt-modal-header">
              <div className="opt-modal-title-wrap">
                <div className="opt-icon-bubble">
                  <IconPlus height={18} width={18} />
                </div>
                <div>
                  <h3>Créer une annonce boutique</h3>
                  <p className="opt-modal-sub">{createListingModal.productName}</p>
                </div>
              </div>
              <button className="opt-modal-close" onClick={() => setCreateListingModal(null)} type="button">
                <IconX height={18} width={18} />
              </button>
            </div>

            <div className="opt-modal-body">
              <div className="field">
                <span>Titre affiché dans votre boutique</span>
                <input
                  value={listingTitle}
                  onChange={(e) => setListingTitle(e.target.value)}
                  placeholder="Ex: Monture solaire aviateur polarisée"
                  required
                />
              </div>

              <div className="field">
                <span>Description ou caractéristiques en magasin</span>
                <textarea
                  value={listingDesc}
                  onChange={(e) => setListingDesc(e.target.value)}
                  placeholder="Ex: Monture légère en titane, verres anti-reflets premium."
                  rows={3}
                />
              </div>

              <div className="field">
                <span>Statut de visibilité</span>
                <select value={listingStatus} onChange={(e) => setListingStatus(e.target.value)}>
                  <option value="BROUILLON">Brouillon interne</option>
                  <option value="ACTIVE">Active (visible par les clients)</option>
                  <option value="EN_PAUSE">En pause</option>
                </select>
              </div>
            </div>

            <div className="opt-modal-footer">
              <button className="button secondary" onClick={() => setCreateListingModal(null)} type="button">
                Annuler
              </button>
              <button
                className="button primary"
                disabled={submitting}
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    await onCreateListing({
                      produit_id: createListingModal.productId,
                      titre_personnalise: listingTitle,
                      description_personnalisee: listingDesc,
                      statut: listingStatus,
                    });
                    setCreateListingModal(null);
                    setActiveTab("listings");
                  } finally {
                    setSubmitting(false);
                  }
                }}
                type="button"
              >
                {submitting ? "Création…" : "Créer l'annonce"}
              </button>
            </div>
          </div>
        </div>
      )}

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
  onReadFrameImage,
}: {
  items: Array<Record<string, unknown>>;
  error: string;
  currency: string;
  onUpdateStock: (stockId: string, input: Record<string, unknown>) => Promise<void>;
  onReadFrameImage?: (imageId: string) => Promise<Blob>;
}) {
  const [savingId, setSavingId] = useState("");
  const [saveError, setSaveError] = useState("");

  return (
    <div className="opt-card">
      <div className="opt-card-header">
        <div>
          <h3>Montures de l’inventaire</h3>
          <p className="opt-card-sub">La visibilité publique est indépendante du stock physique.</p>
        </div>
      </div>
      <div className="opt-card-body-tight">
        {(error || saveError) && <p className="error-message" role="alert">{saveError || error}</p>}
        {items.length ? (
          <div className="opt-table-wrap">
            <table className="opt-table">
              <thead>
                <tr>
                  <th>Monture</th>
                  <th>Coloris</th>
                  <th>Stock disponible</th>
                  <th>Prix unitaire</th>
                  <th>Visibilité client</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const id = String(item.id ?? "");
                  const available = Math.max(
                    0,
                    Number(item.quantite_disponible ?? 0) -
                      Number(item.quantite_reservee ?? 0),
                  );
                  const price = item.prix_vente;
                  const published = item.est_publie === true;
                  const canPublish =
                    typeof price === "number" ||
                    (typeof price === "string" && Number(price) > 0);

                  return (
                    <tr key={id}>
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="opt-empty-state">
            <IconEyeglasses height={36} width={36} />
            <h4>Aucune monture en stock</h4>
            <p>Les montures ajoutées dans l’inventaire apparaîtront ici. Elles restent masquées tant qu’elles ne sont pas publiées.</p>
          </div>
        )}
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
  const [value, setValue] = useState(
    currentPrice === null || currentPrice === undefined ? "" : String(currentPrice),
  );
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

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setValue(
        currentPrice === null || currentPrice === undefined ? "" : String(currentPrice),
      );
    });
    return () => window.cancelAnimationFrame(frame);
  }, [currentPrice]);

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
            onChange={(event) => setValue(event.target.value)}
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
}: {
  item: Record<string, unknown>;
  onReadFrameImage?: (imageId: string) => Promise<Blob>;
}) {
  const image = item.catalogueImage as Record<string, unknown> | null | undefined;
  const upload = item.frameImageUpload as Record<string, unknown> | null | undefined;
  const uploadId = typeof upload?.id === "string" ? upload.id : "";
  const [privateImageUrl, setPrivateImageUrl] = useState("");

  useEffect(() => {
    if (!uploadId || !onReadFrameImage) {
      const frame = window.requestAnimationFrame(() => setPrivateImageUrl(""));
      return () => window.cancelAnimationFrame(frame);
    }
    let active = true;
    let objectUrl = "";
    onReadFrameImage(uploadId)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setPrivateImageUrl(objectUrl);
      })
      .catch(() => {
        if (active) setPrivateImageUrl("");
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [onReadFrameImage, uploadId]);

  const imageUrl =
    typeof image?.imageUrl === "string"
      ? image.imageUrl
      : privateImageUrl || "/images/frame-placeholder.svg";

  return (
    <Image
      src={imageUrl}
      alt={`Image de ${stockTitle(item)}`}
      width={52}
      height={52}
      unoptimized
      className="h-[52px] w-[52px] rounded-md bg-[#eee7dc] object-contain"
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

function isPositivePriceInput(value: string): boolean {
  if (!/^\d+(?:\.\d{1,3})?$/.test(value.trim())) return false;
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 && amount <= 999999999.999;
}
