"use client";

import { useEffect, useState } from "react";
import api from "@/app/api/axios";
import { API } from "@/app/api/endpoints";
import { extractPaged, errMsg } from "@/app/api/helpers";
import { toast } from "react-toastify";
import PageHeader from "@/components/common/PageHeader";
import Pagination from "@/components/common/Pagination";
import ViewDetailsModal from "@/components/common/ViewDetailsModal";
import ActionMenu from "@/components/common/ActionMenu";

interface Payment {
  id?: number;
  collectionId?: number;
  amountPaid?: number;
  paymentDate?: string;
  paymentChannel?: string;
  paymentReference?: string;
  receiptNumber?: string;
  gatewayReference?: string;
  notes?: string;
  [key: string]: any;
}

export default function PaymentsPage() {
  const [items, setItems] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;
  const [loading, setLoading] = useState(true);
  const [lookup, setLookup] = useState({ type: "search", value: "" });
  const [viewItem, setViewItem] = useState<Payment | null>(null);
  const [summary, setSummary] = useState<Record<string, any> | null>(null);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    paymentChannel: "Cash",
    paymentReference: "",
    receiptNumber: "",
    totalAmountPaid: "",
    notes: "",
    itemsText: "", // "collectionId,amount" per line
  });

  const fetchList = async () => {
    setLoading(true);
    try {
      let res;
      const v = lookup.value.trim();
      if (lookup.type === "reference" && v) {
        res = await api.get(API.collectionPayments.byPaymentReference, { params: { paymentReference: v } });
      } else if (lookup.type === "receipt" && v) {
        res = await api.get(API.collectionPayments.byReceipt, { params: { receiptNumber: v } });
      } else if (lookup.type === "channel" && v) {
        res = await api.get(API.collectionPayments.byChannel, { params: { paymentChannel: v } });
      } else if (lookup.type === "collection" && v) {
        res = await api.get(API.collectionPayments.byCollectionId, { params: { collectionId: v } });
      } else {
        res = await api.get(API.collectionPayments.search, { params: { PageNumber: page, PageSize: pageSize } });
      }
      const paged = extractPaged<Payment>(res.data, pageSize);
      setItems(paged.items);
      setTotal(paged.totalRecords);
      setTotalPages(paged.totalPages);
    } catch (err: any) {
      toast.error(errMsg(err, "Failed to load payments"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const { data } = await api.get(API.collectionPayments.summary);
      setSummary(data?.data ?? data ?? null);
    } catch {
      setSummary(null);
    }
  };

  useEffect(() => {
    fetchList();
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchList();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this payment record?")) return;
    try {
      await api.delete(API.collectionPayments.delete(id));
      toast.success("Deleted");
      fetchList();
    } catch (err: any) {
      toast.error(errMsg(err, "Delete failed"));
    }
  };

  const handleBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkSaving(true);
    try {
      const items = bulkForm.itemsText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [collectionId, amountPaid] = line.split(/[,\s]+/);
          return {
            collectionId: Number(collectionId),
            amountPaid: Number(amountPaid),
          };
        })
        .filter((i) => i.collectionId && !Number.isNaN(i.amountPaid));

      if (!items.length) {
        toast.error("Add at least one line: collectionId,amount");
        setBulkSaving(false);
        return;
      }

      const total =
        parseFloat(bulkForm.totalAmountPaid) ||
        items.reduce((s, i) => s + i.amountPaid, 0);

      await api.post(API.collectionPayments.bulk, {
        paymentChannel: bulkForm.paymentChannel,
        paymentReference: bulkForm.paymentReference || null,
        receiptNumber: bulkForm.receiptNumber || null,
        totalAmountPaid: total,
        notes: bulkForm.notes || "Bulk payment via admin portal",
        items,
      });
      toast.success("Bulk payment submitted");
      setShowBulk(false);
      setBulkForm({
        paymentChannel: "Cash",
        paymentReference: "",
        receiptNumber: "",
        totalAmountPaid: "",
        notes: "",
        itemsText: "",
      });
      fetchList();
      fetchSummary();
    } catch (err: any) {
      toast.error(errMsg(err, "Bulk payment failed"));
    } finally {
      setBulkSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Collection Payments"
          description="Search payment history by reference, receipt, channel, or collection"
        />
        <button
          type="button"
          onClick={() => setShowBulk(true)}
          className="inline-flex items-center px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg shrink-0"
        >
          + Bulk payment
        </button>
      </div>

      {summary && typeof summary === "object" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(summary)
            .filter(([, v]) => typeof v === "number")
            .slice(0, 8)
            .map(([k, v]) => (
              <div key={k} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500 truncate">{k}</p>
                <p className="text-lg font-semibold mt-1">{String(v)}</p>
              </div>
            ))}
        </div>
      )}

      <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
        <select
          value={lookup.type}
          onChange={(e) => setLookup({ ...lookup, type: e.target.value })}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
        >
          <option value="search">All (search)</option>
          <option value="reference">Payment reference</option>
          <option value="receipt">Receipt number</option>
          <option value="channel">Payment channel</option>
          <option value="collection">Collection ID</option>
        </select>
        <input
          value={lookup.value}
          onChange={(e) => setLookup({ ...lookup, value: e.target.value })}
          placeholder="Lookup value..."
          className="flex-1 min-w-[160px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
        />
        <button type="submit" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-sm font-medium rounded-lg">
          Search
        </button>
      </form>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Channel</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Reference</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Date</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No payments found</td></tr>
              ) : (
                items.map((p, i) => (
                  <tr key={p.id ?? i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-mono text-xs">{p.id ?? "—"}</td>
                    <td className="px-4 py-3 font-medium">{p.amountPaid != null ? Number(p.amountPaid).toLocaleString() : "—"}</td>
                    <td className="px-4 py-3">{p.paymentChannel || "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{p.paymentReference || p.receiptNumber || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{p.paymentDate ? new Date(p.paymentDate).toLocaleString() : "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <ActionMenu
                        items={[
                          { label: "View", onClick: () => setViewItem(p) },
                          {
                            label: "Delete",
                            onClick: () => handleDelete(p.id!),
                            variant: "danger",
                            divider: true,
                            hidden: p.id == null,
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
        <Pagination page={page} totalPages={totalPages} totalRecords={total} onPageChange={setPage} />
      </div>

      {viewItem && (
        <ViewDetailsModal title="Payment details" data={viewItem} onClose={() => setViewItem(null)} />
      )}

      {showBulk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Bulk payment for resident</h2>
            <form onSubmit={handleBulk} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Channel</label>
                  <select
                    value={bulkForm.paymentChannel}
                    onChange={(e) =>
                      setBulkForm({ ...bulkForm, paymentChannel: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Card">Card</option>
                    <option value="POS">POS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bulkForm.totalAmountPaid}
                    onChange={(e) =>
                      setBulkForm({ ...bulkForm, totalAmountPaid: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                    placeholder="Auto from lines if empty"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment reference</label>
                <input
                  value={bulkForm.paymentReference}
                  onChange={(e) =>
                    setBulkForm({ ...bulkForm, paymentReference: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Receipt number</label>
                <input
                  value={bulkForm.receiptNumber}
                  onChange={(e) =>
                    setBulkForm({ ...bulkForm, receiptNumber: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Items (one per line: collectionId,amount)
                </label>
                <textarea
                  required
                  rows={5}
                  value={bulkForm.itemsText}
                  onChange={(e) =>
                    setBulkForm({ ...bulkForm, itemsText: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-mono"
                  placeholder={"12,5000\n15,2500"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <input
                  value={bulkForm.notes}
                  onChange={(e) => setBulkForm({ ...bulkForm, notes: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowBulk(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkSaving}
                  className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm disabled:opacity-60"
                >
                  {bulkSaving ? "Submitting…" : "Submit bulk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
