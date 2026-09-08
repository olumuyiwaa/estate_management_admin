"use client";

import { useEffect, useState } from "react";
import api from "@/app/api/axios";
import { toast } from "react-toastify";

interface AppUser {
  id: string;
  userName?: string;
  email?: string;
  roles?: string[];
  firstName?: string;
  lastName?: string;
  displayName?: string;
  otherName?: string;
  userCode?: string;
  mobileNo?: string;
  isLDAPUser?: boolean;
  isActive?: boolean;
  [key: string]: any;
}

interface RoleItem {
  id: string;
  name: string;
  description?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    email: "",
    mobileNo: "",
    isLDAPUser: false,
    isActive: true,
    roles: [] as string[],
  });

  const fetchUsers = async (q?: string) => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/Access/GetUsersWithSearch", {
        params: q ? { Search: q } : undefined,
      });
      // API may return array directly or wrapped
      const list = Array.isArray(data) ? data : data?.data ?? data?.items ?? [];
      setUsers(Array.isArray(list) ? list : []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const { data } = await api.get("/api/Roles/roles/getall-roles");
      const list = Array.isArray(data) ? data : data?.data ?? [];
      setRoles(Array.isArray(list) ? list : []);
    } catch {
      setRoles([]);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(search.trim() || undefined);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/Access/CreateUser", {
        firstName: form.firstName,
        lastName: form.lastName,
        userName: form.userName,
        email: form.email || null,
        mobileNo: form.mobileNo,
        isLDAPUser: form.isLDAPUser,
        isActive: form.isActive,
        roles: form.roles.length ? form.roles : null,
        tenantCode: "001",
      });
      toast.success("User created");
      setShowCreate(false);
      setForm({
        firstName: "",
        lastName: "",
        userName: "",
        email: "",
        mobileNo: "",
        isLDAPUser: false,
        isActive: true,
        roles: [],
      });
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (userName: string) => {
    if (!confirm(`Deactivate ${userName}?`)) return;
    try {
      await api.post("/api/Access/DeactivateUser", { userName });
      toast.success("User deactivated");
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Deactivate failed");
    }
  };

  const handleReActivate = async (userName: string) => {
    try {
      await api.post("/api/Access/ReActivateUser", { userName });
      toast.success("User reactivated");
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Reactivate failed");
    }
  };

  const handleResetPassword = async (userName: string) => {
    if (!confirm(`Reset password for ${userName}?`)) return;
    try {
      await api.post("/api/Access/ResetPasswordForUser", { userName });
      toast.success("Password reset initiated");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Reset failed");
    }
  };

  const toggleRole = (roleName: string) => {
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(roleName)
        ? prev.roles.filter((r) => r !== roleName)
        : [...prev.roles, roleName],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Users & Roles
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage portal users and role assignments
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg"
        >
          + Create User
        </button>
      </div>

      {/* Roles chips */}
      {roles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {roles.map((r) => (
            <span
              key={r.id}
              className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
            >
              {r.name}
              {r.description && r.description !== r.name ? ` — ${r.description}` : ""}
            </span>
          ))}
        </div>
      )}

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, username..."
          className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-sm font-medium rounded-lg"
        >
          Search
        </button>
      </form>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Create User</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name *</label>
                  <input
                    required
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name *</label>
                  <input
                    required
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Username *</label>
                <input
                  required
                  value={form.userName}
                  onChange={(e) => setForm({ ...form, userName: e.target.value })}
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
                <label className="block text-sm font-medium mb-1">Mobile No *</label>
                <input
                  required
                  value={form.mobileNo}
                  onChange={(e) => setForm({ ...form, mobileNo: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Roles</label>
                <div className="flex flex-wrap gap-2">
                  {roles.map((r) => (
                    <label
                      key={r.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border cursor-pointer ${
                        form.roles.includes(r.name)
                          ? "bg-brand-50 border-brand-500 text-brand-700"
                          : "border-gray-300 text-gray-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={form.roles.includes(r.name)}
                        onChange={() => toggleRole(r.name)}
                      />
                      {r.name}
                    </label>
                  ))}
                </div>
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
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Username</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Roles</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Phone</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No users found</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-medium">
                      {u.displayName ||
                        [u.firstName, u.lastName].filter(Boolean).join(" ") ||
                        "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {u.userName}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(u.roles || []).map((r) => (
                          <span
                            key={r}
                            className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-brand-50 text-brand-700"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">{u.mobileNo || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          u.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      {u.isActive ? (
                        <button
                          onClick={() => handleDeactivate(u.userName!)}
                          className="text-sm text-orange-600 font-medium"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReActivate(u.userName!)}
                          className="text-sm text-green-600 font-medium"
                        >
                          Reactivate
                        </button>
                      )}
                      <button
                        onClick={() => handleResetPassword(u.userName!)}
                        className="text-sm text-brand-600 font-medium"
                      >
                        Reset PW
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
