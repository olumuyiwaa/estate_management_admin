"use client";

import { useEffect, useState } from "react";
import api from "@/app/api/axios";
import { ApiResponse, PagedData } from "@/app/api/types";
import { toast } from "react-toastify";
import Pagination from "@/components/common/Pagination";

interface Visitor {
  id: number;
  residentId?: number;
  fullName?: string;
  visitorDisplayName?: string;
  visitorAddress?: string;
  mobileNo?: string;
  email?: string;
  visitingDate?: string;
  verificationCode?: string;
  status?: string;
  residentCode?: string;
  residentFirstName?: string;
  residentLastName?: string;
  residentFullName?: string;
  rowVersion?: string;
  [key: string]: any;
}

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "active" | "pending">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    residentId: 16,
    fullName: "",
    mobileNo: "",
    email: "",
    visitorAddress: "",
    visitingDate: "",
  });

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      let endpoint = "/api/Visitors/GetByCriteria";
      if (tab === "active") endpoint = "/api/Visitors/GetActiveVisitors";
      if (tab === "pending") endpoint = "/api/Visitors/GetPendingVisitors";

      const { data } = await api.get<ApiResponse<PagedData<Visitor>>>(endpoint);
      const page = data?.data;
      setVisitors(page?.items ?? []);
      setTotal(page?.totalRecords ?? page?.items?.length ?? 0);
      setTotalPages(page?.totalPages || Math.max(1, Math.ceil((page?.totalRecords || 0) / pageSize)));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load visitors");
      setVisitors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, [tab]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/Visitors/CreateNew", {
        residentId: Number(form.residentId),
        fullName: form.fullName,
        mobileNo: form.mobileNo || null,
        email: form.email || null,
        visitorAddress: form.visitorAddress || null,
        visitingDate: form.visitingDate
          ? new Date(form.visitingDate).toISOString()
          : new Date().toISOString(),
      });
      toast.success("Visitor created (Pending)");
      setShowCreate(false);
      setForm({
        residentId: 16,
        fullName: "",
        mobileNo: "",
        email: "",
        visitorAddress: "",
        visitingDate: "",
      });
      fetchVisitors();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create visitor");
    } finally {
      setSaving(false);
    }
  };

  /** Check-in: POST /api/Visitors/CheckVistorIn  (note API typo: Vistor) */
  const handleCheckIn = async (v: Visitor) => {
    try {
      await api.post("/api/Visitors/CheckVistorIn", {
        visitorId: v.id,
        securityOfficerId: null,
        entryRemarks: "Checked in via admin portal",
      });
      toast.success("Visitor checked in");
      fetchVisitors();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Check-in failed");
    }
  };

  /** Check-out: PUT /api/Visitors/CheckVisitorOut */
  const handleCheckOut = async (v: Visitor) => {
    try {
      await api.put("/api/Visitors/CheckVisitorOut", {
        id: v.id,
        rowVersion: v.rowVersion || null,
        exitRemarks: "Checked out via admin portal",
      });
      toast.success("Visitor checked out");
      fetchVisitors();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Check-out failed");
    }
  };

  const statusColor = (s?: string) => {
    switch (s?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "checkedin":
      case "checked-in":
      case "active":
        return "bg-green-100 text-green-700";
      case "checkedout":
      case "checked-out":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Visitors</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total > 0 ? `${total} visitors` : "Manage visitor access"}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg"
        >
          + Register Visitor
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {(["all", "pending", "active"] as const).map((t) => (
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

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Register Visitor</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Host Resident ID *</label>
                <input
                  type="number"
                  required
                  value={form.residentId}
                  onChange={(e) =>
                    setForm({ ...form, residentId: parseInt(e.target.value) || 0 })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mobile</label>
                <input
                  value={form.mobileNo}
                  onChange={(e) => setForm({ ...form, mobileNo: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  value={form.visitorAddress}
                  onChange={(e) => setForm({ ...form, visitorAddress: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Visiting Date</label>
                <input
                  type="datetime-local"
                  value={form.visitingDate}
                  onChange={(e) => setForm({ ...form, visitingDate: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Register"}
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
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Visitor</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Code</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Phone</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Host</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Visit Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : visitors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No visitors found</td>
                </tr>
              ) : (
                visitors.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-medium">
                      {v.visitorDisplayName || v.fullName || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{v.verificationCode || "—"}</td>
                    <td className="px-4 py-3">{v.mobileNo || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {v.residentFullName ||
                        [v.residentFirstName, v.residentLastName].filter(Boolean).join(" ") ||
                        "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {v.visitingDate ? new Date(v.visitingDate).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColor(v.status)}`}>
                        {v.status || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {v.status?.toLowerCase() === "pending" && (
                        <button
                          onClick={() => handleCheckIn(v)}
                          className="text-sm text-green-600 font-medium"
                        >
                          Check In
                        </button>
                      )}
                      {["checkedin", "checked-in", "active"].includes(
                        (v.status || "").toLowerCase()
                      ) && (
                        <button
                          onClick={() => handleCheckOut(v)}
                          className="text-sm text-red-600 font-medium"
                        >
                          Check Out
                        </button>
                      )}
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
    </div>
  );
}

