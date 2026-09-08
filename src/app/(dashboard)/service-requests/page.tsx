"use client";

import { useEffect, useState } from "react";
import api from "@/app/api/axios";
import { ServiceRequest, ApiResponse, PagedData } from "@/app/api/types";
import { toast } from "react-toastify";
import Pagination from "@/components/common/Pagination";
import ViewDetailsModal from "@/components/common/ViewDetailsModal";
import UpdateModal from "@/components/common/UpdateModal";

export default function ServiceRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    description: "",
    categoryId: 1,
    priority: "medium",
  });
  const [saving, setSaving] = useState(false);
  const [viewRequest, setViewRequest] = useState<any | null>(null);
  const [editRequest, setEditRequest] = useState<any | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const endpoint =
        filter === "open"
          ? "/api/ServiceRequests/GetOpenServiceRequests"
          : "/api/ServiceRequests/SearchServiceRequests";

      const { data } = await api.get<ApiResponse<PagedData<ServiceRequest>>>(
        endpoint
      );
      const page = data?.data;
      setRequests(page?.items ?? []);
      setTotal(page?.totalRecords ?? page?.items?.length ?? 0);
      setTotalPages(page?.totalPages || Math.max(1, Math.ceil((page?.totalRecords || 0) / pageSize)));
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || "Failed to load service requests"
      );
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/ServiceRequests/CreateServiceRequest", form);
      toast.success("Service request created");
      setShowForm(false);
      setForm({
        subject: "",
        description: "",
        categoryId: 1,
        priority: "medium",
      });
      fetchRequests();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create request");
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = async (id: number) => {
    if (typeof window !== "undefined") {
      const ok = window.confirm("Mark this request as resolved?");
      if (!ok) return;
    }
    try {
      await api.post("/api/ServiceRequests/ResolveServiceRequest", { id });
      toast.success("Marked as resolved");
      fetchRequests();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Action failed");
    }
  };

  const priorityColor = (p?: string) => {
    switch (p?.toLowerCase()) {
      case "critical":
      case "high":
        return "bg-red-100 text-red-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const statusColor = (s?: string) => {
    switch (s?.toLowerCase()) {
      case "open":
        return "bg-blue-100 text-blue-700";
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Service Requests
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {total > 0 ? `${total} requests` : "Track maintenance & service requests"}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg"
        >
          + New Request
        </button>
      </div>

      <div className="flex gap-2">
        {(["open", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg ${
              filter === f
                ? "bg-brand-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            {f === "open" ? "Open" : "All"}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">New Service Request</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject *</label>
                <input
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Category ID
                  </label>
                  <input
                    type="number"
                    value={form.categoryId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        categoryId: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm({ ...form, priority: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
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
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Ref
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Subject
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Category
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Priority
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Resident
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Created
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No service requests found
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      {r.requestReference || r.id}
                    </td>
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate">
                      {r.subject || "—"}
                    </td>
                    <td className="px-4 py-3">{r.categoryName || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full capitalize ${priorityColor(
                          r.priority
                        )}`}
                      >
                        {r.priority || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColor(
                          r.status
                        )}`}
                      >
                        {r.status || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {[r.residentFirstName, r.residentLastName]
                        .filter(Boolean)
                        .join(" ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status?.toLowerCase() !== "resolved" &&
                        r.status?.toLowerCase() !== "closed" && (
                          <button
                            onClick={() => handleResolve(r.id)}
                            className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                          >
                            Resolve
                          </button>
                        )}
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setViewRequest(r)} className="text-sm text-gray-600">View</button>
                        <button onClick={() => setEditRequest(r)} className="text-sm text-brand-600">Edit</button>
                      </div>
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
        {viewRequest && (
          <ViewDetailsModal title="Request Details" data={viewRequest} onClose={() => setViewRequest(null)} />
        )}
        {editRequest && (
          <UpdateModal
            title="Edit Request"
            initialData={editRequest}
            fields={["subject", "description", "priority", "status"]}
            onClose={() => setEditRequest(null)}
            onSave={async (upd) => {
              try {
                await api.put("/api/ServiceRequests/Update", upd);
                toast.success("Request updated");
                fetchRequests();
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

