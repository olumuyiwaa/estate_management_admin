"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/app/api/axios";
import { API } from "@/app/api/endpoints";
import { ApiResponse, PagedData } from "@/app/api/types";
import { toast } from "react-toastify";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import Modal from "@/components/common/Modal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import Pagination from "@/components/common/Pagination";

type CollectionConfig = {
  id: number;
  collectionCode?: string;
  collectionName?: string;
  displayName?: string;
  description?: string;
  amount?: number;
  frequency?: string;
  dueDay?: number;
  gracePeriodDays?: number;
  penaltyAmount?: number;
  isPenaltyEnabled?: boolean;
  isMandatory?: boolean;
  isActive?: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  rowVersion?: string;
  [key: string]: any;
};

const emptyForm = {
  collectionCode: "",
  collectionName: "",
  description: "",
  amount: "",
  frequency: "Monthly",
  dueDay: "1",
  gracePeriodDays: "0",
  penaltyAmount: "0",
  isPenaltyEnabled: false,
  isMandatory: true,
  isActive: true,
  effectiveFrom: "",
  effectiveTo: "",
};

export default function CollectionsConfigPage() {
  const [items, setItems] = useState<CollectionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "active">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CollectionConfig | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CollectionConfig | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  const fetchList = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      try {
        const endpoint =
          tab === "active"
            ? API.collectionConfig.active
            : API.collectionConfig.search;
        const { data } = await api.get<
          ApiResponse<PagedData<CollectionConfig> | CollectionConfig[]>
        >(endpoint, {
          params: { PageNumber: pageNum, PageSize: pageSize },
        });
        const payload = data?.data;
        if (Array.isArray(payload)) {
          setItems(payload);
          setTotalPages(1);
        } else if (payload && "items" in payload) {
          setItems(payload.items ?? []);
          setTotalPages(
            payload.totalPages ||
              Math.max(1, Math.ceil((payload.totalRecords || 0) / pageSize))
          );
        } else {
          setItems([]);
        }
        setPage(pageNum);
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message || "Failed to load configurations"
        );
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [tab]
  );

  useEffect(() => {
    fetchList(1);
  }, [fetchList]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (c: CollectionConfig) => {
    setEditing(c);
    setForm({
      collectionCode: c.collectionCode || "",
      collectionName: c.collectionName || c.displayName || "",
      description: c.description || "",
      amount: String(c.amount ?? ""),
      frequency: c.frequency || "Monthly",
      dueDay: String(c.dueDay ?? 1),
      gracePeriodDays: String(c.gracePeriodDays ?? 0),
      penaltyAmount: String(c.penaltyAmount ?? 0),
      isPenaltyEnabled: !!c.isPenaltyEnabled,
      isMandatory: c.isMandatory !== false,
      isActive: c.isActive !== false,
      effectiveFrom: c.effectiveFrom ? String(c.effectiveFrom).slice(0, 10) : "",
      effectiveTo: c.effectiveTo ? String(c.effectiveTo).slice(0, 10) : "",
    });
    setShowForm(true);
  };

  const payloadFromForm = () => ({
    collectionCode: form.collectionCode || null,
    collectionName: form.collectionName,
    description: form.description || null,
    amount: Number(form.amount) || 0,
    frequency: form.frequency,
    dueDay: Number(form.dueDay) || 1,
    gracePeriodDays: Number(form.gracePeriodDays) || 0,
    penaltyAmount: Number(form.penaltyAmount) || 0,
    isPenaltyEnabled: form.isPenaltyEnabled,
    isMandatory: form.isMandatory,
    isActive: form.isActive,
    effectiveFrom: form.effectiveFrom || null,
    effectiveTo: form.effectiveTo || null,
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(API.collectionConfig.update, {
          id: editing.id,
          ...payloadFromForm(),
          rowVersion: editing.rowVersion || null,
        });
        toast.success("Configuration updated");
      } else {
        await api.post(API.collectionConfig.create, payloadFromForm());
        toast.success("Configuration created");
      }
      setShowForm(false);
      fetchList(page);
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
      await api.delete(API.collectionConfig.delete, {
        params: { id: deleteTarget.id },
      });
      toast.success("Configuration deleted");
      setDeleteTarget(null);
      fetchList(page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const formatMoney = (n?: number) =>
    typeof n === "number"
      ? n.toLocaleString(undefined, {
          style: "currency",
          currency: "NGN",
          maximumFractionDigits: 0,
        })
      : "—";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collection types"
        description="Billing configurations (dues, levies, fees) used to generate resident collections"
        actions={
          <button
            onClick={openCreate}
            className="inline-flex items-center px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg shadow-sm"
          >
            + New configuration
          </button>
        }
      />

      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
        {(
          [
            ["all", "All"],
            ["active", "Active only"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              tab === key
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <DataTable
        loading={loading}
        rows={items}
        rowKey={(r) => r.id}
        emptyTitle="No collection configurations"
        emptyDescription="Define fee types (e.g. monthly service charge) before generating collections."
        emptyAction={
          <button
            onClick={openCreate}
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            Create configuration
          </button>
        }
        columns={[
          {
            key: "code",
            header: "Code",
            render: (c) => (
              <span className="font-mono text-xs">{c.collectionCode || "—"}</span>
            ),
          },
          {
            key: "name",
            header: "Name",
            render: (c) => (
              <div>
                <p className="font-medium">
                  {c.displayName || c.collectionName}
                </p>
                {c.description && (
                  <p className="text-xs text-gray-500 truncate max-w-[220px]">
                    {c.description}
                  </p>
                )}
              </div>
            ),
          },
          {
            key: "amount",
            header: "Amount",
            render: (c) => (
              <span className="tabular-nums font-medium">
                {formatMoney(c.amount)}
              </span>
            ),
          },
          {
            key: "freq",
            header: "Frequency",
            render: (c) => c.frequency || "—",
          },
          {
            key: "due",
            header: "Due day",
            render: (c) => c.dueDay ?? "—",
          },
          {
            key: "flags",
            header: "Flags",
            render: (c) => (
              <div className="flex flex-wrap gap-1">
                {c.isMandatory && <StatusBadge label="Mandatory" tone="orange" />}
                {c.isPenaltyEnabled && (
                  <StatusBadge label="Penalty" tone="red" />
                )}
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (c) => <StatusBadge status={c.isActive} />,
          },
          {
            key: "actions",
            header: "Actions",
            className: "text-right",
            render: (c) => (
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => openEdit(c)}
                  className="text-sm font-medium text-brand-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteTarget(c)}
                  className="text-sm font-medium text-red-600"
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
          onPageChange={(p) => {
            setPage(p);
            fetchList(p);
          }}
        />
      )}

      {showForm && (
        <Modal
          title={editing ? "Edit configuration" : "New configuration"}
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
                form="cfg-form"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm disabled:opacity-60"
              >
                {saving ? "Saving…" : editing ? "Update" : "Create"}
              </button>
            </div>
          }
        >
          <form id="cfg-form" onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Code</label>
                <input
                  value={form.collectionCode}
                  onChange={(e) =>
                    setForm({ ...form, collectionCode: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  placeholder="e.g. SVC-MONTHLY"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Name *
                </label>
                <input
                  required
                  value={form.collectionName}
                  onChange={(e) =>
                    setForm({ ...form, collectionName: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Amount *
                </label>
                <input
                  required
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({ ...form, amount: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Frequency
                </label>
                <select
                  value={form.frequency}
                  onChange={(e) =>
                    setForm({ ...form, frequency: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                >
                  <option>Monthly</option>
                  <option>Yearly</option>
                  <option>Quarterly</option>
                  <option>OneTime</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due day</label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={form.dueDay}
                  onChange={(e) =>
                    setForm({ ...form, dueDay: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Grace period (days)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.gracePeriodDays}
                  onChange={(e) =>
                    setForm({ ...form, gracePeriodDays: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Penalty amount
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.penaltyAmount}
                  onChange={(e) =>
                    setForm({ ...form, penaltyAmount: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Effective from
                </label>
                <input
                  type="date"
                  value={form.effectiveFrom}
                  onChange={(e) =>
                    setForm({ ...form, effectiveFrom: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Effective to
                </label>
                <input
                  type="date"
                  value={form.effectiveTo}
                  onChange={(e) =>
                    setForm({ ...form, effectiveTo: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={2}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isMandatory}
                  onChange={(e) =>
                    setForm({ ...form, isMandatory: e.target.checked })
                  }
                />
                Mandatory
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isPenaltyEnabled}
                  onChange={(e) =>
                    setForm({ ...form, isPenaltyEnabled: e.target.checked })
                  }
                />
                Penalty enabled
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                />
                Active
              </label>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete configuration"
        message={`Delete “${
          deleteTarget?.displayName || deleteTarget?.collectionName
        }”? Existing collections may still reference it.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
