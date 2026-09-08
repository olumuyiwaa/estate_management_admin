"use client";

import { useEffect, useState } from "react";
import api from "@/app/api/axios";
import { StaffMember, ApiResponse, PagedData } from "@/app/api/types";
import { toast } from "react-toastify";

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get<ApiResponse<PagedData<StaffMember> | StaffMember[]>>(
          "/api/Staff/GetStaffByCriteria"
        );
        const payload = data?.data;
        if (Array.isArray(payload)) {
          setStaff(payload);
        } else if (payload && "items" in payload) {
          setStaff((payload as PagedData<StaffMember>).items ?? []);
        } else {
          setStaff([]);
        }
      } catch (err: any) {
        console.error(err);
        toast.error(err?.response?.data?.message || "Failed to load staff");
        setStaff([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Staff
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Estate staff directory
        </p>
      </div>

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
                  Position
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Department
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Phone
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No staff found
                  </td>
                </tr>
              ) : (
                staff.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      {s.staffCode || "—"}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {s.fullName ||
                        [s.firstName, s.lastName].filter(Boolean).join(" ")}
                    </td>
                    <td className="px-4 py-3">{s.position || "—"}</td>
                    <td className="px-4 py-3">
                      {s.departmentName || s.departmentCode || "—"}
                    </td>
                    <td className="px-4 py-3">{s.phoneNumber || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {s.email || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          s.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {s.isActive ? "Active" : "Inactive"}
                      </span>
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
