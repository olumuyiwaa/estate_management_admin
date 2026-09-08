"use client";

import { useEffect, useState } from "react";
import api from "@/app/api/axios";
import { Resident, ApiResponse, PagedData } from "@/app/api/types";
import { toast } from "react-toastify";
import Pagination from "@/components/common/Pagination";
import ViewDetailsModal from "@/components/common/ViewDetailsModal";
import UpdateModal from "@/components/common/UpdateModal";

export default function ResidentsPage() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobileNo: "",
    address: "",
    residentType: "Owner",
    title: "Mr",
    sex: "Male",
  });
  const [saving, setSaving] = useState(false);
  const [viewResident, setViewResident] = useState<Resident | null>(null);
  const [editResident, setEditResident] = useState<Resident | null>(null);

  const fetchResidents = async (q?: string, pageNum = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get<ApiResponse<PagedData<Resident>>>(
        "/api/Residents/SearchResidents",
        {
          params: {
            ...(q ? { Search: q } : {}),
            PageNumber: pageNum,
            PageSize: pageSize,
          },
        }
      );
      const p = data?.data;
      setResidents(p?.items ?? []);
      setTotal(p?.totalRecords ?? p?.items?.length ?? 0);
      setTotalPages(p?.totalPages || Math.max(1, Math.ceil((p?.totalRecords || 0) / pageSize)));
      setPage(pageNum);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to load residents");
      setResidents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResidents(search.trim() || undefined, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (page !== 1) setPage(1);
    else fetchResidents(search.trim() || undefined, 1);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/Residents/CreateResident", form);
      toast.success("Resident created successfully");
      setShowForm(false);
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        mobileNo: "",
        address: "",
        residentType: "Owner",
        title: "Mr",
        sex: "Male",
      });
      fetchResidents();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create resident");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Residents
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {total > 0 ? `${total} residents` : "Manage estate residents"}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Add Resident
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, code..."
          className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-sm font-medium rounded-lg"
        >
          Search
        </button>
      </form>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Add New Resident</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <select
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  >
                    <option>Mr</option>
                    <option>Mrs</option>
                    <option>Miss</option>
                    <option>Dr</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={form.residentType}
                    onChange={(e) =>
                      setForm({ ...form, residentType: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  >
                    <option>Owner</option>
                    <option>Tenant</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    First Name *
                  </label>
                  <input
                    required
                    value={form.firstName}
                    onChange={(e) =>
                      setForm({ ...form, firstName: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Last Name *
                  </label>
                  <input
                    required
                    value={form.lastName}
                    onChange={(e) =>
                      setForm({ ...form, lastName: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  />
                </div>
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
                <label className="block text-sm font-medium mb-1">
                  Mobile No *
                </label>
                <input
                  required
                  value={form.mobileNo}
                  onChange={(e) =>
                    setForm({ ...form, mobileNo: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sex</label>
                <select
                  value={form.sex}
                  onChange={(e) => setForm({ ...form, sex: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                >
                  <option>Male</option>
                  <option>Female</option>
                </select>
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
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Code
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Type
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Phone
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : residents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No residents found
                  </td>
                </tr>
              ) : (
                residents.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      {r.residentCode || "—"}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {[r.title, r.firstName, r.middleName, r.lastName]
                        .filter(Boolean)
                        .join(" ")}
                    </td>
                    <td className="px-4 py-3">{r.residentType || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {r.email || "—"}
                    </td>
                    <td className="px-4 py-3">{r.mobileNo || r.phoneNo || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          r.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {r.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => setViewResident(r)}
                        className="text-sm text-gray-600 dark:text-gray-300 mr-2"
                      >
                        View
                      </button>
                      <button
                        onClick={() => setEditResident(r)}
                        className="text-sm text-brand-600 font-medium"
                      >
                        Edit
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
      </div>
      {viewResident && (
        <ViewDetailsModal
          title="Resident Details"
          data={viewResident}
          onClose={() => setViewResident(null)}
        />
      )}
      {editResident && (
        <UpdateModal
          title="Edit Resident"
          initialData={editResident}
          fields={["firstName", "lastName", "email", "mobileNo", "address", "residentType"]}
          onClose={() => setEditResident(null)}
          onSave={async (upd) => {
            try {
              await api.put("/api/Residents/UpdateResident", upd);
              toast.success("Resident updated");
              fetchResidents();
            } catch (err: any) {
              toast.error(err?.response?.data?.message || "Update failed");
            }
          }}
        />
      )}
    </div>
  );
}
