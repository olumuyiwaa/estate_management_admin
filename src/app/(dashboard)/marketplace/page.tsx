"use client";

import { useEffect, useState } from "react";
import api from "@/app/api/axios";
import { ApiResponse, PagedData } from "@/app/api/types";
import { toast } from "react-toastify";
import Pagination from "@/components/common/Pagination";
import ActionMenu from "@/components/common/ActionMenu";

interface MarketplaceItem {
  id: number;
  itemReference?: string;
  residentId?: number;
  categoryId?: number;
  itemTitle?: string;
  itemDescription?: string;
  price?: number;
  condition?: string;
  showPrice?: boolean;
  allowChat?: boolean;
  isNegotiable?: boolean;
  contactPhone?: string;
  contactEmail?: string;
  locationDescription?: string;
  status?: string;
  approvalStatus?: string;
  viewCount?: number;
  isFeatured?: boolean;
  categoryName?: string;
  categoryCode?: string;
  residentFullName?: string;
  residentFirstName?: string;
  residentLastName?: string;
  [key: string]: any;
}

interface Category {
  id: number;
  categoryCode?: string;
  categoryName?: string;
  isActive?: boolean;
  displayName?: string;
}

interface Summary {
  totalListings: number;
  pendingApproval: number;
  approvedListings: number;
  rejectedListings: number;
  availableListings: number;
  totalViews: number;
  totalCategories: number;
}

export default function MarketplacePage() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const [tab, setTab] = useState<"all" | "pending" | "approved" | "rejected" | "featured">("all");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imagesFor, setImagesFor] = useState<MarketplaceItem | null>(null);
  const [images, setImages] = useState<any[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [form, setForm] = useState({
    residentId: 0,
    categoryId: 1,
    itemTitle: "",
    itemDescription: "",
    price: 0,
    condition: "New",
    showPrice: true,
    allowChat: true,
    isNegotiable: false,
    contactPhone: "",
    contactEmail: "",
    locationDescription: "",
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const endpoints: Record<string, string> = {
        all: "/api/MarketplaceItems/SearchMarketplaceItems",
        pending: "/api/MarketplaceItems/GetMarketplaceItemsPendingApproval",
        approved: "/api/MarketplaceItems/GetApprovedMarketplaceItems",
        rejected: "/api/MarketplaceItems/GetRejectedMarketplaceItems",
        featured: "/api/MarketplaceItems/GetFeaturedMarketplaceItems",
      };
      const { data } = await api.get<ApiResponse<PagedData<MarketplaceItem>>>(
        endpoints[tab]
      );
      setItems(data?.data?.items ?? []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load listings");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeta = async () => {
    try {
      const [catRes, sumRes] = await Promise.allSettled([
        api.get("/api/MarketplaceCategories/GetActiveMarketplaceCategories"),
        api.get("/api/MarketplaceItems/GetMarketplaceDashboardSummary"),
      ]);
      if (catRes.status === "fulfilled") {
        const d = catRes.value.data?.data;
        setCategories(d?.items ?? (Array.isArray(d) ? d : []));
      }
      if (sumRes.status === "fulfilled") {
        setSummary(sumRes.value.data?.data ?? null);
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [tab]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/MarketplaceItems/CreateMarketplaceItem", form);
      toast.success("Listing created");
      setShowForm(false);
      setForm({
        residentId: 0,
        categoryId: 1,
        itemTitle: "",
        itemDescription: "",
        price: 0,
        condition: "New",
        showPrice: true,
        allowChat: true,
        isNegotiable: false,
        contactPhone: "",
        contactEmail: "",
        locationDescription: "",
      });
      fetchItems();
      fetchMeta();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create listing");
    } finally {
      setSaving(false);
    }
  };

  const openImages = async (item: MarketplaceItem) => {
    setImagesFor(item);
    setImageUrl("");
    try {
      const { data } = await api.get(
        "/api/MarketplaceItemImages/GetImagesByMarketplaceItem",
        { params: { marketplaceItemId: item.id } }
      );
      const list = data?.data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
      setImages(Array.isArray(list) ? list : []);
    } catch {
      setImages([]);
    }
  };

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagesFor || !imageUrl.trim()) return;
    setSaving(true);
    try {
      await api.post("/api/MarketplaceItemImages/CreateMarketplaceItemImage", {
        marketplaceItemId: imagesFor.id,
        imageUrl: imageUrl.trim(),
        displayOrder: images.length,
        isPrimary: images.length === 0,
      });
      toast.success("Image added");
      setImageUrl("");
      openImages(imagesFor);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to add image");
    } finally {
      setSaving(false);
    }
  };

  const handleSetPrimary = async (imageId: number) => {
    if (!imagesFor) return;
    try {
      await api.post("/api/MarketplaceItemImages/SetPrimaryMarketplaceItemImage", null, {
        params: { id: imageId },
      });
      toast.success("Primary image set");
      openImages(imagesFor);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to set primary");
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!imagesFor || !confirm("Delete this image?")) return;
    try {
      await api.delete("/api/MarketplaceItemImages/DeleteMarketplaceItemImage", {
        params: { id: imageId },
      });
      toast.success("Image deleted");
      openImages(imagesFor);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Delete failed");
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.post("/api/MarketplaceItems/ApproveMarketplaceItem", { id });
      toast.success("Approved");
      fetchItems();
      fetchMeta();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Approve failed");
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt("Rejection reason?");
    if (reason === null) return;
    try {
      await api.post("/api/MarketplaceItems/RejectMarketplaceItem", {
        id,
        rejectionReason: reason || "Rejected by admin",
      });
      toast.success("Rejected");
      fetchItems();
      fetchMeta();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Reject failed");
    }
  };

  const fmt = (n?: number) =>
    typeof n === "number"
      ? n.toLocaleString("en-NG", { style: "currency", currency: "NGN" })
      : "—";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Marketplace
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Estate classifieds and listings
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg"
        >
          + New Listing
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ["Total", summary.totalListings],
            ["Pending", summary.pendingApproval],
            ["Approved", summary.approvedListings],
            ["Views", summary.totalViews],
          ].map(([label, val]) => (
            <div
              key={label as string}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
            >
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-2xl font-bold mt-1">{val as number}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {(["all", "pending", "approved", "rejected", "featured"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize ${
              tab === t
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">New Listing</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  required
                  value={form.itemTitle}
                  onChange={(e) => setForm({ ...form, itemTitle: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.itemDescription}
                  onChange={(e) =>
                    setForm({ ...form, itemDescription: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) =>
                      setForm({ ...form, categoryId: parseInt(e.target.value) })
                    }
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.categoryName || c.displayName || c.categoryCode}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Condition</label>
                  <select
                    value={form.condition}
                    onChange={(e) => setForm({ ...form, condition: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  >
                    <option>New</option>
                    <option>Like New</option>
                    <option>Good</option>
                    <option>Fair</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Price (NGN)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Resident ID</label>
                  <input
                    type="number"
                    value={form.residentId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        residentId: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contact Phone</label>
                <input
                  value={form.contactPhone}
                  onChange={(e) =>
                    setForm({ ...form, contactPhone: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  value={form.locationDescription}
                  onChange={(e) =>
                    setForm({ ...form, locationDescription: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.showPrice}
                    onChange={(e) =>
                      setForm({ ...form, showPrice: e.target.checked })
                    }
                  />
                  Show price
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isNegotiable}
                    onChange={(e) =>
                      setForm({ ...form, isNegotiable: e.target.checked })
                    }
                  />
                  Negotiable
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.allowChat}
                    onChange={(e) =>
                      setForm({ ...form, allowChat: e.target.checked })
                    }
                  />
                  Allow chat
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm disabled:opacity-60"
                >
                  {saving ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Ref</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Title</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Category</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Price</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Approval</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Views</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">No listings found</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-mono text-xs">{item.itemReference || item.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.itemTitle}</div>
                      <div className="text-xs text-gray-500">
                        {[item.residentFirstName, item.residentLastName]
                          .filter(Boolean)
                          .join(" ")}
                      </div>
                    </td>
                    <td className="px-4 py-3">{item.categoryName || "—"}</td>
                    <td className="px-4 py-3 font-medium">
                      {item.showPrice ? fmt(item.price) : "Hidden"}
                      {item.isNegotiable && (
                        <span className="ml-1 text-xs text-gray-400">nego</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{item.status || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          item.approvalStatus === "Approved"
                            ? "bg-green-100 text-green-700"
                            : item.approvalStatus === "Rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {item.approvalStatus || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{item.viewCount ?? 0}</td>
                    <td className="px-4 py-3 text-right">
                      <ActionMenu
                        items={[
                          {
                            label: "Images",
                            onClick: () => openImages(item),
                          },
                          {
                            label: "Approve",
                            onClick: () => handleApprove(item.id),
                            variant: "success",
                            hidden: item.approvalStatus === "Approved",
                          },
                          {
                            label: "Reject",
                            onClick: () => handleReject(item.id),
                            variant: "danger",
                            hidden: item.approvalStatus === "Rejected",
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          totalRecords={total}
          onPageChange={setPage}
        />
      </div>

      {imagesFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-1">Images</h2>
            <p className="text-sm text-gray-500 mb-4 truncate">
              {imagesFor.itemTitle} (#{imagesFor.id})
            </p>
            <form onSubmit={handleAddImage} className="flex gap-2 mb-4">
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Image URL"
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={saving || !imageUrl.trim()}
                className="px-3 py-2 bg-brand-500 text-white text-sm rounded-lg disabled:opacity-60"
              >
                Add
              </button>
            </form>
            <ul className="space-y-2 mb-4">
              {images.length === 0 ? (
                <li className="text-sm text-gray-500">No images yet</li>
              ) : (
                images.map((img: any) => (
                  <li
                    key={img.id}
                    className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.imageUrl}
                      alt=""
                      className="w-12 h-12 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate font-mono">{img.imageUrl}</p>
                      {img.isPrimary && (
                        <span className="text-xs text-brand-600 font-medium">Primary</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {!img.isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(img.id)}
                          className="text-xs px-2 py-1 border rounded"
                        >
                          Primary
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(img.id)}
                        className="text-xs px-2 py-1 border border-red-300 text-red-600 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
            <button
              type="button"
              onClick={() => setImagesFor(null)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

