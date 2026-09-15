"use client";

import { useEffect, useState } from "react";
import api from "@/app/api/axios";
import { API } from "@/app/api/endpoints";
import { extractPaged, errMsg } from "@/app/api/helpers";
import { toast } from "react-toastify";
import Pagination from "@/components/common/Pagination";
import ActionMenu from "@/components/common/ActionMenu";

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

interface VisitorLog {
  id?: number;
  visitorId?: number;
  visitorName?: string;
  verificationCode?: string;
  entryTime?: string;
  exitTime?: string;
  entryRemarks?: string;
  exitRemarks?: string;
  securityOfficerId?: number;
  status?: string;
  [key: string]: any;
}

const emptyForm = {
  residentId: 0,
  fullName: "",
  mobileNo: "",
  email: "",
  visitorAddress: "",
  visitingDate: "",
};

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "active" | "pending" | "logs">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editVisitor, setEditVisitor] = useState<Visitor | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyResult, setVerifyResult] = useState<Visitor | null>(null);
  const [verifying, setVerifying] = useState(false);

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      let endpoint = API.visitors.getByCriteria;
      if (tab === "active") endpoint = API.visitors.active;
      if (tab === "pending") endpoint = API.visitors.pending;

      const { data } = await api.get(endpoint, {
        params: { PageNumber: page, PageSize: pageSize },
      });
      const paged = extractPaged<Visitor>(data, pageSize);
      setVisitors(paged.items);
      setTotal(paged.totalRecords);
      setTotalPages(paged.totalPages);
    } catch (err: any) {
      toast.error(errMsg(err, "Failed to load visitors"));
      setVisitors([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(API.visitors.logsByCriteria, {
        params: { PageNumber: page, PageSize: pageSize },
      });
      const paged = extractPaged<VisitorLog>(data, pageSize);
      setLogs(paged.items);
      setTotal(paged.totalRecords);
      setTotalPages(paged.totalPages);
    } catch (err: any) {
      toast.error(errMsg(err, "Failed to load visitor logs"));
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [tab]);

  useEffect(() => {
    if (tab === "logs") fetchLogs();
    else fetchVisitors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(API.visitors.create, {
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
      setForm(emptyForm);
      if (tab !== "logs") fetchVisitors();
    } catch (err: any) {
      toast.error(errMsg(err, "Failed to create visitor"));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (v: Visitor) => {
    setEditVisitor(v);
    setForm({
      residentId: v.residentId || 0,
      fullName: v.fullName || v.visitorDisplayName || "",
      mobileNo: v.mobileNo || "",
      email: v.email || "",
      visitorAddress: v.visitorAddress || "",
      visitingDate: v.visitingDate
        ? new Date(v.visitingDate).toISOString().slice(0, 16)
        : "",
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVisitor) return;
    setSaving(true);
    try {
      await api.put(API.visitors.update, {
        id: editVisitor.id,
        residentId: Number(form.residentId),
        fullName: form.fullName,
        mobileNo: form.mobileNo || null,
        email: form.email || null,
        visitorAddress: form.visitorAddress || null,
        visitingDate: form.visitingDate
          ? new Date(form.visitingDate).toISOString()
          : editVisitor.visitingDate,
        rowVersion: editVisitor.rowVersion || null,
      });
      toast.success("Visitor updated");
      setEditVisitor(null);
      setForm(emptyForm);
      fetchVisitors();
    } catch (err: any) {
      toast.error(errMsg(err, "Failed to update visitor"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (v: Visitor) => {
    if (!confirm(`Delete visitor ${v.visitorDisplayName || v.fullName}?`)) return;
    try {
      await api.delete(API.visitors.delete(v.id));
      toast.success("Visitor deleted");
      fetchVisitors();
    } catch (err: any) {
      toast.error(errMsg(err, "Delete failed"));
    }
  };

  /** Check-in: POST /api/Visitors/CheckVistorIn  (note API typo: Vistor) */
  const handleCheckIn = async (v: Visitor) => {
    try {
      await api.post(API.visitors.checkIn, {
        visitorId: v.id,
        securityOfficerId: null,
        entryRemarks: "Checked in via admin portal",
      });
      toast.success("Visitor checked in");
      fetchVisitors();
    } catch (err: any) {
      toast.error(errMsg(err, "Check-in failed"));
    }
  };

  /** Check-out: PUT /api/Visitors/CheckVisitorOut */
  const handleCheckOut = async (v: Visitor) => {
    try {
      await api.put(API.visitors.checkOut, {
        id: v.id,
        rowVersion: v.rowVersion || null,
        exitRemarks: "Checked out via admin portal",
      });
      toast.success("Visitor checked out");
      fetchVisitors();
    } catch (err: any) {
      toast.error(errMsg(err, "Check-out failed"));
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode.trim()) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const code = verifyCode.trim();
      // Prefer active visit lookup; fall back to verify endpoint
      let data: any;
      try {
        const res = await api.get(API.visitors.activeVisitByCode(code));
        data = res.data;
      } catch {
        const res = await api.get(API.visitors.verify(code));
        data = res.data;
      }
      const visitor =
        data?.data ?? (Array.isArray(data) ? data[0] : data) ?? null;
      if (visitor && (visitor.id || visitor.verificationCode)) {
        setVerifyResult(visitor as Visitor);
        toast.success("Visitor found");
      } else {
        toast.error("No visitor found for this code");
      }
    } catch (err: any) {
      toast.error(errMsg(err, "Verification failed"));
    } finally {
      setVerifying(false);
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

  const visitorFormModal = (
    title: string,
    onSubmit: (e: React.FormEvent) => void,
    onCancel: () => void,
    submitLabel: string
  ) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        <form onSubmit={onSubmit} className="space-y-4">
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
              min={1}
              value={form.residentId || ""}
              onChange={(e) =>
                setForm({ ...form, residentId: parseInt(e.target.value) || 0 })
              }
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              placeholder="Enter resident ID"
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
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm disabled:opacity-60"
            >
              {saving ? "Saving..." : submitLabel}
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Visitors</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total > 0 ? `${total} records` : "Manage visitor access"}
          </p>
        </div>
        <button
          onClick={() => {
            setForm(emptyForm);
            setShowCreate(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg"
        >
          + Register Visitor
        </button>
      </div>

      {/* Verify by code */}
      <form
        onSubmit={handleVerify}
        className="flex flex-col sm:flex-row gap-2 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
      >
        <input
          value={verifyCode}
          onChange={(e) => setVerifyCode(e.target.value)}
          placeholder="Verification code"
          className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-mono"
        />
        <button
          type="submit"
          disabled={verifying}
          className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium rounded-lg disabled:opacity-60"
        >
          {verifying ? "Verifying…" : "Verify code"}
        </button>
      </form>
      {verifyResult && (
        <div className="p-4 rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 text-sm">
          <p className="font-medium">
            {verifyResult.visitorDisplayName || verifyResult.fullName || "Visitor"}
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            Code: {verifyResult.verificationCode} · Status: {verifyResult.status || "—"}
          </p>
          <p className="text-gray-500">
            Host:{" "}
            {verifyResult.residentFullName ||
              [verifyResult.residentFirstName, verifyResult.residentLastName]
                .filter(Boolean)
                .join(" ") ||
              "—"}
          </p>
          <div className="flex gap-2 mt-2">
            {verifyResult.status?.toLowerCase() === "pending" && (
              <button
                type="button"
                onClick={() => handleCheckIn(verifyResult)}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg"
              >
                Check In
              </button>
            )}
            {["checkedin", "checked-in", "active"].includes(
              (verifyResult.status || "").toLowerCase()
            ) && (
              <button
                type="button"
                onClick={() => handleCheckOut(verifyResult)}
                className="px-3 py-1 text-xs bg-red-600 text-white rounded-lg"
              >
                Check Out
              </button>
            )}
            <button
              type="button"
              onClick={() => setVerifyResult(null)}
              className="px-3 py-1 text-xs border rounded-lg"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {(["all", "pending", "active", "logs"] as const).map((t) => (
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

      {showCreate &&
        visitorFormModal(
          "Register Visitor",
          handleCreate,
          () => setShowCreate(false),
          "Register"
        )}

      {editVisitor &&
        visitorFormModal(
          "Edit Visitor",
          handleUpdate,
          () => {
            setEditVisitor(null);
            setForm(emptyForm);
          },
          "Save"
        )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          {tab === "logs" ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Visitor</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Code</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Entry</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Exit</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Remarks</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No logs found</td>
                  </tr>
                ) : (
                  logs.map((log, i) => (
                    <tr key={log.id ?? i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3 font-medium">{log.visitorName || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs">{log.verificationCode || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                        {log.entryTime ? new Date(log.entryTime).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                        {log.exitTime ? new Date(log.exitTime).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {log.entryRemarks || log.exitRemarks || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColor(log.status)}`}>
                          {log.status || "—"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
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
                      <td className="px-4 py-3 text-right">
                        <ActionMenu
                          items={[
                            {
                              label: "Edit",
                              onClick: () => openEdit(v),
                            },
                            {
                              label: "Check In",
                              onClick: () => handleCheckIn(v),
                              variant: "success",
                              hidden: v.status?.toLowerCase() !== "pending",
                            },
                            {
                              label: "Check Out",
                              onClick: () => handleCheckOut(v),
                              variant: "danger",
                              hidden: !["checkedin", "checked-in", "active"].includes(
                                (v.status || "").toLowerCase()
                              ),
                            },
                            {
                              label: "Delete",
                              onClick: () => handleDelete(v),
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
          )}
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
