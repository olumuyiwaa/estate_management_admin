"use client";

import { useEffect, useState } from "react";
import api from "@/app/api/axios";
import { API } from "@/app/api/endpoints";
import { extractList, errMsg } from "@/app/api/helpers";
import { toast } from "react-toastify";
import ActionMenu from "@/components/common/ActionMenu";

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

interface PermissionRow {
  moduleName: string;
  canRead: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const DEFAULT_MODULES = [
  "UserManagement",
  "Issues",
  "Residents",
  "Staff",
  "Visitors",
  "ServiceRequests",
  "Collections",
  "Announcements",
  "Marketplace",
  "Vehicles",
  "Notifications",
];

const emptyForm = {
  firstName: "",
  lastName: "",
  userName: "",
  email: "",
  mobileNo: "",
  isLDAPUser: false,
  isActive: true,
  roles: [] as string[],
};

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [roleForm, setRoleForm] = useState({ roleName: "", description: "" });
  const [assignUser, setAssignUser] = useState<AppUser | null>(null);
  const [assignRoles, setAssignRoles] = useState<string[]>([]);
  const [roleSaving, setRoleSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // Role permissions editor
  const [permRole, setPermRole] = useState<RoleItem | null>(null);
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [permSaving, setPermSaving] = useState(false);

  const fetchUsers = async (q?: string) => {
    setLoading(true);
    try {
      const { data } = await api.get(API.access.getUsers, {
        params: q ? { Search: q } : undefined,
      });
      setUsers(extractList<AppUser>(data));
    } catch (err: any) {
      toast.error(errMsg(err, "Failed to load users"));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const { data } = await api.get(API.roles.getAll);
      const list = extractList<any>(data);
      setRoles(
        list.map((r: any) => ({
          id: String(r.id ?? r.roleId ?? r.name),
          name: r.name ?? r.roleName ?? String(r),
          description: r.description,
        }))
      );
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
      await api.post(API.access.createUser, {
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
      setForm(emptyForm);
      fetchUsers();
    } catch (err: any) {
      toast.error(errMsg(err, "Failed to create user"));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (u: AppUser) => {
    setEditUser(u);
    setForm({
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      userName: u.userName || "",
      email: u.email || "",
      mobileNo: u.mobileNo || "",
      isLDAPUser: !!u.isLDAPUser,
      isActive: u.isActive !== false,
      roles: [...(u.roles || [])],
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser?.userName) return;
    setSaving(true);
    try {
      await api.post(API.access.updateUser, {
        firstName: form.firstName,
        lastName: form.lastName,
        userName: form.userName,
        email: form.email || null,
        mobileNo: form.mobileNo,
        isLDAPUser: form.isLDAPUser,
        isActive: form.isActive,
        roles: form.roles.length ? form.roles : null,
        tenantCode: "001",
        displayName: [form.firstName, form.lastName].filter(Boolean).join(" ") || null,
        userCode: editUser.userCode || null,
        otherName: editUser.otherName || null,
      });
      toast.success("User updated");
      setEditUser(null);
      setForm(emptyForm);
      fetchUsers(search.trim() || undefined);
    } catch (err: any) {
      toast.error(errMsg(err, "Failed to update user"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userName: string) => {
    if (!confirm(`Permanently delete user ${userName}? This cannot be undone.`)) return;
    try {
      await api.delete(API.access.deleteUser, { params: { username: userName } });
      toast.success("User deleted");
      fetchUsers(search.trim() || undefined);
    } catch (err: any) {
      toast.error(errMsg(err, "Delete failed"));
    }
  };

  const handleDeactivate = async (userName: string) => {
    if (!confirm(`Deactivate ${userName}?`)) return;
    try {
      await api.post(API.access.deactivate, null, { params: { username: userName } });
      toast.success("User deactivated");
      fetchUsers(search.trim() || undefined);
    } catch (err: any) {
      toast.error(errMsg(err, "Deactivate failed"));
    }
  };

  const handleReActivate = async (userName: string) => {
    try {
      await api.post(API.access.reactivate, null, { params: { username: userName } });
      toast.success("User reactivated");
      fetchUsers(search.trim() || undefined);
    } catch (err: any) {
      toast.error(errMsg(err, "Reactivate failed"));
    }
  };

  const handleResetPassword = async (userName: string) => {
    if (!confirm(`Reset password for ${userName}?`)) return;
    try {
      await api.post(API.access.resetPassword, { userName });
      toast.success("Password reset initiated");
    } catch (err: any) {
      toast.error(errMsg(err, "Reset failed"));
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoleSaving(true);
    try {
      await api.post(API.roles.create, {
        roleName: roleForm.roleName,
        description: roleForm.description || roleForm.roleName,
      });
      toast.success("Role created");
      setShowCreateRole(false);
      setRoleForm({ roleName: "", description: "" });
      fetchRoles();
    } catch (err: any) {
      toast.error(errMsg(err, "Failed to create role"));
    } finally {
      setRoleSaving(false);
    }
  };

  /** Sync roles: add new, remove unchecked */
  const handleAssignRoles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignUser?.userName) return;
    setRoleSaving(true);
    try {
      const current = assignUser.roles || [];
      const toAdd = assignRoles.filter((r) => !current.includes(r));
      const toRemove = current.filter((r) => !assignRoles.includes(r));

      if (toAdd.length) {
        await api.post(API.access.addUserToRoles, {
          userName: assignUser.userName,
          roles: toAdd,
        });
      }
      if (toRemove.length) {
        await api.post(API.access.removeFromMultipleRoles, {
          userName: assignUser.userName,
          roles: toRemove,
        });
      }
      toast.success("Roles updated");
      setAssignUser(null);
      setAssignRoles([]);
      fetchUsers(search.trim() || undefined);
    } catch (err: any) {
      toast.error(errMsg(err, "Failed to assign roles"));
    } finally {
      setRoleSaving(false);
    }
  };

  const openPermissions = async (role: RoleItem) => {
    setPermRole(role);
    setPermissions(
      DEFAULT_MODULES.map((m) => ({
        moduleName: m,
        canRead: false,
        canAdd: false,
        canEdit: false,
        canDelete: false,
      }))
    );
    try {
      const { data } = await api.get(API.roles.permissionsForRole(role.name));
      const list: PermissionRow[] =
        extractList(data) ||
        data?.data?.permissions ||
        data?.permissions ||
        [];
      if (Array.isArray(list) && list.length) {
        const byModule = new Map(
          list.map((p: any) => [
            p.moduleName,
            {
              moduleName: p.moduleName,
              canRead: !!p.canRead,
              canAdd: !!p.canAdd,
              canEdit: !!p.canEdit,
              canDelete: !!p.canDelete,
            },
          ])
        );
        setPermissions(
          DEFAULT_MODULES.map(
            (m) =>
              byModule.get(m) || {
                moduleName: m,
                canRead: false,
                canAdd: false,
                canEdit: false,
                canDelete: false,
              }
          )
        );
      }
    } catch {
      // keep defaults
    }
  };

  const handleSavePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permRole) return;
    setPermSaving(true);
    try {
      // Prefer bulk update when role id is available
      if (permRole.id && permRole.id !== permRole.name) {
        await api.post(API.roles.updateWithPermissions, {
          roleId: permRole.id,
          roleName: permRole.name,
          description: permRole.description || permRole.name,
          permissions: permissions,
        });
      } else {
        // Fallback: set each module permission
        for (const p of permissions) {
          await api.post(API.roles.setPermission, {
            roleName: permRole.name,
            moduleName: p.moduleName,
            canRead: p.canRead,
            canAdd: p.canAdd,
            canEdit: p.canEdit,
            canDelete: p.canDelete,
          });
        }
      }
      toast.success("Permissions saved");
      setPermRole(null);
    } catch (err: any) {
      toast.error(errMsg(err, "Failed to save permissions"));
    } finally {
      setPermSaving(false);
    }
  };

  const toggleFormRole = (roleName: string) => {
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(roleName)
        ? prev.roles.filter((r) => r !== roleName)
        : [...prev.roles, roleName],
    }));
  };

  const setPerm = (
    moduleName: string,
    field: keyof Omit<PermissionRow, "moduleName">,
    value: boolean
  ) => {
    setPermissions((prev) =>
      prev.map((p) => (p.moduleName === moduleName ? { ...p, [field]: value } : p))
    );
  };

  const userFormFields = (
    onSubmit: (e: React.FormEvent) => void,
    title: string,
    submitLabel: string,
    onCancel: () => void,
    usernameLocked = false
  ) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        <form onSubmit={onSubmit} className="space-y-4">
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
              disabled={usernameLocked}
              value={form.userName}
              onChange={(e) => setForm({ ...form, userName: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm disabled:opacity-60"
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
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Active
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isLDAPUser}
                onChange={(e) => setForm({ ...form, isLDAPUser: e.target.checked })}
              />
              LDAP user
            </label>
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
                    onChange={() => toggleFormRole(r.name)}
                  />
                  {r.name}
                </label>
              ))}
            </div>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Users & Roles
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage portal users, role assignments, and permissions
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowCreateRole(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium rounded-lg"
          >
            + Create Role
          </button>
          <button
            onClick={() => {
              setForm(emptyForm);
              setShowCreate(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg"
          >
            + Create User
          </button>
        </div>
      </div>

      {/* Roles chips — click to manage permissions */}
      {roles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {roles.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => openPermissions(r)}
              title="Click to manage permissions"
              className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 hover:ring-2 hover:ring-brand-300"
            >
              {r.name}
              {r.description && r.description !== r.name ? ` — ${r.description}` : ""}
            </button>
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

      {showCreate &&
        userFormFields(
          handleCreate,
          "Create User",
          "Create",
          () => setShowCreate(false)
        )}

      {editUser &&
        userFormFields(
          handleUpdate,
          `Edit User — ${editUser.userName}`,
          "Save changes",
          () => {
            setEditUser(null);
            setForm(emptyForm);
          },
          true
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
                  <tr key={u.id || u.userName} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
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
                    <td className="px-4 py-3 text-right">
                      <ActionMenu
                        items={[
                          {
                            label: "Edit",
                            onClick: () => openEdit(u),
                          },
                          {
                            label: "Deactivate",
                            onClick: () => handleDeactivate(u.userName!),
                            variant: "warning",
                            hidden: !u.isActive,
                          },
                          {
                            label: "Reactivate",
                            onClick: () => handleReActivate(u.userName!),
                            variant: "success",
                            hidden: !!u.isActive,
                          },
                          {
                            label: "Roles",
                            onClick: () => {
                              setAssignUser(u);
                              setAssignRoles([...(u.roles || [])]);
                            },
                          },
                          {
                            label: "Reset password",
                            onClick: () => handleResetPassword(u.userName!),
                          },
                          {
                            label: "Delete",
                            onClick: () => handleDelete(u.userName!),
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
        </div>
      </div>

      {showCreateRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Create Role</h2>
            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Role name *</label>
                <input
                  required
                  value={roleForm.roleName}
                  onChange={(e) => setRoleForm({ ...roleForm, roleName: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  placeholder="e.g. SecurityOfficer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateRole(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={roleSaving}
                  className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm disabled:opacity-60"
                >
                  {roleSaving ? "Saving…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {assignUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-1">Assign roles</h2>
            <p className="text-sm text-gray-500 mb-4">{assignUser.userName}</p>
            <p className="text-xs text-gray-400 mb-3">
              Uncheck a role to remove it from this user.
            </p>
            <form onSubmit={handleAssignRoles} className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => (
                  <label
                    key={r.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border cursor-pointer ${
                      assignRoles.includes(r.name)
                        ? "bg-brand-50 border-brand-500 text-brand-700"
                        : "border-gray-300 text-gray-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={assignRoles.includes(r.name)}
                      onChange={() =>
                        setAssignRoles((prev) =>
                          prev.includes(r.name)
                            ? prev.filter((x) => x !== r.name)
                            : [...prev, r.name]
                        )
                      }
                    />
                    {r.name}
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setAssignUser(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={roleSaving}
                  className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm disabled:opacity-60"
                >
                  {roleSaving ? "Saving…" : "Save roles"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {permRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-1">Permissions — {permRole.name}</h2>
            <p className="text-sm text-gray-500 mb-4">
              Toggle module access for this role
            </p>
            <form onSubmit={handleSavePermissions}>
              <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-3 py-2 text-left">Module</th>
                      <th className="px-3 py-2 text-center">Read</th>
                      <th className="px-3 py-2 text-center">Add</th>
                      <th className="px-3 py-2 text-center">Edit</th>
                      <th className="px-3 py-2 text-center">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {permissions.map((p) => (
                      <tr key={p.moduleName}>
                        <td className="px-3 py-2 font-medium">{p.moduleName}</td>
                        {(["canRead", "canAdd", "canEdit", "canDelete"] as const).map(
                          (field) => (
                            <td key={field} className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={p[field]}
                                onChange={(e) =>
                                  setPerm(p.moduleName, field, e.target.checked)
                                }
                              />
                            </td>
                          )
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setPermRole(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={permSaving}
                  className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm disabled:opacity-60"
                >
                  {permSaving ? "Saving…" : "Save permissions"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
