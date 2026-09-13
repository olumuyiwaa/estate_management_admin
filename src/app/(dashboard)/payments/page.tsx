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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collection Payments"
        description="Search payment history by reference, receipt, channel, or collection"
      />

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
    </div>
  );
}
