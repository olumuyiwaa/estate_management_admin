"use client";

import { useEffect, useState } from "react";
import api from "@/app/api/axios";
import { ApiResponse, PagedData } from "@/app/api/types";
import { toast } from "react-toastify";
import Pagination from "@/components/common/Pagination";
import ViewDetailsModal from "@/components/common/ViewDetailsModal";
import UpdateModal from "@/components/common/UpdateModal";

interface Issue {
  id: number;
  ticketNo?: string;
  title?: string;
  description?: string;
  reportedBy?: number;
  assignedTo?: number | null;
  reportedDate?: string;
  status?: string;
  resolutionDate?: string | null;
  reportedByFullName?: string;
  reportedByFirstName?: string;
  reportedByLastName?: string;
  assignedToFullName?: string;
  rowVersion?: string;
  [key: string]: any;
}

export default function IssuesPage() {
  const [items, setItems] = useState<Issue[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    reportedBy: 16,
    status: "Open",
  });
  const [viewIssue, setViewIssue] = useState<Issue | null>(null);
  const [editIssue, setEditIssue] = useState<Issue | null>(null);

  const fetchList = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<ApiResponse<PagedData<Issue>>>(
        "/api/Issues/GetByCritera"
      );
      const page = data?.data;
      setItems(page?.items ?? []);
      setTotal(page?.totalRecords ?? page?.items?.length ?? 0);
      setTotalPages(page?.totalPages || Math.max(1, Math.ceil((page?.totalRecords || 0) / pageSize)));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load issues");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/Issues/CreateNew", {
        title: form.title,
        description: form.description,
        reportedBy: Number(form.reportedBy),
        status: form.status,
      });
      toast.success("Issue created");
      setShowForm(false);
      setForm({ title: "", description: "", reportedBy: 16, status: "Open" });
      fetchList();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create issue");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (issue: Issue, status: string) => {
    if (typeof window !== "undefined") {
      const ok = window.confirm(`Mark issue #${issue.id} as ${status}?`);
      if (!ok) return;
    }
    try {
      await api.put("/api/Issues/Update", {
        id: issue.id,
        rowVersion: issue.rowVersion || null,
        title: issue.title,
        description: issue.description,
        assignedTo: issue.assignedTo,
        status,
        resolutionDate:
          status.toLowerCase() === "resolved" || status.toLowerCase() === "closed"
            ? new Date().toISOString()
            : null,
      });
      toast.success(`Marked as ${status}`);
      fetchList();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Update failed");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this issue?")) return;
    try {
      await api.delete("/api/Issues/Delete", { params: { id } });
      toast.success("Deleted");
      fetchList();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Delete failed");
    }
  };

  const statusColor = (s?: string) => {
    switch (s?.toLowerCase()) {
      case "open":
        return "bg-blue-100 text-blue-700";
      case "in progress":
      case "assigned":
        return "bg-purple-100 text-purple-700";
      case "resolved":
        return "bg-green-100 text-green-700";
      case "closed":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Issues</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total > 0 ? `${total} issues` : "Track and resolve estate issues"}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg"
        >
          + Report Issue
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Report Issue</h2>
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
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reported By (Resident ID)</label>
                <input
                  type="number"
                  value={form.reportedBy}
                  onChange={(e) =>
                    setForm({ ...form, reportedBy: parseInt(e.target.value) || 0 })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
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
                  {saving ? "Saving..." : "Create"}
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
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Ticket</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Title</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Reported By</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Date</th>
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
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No issues found</td>
                </tr>
              ) : (
                items.map((issue) => (
                  <tr key={issue.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-mono text-xs">
                      {issue.ticketNo || issue.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{issue.title}</div>
                      {issue.description && (
                        <div className="text-xs text-gray-500 truncate max-w-[220px]">
                          {issue.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {issue.reportedByFullName ||
                        [issue.reportedByFirstName, issue.reportedByLastName]
                          .filter(Boolean)
                          .join(" ") ||
                        "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColor(
                          issue.status
                        )}`}
                      >
                        {issue.status || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {issue.reportedDate
                        ? new Date(issue.reportedDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      {issue.status?.toLowerCase() === "open" && (
                        <button
                          onClick={() => handleUpdateStatus(issue, "In Progress")}
                          className="text-sm text-purple-600 font-medium"
                        >
                          Start
                        </button>
                      )}
                      {["open", "in progress"].includes(
                        (issue.status || "").toLowerCase()
                      ) && (
                        <button
                          onClick={() => handleUpdateStatus(issue, "Resolved")}
                          className="text-sm text-green-600 font-medium"
                        >
                          Resolve
                        </button>
                      )}
                      <button onClick={() => setViewIssue(issue)} className="text-sm text-gray-600 mr-2">View</button>
                      <button onClick={() => setEditIssue(issue)} className="text-sm text-brand-600 mr-2">Edit</button>
                      <button
                        onClick={() => handleDelete(issue.id)}
                        className="text-sm text-red-600 font-medium"
                      >
                        Delete
                      </button>
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
          {viewIssue && (
            <ViewDetailsModal title="Issue Details" data={viewIssue} onClose={() => setViewIssue(null)} />
          )}
          {editIssue && (
            <UpdateModal
              title="Edit Issue"
              initialData={editIssue}
              fields={["title", "description", "status"]}
              onClose={() => setEditIssue(null)}
              onSave={async (upd) => {
                try {
                  await api.put("/api/Issues/Update", upd);
                  toast.success("Issue updated");
                  fetchList();
                } catch (err: any) {
                  toast.error(err?.response?.data?.message || "Update failed");
                }
              }}
            />
          )}
      </div>
    </div>
  );
}

