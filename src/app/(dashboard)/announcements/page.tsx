"use client";

import { useEffect, useState } from "react";
import api from "@/app/api/axios";
import { ApiResponse, PagedData } from "@/app/api/types";
import { toast } from "react-toastify";

interface Announcement {
  id: number;
  announcementReference?: string;
  title?: string;
  summary?: string;
  content?: string;
  bannerImageUrl?: string | null;
  priority?: string;
  isPublished?: boolean;
  publishedDate?: string | null;
  expiryDate?: string | null;
  requiresAcknowledgement?: boolean;
  createdBy?: string;
  isExpired?: boolean;
  isActive?: boolean;
  publishedBy?: string;
  daysUntilExpiry?: number;
  rowVersion?: string;
  [key: string]: any;
}

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"published" | "draft" | "all">("published");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    summary: "",
    content: "",
    priority: "Medium",
    requiresAcknowledgement: false,
    expiryDate: "",
  });

  const fetchList = async () => {
    setLoading(true);
    try {
      let endpoint = "/api/Announcements/SearchAnnouncements";
      if (tab === "published") endpoint = "/api/Announcements/GetPublishedAnnouncements";
      if (tab === "draft") endpoint = "/api/Announcements/GetDraftAnnouncements";

      const { data } = await api.get<ApiResponse<PagedData<Announcement>>>(endpoint);
      const page = data?.data;
      setItems(page?.items ?? []);
      setTotal(page?.totalRecords ?? page?.items?.length ?? 0);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load announcements");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [tab]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/Announcements/CreateAnnouncement", {
        title: form.title,
        summary: form.summary,
        content: form.content,
        priority: form.priority,
        requiresAcknowledgement: form.requiresAcknowledgement,
        expiryDate: form.expiryDate || null,
      });
      toast.success("Announcement created");
      setShowForm(false);
      setForm({
        title: "",
        summary: "",
        content: "",
        priority: "Medium",
        requiresAcknowledgement: false,
        expiryDate: "",
      });
      fetchList();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create announcement");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (id: number) => {
    try {
      await api.post("/api/Announcements/PublishAnnouncement", { id });
      toast.success("Published");
      fetchList();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Publish failed");
    }
  };

  const handleUnpublish = async (id: number) => {
    try {
      await api.post("/api/Announcements/UnpublishAnnouncement", { id });
      toast.success("Unpublished");
      fetchList();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Unpublish failed");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      await api.delete("/api/Announcements/DeleteAnnouncement", { params: { id } });
      toast.success("Deleted");
      fetchList();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Delete failed");
    }
  };

  const priorityColor = (p?: string) => {
    switch (p?.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-700";
      case "high":
        return "bg-orange-100 text-orange-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Announcements
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {total > 0 ? `${total} announcements` : "Create and publish estate notices"}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg"
        >
          + New Announcement
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {(["published", "draft", "all"] as const).map((t) => (
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
            <h2 className="text-lg font-semibold mb-4">New Announcement</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Summary</label>
                <input
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Content</label>
                <textarea
                  rows={4}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expiry Date</label>
                  <input
                    type="datetime-local"
                    value={form.expiryDate}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.requiresAcknowledgement}
                  onChange={(e) =>
                    setForm({ ...form, requiresAcknowledgement: e.target.checked })
                  }
                />
                Requires acknowledgement
              </label>
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
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Priority</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Published</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No announcements found</td>
                </tr>
              ) : (
                items.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-mono text-xs">{a.announcementReference || a.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{a.title}</div>
                      {a.summary && (
                        <div className="text-xs text-gray-500 truncate max-w-[220px]">{a.summary}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${priorityColor(a.priority)}`}>
                        {a.priority || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {a.isPublished ? (
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                          Draft
                        </span>
                      )}
                      {a.isExpired && (
                        <span className="ml-1 inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
                          Expired
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {a.publishedDate ? new Date(a.publishedDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {!a.isPublished ? (
                        <button onClick={() => handlePublish(a.id)} className="text-sm text-brand-600 font-medium">
                          Publish
                        </button>
                      ) : (
                        <button onClick={() => handleUnpublish(a.id)} className="text-sm text-orange-600 font-medium">
                          Unpublish
                        </button>
                      )}
                      <button onClick={() => handleDelete(a.id)} className="text-sm text-red-600 font-medium">
                        Delete
                      </button>
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
