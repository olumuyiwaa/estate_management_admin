"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/app/api/axios";
import { API } from "@/app/api/endpoints";
import { StaffMember, ApiResponse, PagedData } from "@/app/api/types";
import { toast } from "react-toastify";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import Modal from "@/components/common/Modal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import Pagination from "@/components/common/Pagination";

type Dept = { id: number; name?: string; departmentName?: string; code?: string };

const emptyForm = {
  firstName: "",
  lastName: "",
  middleName: "",
  email: "",
  phoneNumber: "",
  gender: "Male",
  position: "",
  departmentId: "" as string | number,
  residentialAddress: "",
  employmentDate: "",
  notes: "",
  isActive: true,
  withAccount: true,
  roles: [] as string[],
};

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchStaff = useCallback(
    async (q?: string, pageNum = 1) => {
      setLoading(true);
      try {
        const { data } = await api.get<
          ApiResponse<PagedData<StaffMember> | StaffMember[]>
        >(API.staff.getByCriteria, {
          params: {
            ...(q ? { Search: q } : {}),
            PageNumber: pageNum,
            PageSize: pageSize,
          },
        });
        const payload = data?.data;
        if (Array.isArray(payload)) {
          setStaff(payload);
          setTotal(payload.length);
          setTotalPages(1);
        } else if (payload && "items" in payload) {
          const p = payload as PagedData<StaffMember>;
          setStaff(p.items ?? []);
          setTotal(p.totalRecords ?? 0);
          setTotalPages(
            p.totalPages ||
              Math.max(1, Math.ceil((p.totalRecords || 0) / pageSize))
          );
        } else {
          setStaff([]);
          setTotal(0);
        }
        setPage(pageNum);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to load staff");
        setStaff([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchDepartments = async () => {
    try {
      const { data } = await api.get(API.staff.departments);
      const list = Array.isArray(data) ? data : data?.data ?? [];
      setDepartments(Array.isArray(list) ? list : []);
    } catch {
      setDepartments([]);
    }
  };

  useEffect(() => {
    fetchStaff(search.trim() || undefined, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (s: StaffMember) => {
    setEditing(s);
    setForm({
      firstName: s.firstName || "",
      lastName: s.lastName || "",
      middleName: s.middleName || "",
      email: s.email || "",
      phoneNumber: s.phoneNumber || "",
      gender: s.gender || "Male",
      position: s.position || "",
      departmentId: s.departmentId ?? "",
      residentialAddress: (s as any).residentialAddress || "",
      employmentDate: (s as any).employmentDate
        ? String((s as any).employmentDate).slice(0, 10)
        : "",
      notes: (s as any).notes || "",
      isActive: s.isActive !== false,
      withAccount: false,
      roles: [],
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(API.staff.update, {
          id: editing.id,
          firstName: form.firstName,
          middleName: form.middleName || null,
          lastName: form.lastName,
          gender: form.gender,
          phoneNumber: form.phoneNumber,
          email: form.email || null,
          departmentId: form.departmentId
            ? Number(form.departmentId)
            : null,
          position: form.position || null,
          employmentDate: form.employmentDate || null,
          residentialAddress: form.residentialAddress || null,
          notes: form.notes || null,
          isActive: form.isActive,
          rowVersion: (editing as any).rowVersion || null,
        });
        toast.success("Staff updated");
      } else if (form.withAccount) {
        await api.post(API.staff.createWithAccount, {
          firstName: form.firstName,
          lastName: form.lastName,
          otherName: form.middleName || null,
          email: form.email || null,
          mobileNo: form.phoneNumber,
          phoneNumber: form.phoneNumber,
          gender: form.gender,
          sex: form.gender,
          departmentId: form.departmentId
            ? Number(form.departmentId)
            : null,
          position: form.position || null,
          employmentDate: form.employmentDate || null,
          residentialAddress: form.residentialAddress || null,
          notes: form.notes || null,
          isActive: form.isActive,
          roles: form.roles.length ? form.roles : null,
        });
        toast.success("Staff created with user account");
      } else {
        await api.post(API.staff.create, {
          firstName: form.firstName,
          middleName: form.middleName || null,
          lastName: form.lastName,
          gender: form.gender,
          phoneNumber: form.phoneNumber,
          email: form.email || null,
          departmentId: form.departmentId
            ? Number(form.departmentId)
            : null,
          position: form.position || null,
          employmentDate: form.employmentDate || null,
          residentialAddress: form.residentialAddress || null,
          notes: form.notes || null,
          isActive: form.isActive,
        });
        toast.success("Staff created");
      }
      setShowForm(false);
      fetchStaff(search.trim() || undefined, page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(API.staff.delete(deleteTarget.id));
      toast.success("Staff deleted");
      setDeleteTarget(null);
      fetchStaff(search.trim() || undefined, page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (page !== 1) setPage(1);
    else fetchStaff(search.trim() || undefined, 1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        description={
          total > 0
            ? `${total} staff member${total === 1 ? "" : "s"}`
            : "Estate staff directory and accounts"
        }
        actions={
          <button
            onClick={openCreate}
            className="inline-flex items-center px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg shadow-sm"
          >
            + Add Staff
          </button>
        }
      />

      <form onSubmit={onSearch} className="flex gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, position…"
          className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-sm font-medium rounded-lg"
        >
          Search
        </button>
      </form>

      <DataTable
        loading={loading}
        rows={staff}
        rowKey={(s) => s.id}
        emptyTitle="No staff found"
        emptyDescription="Add staff members or register them with portal access."
        emptyAction={
          <button
            onClick={openCreate}
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            Add first staff member
          </button>
        }
        columns={[
          {
            key: "code",
            header: "Code",
            render: (s) => (
              <span className="font-mono text-xs text-gray-600 dark:text-gray-300">
                {s.staffCode || "—"}
              </span>
            ),
          },
          {
            key: "name",
            header: "Name",
            render: (s) => (
              <span className="font-medium text-gray-900 dark:text-white">
                {s.fullName ||
                  [s.firstName, s.lastName].filter(Boolean).join(" ")}
              </span>
            ),
          },
          {
            key: "position",
            header: "Position",
            render: (s) => s.position || "—",
          },
          {
            key: "dept",
            header: "Department",
            render: (s) => s.departmentName || s.departmentCode || "—",
          },
          {
            key: "phone",
            header: "Phone",
            render: (s) => s.phoneNumber || "—",
          },
          {
            key: "email",
            header: "Email",
            render: (s) => (
              <span className="text-gray-600 dark:text-gray-300">
                {s.email || "—"}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (s) => <StatusBadge status={s.isActive} />,
          },
          {
            key: "actions",
            header: "Actions",
            className: "text-right",
            render: (s) => (
              <div className="flex justify-end gap-2 whitespace-nowrap">
                <button
                  onClick={() => openEdit(s)}
                  className="text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteTarget(s)}
                  className="text-sm font-medium text-red-600 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            ),
          },
        ]}
      />

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {showForm && (
        <Modal
          title={editing ? "Edit Staff" : "Add Staff"}
          onClose={() => setShowForm(false)}
          size="lg"
          footer={
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="staff-form"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm disabled:opacity-60"
              >
                {saving ? "Saving…" : editing ? "Update" : "Create"}
              </button>
            </div>
          }
        >
          <form id="staff-form" onSubmit={handleSave} className="space-y-4">
            {!editing && (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.withAccount}
                  onChange={(e) =>
                    setForm({ ...form, withAccount: e.target.checked })
                  }
                  className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <span>
                  Create portal user account{" "}
                  <span className="text-gray-500">
                    (CreateAndRegisterNewStaffAccount)
                  </span>
                </span>
              </label>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field
                label="First name *"
                required
                value={form.firstName}
                onChange={(v) => setForm({ ...form, firstName: v })}
              />
              <Field
                label="Last name *"
                required
                value={form.lastName}
                onChange={(v) => setForm({ ...form, lastName: v })}
              />
              <Field
                label="Middle name"
                value={form.middleName}
                onChange={(v) => setForm({ ...form, middleName: v })}
              />
              <div>
                <label className="block text-sm font-medium mb-1">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) =>
                    setForm({ ...form, gender: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <Field
                label="Phone *"
                required
                value={form.phoneNumber}
                onChange={(v) => setForm({ ...form, phoneNumber: v })}
              />
              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
              />
              <Field
                label="Position"
                value={form.position}
                onChange={(v) => setForm({ ...form, position: v })}
              />
              <div>
                <label className="block text-sm font-medium mb-1">
                  Department
                </label>
                <select
                  value={form.departmentId}
                  onChange={(e) =>
                    setForm({ ...form, departmentId: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                >
                  <option value="">— Select —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.departmentName || d.name || d.code || d.id}
                    </option>
                  ))}
                </select>
              </div>
              <Field
                label="Employment date"
                type="date"
                value={form.employmentDate}
                onChange={(v) => setForm({ ...form, employmentDate: v })}
              />
              <Field
                label="Address"
                value={form.residentialAddress}
                onChange={(v) =>
                  setForm({ ...form, residentialAddress: v })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.checked })
                }
                className="rounded border-gray-300 text-brand-500"
              />
              Active
            </label>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete staff"
        message={`Soft-delete ${
          deleteTarget?.fullName ||
          [deleteTarget?.firstName, deleteTarget?.lastName]
            .filter(Boolean)
            .join(" ") ||
          "this staff member"
        }? This can usually be reversed on the backend.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      />
    </div>
  );
}
