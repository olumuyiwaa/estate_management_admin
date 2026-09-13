"use client";

import { useEffect, useState } from "react";
import api from "@/app/api/axios";
import { API } from "@/app/api/endpoints";
import { extractList, errMsg } from "@/app/api/helpers";
import { toast } from "react-toastify";
import PageHeader from "@/components/common/PageHeader";
import ViewDetailsModal from "@/components/common/ViewDetailsModal";
import ActionMenu from "@/components/common/ActionMenu";

interface MeetingItem {
  id?: number;
  title?: string;
  meetingTitle?: string;
  summary?: string;
  meetingSummary?: string;
  meetingDate?: string;
  location?: string;
  attendees?: string;
  rowVersion?: string;
  [key: string]: any;
}

export default function MeetingSummaryPage() {
  const [items, setItems] = useState<MeetingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<MeetingItem | null>(null);
  const [viewItem, setViewItem] = useState<MeetingItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    summary: "",
    meetingDate: "",
    location: "",
    attendees: "",
  });

  const fetchList = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(API.meetingSummary.list);
      setItems(extractList<MeetingItem>(data));
    } catch (err: any) {
      toast.error(errMsg(err, "Failed to load meeting summaries"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({ title: "", summary: "", meetingDate: "", location: "", attendees: "" });
    setShowForm(true);
  };

  const openEdit = (m: MeetingItem) => {
    setEditItem(m);
    setForm({
      title: m.title || m.meetingTitle || "",
      summary: m.summary || m.meetingSummary || "",
      meetingDate: m.meetingDate ? new Date(m.meetingDate).toISOString().slice(0, 16) : "",
      location: m.location || "",
      attendees: m.attendees || "",
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        title: form.title,
        meetingTitle: form.title,
        summary: form.summary,
        meetingSummary: form.summary,
        meetingDate: form.meetingDate ? new Date(form.meetingDate).toISOString() : new Date().toISOString(),
        location: form.location || null,
        attendees: form.attendees || null,
      };
      if (editItem?.id != null) {
        payload.id = editItem.id;
        payload.rowVersion = editItem.rowVersion || null;
        await api.put(API.meetingSummary.update, payload);
        toast.success("Meeting summary updated");
      } else {
        await api.post(API.meetingSummary.create, payload);
        toast.success("Meeting summary created");
      }
      setShowForm(false);
      fetchList();
    } catch (err: any) {
      toast.error(errMsg(err, "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this meeting summary?")) return;
    try {
      await api.delete(API.meetingSummary.delete(id));
      toast.success("Deleted");
      fetchList();
    } catch (err: any) {
      toast.error(errMsg(err, "Delete failed"));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meeting Summaries"
        description="Record and manage estate meeting minutes"
        actions={
          <button onClick={openCreate} className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg">
            + New summary
          </button>
        }
      />

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">{editItem ? "Edit meeting summary" : "New meeting summary"}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input type="datetime-local" value={form.meetingDate} onChange={(e) => setForm({ ...form, meetingDate: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Attendees</label>
                <input value={form.attendees} onChange={(e) => setForm({ ...form, attendees: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm" placeholder="Comma-separated names" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Summary *</label>
                <textarea required rows={5} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm disabled:opacity-60">{saving ? "Saving..." : "Save"}</button>
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
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Title</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Location</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No meeting summaries</td></tr>
              ) : (
                items.map((m, i) => (
                  <tr key={m.id ?? i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-medium">{m.title || m.meetingTitle || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{m.meetingDate ? new Date(m.meetingDate).toLocaleString() : "—"}</td>
                    <td className="px-4 py-3">{m.location || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <ActionMenu
                        items={[
                          { label: "View", onClick: () => setViewItem(m) },
                          { label: "Edit", onClick: () => openEdit(m) },
                          {
                            label: "Delete",
                            onClick: () => handleDelete(m.id!),
                            variant: "danger",
                            divider: true,
                            hidden: m.id == null,
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

      {viewItem && (
        <ViewDetailsModal title="Meeting summary" data={viewItem} onClose={() => setViewItem(null)} />
      )}
    </div>
  );
}
