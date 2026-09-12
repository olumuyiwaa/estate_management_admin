"use client";

import { useEffect, useState } from "react";
import api from "@/app/api/axios";
import { API } from "@/app/api/endpoints";
import Link from "next/link";
import {
  ApiResponse,
  ServiceRequestSummary,
  AnnouncementSummary,
} from "@/app/api/types";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [sr, setSr] = useState<ServiceRequestSummary | null>(null);
  const [ann, setAnn] = useState<AnnouncementSummary | null>(null);
  const [residentCount, setResidentCount] = useState<number | null>(null);
  const [staffCount, setStaffCount] = useState<number | null>(null);
  const [marketSummary, setMarketSummary] = useState<Record<
    string,
    number
  > | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [srRes, annRes, resRes, staffRes, mktRes] =
          await Promise.allSettled([
            api.get<ApiResponse<ServiceRequestSummary>>(
              API.serviceRequests.summary
            ),
            api.get<ApiResponse<AnnouncementSummary>>(
              API.announcements.summary
            ),
            api.get(API.residents.search, {
              params: { PageNumber: 1, PageSize: 1 },
            }),
            api.get(API.staff.getByCriteria, {
              params: { PageNumber: 1, PageSize: 1 },
            }),
            api.get(API.marketplace.summary),
          ]);

        if (srRes.status === "fulfilled") {
          setSr(srRes.value.data?.data ?? null);
        }
        if (annRes.status === "fulfilled") {
          setAnn(annRes.value.data?.data ?? null);
        }
        if (resRes.status === "fulfilled") {
          const d = resRes.value.data?.data;
          setResidentCount(d?.totalRecords ?? d?.items?.length ?? null);
        }
        if (staffRes.status === "fulfilled") {
          const d = staffRes.value.data?.data;
          setStaffCount(
            d?.totalRecords ??
              (Array.isArray(d) ? d.length : d?.items?.length) ??
              null
          );
        }
        if (mktRes.status === "fulfilled") {
          const raw = mktRes.value.data?.data;
          if (raw && typeof raw === "object") {
            const nums: Record<string, number> = {};
            for (const [k, v] of Object.entries(raw)) {
              if (typeof v === "number") nums[k] = v;
            }
            setMarketSummary(Object.keys(nums).length ? nums : null);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cards = [
    {
      title: "Residents",
      value: loading ? "…" : (residentCount ?? "—"),
      href: "/residents",
      accent: "bg-blue-500",
    },
    {
      title: "Staff",
      value: loading ? "…" : (staffCount ?? "—"),
      href: "/staff",
      accent: "bg-indigo-500",
    },
    {
      title: "Open requests",
      value: loading ? "…" : (sr?.openRequests ?? "—"),
      subtitle: sr ? `${sr.criticalRequests} critical` : undefined,
      href: "/service-requests",
      accent: "bg-orange-500",
    },
    {
      title: "Announcements",
      value: loading ? "…" : (ann?.publishedAnnouncements ?? "—"),
      subtitle: ann ? `${ann.criticalAnnouncements} critical` : undefined,
      href: "/announcements",
      accent: "bg-emerald-500",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Live overview of estate operations"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c) => (
          <StatCard key={c.title} {...c} />
        ))}
      </div>

      {sr && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Service requests
            </h2>
            <Link
              href="/service-requests"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {(
              [
                ["Open", sr.openRequests],
                ["Assigned", sr.assignedRequests],
                ["In progress", sr.inProgressRequests],
                ["Resolved", sr.resolvedRequests],
                ["Closed", sr.closedRequests],
                ["Critical", sr.criticalRequests],
                ["Today", sr.requestsToday],
                ["This month", sr.requestsThisMonth],
              ] as const
            ).map(([label, val]) => (
              <div
                key={label}
                className="rounded-lg bg-gray-50 dark:bg-gray-700/40 p-3"
              >
                <p className="text-gray-500 dark:text-gray-400 text-xs">
                  {label}
                </p>
                <p className="text-xl font-semibold mt-1 tabular-nums">{val}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {ann && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Announcements
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {(
                [
                  ["Published", ann.publishedAnnouncements],
                  ["Draft", ann.draftAnnouncements],
                  ["Critical", ann.criticalAnnouncements],
                  ["Expired", ann.expiredAnnouncements],
                ] as const
              ).map(([label, val]) => (
                <div
                  key={label}
                  className="rounded-lg bg-gray-50 dark:bg-gray-700/40 p-3"
                >
                  <p className="text-gray-500 text-xs">{label}</p>
                  <p className="text-xl font-semibold mt-1 tabular-nums">
                    {val}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {marketSummary && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Marketplace
              </h2>
              <Link
                href="/marketplace"
                className="text-sm font-medium text-brand-600"
              >
                Manage →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {Object.entries(marketSummary)
                .slice(0, 6)
                .map(([k, v]) => (
                  <div
                    key={k}
                    className="rounded-lg bg-gray-50 dark:bg-gray-700/40 p-3"
                  >
                    <p className="text-gray-500 text-xs capitalize">
                      {k.replace(/([A-Z])/g, " $1").trim()}
                    </p>
                    <p className="text-xl font-semibold mt-1 tabular-nums">
                      {v}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Add resident", href: "/residents" },
            { label: "Service requests", href: "/service-requests" },
            { label: "Register visitor", href: "/visitors" },
            { label: "Collection types", href: "/collections-config" },
            { label: "Staff", href: "/staff" },
            { label: "Announcements", href: "/announcements" },
            { label: "Users & roles", href: "/users" },
            { label: "Marketplace", href: "/marketplace" },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center justify-center px-4 py-3 text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 rounded-lg transition-colors"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
