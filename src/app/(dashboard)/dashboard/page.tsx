"use client";

import { useEffect, useState } from "react";
import api from "@/app/api/axios";
import Link from "next/link";
import {
  ApiResponse,
  ServiceRequestSummary,
  AnnouncementSummary,
} from "@/app/api/types";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [sr, setSr] = useState<ServiceRequestSummary | null>(null);
  const [ann, setAnn] = useState<AnnouncementSummary | null>(null);
  const [residentCount, setResidentCount] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [srRes, annRes, resRes] = await Promise.allSettled([
          api.get<ApiResponse<ServiceRequestSummary>>(
            "/api/ServiceRequests/GetServiceRequestDashboardSummary"
          ),
          api.get<ApiResponse<AnnouncementSummary>>(
            "/api/Announcements/AnnouncementDashboardSummary"
          ),
          api.get("/api/Residents/SearchResidents"),
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
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cards = [
    {
      title: "Residents",
      value: loading ? "..." : residentCount ?? "—",
      href: "/residents",
      color: "bg-blue-500",
    },
    {
      title: "Open Requests",
      value: loading ? "..." : sr?.openRequests ?? "—",
      subtitle: sr ? `${sr.criticalRequests} critical` : undefined,
      href: "/service-requests",
      color: "bg-orange-500",
    },
    {
      title: "Total Requests",
      value: loading ? "..." : sr?.totalRequests ?? "—",
      href: "/service-requests",
      color: "bg-purple-500",
    },
    {
      title: "Announcements",
      value: loading ? "..." : ann?.publishedAnnouncements ?? "—",
      subtitle: ann ? `${ann.criticalAnnouncements} critical` : undefined,
      href: "/announcements",
      color: "bg-green-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of your estate operations
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {card.title}
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {card.value}
                </p>
                {card.subtitle && (
                  <p className="mt-1 text-xs text-gray-400">{card.subtitle}</p>
                )}
              </div>
              <div
                className={`w-10 h-10 rounded-lg ${card.color} opacity-80 flex items-center justify-center text-white text-lg`}
              >
                →
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Detailed SR breakdown */}
      {sr && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Service Requests Breakdown
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              ["Open", sr.openRequests],
              ["Assigned", sr.assignedRequests],
              ["In Progress", sr.inProgressRequests],
              ["Resolved", sr.resolvedRequests],
              ["Closed", sr.closedRequests],
              ["Critical", sr.criticalRequests],
              ["Today", sr.requestsToday],
              ["This Month", sr.requestsThisMonth],
            ].map(([label, val]) => (
              <div
                key={label as string}
                className="rounded-lg bg-gray-50 dark:bg-gray-700/40 p-3"
              >
                <p className="text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-xl font-semibold mt-1">{val as number}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Residents", href: "/residents" },
            { label: "Service Requests", href: "/service-requests" },
            { label: "Visitors", href: "/visitors" },
            { label: "Announcements", href: "/announcements" },
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
