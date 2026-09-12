"use client";

type Tone =
  | "green"
  | "red"
  | "yellow"
  | "blue"
  | "gray"
  | "orange"
  | "purple";

const tones: Record<Tone, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400",
  red: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400",
  yellow: "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400",
  blue: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400",
  gray: "bg-gray-100 text-gray-600 ring-gray-500/20 dark:bg-gray-700 dark:text-gray-300",
  orange: "bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400",
  purple: "bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-500/10 dark:text-purple-400",
};

export function statusTone(status?: string | boolean | null): Tone {
  if (typeof status === "boolean") return status ? "green" : "gray";
  const s = (status || "").toLowerCase();
  if (["active", "published", "approved", "paid", "resolved", "closed", "checkedin", "checked-in", "granted"].includes(s))
    return "green";
  if (["inactive", "draft", "pending", "open"].includes(s)) return "yellow";
  if (["critical", "rejected", "overdue", "denied", "deleted"].includes(s)) return "red";
  if (["assigned", "inprogress", "in progress", "partial"].includes(s)) return "blue";
  if (["checkedout", "checked-out", "expired"].includes(s)) return "gray";
  return "blue";
}

export default function StatusBadge({
  label,
  tone,
  status,
}: {
  label?: string;
  tone?: Tone;
  status?: string | boolean | null;
}) {
  const t = tone || statusTone(status ?? label);
  const text =
    label ??
    (typeof status === "boolean" ? (status ? "Active" : "Inactive") : status || "—");
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ring-1 ring-inset ${tones[t]}`}
    >
      {text}
    </span>
  );
}
