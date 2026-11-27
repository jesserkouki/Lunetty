"use client";

import { useState } from "react";
import {
  IconLocations,
  IconPlus,
  IconCheck,
  IconSearch,
  IconX,
} from "../ui/Icons";
import type { JsonRecord } from "../../../services/api";
import type { Page } from "../../../services/users.service";

interface OpticianLocationsProps {
  locationsData: unknown;
  locationTypesData: unknown;
  storeId?: string;
  onCreateLocations: (inputs: Record<string, unknown>[]) => Promise<void>;
  onCreateLocationType: (input: Record<string, unknown>) => Promise<unknown>;
  onUpdateLocation: (locationId: string, input: Record<string, unknown>) => Promise<void>;
  onDeleteLocation: (locationId: string) => Promise<void>;
  onLoadLocationStock: (
    locationId: string,
    page: number,
  ) => Promise<Page<JsonRecord>>;
}

export function OpticianLocations({
  locationsData,
  locationTypesData,
  onCreateLocations,
  onCreateLocationType,
  onUpdateLocation,
  onDeleteLocation,
  onLoadLocationStock,
}: OpticianLocationsProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [locationDrafts, setLocationDrafts] = useState([{ nom: "", code: "" }]);
  const [locType, setLocType] = useState("standard:STORE");
  const [locDefault, setLocDefault] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [typeOverrides, setTypeOverrides] = useState<Array<Record<string, unknown>>>([]);
  const [showNewTypeForm, setShowNewTypeForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [typeError, setTypeError] = useState("");

  const [editModal, setEditModal] = useState<{
    id: string;
    nom: string;
    code: string;
    est_actif: boolean;
  } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [creatingType, setCreatingType] = useState(false);
  const [deletingLocationId, setDeletingLocationId] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [locationTypeFilter, setLocationTypeFilter] = useState("all");
  const [stockLocation, setStockLocation] = useState<{ id: string; name: string } | null>(null);
  const [locationStock, setLocationStock] = useState<Page<JsonRecord> | null>(null);
  const [locationStockPage, setLocationStockPage] = useState(1);
  const [loadingLocationStock, setLoadingLocationStock] = useState(false);
  const [locationStockError, setLocationStockError] = useState("");

  const rawLocations = Array.isArray(locationsData)
    ? (locationsData as Array<Record<string, unknown>>)
    : [];
  const rawLocationTypes = Array.isArray(locationTypesData)
    ? (locationTypesData as Array<Record<string, unknown>>)
    : [];
  const locationTypes = [
    ...rawLocationTypes,
    ...typeOverrides.filter(
      (override) => !rawLocationTypes.some((type) => type.id === override.id),
    ),
  ].filter((type) => type.est_actif !== false);
  const locationTypeOptions = [
    { value: "standard:STORE", label: "Boutique" },
    { value: "standard:ENTREPOT", label: "Entrepôt" },
    { value: "standard:AUTRE", label: "Autre" },
    ...locationTypes.map((type) => ({
      value: `custom:${String(type.id)}`,
      label: String(type.nom),
    })),
  ];
  const filteredLocations = rawLocations.filter((location) => {
    if (
      locationTypeFilter !== "all" &&
      locationTypeValue(location) !== locationTypeFilter
    ) {
      return false;
    }
    const query = locationSearch.trim().toLocaleLowerCase("fr");
    if (!query) return true;
    return [
      String(location.nom ?? ""),
      String(location.code ?? ""),
      locationTypeLabel(location),
    ]
      .join(" ")
      .toLocaleLowerCase("fr")
      .includes(query);
  });
  const canCreateNames =
    locationDrafts.length >= 1 &&
    locationDrafts.length <= 50 &&
    locationDrafts.every(
      (location) =>
        Boolean(location.nom.trim()) &&
        location.nom.trim().length <= 120 &&
        location.code.trim().length <= 40,
    );
  const canCreateLocations =
    canCreateNames && !submitting;

  const resetCreateForm = () => {
    setLocationDrafts([{ nom: "", code: "" }]);
    setLocType("standard:STORE");
    setLocDefault(false);
    setFormError("");
    setTypeError("");
    setShowNewTypeForm(false);
    setNewTypeName("");
  };

  const typeInput = (value: string) =>
    value.startsWith("custom:")
      ? { type_personnalise_id: value.slice("custom:".length) }
      : { type: value.slice("standard:".length), type_personnalise_id: null };

  async function loadLocationStock(locationId: string, page: number) {
    setLoadingLocationStock(true);
    setLocationStock(null);
    setLocationStockError("");
    try {
      const result = await onLoadLocationStock(locationId, page);
      setLocationStock(result);
      setLocationStockPage(page);
    } catch (reason) {
      setLocationStockError(
        reason instanceof Error
          ? reason.message
          : "Impossible de charger les produits de cet emplacement.",
      );
    } finally {
      setLoadingLocationStock(false);
    }
  }

  function inspectLocationStock(location: Record<string, unknown>) {
    const id = String(location.id ?? "");
    setStockLocation({ id, name: String(location.nom ?? "Emplacement") });
    setLocationStock(null);
    setLocationStockPage(1);
    void loadLocationStock(id, 1);
  }

  return (
    <div className="opt-locations-page">
      <div className="opt-card">
        <div className="opt-card-header">
          <div>
            <h3>Emplacements et dépôts de stockage ({rawLocations.length})</h3>
            <p className="opt-card-sub">Boutique physique, ateliers de montage et entrepôts de réserve</p>
          </div>
          <button
            className="button primary"
            onClick={() => {
              resetCreateForm();
              setCreateModalOpen(true);
            }}
            type="button"
          >
            <IconPlus height={16} width={16} /> Nouvel emplacement
          </button>
        </div>

        <div className="opt-card-body-tight">
          {deleteError && (
            <p className="error-message" role="alert">
              {deleteError}
            </p>
          )}
          {rawLocations.length > 0 && (
            <div className="opt-locations-toolbar">
              <label className="opt-locations-search">
                <IconSearch height={16} width={16} />
                <input
                  aria-label="Rechercher un emplacement"
                  placeholder="Rechercher par nom, code ou type"
                  value={locationSearch}
                  onChange={(event) => setLocationSearch(event.target.value)}
                />
              </label>
              <label className="opt-locations-type-filter">
                <span>Type</span>
                <select
                  value={locationTypeFilter}
                  onChange={(event) => setLocationTypeFilter(event.target.value)}
                >
                  <option value="all">Tous les types</option>
                  {locationTypeOptions.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          {rawLocations.length > 0 ? (
            filteredLocations.length ? (
              <div className="opt-location-grid">
              {filteredLocations.map((loc) => {
                const id = String(loc.id);
                const isDefault = Boolean(loc.est_par_defaut);
                const isActive = loc.est_actif !== false;

                return (
                  <div key={id} className="opt-location-card">
                    <div className="opt-loc-top">
                      <div className="opt-loc-icon">
                        <IconLocations height={22} width={22} />
                      </div>
                      <div className="opt-loc-meta">
                        <h4>{String(loc.nom)}</h4>
                        <span className="opt-loc-code">Code: {String(loc.code || "—")} • Type: {locationTypeLabel(loc)}</span>
                      </div>
                    </div>

                    <div className="opt-loc-badges">
                      {isDefault && (
                        <span className="opt-status-pill badge-gold">
                          <IconCheck height={12} width={12} /> Emplacement principal
                        </span>
                      )}
                      <span className={`opt-status-pill ${isActive ? "badge-emerald" : "badge-rose"}`}>
                        {isActive ? "Actif" : "Désactivé"}
                      </span>
                    </div>

                    <div className="opt-loc-actions">
                      <button
                        className="button primary small"
                        type="button"
                        onClick={() => inspectLocationStock(loc)}
                      >
                        Voir les produits
                      </button>
                      <button
                        className="button secondary small"
                        onClick={() => setEditModal({
                          id,
                          nom: String(loc.nom || ""),
                          code: String(loc.code || ""),
                          est_actif: isActive,
                        })}
                        type="button"
                      >
                        Modifier l&apos;emplacement
                      </button>
                      <button
                        className="button danger small"
                        disabled={deletingLocationId === id}
                        onClick={async () => {
                          if (!window.confirm(
                            `Supprimer définitivement l’emplacement « ${String(loc.nom)} » ? Un emplacement contenant du stock ne pourra pas être supprimé.`,
                          )) return;
                          setDeletingLocationId(id);
                          setDeleteError("");
                          try {
                            await onDeleteLocation(id);
                          } catch (reason) {
                            setDeleteError(
                              reason instanceof Error
                                ? reason.message
                                : "La suppression de l’emplacement a échoué.",
                            );
                          } finally {
                            setDeletingLocationId("");
                          }
                        }}
                        type="button"
                      >
                        {deletingLocationId === id ? "Suppression…" : "Supprimer"}
                      </button>
                    </div>
                  </div>
                );
              })}
              </div>
            ) : (
              <div className="opt-empty-state">
                <IconSearch height={32} width={32} />
                <h4>Aucun emplacement trouvé</h4>
                <p>Essayez un autre nom, code ou type.</p>
              </div>
            )
          ) : (
            <div className="opt-empty-state">
              <IconLocations height={36} width={36} />
              <h4>Aucun emplacement configuré</h4>
              <p>Créez votre premier emplacement (ex: Magasin principal) pour gérer votre inventaire.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Location */}
      {createModalOpen && (
        <div className="opt-modal-overlay" onClick={() => setCreateModalOpen(false)} role="dialog" aria-modal="true">
          <div className="opt-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="opt-modal-header">
              <div className="opt-modal-title-wrap">
                <div className="opt-icon-bubble">
                  <IconPlus height={18} width={18} />
                </div>
                <div>
                  <h3>Créer un emplacement de stock</h3>
                  <p className="opt-modal-sub">Définir un nouveau point de stockage physique</p>
                </div>
              </div>
              <button className="opt-modal-close" onClick={() => setCreateModalOpen(false)} type="button">
                <IconX height={18} width={18} />
              </button>
            </div>

            <div className="opt-modal-body" data-lenis-prevent>
              <div className="field">
                <span>Type d&apos;emplacement</span>
                <div className="inventory-location-select">
                  <select
                    value={locType}
                    onChange={(event) => setLocType(event.target.value)}
                  >
                    <option value="standard:STORE">Boutique</option>
                    <option value="standard:ENTREPOT">Entrepôt</option>
                    <option value="standard:AUTRE">Autre</option>
                    {locationTypes.map((type) => (
                      <option key={String(type.id)} value={`custom:${String(type.id)}`}>
                        {String(type.nom)}
                      </option>
                    ))}
                  </select>
                  <button
                    className="button secondary inventory-add-location"
                    type="button"
                    aria-label="Ajouter un type d’emplacement"
                    title="Ajouter un type d’emplacement"
                    onClick={() => {
                      setShowNewTypeForm((shown) => !shown);
                      setTypeError("");
                    }}
                  >
                    <IconPlus height={16} width={16} />
                  </button>
                </div>
                {showNewTypeForm && (
                  <div className="inventory-location-type-create">
                    <input
                      aria-label="Nom du nouveau type d’emplacement"
                      value={newTypeName}
                      maxLength={80}
                      onChange={(event) => {
                        setNewTypeName(event.target.value);
                        setTypeError("");
                      }}
                      placeholder="Ex. : Vitrine"
                    />
                    <button
                      className="button secondary"
                      type="button"
                      disabled={creatingType || !newTypeName.trim()}
                      onClick={async () => {
                        setCreatingType(true);
                        setTypeError("");
                        try {
                          const created = await onCreateLocationType({
                            nom: newTypeName.trim(),
                          });
                          if (!isRecord(created) || typeof created.id !== "string") {
                            throw new Error("Le type créé n’a pas été retourné par le serveur.");
                          }
                          setTypeOverrides((current) => [
                            ...current.filter((type) => type.id !== created.id),
                            created,
                          ]);
                          setLocType(`custom:${created.id}`);
                          setNewTypeName("");
                          setShowNewTypeForm(false);
                        } catch (reason) {
                          setTypeError(
                            reason instanceof Error
                              ? reason.message
                              : "Impossible de créer ce type.",
                          );
                        } finally {
                          setCreatingType(false);
                        }

                      }}
                    >
                      {creatingType ? "Création…" : "Créer le type"}
                    </button>
                    {typeError && <p className="error-message" role="alert">{typeError}</p>}
                  </div>
                )}
              </div>

              <div className="field">
                <span>Nom des emplacements</span>
                <small>Chaque emplacement peut avoir son propre nom et son propre code.</small>
                <div className="location-batch-list">
                  {locationDrafts.map((location, index) => (
                    <div className="location-batch-row" key={index}>
                      <label className="field">
                        <span>Nom {index + 1} *</span>
                        <input
                          value={location.nom}
                          onChange={(event) => {
                            const nom = event.target.value;
                            setLocationDrafts((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, nom } : item,
                              ),
                            );
                            setFormError("");
                          }}
                          placeholder={`Ex. : Emplacement ${index + 1}`}
                          maxLength={120}
                          required
                          aria-invalid={
                            (locationDrafts.length > 1 || Boolean(formError)) &&
                            !location.nom.trim()
                          }
                        />
                        {(locationDrafts.length > 1 || formError) &&
                          !location.nom.trim() && (
                          <small className="error-message" role="alert">
                            Le nom est obligatoire.
                          </small>
                          )}
                      </label>
                      <label className="field">
                        <span>Code (facultatif)</span>
                        <input
                          value={location.code}
                          onChange={(event) => {
                            const code = event.target.value;
                            setLocationDrafts((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, code } : item,
                              ),
                            );
                            setFormError("");
                          }}
                          placeholder="Ex. : MAG-01"
                          maxLength={40}
                          aria-invalid={location.code.trim().length > 40}
                        />
                      </label>
                      {locationDrafts.length > 1 && (
                        <button
                          className="button secondary location-batch-remove"
                          type="button"
                          aria-label={`Supprimer le champ emplacement ${index + 1}`}
                          title="Supprimer cet emplacement"
                          onClick={() => {
                            setLocationDrafts((current) =>
                              current.filter((_, itemIndex) => itemIndex !== index),
                            );
                            setFormError("");
                          }}
                        >
                          <IconX height={16} width={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  className="button secondary location-batch-add"
                  type="button"
                  disabled={locationDrafts.length >= 50}
                  onClick={() => {
                    setLocationDrafts((current) => [
                      ...current,
                      { nom: "", code: "" },
                    ]);
                    setFormError("");
                  }}
                >
                  <IconPlus height={16} width={16} />
                  Ajouter un emplacement
                </button>
                {locationDrafts.length >= 50 && (
                  <small>Maximum 50 emplacements par création.</small>
                )}
              </div>

              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={locDefault}
                  onChange={(e) => setLocDefault(e.target.checked)}
                />
                <span>Définir comme emplacement par défaut pour les réceptions</span>
              </label>
              {locDefault && locationDrafts.length > 1 && (
                <small>Le premier emplacement de la liste sera défini comme emplacement par défaut.</small>
              )}
              {formError && <p className="error-message" role="alert">{formError}</p>}
            </div>

            <div className="opt-modal-footer">
              <button className="button secondary" onClick={() => setCreateModalOpen(false)} type="button">
                Annuler
              </button>
              <button
                className="button primary"
                disabled={!canCreateLocations}
                onClick={async () => {
                  setSubmitting(true);
                  setFormError("");
                  try {
                    const type = typeInput(locType);
                    const inputs = locationDrafts.map((location, index) => ({
                      nom: location.nom.trim(),
                      ...(location.code.trim()
                        ? { code: location.code.trim() }
                        : {}),
                      ...type,
                      est_par_defaut: locDefault && index === 0,
                    }));
                    await onCreateLocations(inputs);
                    setCreateModalOpen(false);
                    resetCreateForm();
                  } catch (reason) {
                    setFormError(
                      reason instanceof Error
                        ? reason.message
                        : "Impossible de créer les emplacements.",
                    );
                  } finally {
                    setSubmitting(false);
                  }
                }}
                type="button"
              >
                {submitting
                  ? "Création…"
                  : locationDrafts.length > 1
                    ? `Créer ${locationDrafts.length} emplacements`
                    : "Créer l’emplacement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Location */}
      {editModal && (
        <div className="opt-modal-overlay" onClick={() => setEditModal(null)} role="dialog" aria-modal="true">
          <div className="opt-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="opt-modal-header">
              <div className="opt-modal-title-wrap">
                <div className="opt-icon-bubble">
                  <IconLocations height={18} width={18} />
                </div>
                <div>
                  <h3>Modifier l&apos;emplacement</h3>
                  <p className="opt-modal-sub">{editModal.nom}</p>
                </div>
              </div>
              <button className="opt-modal-close" onClick={() => setEditModal(null)} type="button">
                <IconX height={18} width={18} />
              </button>
            </div>

            <div className="opt-modal-body">
              <div className="field">
                <span>Nom de l&apos;emplacement</span>
                <input
                  value={editModal.nom}
                  onChange={(e) => setEditModal({ ...editModal, nom: e.target.value })}
                />
              </div>

              <div className="field">
                <span>Code interne</span>
                <input
                  value={editModal.code}
                  onChange={(e) => setEditModal({ ...editModal, code: e.target.value })}
                />
              </div>

              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={editModal.est_actif}
                  onChange={(e) => setEditModal({ ...editModal, est_actif: e.target.checked })}
                />
                <span>Emplacement actif</span>
              </label>
            </div>

            <div className="opt-modal-footer">
              <button className="button secondary" onClick={() => setEditModal(null)} type="button">
                Annuler
              </button>
              <button
                className="button primary"
                disabled={submitting}
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    await onUpdateLocation(editModal.id, {
                      nom: editModal.nom,
                      code: editModal.code || undefined,
                      est_actif: editModal.est_actif,
                    });
                    setEditModal(null);
                  } finally {
                    setSubmitting(false);
                  }
                }}
                type="button"
              >
                {submitting ? "Mise à jour…" : "Sauvegarder"}
              </button>
            </div>
          </div>
        </div>
      )}

      {stockLocation && (
        <div
          className="opt-modal-overlay"
          onClick={() => setStockLocation(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="location-stock-title"
        >
          <div
            className="opt-modal-card opt-location-stock-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="opt-modal-header">
              <div>
                <h3 id="location-stock-title">Produits de {stockLocation.name}</h3>
                <p className="opt-modal-sub">Articles actuellement affectés à cet emplacement.</p>
              </div>
              <button
                className="opt-modal-close"
                onClick={() => setStockLocation(null)}
                type="button"
                aria-label="Fermer"
              >
                <IconX height={18} width={18} />
              </button>
            </div>
            <div className="opt-modal-body" data-lenis-prevent>
              {loadingLocationStock && <p role="status">Chargement des produits…</p>}
              {locationStockError && <p className="error-message" role="alert">{locationStockError}</p>}
              {!loadingLocationStock && locationStock && (
                locationStock.data.length ? (
                  <div className="opt-location-stock-list">
                    {locationStock.data.map((item) => {
                      const onHand = Number(item.quantite_disponible ?? 0);
                      const reserved = Number(item.quantite_reservee ?? 0);
                      return (
                        <article className="opt-location-stock-item" key={String(item.id)}>
                          <div>
                            <strong>{locationStockTitle(item)}</strong>
                            <span>{locationStockType(item)} · Réf. {String(item.marque_reference || "—")}</span>
                          </div>
                          <div className="opt-location-stock-quantity">
                            <span>{Math.max(0, onHand - reserved)} disponible(s)</span>
                            <small>{onHand} en stock · {reserved} réservé(s)</small>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="opt-empty-state">
                    <IconLocations height={32} width={32} />
                    <h4>Aucun produit dans cet emplacement</h4>
                    <p>Les articles que vous y affecterez apparaîtront ici.</p>
                  </div>
                )
              )}
            </div>
            {locationStock && locationStock.meta.totalPages > 1 && (
              <div className="opt-location-stock-pagination">
                <button
                  className="button secondary small"
                  type="button"
                  disabled={loadingLocationStock || locationStockPage <= 1}
                  onClick={() => void loadLocationStock(stockLocation.id, locationStockPage - 1)}
                >
                  Précédent
                </button>
                <span>Page {locationStock.meta.page} sur {locationStock.meta.totalPages}</span>
                <button
                  className="button secondary small"
                  type="button"
                  disabled={loadingLocationStock || locationStockPage >= locationStock.meta.totalPages}
                  onClick={() => void loadLocationStock(stockLocation.id, locationStockPage + 1)}
                >
                  Suivant
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function locationTypeValue(location: Record<string, unknown>): string {
  const customTypeId = location.type_personnalise_id;
  if (typeof customTypeId === "string" && customTypeId) {
    return `custom:${customTypeId}`;
  }
  return `standard:${String(location.type ?? "AUTRE")}`;
}

function locationTypeLabel(location: Record<string, unknown>): string {
  const customType = location.type_personnalise;
  if (isRecord(customType) && typeof customType.nom === "string") {
    return customType.nom;
  }
  const names: Record<string, string> = {
    STORE: "Boutique",
    ENTREPOT: "Entrepôt",
    AUTRE: "Autre",
  };
  const type = String(location.type ?? "");
  return names[type] ?? type.replaceAll("_", " ");
}

function locationStockTitle(item: JsonRecord): string {
  const product = isRecord(item.catalogueProduct) ? item.catalogueProduct : {};
  const listingVariant = isRecord(item.variante_annonce) ? item.variante_annonce : {};
  const listing = isRecord(listingVariant.annonce) ? listingVariant.annonce : {};
  const listingProduct = isRecord(listing.produit) ? listing.produit : {};
  const title =
    product.model ??
    listingProduct.nom ??
    item.marque_reference ??
    (item.type_article === "VERRE_VUE"
      ? "Verre de vue"
      : item.type_article === "VERRE_SOLEIL"
        ? "Verre solaire"
        : item.type_article === "LENTILLE"
          ? "Lentille"
          : "Monture");
  return String(title);
}

function locationStockType(item: JsonRecord): string {
  const names: Record<string, string> = {
    MONTURE: "Monture",
    VERRE_VUE: "Verre de vue",
    VERRE_SOLEIL: "Verre solaire",
    LENTILLE: "Lentille",
  };
  const type = String(item.type_article ?? "");
  return names[type] ?? "Article";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
