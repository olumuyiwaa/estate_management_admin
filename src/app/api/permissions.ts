import type { AuthUser } from "./types";

/**
 * JWT permission strings look like:
 *   Can_Read_Module_UserManagement
 *   Can_Add_Module_Issues
 *   Can_Edit_Module_Issues
 *   Can_Delete_Module_UserManagement
 *
 * Module keys used in nav / UI (flexible matching).
 */
export type PermissionAction = "read" | "add" | "edit" | "delete";

const ACTION_PREFIX: Record<PermissionAction, string> = {
  read: "Can_Read_Module_",
  add: "Can_Add_Module_",
  edit: "Can_Edit_Module_",
  delete: "Can_Delete_Module_",
};

/** Map app routes / feature keys → backend module name fragments */
export const MODULE_ALIASES: Record<string, string[]> = {
  dashboard: [],
  residents: ["Residents", "Resident"],
  staff: ["Staff"],
  users: ["UserManagement", "Users", "Access"],
  roles: ["UserManagement", "Roles"],
  visitors: ["Visitors", "Visitor"],
  vehicles: ["Vehicles", "Vehicle", "ResidentVehicles"],
  "service-requests": ["ServiceRequests", "ServiceRequest", "Issues"],
  collections: ["Collections", "Collection"],
  payments: ["Collections", "CollectionPayments", "Payments"],
  "collections-config": ["Collections", "CollectionConfiguration"],
  announcements: ["Announcements", "Announcement"],
  issues: ["Issues", "Issue"],
  marketplace: ["Marketplace", "MarketplaceItems"],
  "marketplace-categories": ["Marketplace", "MarketplaceCategories"],
  notifications: ["Notifications", "PushNotifications"],
  "meeting-summary": ["MeetingSummary", "Meeting"],
  profile: [],
};

function normalizePerms(user: AuthUser | null | undefined): string[] {
  if (!user) return [];
  // permissions is typed string[] on AuthUser but JWT/storage may be string
  const raw: unknown = user.permissions;
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    const s = raw as string;
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return s.split(/[,;]/).map((part) => part.trim()).filter(Boolean);
    }
  }
  return [];
}

/** True if user is Admin role (bypass module checks) */
export function isAdmin(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  const role = String(user.role || "").toLowerCase();
  if (role === "admin" || role === "administrator") return true;
  if (Array.isArray(user.roles)) {
    return user.roles.some(
      (r) => String(r).toLowerCase() === "admin" || String(r).toLowerCase() === "administrator"
    );
  }
  return false;
}

/**
 * Check whether the user may perform `action` on a module key
 * (route segment or alias from MODULE_ALIASES).
 * Admin always true. Empty permissions list → allow (backend still enforces).
 */
export function hasPermission(
  user: AuthUser | null | undefined,
  moduleKey: string,
  action: PermissionAction = "read"
): boolean {
  if (!user) return false;
  if (isAdmin(user)) return true;

  const perms = normalizePerms(user);
  // No claims at all → don't lock the UI; API will 403 if needed
  if (perms.length === 0) return true;

  const aliases = MODULE_ALIASES[moduleKey] ?? [moduleKey];
  if (aliases.length === 0) return true; // dashboard / profile always visible

  const prefix = ACTION_PREFIX[action];
  return aliases.some((mod) => {
    const exact = `${prefix}${mod}`;
    return perms.some(
      (p) =>
        p === exact ||
        p.toLowerCase() === exact.toLowerCase() ||
        // tolerate Can_Read_Module_X vs Can_Read_X
        p.toLowerCase().includes(mod.toLowerCase()) &&
          p.toLowerCase().includes(action === "read" ? "read" : action)
    );
  });
}

/** Shortcut: can open this nav path (read) */
export function canAccessPath(
  user: AuthUser | null | undefined,
  path: string
): boolean {
  const segment = path.replace(/^\//, "").split("/")[0] || "dashboard";
  return hasPermission(user, segment, "read");
}
