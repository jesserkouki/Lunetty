"use client";

import Image from "next/image";
import {
  Archive,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Edit2,
  Eye,
  ImagePlus,
  LoaderCircle,
  PackagePlus,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  catalogueAdminService,
  type CatalogueImage,
  type CatalogueProduct,
  type CatalogueProductType,
  type CatalogueSummary,
  type CatalogueVariant,
} from "@/services/catalogue-admin.service";
import { ApiError } from "@/services/api";

type ProductDraft = {
  id?: string;
  brand: string;
  reference: string;
  model: string;
  productType: CatalogueProductType;
};

type VariantDraft = {
  productId: string;
  id?: string;
  colorCode: string;
  colorName: string;
  ean: string;
};

type ImageDraft = {
  productId: string;
  variants: CatalogueVariant[];
  id?: string;
  variantId: string;
  imageUrl: string;
  storageKey: string;
  imageSource: string;
  sourceUrl: string;
  licenseInformation: string;
  isPrimary: boolean;
};

const productTypes: Array<[CatalogueProductType, string]> = [
  ["MONTURE", "Monture"],
  ["VERRE", "Verre"],
  ["LENTILLE_CONTACT", "Lentille de contact"],
  ["ACCESSOIRE", "Accessoire"],
];

export function AdminSharedCatalogue() {
  const [summary, setSummary] = useState<CatalogueSummary | null>(null);
  const [products, setProducts] = useState<CatalogueProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [detail, setDetail] = useState<CatalogueProduct | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [productDraft, setProductDraft] = useState<ProductDraft | null>(null);
  const [variantDraft, setVariantDraft] = useState<VariantDraft | null>(null);
  const [imageDraft, setImageDraft] = useState<ImageDraft | null>(null);

  const requestCatalogueData = useCallback(async () => {
      const active =
        activeFilter === "" ? undefined : activeFilter === "active";
      const [nextSummary, result] = await Promise.all([
        catalogueAdminService.summary(),
        catalogueAdminService.products({
          q: query || undefined,
          page,
          limit: 20,
          productType: (typeFilter || undefined) as
            | CatalogueProductType
            | undefined,
          isActive: active,
        }),
      ]);
      return { nextSummary, result };
  }, [activeFilter, page, query, typeFilter]);

  const applyCatalogueData = useCallback(
    (nextSummary: CatalogueSummary, result: Awaited<ReturnType<typeof catalogueAdminService.products>>) => {
      setSummary(nextSummary);
      setProducts(result.data);
      setTotal(result.meta.total);
      setTotalPages(Math.max(result.meta.totalPages, 1));
    },
    [],
  );

  useEffect(() => {
    let active = true;
    requestCatalogueData()
      .then(({ nextSummary, result }) => {
        if (active) applyCatalogueData(nextSummary, result);
      })
      .catch((reason: unknown) => {
        if (active) setError(errorMessage(reason));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applyCatalogueData, requestCatalogueData]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { nextSummary, result } = await requestCatalogueData();
      applyCatalogueData(nextSummary, result);
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setLoading(false);
    }
  }, [applyCatalogueData, requestCatalogueData]);

  const loadDetail = async (id: string) => {
    setDetailLoading(true);
    setDetail(null);
    setError("");
    try {
      setDetail(await catalogueAdminService.product(id));
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setDetailLoading(false);
    }
  };

  const runMutation = async (
    action: () => Promise<unknown>,
    successMessage: string,
    detailProductId?: string,
  ): Promise<boolean> => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await action();
      await refresh();
      if (detailProductId) await loadDetail(detailProductId);
      setNotice(successMessage);
      return true;
    } catch (reason) {
      setError(errorMessage(reason));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setPage(1);
    setQuery(searchText.trim());
  };

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!productDraft) return;
    const draft = productDraft;
    const saved = await runMutation(
      async () => {
        if (draft.id) {
          await catalogueAdminService.updateProduct(draft.id, {
            brand: draft.brand.trim(),
            reference: draft.reference.trim(),
            model: draft.model.trim() || null,
            productType: draft.productType,
          });
        } else {
          await catalogueAdminService.createProduct({
            brand: draft.brand.trim(),
            reference: draft.reference.trim(),
            model: draft.model.trim() || undefined,
            productType: draft.productType,
          });
        }
      },
      draft.id ? "Product updated." : "Product created.",
      draft.id,
    );
    if (saved) setProductDraft(null);
  };

  const saveVariant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!variantDraft) return;
    const draft = variantDraft;
    const payload = {
      colorCode: draft.colorCode.trim() || null,
      colorName: draft.colorName.trim() || null,
      ean: draft.ean.trim() || null,
    };
    const saved = await runMutation(
      () =>
        draft.id
          ? catalogueAdminService.updateVariant(
              draft.productId,
              draft.id,
              payload,
            )
          : catalogueAdminService.createVariant(draft.productId, payload),
      draft.id ? "Variant updated." : "Variant added.",
      draft.productId,
    );
    if (saved) setVariantDraft(null);
  };

  const saveImage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!imageDraft) return;
    const draft = imageDraft;
    const payload = {
      imageUrl: draft.imageUrl.trim(),
      storageKey: draft.storageKey.trim() || null,
      imageSource: draft.imageSource.trim(),
      sourceUrl: draft.sourceUrl.trim() || null,
      licenseInformation: draft.licenseInformation.trim() || null,
      variantId: draft.variantId || null,
      isPrimary: draft.isPrimary,
    };
    const saved = await runMutation(
      () =>
        draft.id
          ? catalogueAdminService.updateImage(draft.id, payload)
          : catalogueAdminService.createImage(draft.productId, payload),
      draft.id ? "Image details updated." : "Image added; verification is still required.",
      draft.productId,
    );
    if (saved) setImageDraft(null);
  };

  const toggleProduct = async (product: CatalogueProduct) => {
    const action = product.isActive ? "deactivate" : "activate";
    if (!window.confirm(`Are you sure you want to ${action} ${product.brand} ${product.reference}?`)) {
      return;
    }
    await runMutation(
      () =>
        catalogueAdminService.updateProduct(product.id, {
          isActive: !product.isActive,
        }),
      `Product ${product.isActive ? "deactivated" : "activated"}.`,
    );
  };

  const archiveVariant = async (variant: CatalogueVariant) => {
    if (
      !window.confirm(
        "Archive this variant? Its historical image and inventory associations will be preserved.",
      )
    ) {
      return;
    }
    await runMutation(
      () =>
        catalogueAdminService.archiveVariant(
          variant.catalogueProductId,
          variant.id,
        ),
      "Variant archived.",
      variant.catalogueProductId,
    );
  };

  const toggleImageVerification = async (image: CatalogueImage) => {
    await runMutation(
      () =>
        catalogueAdminService.updateImage(image.id, {
          isVerified: !image.isVerified,
        }),
      image.isVerified ? "Image verification removed." : "Image verified.",
      image.catalogueProductId,
    );
  };

  const deleteImage = async (image: CatalogueImage) => {
    if (!window.confirm("Delete this catalogue image? This cannot be undone.")) {
      return;
    }
    await runMutation(
      () => catalogueAdminService.deleteImage(image.id),
      "Image deleted.",
      image.catalogueProductId,
    );
  };

  const openProductDraft = (product?: CatalogueProduct) => {
    setDetail(null);
    setProductDraft({
      id: product?.id,
      brand: product?.brand ?? "",
      reference: product?.reference ?? "",
      model: product?.model ?? "",
      productType: product?.productType ?? "MONTURE",
    });
  };

  const openVariantDraft = (
    productId: string,
    variant?: CatalogueVariant,
  ) => {
    setDetail(null);
    setVariantDraft({
      productId,
      id: variant?.id,
      colorCode: variant?.colorCode ?? "",
      colorName: variant?.colorName ?? "",
      ean: variant?.ean ?? "",
    });
  };

  const openImageDraft = (
    product: CatalogueProduct,
    image?: CatalogueImage,
  ) => {
    setDetail(null);
    setImageDraft({
      productId: product.id,
      variants: product.variants,
      id: image?.id,
      variantId: image?.variantId ?? "",
      imageUrl: image?.imageUrl ?? "",
      storageKey: image?.storageKey ?? "",
      imageSource: image?.imageSource ?? "",
      sourceUrl: image?.sourceUrl ?? "",
      licenseInformation: image?.licenseInformation ?? "",
      isPrimary: image?.isPrimary ?? false,
    });
  };

  const stats = [
    { label: "Catalogue products", value: summary?.totalProducts ?? 0, tone: "gold" },
    { label: "Variants", value: summary?.totalVariants ?? 0, tone: "blue" },
    { label: "Verified images", value: summary?.totalVerifiedImages ?? 0, tone: "green" },
    { label: "Without verified images", value: summary?.productsWithoutVerifiedImages ?? 0, tone: "orange" },
    { label: "Active products", value: summary?.activeProducts ?? 0, tone: "violet" },
    { label: "Archived products", value: summary?.archivedProducts ?? 0, tone: "slate" },
  ];

  return (
    <div className="admin-content catalogue-admin-content">
      <section className="admin-welcome catalogue-welcome">
        <div>
          <span className="admin-eyebrow">SHARED EYEWEAR CATALOGUE</span>
          <h2>One trusted catalogue for every shop.</h2>
          <p>Manage products, colour variants, image metadata and verification.</p>
        </div>
        <div className="admin-welcome-icon"><ShieldCheck size={27} /></div>
      </section>

      <div className="admin-stat-grid catalogue-stat-grid">
        {stats.map((stat) => (
          <div className="admin-stat-card" key={stat.label}>
            <span className={`admin-stat-icon tone-${stat.tone}`}>
              {stat.label === "Verified images" ? <CheckCircle2 size={18} /> : <PackagePlus size={18} />}
            </span>
            <span className="admin-stat-label">{stat.label}</span>
            <strong>{formatNumber(stat.value)}</strong>
          </div>
        ))}
      </div>

      {error && (
        <div className="admin-message is-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void refresh()}>Retry</button>
        </div>
      )}
      {notice && <div className="admin-message is-success" role="status">{notice}</div>}

      <section className="admin-panel catalogue-products-panel">
        <div className="admin-panel-heading catalogue-panel-heading">
          <div>
            <h3>Catalogue products</h3>
            <p>{formatNumber(total)} results · page {page} of {totalPages}</p>
          </div>
          <button className="admin-button admin-button-primary" type="button" onClick={() => openProductDraft()}>
            <Plus size={15} /> Create product
          </button>
        </div>
        <div className="catalogue-toolbar">
          <form className="admin-search catalogue-search" onSubmit={submitSearch}>
            <Search size={16} aria-hidden="true" />
            <input
              aria-label="Search catalogue"
              placeholder="Search brand, model or reference"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
            <button type="submit">Search</button>
          </form>
          <label>
            <span className="catalogue-sr-only">Product type</span>
            <select
              value={typeFilter}
              onChange={(event) => {
                setLoading(true);
                setTypeFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All product types</option>
              {productTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>
            <span className="catalogue-sr-only">Product status</span>
            <select
              value={activeFilter}
              onChange={(event) => {
                setLoading(true);
                setActiveFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        </div>
        {loading ? (
          <div className="catalogue-loading"><LoaderCircle className="admin-spin" size={20} /> Loading catalogue…</div>
        ) : products.length === 0 ? (
          <div className="catalogue-empty">
            <ImagePlus size={26} />
            <strong>No products found</strong>
            <span>Try changing the filters or create the first catalogue product.</span>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table catalogue-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Variants</th>
                  <th>Images</th>
                  <th>Status</th>
                  <th><span className="catalogue-sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const image = availableProductImage(product);
                  const hasVerifiedImage = Boolean(image);
                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="catalogue-product-cell">
                          {image ? (
                            <Image src={image.imageUrl} alt={`${product.brand} ${product.model ?? ""}`} width={52} height={52} unoptimized />
                          ) : (
                            <span className="catalogue-image-placeholder"><ImagePlus size={17} /></span>
                          )}
                          <span>
                            <strong>{product.brand}</strong>
                            <small>{product.model || product.reference}</small>
                            <small>Ref. {product.reference}</small>
                          </span>
                        </div>
                      </td>
                      <td>{productTypeName(product.productType)}</td>
                      <td>{product.variants.length}</td>
                      <td><span className={`admin-status-badge ${hasVerifiedImage ? "status-active" : "status-pending_verification"}`}>{hasVerifiedImage ? "Verified image" : "No verified image"}</span></td>
                      <td><span className={`admin-status-badge ${product.isActive ? "status-active" : "status-deactivated"}`}>{product.isActive ? "Active" : "Archived"}</span></td>
                      <td>
                        <div className="catalogue-row-actions">
                          <button className="admin-icon-button" type="button" title="View product details" aria-label={`View ${product.brand} ${product.reference}`} onClick={() => void loadDetail(product.id)}><Eye size={15} /></button>
                          <button className="admin-icon-button" type="button" title="Edit product" aria-label={`Edit ${product.brand} ${product.reference}`} onClick={() => openProductDraft(product)}><Edit2 size={15} /></button>
                          <button className="admin-icon-button" type="button" title={product.isActive ? "Deactivate product" : "Activate product"} aria-label={product.isActive ? "Deactivate product" : "Activate product"} onClick={() => void toggleProduct(product)}><Archive size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="catalogue-pagination">
          <span>Showing {products.length ? (page - 1) * 20 + 1 : 0}–{Math.min(page * 20, total)} of {formatNumber(total)}</span>
          <div>
            <button className="admin-icon-button" type="button" aria-label="Previous page" disabled={page <= 1 || loading} onClick={() => { setLoading(true); setPage((current) => current - 1); }}><ChevronLeft size={16} /></button>
            <button className="admin-icon-button" type="button" aria-label="Next page" disabled={page >= totalPages || loading} onClick={() => { setLoading(true); setPage((current) => current + 1); }}><ChevronRight size={16} /></button>
          </div>
        </div>
      </section>

      {(detail || detailLoading) && (
        <div className="admin-modal-backdrop catalogue-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            setDetail(null);
            setDetailLoading(false);
          }
        }}>
          <section className="admin-plan-modal catalogue-detail-modal" role="dialog" aria-modal="true" aria-labelledby="catalogue-detail-title">
            {detailLoading || !detail ? (
              <div className="catalogue-loading"><LoaderCircle className="admin-spin" size={20} /> Loading product…</div>
            ) : (
              <>
                <div className="admin-modal-heading">
                  <div><span className="admin-eyebrow">CATALOGUE PRODUCT</span><h2 id="catalogue-detail-title">{detail.brand} · {detail.reference}</h2></div>
                  <button className="admin-icon-button" type="button" aria-label="Close product details" onClick={() => setDetail(null)}><X size={16} /></button>
                </div>
                <div className="catalogue-detail-summary">
                  <span><small>Model</small><strong>{detail.model || "—"}</strong></span>
                  <span><small>Type</small><strong>{productTypeName(detail.productType)}</strong></span>
                  <span><small>Status</small><strong>{detail.isActive ? "Active" : "Archived"}</strong></span>
                </div>
                <div className="catalogue-detail-actions">
                  <button className="admin-button admin-button-secondary" type="button" onClick={() => openProductDraft(detail)}><Edit2 size={14} /> Edit product</button>
                  <button className="admin-button admin-button-secondary" type="button" onClick={() => openVariantDraft(detail.id)}><Plus size={14} /> Add variant</button>
                  <button className="admin-button admin-button-primary" type="button" onClick={() => openImageDraft(detail)}><ImagePlus size={14} /> Add image</button>
                </div>
                <section className="catalogue-detail-section">
                  <div className="catalogue-subheading"><div><h3>Colour variants</h3><p>Archived variants remain available for historical associations.</p></div></div>
                  {detail.variants.length === 0 ? (
                    <div className="catalogue-inline-empty">No variants have been added.</div>
                  ) : (
                    <div className="admin-table-wrap">
                      <table className="admin-table catalogue-variant-table">
                        <thead><tr><th>Colour</th><th>Code</th><th>EAN / barcode</th><th>Images</th><th>Status</th><th><span className="catalogue-sr-only">Actions</span></th></tr></thead>
                        <tbody>{detail.variants.map((variant) => (
                          <tr key={variant.id}>
                            <td><strong>{variant.colorName || "Unnamed colour"}</strong></td>
                            <td>{variant.colorCode || "—"}</td>
                            <td>{variant.ean || "—"}</td>
                            <td>{variant.images.length}</td>
                            <td><span className={`admin-status-badge ${variant.deletedAt ? "status-deactivated" : variant.isActive ? "status-active" : "status-pending_verification"}`}>{variant.deletedAt ? "Archived" : variant.isActive ? "Active" : "Inactive"}</span></td>
                            <td><div className="catalogue-row-actions">
                              <button className="admin-icon-button" type="button" title="Edit variant" aria-label="Edit variant" disabled={Boolean(variant.deletedAt)} onClick={() => openVariantDraft(detail.id, variant)}><Edit2 size={14} /></button>
                              {!variant.deletedAt && <button className="admin-icon-button" type="button" title="Archive variant" aria-label="Archive variant" onClick={() => void archiveVariant(variant)}><Archive size={14} /></button>}
                            </div></td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
                </section>
                <section className="catalogue-detail-section">
                  <div className="catalogue-subheading"><div><h3>Product images</h3><p>Verified images can appear in optician suggestions.</p></div></div>
                  {detail.images.length === 0 ? (
                    <div className="catalogue-inline-empty">No images have been added.</div>
                  ) : (
                    <div className="catalogue-image-grid">
                      {detail.images.map((image) => (
                        <ImageCard
                          key={image.id}
                          image={image}
                          product={detail}
                          saving={saving}
                          onEdit={() => openImageDraft(detail, image)}
                          onVerify={() => void toggleImageVerification(image)}
                          onDelete={() => void deleteImage(image)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </section>
        </div>
      )}

      {productDraft && (
        <div className="admin-modal-backdrop catalogue-backdrop">
          <form className="admin-plan-modal" onSubmit={(event) => void saveProduct(event)}>
            <ModalHeading title={productDraft.id ? "Edit product" : "Create product"} onClose={() => setProductDraft(null)} />
            <div className="admin-form-grid">
              <label>Brand<input required maxLength={120} value={productDraft.brand} onChange={(event) => setProductDraft({ ...productDraft, brand: event.target.value })} /></label>
              <label>Reference<input required maxLength={160} value={productDraft.reference} onChange={(event) => setProductDraft({ ...productDraft, reference: event.target.value })} /></label>
              <label>Model<input maxLength={160} value={productDraft.model} onChange={(event) => setProductDraft({ ...productDraft, model: event.target.value })} /></label>
              <label>Product type<select value={productDraft.productType} onChange={(event) => setProductDraft({ ...productDraft, productType: event.target.value as CatalogueProductType })}>{productTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            </div>
            <ModalActions saving={saving} onCancel={() => setProductDraft(null)} submitLabel={productDraft.id ? "Save changes" : "Create product"} />
          </form>
        </div>
      )}

      {variantDraft && (
        <div className="admin-modal-backdrop catalogue-backdrop">
          <form className="admin-plan-modal" onSubmit={(event) => void saveVariant(event)}>
            <ModalHeading title={variantDraft.id ? "Edit variant" : "Add colour variant"} onClose={() => setVariantDraft(null)} />
            <div className="admin-form-grid">
              <label>Colour name<input maxLength={100} value={variantDraft.colorName} onChange={(event) => setVariantDraft({ ...variantDraft, colorName: event.target.value })} placeholder="Black / matte" /></label>
              <label>Colour code<input maxLength={60} value={variantDraft.colorCode} onChange={(event) => setVariantDraft({ ...variantDraft, colorCode: event.target.value })} /></label>
              <label className="admin-span-two">EAN / barcode<input minLength={8} maxLength={14} value={variantDraft.ean} onChange={(event) => setVariantDraft({ ...variantDraft, ean: event.target.value })} /></label>
            </div>
            <ModalActions saving={saving} onCancel={() => setVariantDraft(null)} submitLabel={variantDraft.id ? "Save changes" : "Add variant"} />
          </form>
        </div>
      )}

      {imageDraft && (
        <div className="admin-modal-backdrop catalogue-backdrop">
          <form className="admin-plan-modal" onSubmit={(event) => void saveImage(event)}>
            <ModalHeading title={imageDraft.id ? "Edit image metadata" : "Add catalogue image"} onClose={() => setImageDraft(null)} />
            <div className="catalogue-form-note"><CircleAlert size={16} /> New images are unverified and will not appear in optician suggestions until verified.</div>
            <div className="admin-form-grid">
              <label className="admin-span-two">Image URL<input type="url" required maxLength={2048} value={imageDraft.imageUrl} onChange={(event) => setImageDraft({ ...imageDraft, imageUrl: event.target.value })} /></label>
              <label>Storage key (optional)<input maxLength={1024} value={imageDraft.storageKey} onChange={(event) => setImageDraft({ ...imageDraft, storageKey: event.target.value })} /></label>
              <label>Image source<input required maxLength={40} value={imageDraft.imageSource} onChange={(event) => setImageDraft({ ...imageDraft, imageSource: event.target.value })} placeholder="Licensed / internal" /></label>
              <label className="admin-span-two">Source URL<input type="url" maxLength={2048} value={imageDraft.sourceUrl} onChange={(event) => setImageDraft({ ...imageDraft, sourceUrl: event.target.value })} /></label>
              <label className="admin-span-two">Licence information<textarea rows={3} value={imageDraft.licenseInformation} onChange={(event) => setImageDraft({ ...imageDraft, licenseInformation: event.target.value })} /></label>
              <label className="admin-span-two">Image applies to<select value={imageDraft.variantId} onChange={(event) => setImageDraft({ ...imageDraft, variantId: event.target.value })}><option value="">Whole product</option>{imageDraft.variants.filter((variant) => !variant.deletedAt || variant.id === imageDraft.variantId).map((variant) => <option key={variant.id} value={variant.id}>{variant.colorName || variant.colorCode || "Variant"}{variant.ean ? ` · ${variant.ean}` : ""}{variant.deletedAt ? " · archived" : ""}</option>)}</select></label>
            </div>
            <label className="admin-checkbox-row"><input type="checkbox" checked={imageDraft.isPrimary} onChange={(event) => setImageDraft({ ...imageDraft, isPrimary: event.target.checked })} /><span>Set as primary image for this product or variant</span></label>
            <ModalActions saving={saving} onCancel={() => setImageDraft(null)} submitLabel={imageDraft.id ? "Save changes" : "Add image"} />
          </form>
        </div>
      )}
    </div>
  );
}

function ImageCard({
  image,
  product,
  saving,
  onEdit,
  onVerify,
  onDelete,
}: {
  image: CatalogueImage;
  product: CatalogueProduct;
  saving: boolean;
  onEdit: () => void;
  onVerify: () => void;
  onDelete: () => void;
}) {
  const variant = product.variants.find((candidate) => candidate.id === image.variantId);
  return (
    <article className="catalogue-image-card">
      <div className="catalogue-image-preview">
        <Image src={image.imageUrl} alt={`${product.brand} ${variant?.colorName ?? ""}`} width={250} height={150} unoptimized />
        <span className={`admin-status-badge ${image.isVerified ? "status-active" : "status-pending_verification"}`}>{image.isVerified ? "Verified" : "Unverified"}</span>
      </div>
      <div className="catalogue-image-copy">
        <strong>{image.variantId ? variant?.colorName || variant?.colorCode || "Variant image" : "Product-wide image"}</strong>
        <small>Source: {image.imageSource}</small>
        <small>Licence: {image.licenseInformation || "Not specified"}</small>
        {image.sourceUrl && <a href={image.sourceUrl} target="_blank" rel="noreferrer">View source</a>}
      </div>
      <div className="catalogue-image-actions">
        <button className="admin-button admin-button-secondary" type="button" disabled={saving} onClick={onEdit}><Edit2 size={13} /> Edit</button>
        <button className="admin-button admin-button-secondary" type="button" disabled={saving} onClick={onVerify}>{image.isVerified ? "Unverify" : "Verify"}</button>
        <button className="admin-icon-button" type="button" disabled={saving} aria-label="Delete image" onClick={onDelete}><Trash2 size={14} /></button>
      </div>
    </article>
  );
}

function ModalHeading({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="admin-modal-heading">
      <h2>{title}</h2>
      <button className="admin-icon-button" type="button" aria-label="Close dialog" onClick={onClose}><X size={16} /></button>
    </div>
  );
}

function ModalActions({
  saving,
  onCancel,
  submitLabel,
}: {
  saving: boolean;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="admin-modal-actions">
      <button className="admin-button admin-button-secondary" type="button" disabled={saving} onClick={onCancel}>Cancel</button>
      <button className="admin-button admin-button-primary" type="submit" disabled={saving}>{saving && <LoaderCircle className="admin-spin" size={14} />}{submitLabel}</button>
    </div>
  );
}

function availableProductImage(product: CatalogueProduct) {
  const activeVariants = new Set(
    product.variants
      .filter((variant) => variant.isActive && !variant.deletedAt)
      .map((variant) => variant.id),
  );
  return product.images.find(
    (image) =>
      image.isVerified &&
      (!image.variantId || activeVariants.has(image.variantId)),
  );
}

function productTypeName(value: CatalogueProductType) {
  return productTypes.find(([type]) => type === value)?.[1] ?? value;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function errorMessage(reason: unknown) {
  return reason instanceof ApiError
    ? reason.message
    : "The catalogue request could not be completed. Please retry.";
}
