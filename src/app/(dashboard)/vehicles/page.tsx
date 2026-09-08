"use client";

import { useEffect, useState } from "react";
import api from "@/app/api/axios";
import { ApiResponse, PagedData } from "@/app/api/types";
import { toast } from "react-toastify";
import ViewDetailsModal from "@/components/common/ViewDetailsModal";
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
  [key: string]: any;
}

export default function VehiclesPage() {
  const [tab, setTab] = useState<"vehicles" | "logs">("vehicles");
  const [vehicles, setVehicles] = useState<ResidentVehicle[]>([]);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    residentId: 16,
    plateNumber: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleColor: "",
    vehicleYear: new Date().getFullYear(),
    stickerNumber: "",
    isPrimaryVehicle: false,
  });
  const [viewVehicle, setViewVehicle] = useState<ResidentVehicle | null>(null);
  const [editVehicle, setEditVehicle] = useState<ResidentVehicle | null>(null);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<ApiResponse<PagedData<ResidentVehicle>>>(
        "/api/ResidentVehicles/SearchResidentVehicles"
      );
      const page = data?.data;
      setVehicles(page?.items ?? (Array.isArray(data?.data) ? (data.data as any) : []));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load vehicles");
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<ApiResponse<PagedData<AccessLog>>>(
        "/api/VehicleAccessLogs/SearchLog"
      );
      const page = data?.data;
      setLogs(page?.items ?? []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load access logs");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "vehicles") fetchVehicles();
    else fetchLogs();
  }, [tab]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/ResidentVehicles/CreateResidentVehicle", form);
      toast.success("Vehicle registered");
      setShowForm(false);
      setForm({
        residentId: 16,
        plateNumber: "",
        vehicleMake: "",
        vehicleModel: "",
        vehicleColor: "",
        vehicleYear: new Date().getFullYear(),
        stickerNumber: "",
        isPrimaryVehicle: false,
      });
      fetchVehicles();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to register vehicle");
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async (plate: string) => {
    try {
      const { data } = await api.get("/api/ResidentVehicles/VerifyVehicleAccess", {
        params: { plateNumber: plate },
      });
      toast.info(data?.message || data?.data?.verificationMessage || JSON.stringify(data?.data ?? data));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Verification failed");
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
        {tab === "vehicles" && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg"
          >
            + Register Vehicle
          </button>
        )}
      </div>

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
                  value={form.residentId}
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
                          <div className="flex justify-end gap-3">
                            {v.plateNumber && (
                              <button
                                onClick={() => handleVerify(v.plateNumber!)}
                                className="text-sm text-brand-600 font-medium"
                              >
                                Verify
                              </button>
                            )}
                            <button onClick={() => setViewVehicle(v)} className="text-sm text-gray-600">View</button>
                            <button onClick={() => setEditVehicle(v)} className="text-sm text-brand-600">Edit</button>
                          </div>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No access logs found</td>
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {viewVehicle && (
        <ViewDetailsModal title="Vehicle Details" data={viewVehicle} onClose={() => setViewVehicle(null)} />
      )}
      {editVehicle && (
        <UpdateModal
          title="Edit Vehicle"
          initialData={editVehicle}
          fields={["plateNumber", "vehicleMake", "vehicleModel", "vehicleColor", "stickerNumber"]}
          onClose={() => setEditVehicle(null)}
          onSave={async (upd) => {
            try {
              await api.put("/api/ResidentVehicles/UpdateResidentVehicle", upd);
              toast.success("Vehicle updated");
              fetchVehicles();
            } catch (err: any) {
              toast.error(err?.response?.data?.message || "Update failed");
            }
          }}
        />
      )}
    </div>
  );
}
