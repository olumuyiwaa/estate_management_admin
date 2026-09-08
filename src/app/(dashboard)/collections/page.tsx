"use client";

import { useEffect, useState } from "react";
import api from "@/app/api/axios";
import { ApiResponse, PagedData } from "@/app/api/types";
import { toast } from "react-toastify";
import Pagination from "@/components/common/Pagination";

interface Collection {
  id: number;
  collectionReference?: string;
  collectionConfigurationId?: number;
  residentId?: number;
  billingPeriod?: string;
  billingYear?: number;
  amountDue?: number;
  penaltyAmount?: number;
  amountPaid?: number;
  outstandingBalance?: number;
  status?: string;
  dueDate?: string;
  paymentDate?: string | null;
  collectionCode?: string;
  collectionName?: string;
  frequency?: string;
  residentFullName?: string;
  residentCode?: string;
  isFullyPaid?: boolean;
  totalAmountDue?: number;
  paymentPercentage?: number;
  [key: string]: any;
}

export default function CollectionsPage() {
  const [items, setItems] = useState<Collection[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "outstanding" | "overdue" | "paid">("outstanding");
  const [showPay, setShowPay] = useState<Collection | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payChannel, setPayChannel] = useState("Cash");
  const [saving, setSaving] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const endpoints: Record<string, string> = {
        all: "/api/Collections/SearchCollections",
        outstanding: "/api/Collections/GetOutstandingCollections",
        overdue: "/api/Collections/GetOverdueCollections",
        paid: "/api/Collections/GetPaidCollections",
      };
      const { data } = await api.get<ApiResponse<PagedData<Collection>>>(
        endpoints[tab]
      );
      const page = data?.data;
      setItems(page?.items ?? []);
      setTotal(page?.totalRecords ?? page?.items?.length ?? 0);
      setTotalPages(page?.totalPages || Math.max(1, Math.ceil((page?.totalRecords || 0) / pageSize)));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load collections");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [tab]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPay) return;
    setSaving(true);
    try {
      await api.post("/api/CollectionPayments/CreateCollectionPayment", {
        collectionId: showPay.id,
        amountPaid: parseFloat(payAmount),
        paymentDate: new Date().toISOString(),
        paymentChannel: payChannel,
        notes: "Recorded via admin portal",
      });
      toast.success("Payment recorded");
      setShowPay(null);
      setPayAmount("");
      fetchList();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Payment failed");
    } finally {
      setSaving(false);
    }
  };

  const statusColor = (s?: string) => {
    switch (s?.toLowerCase()) {
      case "outstanding":
        return "bg-yellow-100 text-yellow-700";
      case "overdue":
        return "bg-red-100 text-red-700";
      case "paid":
      case "fully paid":
        return "bg-green-100 text-green-700";
      case "partially paid":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const fmt = (n?: number) =>
    typeof n === "number"
      ? n.toLocaleString("en-NG", { style: "currency", currency: "NGN" })
      : "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Collections
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {total > 0 ? `${total} collections` : "Estate levies and payments"}
        </p>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {(["all","outstanding", "overdue", "paid"] as const).map((t) => (
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

      {showPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-1">Record Payment</h2>
            <p className="text-sm text-gray-500 mb-4">
              {showPay.collectionName} — {showPay.collectionReference}
              <br />
              Outstanding: {fmt(showPay.outstandingBalance)}
            </p>
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Amount *</label>
                <input
                  type="number"
                  required
                  min={0}
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder={String(showPay.outstandingBalance ?? "")}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Channel</label>
                <select
                  value={payChannel}
                  onChange={(e) => setPayChannel(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                >
                  <option>Cash</option>
                  <option>Bank Transfer</option>
                  <option>POS</option>
                  <option>Online</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPay(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Record Payment"}
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
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Ref</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Levy</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Resident</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Due</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Outstanding</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No collections found</td>
                </tr>
              ) : (
                items.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-mono text-xs">{c.collectionReference || c.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{c.collectionName || c.collectionCode}</div>
                      <div className="text-xs text-gray-500">
                        {c.billingPeriod} {c.billingYear}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {c.residentFullName || c.residentCode || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {c.dueDate ? new Date(c.dueDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 font-medium">{fmt(c.outstandingBalance)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColor(c.status)}`}>
                        {c.status || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!c.isFullyPaid && (
                        <button
                          onClick={() => {
                            setShowPay(c);
                            setPayAmount(String(c.outstandingBalance ?? ""));
                          }}
                          className="text-sm text-brand-600 font-medium"
                        >
                          Record Payment
                        </button>
                      )}
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
    </div>
  );
}

