"use client";

import { useEffect, useState } from "react";
import api from "@/app/api/axios";
import { API } from "@/app/api/endpoints";
import { extractList, errMsg } from "@/app/api/helpers";
import { toast } from "react-toastify";
import PageHeader from "@/components/common/PageHeader";

interface NotificationItem {
  id?: number | string;
  title?: string;
  message?: string;
  body?: string;
  isRead?: boolean;
  createdAt?: string;
  sentAt?: string;
  [key: string]: any;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSend, setShowSend] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    message: "",
    userIds: "",
    sendToAll: true,
  });

  const fetchUnread = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(API.pushNotifications.unread);
      setItems(extractList<NotificationItem>(data));
    } catch (err: any) {
      toast.error(errMsg(err, "Failed to load notifications"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnread();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        title: form.title,
        message: form.message,
        body: form.message,
      };
      if (!form.sendToAll && form.userIds.trim()) {
        payload.userIds = form.userIds
          .split(/[,;\s]+/)
          .map((s) => s.trim())
          .filter(Boolean);
      }
      await api.post(API.pushNotifications.send, payload);
      toast.success("Notification sent");
      setShowSend(false);
      setForm({ title: "", message: "", userIds: "", sendToAll: true });
      fetchUnread();
    } catch (err: any) {
      toast.error(errMsg(err, "Failed to send notification"));
    } finally {
      setSaving(false);
    }
  };

  const markRead = async (id: number | string) => {
    try {
      await api.put(API.pushNotifications.markRead, null, { params: { id } });
      toast.success("Marked as read");
      fetchUnread();
    } catch (err: any) {
      toast.error(errMsg(err, "Failed to mark as read"));
    }
  };

  const markAllRead = async () => {
    try {
      await api.put(API.pushNotifications.markAllRead);
      toast.success("All marked as read");
      fetchUnread();
    } catch (err: any) {
      toast.error(errMsg(err, "Failed to mark all as read"));
    }
  };

  const clearAll = async () => {
    if (!confirm("Clear all notifications?")) return;
    try {
      await api.delete(API.pushNotifications.clearAll);
      toast.success("Cleared");
      fetchUnread();
    } catch (err: any) {
      toast.error(errMsg(err, "Failed to clear"));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Push Notifications"
        description="Send broadcasts and manage unread notifications"
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={markAllRead}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Mark all read
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
            >
              Clear all
            </button>
            <button
              onClick={() => setShowSend(true)}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg"
            >
              + Send notification
            </button>
          </div>
        }
      />

      {showSend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Send notification</h2>
            <form onSubmit={handleSend} className="space-y-4">
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
                <label className="block text-sm font-medium mb-1">Message *</label>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.sendToAll}
                  onChange={(e) =>
                    setForm({ ...form, sendToAll: e.target.checked })
                  }
                />
                Send to all (omit user filter)
              </label>
              {!form.sendToAll && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    User IDs (comma-separated)
                  </label>
                  <input
                    value={form.userIds}
                    onChange={(e) =>
                      setForm({ ...form, userIds: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                    placeholder="guid1, guid2"
                  />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSend(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm disabled:opacity-60"
                >
                  {saving ? "Sending..." : "Send"}
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
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Title</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Message</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">When</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No unread notifications</td>
                </tr>
              ) : (
                items.map((n, i) => (
                  <tr key={String(n.id ?? i)} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-medium">{n.title || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-md truncate">
                      {n.message || n.body || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {n.createdAt || n.sentAt
                        ? new Date(String(n.createdAt || n.sentAt)).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {n.id != null && (
                        <button onClick={() => markRead(n.id!)} className="text-sm text-brand-600 font-medium">
                          Mark read
                        </button>
                      )}
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
