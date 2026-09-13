import type { ApiResponse, PagedData } from "./types";

/** Normalise various API list/paged shapes into a consistent structure */
export function extractPaged<T = any>(
  payload: any,
  fallbackPageSize = 20
): PagedData<T> {
  const root = payload?.data ?? payload;
  if (Array.isArray(root)) {
    return {
      items: root as T[],
      totalRecords: root.length,
      pageNumber: 1,
      pageSize: fallbackPageSize,
      totalPages: 1,
    };
  }
  const items: T[] =
    root?.items ??
    root?.data ??
    root?.results ??
    root?.records ??
    [];
  const totalRecords =
    root?.totalRecords ??
    root?.totalCount ??
    root?.total ??
    (Array.isArray(items) ? items.length : 0);
  const pageNumber = root?.pageNumber ?? root?.page ?? 1;
  const pageSize = root?.pageSize ?? fallbackPageSize;
  const totalPages =
    root?.totalPages ?? Math.max(1, Math.ceil(Number(totalRecords) / pageSize) || 1);
  return {
    items: Array.isArray(items) ? items : [],
    totalRecords: Number(totalRecords) || 0,
    pageNumber: Number(pageNumber) || 1,
    pageSize: Number(pageSize) || fallbackPageSize,
    totalPages: Number(totalPages) || 1,
  };
}

export function extractList<T = any>(payload: any): T[] {
  return extractPaged<T>(payload).items;
}

export function extractData<T = any>(res: ApiResponse<T> | any): T | null {
  if (res == null) return null;
  if (res.data !== undefined) return res.data as T;
  return res as T;
}

export function errMsg(err: any, fallback = "Request failed"): string {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.title ||
    err?.message ||
    fallback
  );
}
