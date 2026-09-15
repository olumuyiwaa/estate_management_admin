"use client";

import { useEffect, useState } from "react";
import api from "@/app/api/axios";
import { API } from "@/app/api/endpoints";
import { extractList, errMsg } from "@/app/api/helpers";
import { toast } from "react-toastify";
import ActionMenu from "@/components/common/ActionMenu";

interface Category {
  id: number;
  categoryCode?: string;
  categoryName?: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
  displayName?: string;
  [key: string]: any;
}

const emptyForm = {
  categoryCode: "",
  categoryName: "",
  description: "",
  displayOrder: 0,
  isActive: true,
};

export default function MarketplaceCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "inactive" | "all">("active");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      let endpoint: string = API.marketplaceCategories.active;
      if (tab === "inactive") endpoint = API.marketplaceCategories.inactive;
      if (tab === "all") endpoint = API.marketplaceCategories.search;

      const { data } = await api.get(endpoint);
      setCategories(extractList<Category>(data));
    } catch (err: any) {
      toast.error(errMsg(err, "Failed to load categories"));
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(API.marketplaceCategories.create, {
        categoryCode: form.categoryCode || form.categoryName.replace(/\s+/g, "_").toUpperCase(),
        categoryName: form.categoryName,
        description: form.description || null,
        displayOrder: Number(form.displayOrder) || 0,
        isActive: form.isActive,
      });
      toast.success("Category created");
      setShowForm(false);
      setForm(emptyForm);
      fetchCategories();
    } catch (err: any) {
      toast.error(errMsg(err, "Failed to create category"));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (c: Category) => {
    setEditItem(c);
    setForm({
      categoryCode: c.categoryCode || "",
      categoryName: c.categoryName || c.displayName || "",
      description: c.description || "",
      displayOrder: c.displayOrder ?? 0,
      isActive: c.isActive !== false,
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    setSaving(true);
    try {
      await api.put(API.marketplaceCategories.update, {
        id: editItem.id,
        categoryCode: form.categoryCode,
        categoryName: form.categoryName,
        description: form.description || null,
        displayOrder: Number(form.displayOrder) || 0,
        isActive: form.isActive,
      });
      toast.success("Category updated");
      setEditItem(null);
      setForm(emptyForm);
      fetchCategories();
    } catch (err: any) {
      toast.error(errMsg(err, "Failed to update category"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: Category) => {
    if (!confirm(`Delete category "${c.categoryName || c.displayName}"?`)) return;
    try {
      await api.delete(API.marketplaceCategories.delete(c.id));
      toast.success("Category deleted");
      fetchCategories();
    } catch (err: any) {
      toast.error(errMsg(err, "Delete failed"));
    }
  };

  const formModal = (
    title: string,
    onSubmit: (e: React.FormEvent) => void,
    onCancel: () => void,
    submitLabel: string
  ) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              required
              value={form.categoryName}
              onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Code</label>
            <input
              value={form.categoryCode}
              onChange={(e) => setForm({ ...form, categoryCode: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-mono"
              placeholder="Auto from name if empty"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Display order</label>
            <input
              type="number"
              value={form.displayOrder}
              onChange={(e) =>
                setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })
              }
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active
          </label>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm disabled:opacity-60"
            >
              {saving ? "Saving…" : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Marketplace Categories
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage listing categories for the marketplace
          </p>
        </div>
        <button
          onClick={() => {
            setForm(emptyForm);
            setShowForm(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg"
        >
          + Add Category
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {(["active", "inactive", "all"] as const).map((t) => (
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

      {showForm &&
        formModal("Create Category", handleCreate, () => setShowForm(false), "Create")}
      {editItem &&
        formModal(
          "Edit Category",
          handleUpdate,
          () => {
            setEditItem(null);
            setForm(emptyForm);
          },
          "Save"
        )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Code</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Order</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No categories</td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-medium">
                      {c.categoryName || c.displayName || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{c.categoryCode || "—"}</td>
                    <td className="px-4 py-3">{c.displayOrder ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          c.isActive !== false
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {c.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ActionMenu
                        items={[
                          { label: "Edit", onClick: () => openEdit(c) },
                          {
                            label: "Delete",
                            onClick: () => handleDelete(c),
                            variant: "danger",
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
      </div>
    </div>
  );
}
