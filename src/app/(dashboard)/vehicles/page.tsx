"use client";

import { useEffect, useState } from "react";
import api from "@/app/api/axios";
import { API } from "@/app/api/endpoints";
import { extractPaged, extractList, errMsg } from "@/app/api/helpers";
import { toast } from "react-toastify";
import ViewDetailsModal from "@/components/common/ViewDetailsModal";
import ActionMenu from "@/components/common/ActionMenu";
import UpdateModal from "@/components/common/UpdateModal";

interface ResidentVehicle {
  id: number;
  residentId?: number;
  plateNumber?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehicleYear?: number;
  stickerNumber?: string;
  isPrimaryVehicle?: boolean;
  isActive?: boolean;
  residentCode?: string;
  residentFullName?: string;
  [key: string]: any;
}

interface AccessLog {
  id: number;
  plateNumber?: string;
  stickerNumber?: string;
  accessDirection?: string;
  accessStatus?: string;
  accessDateTime?: string;
  gateName?: string;
  residentCode?: string;
  verificationMessage?: string;
  accessMethod?: string;
  residentVehicleId?: number;
  residentId?: number;
  [key: string]: any;
}

const emptyVehicle = {
  residentId: 0,
  plateNumber: "",
  vehicleMake: "",
  vehicleModel: "",
  vehicleColor: "",
  vehicleYear: new Date().getFullYear(),
  stickerNumber: "",
  isPrimaryVehicle: false,
};

const emptyLog = {
  plateNumber: "",
  stickerNumber: "",
  accessDirection: "Entry",
  accessStatus: "Granted",
  gateName: "Main Gate",
  residentVehicleId: 0,
  residentId: 0,
  accessMethod: "Manual",
  verificationMessage: "Logged via admin portal",
};

export default function VehiclesPage() {
  const [tab, setTab] = useState<"vehicles" | "logs">("vehicles");
  const [logFilter, setLogFilter] = useState<"all" | "entry" | "exit" | "granted" | "denied">("all");
  const [vehicles, setVehicles] = useState<ResidentVehicle[]>([]);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [summary, setSummary] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyVehicle);
  const [logForm, setLogForm] = useState(emptyLog);
  const [viewVehicle, setViewVehicle] = useState<ResidentVehicle | null>(null);
  const [editVehicle, setEditVehicle] = useState<ResidentVehicle | null>(null);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(API.vehicles.search);
      const paged = extractPaged<ResidentVehicle>(data);
      setVehicles(paged.items);
    } catch (err: any) {
      toast.error(errMsg(err, "Failed to load vehicles"));
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const endpoints: Record<string, string> = {
        all: API.vehicleLogs.search,
        entry: API.vehicleLogs.entry,
        exit: API.vehicleLogs.exit,
        granted: API.vehicleLogs.granted,
        denied: API.vehicleLogs.denied,
      };
      const { data } = await api.get(endpoints[logFilter]);
      const paged = extractPaged<AccessLog>(data);
      setLogs(paged.items.length ? paged.items : extractList<AccessLog>(data));
    } catch (err: any) {
      toast.error(errMsg(err, "Failed to load access logs"));
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const [v, l] = await Promise.all([
        api.get(API.vehicles.summary).catch(() => null),
        api.get(API.vehicleLogs.summary).catch(() => null),
      ]);
      const vs = v?.data?.data ?? v?.data ?? null;
      const ls = l?.data?.data ?? l?.data ?? null;
      setSummary({ ...(vs || {}), ...(ls || {}) });
    } catch {
      setSummary(null);
    }
  };

  useEffect(() => {
    if (tab === "vehicles") fetchVehicles();
    else fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, logFilter]);

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(API.vehicles.create, {
        ...form,
        residentId: Number(form.residentId),
      });
      toast.success("Vehicle registered");
      setShowForm(false);
      setForm(emptyVehicle);
      fetchVehicles();
    } catch (err: any) {
      toast.error(errMsg(err, "Failed to register vehicle"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVehicle = async (v: ResidentVehicle) => {
    if (!confirm(`Delete vehicle ${v.plateNumber}?`)) return;
    try {
      await api.delete(API.vehicles.delete, { params: { id: v.id } });
      toast.success("Vehicle deleted");
      fetchVehicles();
    } catch (err: any) {
      toast.error(errMsg(err, "Delete failed"));
    }
  };

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(API.vehicleLogs.create, {
        plateNumber: logForm.plateNumber || null,
        stickerNumber: logForm.stickerNumber || null,
        accessDirection: logForm.accessDirection,
        accessStatus: logForm.accessStatus,
        gateName: logForm.gateName || null,
        residentVehicleId: logForm.residentVehicleId || null,
        residentId: logForm.residentId || null,
        accessMethod: logForm.accessMethod || "Manual",
        verificationMessage: logForm.verificationMessage || null,
        accessDateTime: new Date().toISOString(),
      });
      toast.success("Access log created");
      setShowLogForm(false);
      setLogForm(emptyLog);
      fetchLogs();
    } catch (err: any) {
      toast.error(errMsg(err, "Failed to create log"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLog = async (log: AccessLog) => {
    if (!confirm("Delete this access log?")) return;
    try {
      await api.delete(API.vehicleLogs.delete, { params: { id: log.id } });
      toast.success("Log deleted");
      fetchLogs();
    } catch (err: any) {
      toast.error(errMsg(err, "Delete failed"));
    }
  };

  const handleVerify = async (plate: string) => {
    try {
      const { data } = await api.get(API.vehicles.verify, {
        params: { plateNumber: plate },
      });
      toast.info(
        data?.message ||
          data?.data?.verificationMessage ||
          JSON.stringify(data?.data ?? data)
      );
    } catch (err: any) {
      toast.error(errMsg(err, "Verification failed"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Vehicle Access
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Registered vehicles and gate access logs
          </p>
        </div>
        <div className="flex gap-2">
          {tab === "logs" && (
            <button
              onClick={() => {
                setLogForm(emptyLog);
                setShowLogForm(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg"
            >
              + Log access
            </button>
          )}
          {tab === "vehicles" && (
            <button
              onClick={() => {
                setForm(emptyVehicle);
                setShowForm(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg"
            >
              + Register Vehicle
            </button>
          )}
        </div>
      </div>

      {summary && typeof summary === "object" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(summary)
            .filter(([, v]) => typeof v === "number")
            .slice(0, 8)
            .map(([k, v]) => (
              <div
                key={k}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
              >
                <p className="text-xs text-gray-500 truncate">{k}</p>
                <p className="text-lg font-semibold mt-1">{String(v)}</p>
              </div>
            ))}
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {(["vehicles", "logs"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize ${
              tab === t
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "vehicles" ? "Registered Vehicles" : "Access Logs"}
          </button>
        ))}
      </div>

      {tab === "logs" && (
        <div className="flex flex-wrap gap-2">
          {(["all", "entry", "exit", "granted", "denied"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setLogFilter(f)}
              className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${
                logFilter === f
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Register Vehicle</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Resident ID *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={form.residentId || ""}
                  onChange={(e) =>
                    setForm({ ...form, residentId: parseInt(e.target.value) || 0 })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Plate Number *</label>
                <input
                  required
                  value={form.plateNumber}
                  onChange={(e) => setForm({ ...form, plateNumber: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Make</label>
                  <input
                    value={form.vehicleMake}
                    onChange={(e) => setForm({ ...form, vehicleMake: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Model</label>
                  <input
                    value={form.vehicleModel}
                    onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Color</label>
                  <input
                    value={form.vehicleColor}
                    onChange={(e) => setForm({ ...form, vehicleColor: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Year</label>
                  <input
                    type="number"
                    value={form.vehicleYear}
                    onChange={(e) =>
                      setForm({ ...form, vehicleYear: parseInt(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sticker Number</label>
                <input
                  value={form.stickerNumber}
                  onChange={(e) => setForm({ ...form, stickerNumber: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isPrimaryVehicle}
                  onChange={(e) =>
                    setForm({ ...form, isPrimaryVehicle: e.target.checked })
                  }
                />
                Primary vehicle
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
                  {saving ? "Saving..." : "Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLogForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Create Access Log</h2>
            <form onSubmit={handleCreateLog} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Plate Number *</label>
                <input
                  required
                  value={logForm.plateNumber}
                  onChange={(e) => setLogForm({ ...logForm, plateNumber: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Direction</label>
                  <select
                    value={logForm.accessDirection}
                    onChange={(e) =>
                      setLogForm({ ...logForm, accessDirection: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  >
                    <option value="Entry">Entry</option>
                    <option value="Exit">Exit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={logForm.accessStatus}
                    onChange={(e) =>
                      setLogForm({ ...logForm, accessStatus: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  >
                    <option value="Granted">Granted</option>
                    <option value="Denied">Denied</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gate</label>
                <input
                  value={logForm.gateName}
                  onChange={(e) => setLogForm({ ...logForm, gateName: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sticker</label>
                <input
                  value={logForm.stickerNumber}
                  onChange={(e) =>
                    setLogForm({ ...logForm, stickerNumber: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Create log"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          {tab === "vehicles" ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Plate</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Vehicle</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Sticker</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Resident</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Primary</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td>
                  </tr>
                ) : vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No vehicles found</td>
                  </tr>
                ) : (
                  vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3 font-mono font-medium">{v.plateNumber || "—"}</td>
                      <td className="px-4 py-3">
                        {[v.vehicleMake, v.vehicleModel, v.vehicleColor]
                          .filter(Boolean)
                          .join(" ") || "—"}
                        {v.vehicleYear ? ` (${v.vehicleYear})` : ""}
                      </td>
                      <td className="px-4 py-3">{v.stickerNumber || "—"}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {v.residentFullName || v.residentCode || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {v.isPrimaryVehicle ? (
                          <span className="text-xs font-medium text-brand-600">Yes</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ActionMenu
                          items={[
                            {
                              label: "Verify",
                              onClick: () => handleVerify(v.plateNumber!),
                              hidden: !v.plateNumber,
                            },
                            { label: "View", onClick: () => setViewVehicle(v) },
                            { label: "Edit", onClick: () => setEditVehicle(v) },
                            {
                              label: "Delete",
                              onClick: () => handleDeleteVehicle(v),
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
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Plate</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Direction</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Gate</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Time</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Method</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading...</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No access logs found</td>
                  </tr>
                ) : (
                  logs.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3 font-mono font-medium">{l.plateNumber || "—"}</td>
                      <td className="px-4 py-3">{l.accessDirection || "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                            (l.accessStatus || "").toLowerCase().includes("grant")
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {l.accessStatus || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">{l.gateName || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                        {l.accessDateTime
                          ? new Date(l.accessDateTime).toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3">{l.accessMethod || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <ActionMenu
                          items={[
                            {
                              label: "Delete",
                              onClick: () => handleDeleteLog(l),
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
      </div>
      {viewVehicle && (
        <ViewDetailsModal
          title="Vehicle Details"
          data={viewVehicle}
          onClose={() => setViewVehicle(null)}
        />
      )}
      {editVehicle && (
        <UpdateModal
          title="Edit Vehicle"
          initialData={editVehicle}
          fields={[
            "plateNumber",
            "vehicleMake",
            "vehicleModel",
            "vehicleColor",
            "stickerNumber",
          ]}
          onClose={() => setEditVehicle(null)}
          onSave={async (upd) => {
            try {
              await api.put(API.vehicles.update, upd);
              toast.success("Vehicle updated");
              fetchVehicles();
            } catch (err: any) {
              toast.error(errMsg(err, "Update failed"));
            }
          }}
        />
      )}
    </div>
  );
}
