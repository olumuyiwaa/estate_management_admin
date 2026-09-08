import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://emsapi.corvanta.ng";

const api = axios.create({
  baseURL: BASE,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refreshToken");
}

function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}

// Attach Bearer token on every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    // Axios v1 uses AxiosHeaders – set both ways for compatibility
    if (config.headers && typeof (config.headers as any).set === "function") {
      (config.headers as any).set("Authorization", `Bearer ${token}`);
    } else {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (err: unknown) => void;
}> = [];

function flushQueue(error: unknown, token: string | null) {
  pendingQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt refresh once per request, and only on 401
    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    // Don't try to refresh the refresh/login endpoints themselves
    const url = originalRequest.url || "";
    if (
      url.includes("/Authentication/login") ||
      url.includes("/Authentication/refresh")
    ) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      // No refresh token – reject without wiping (caller/UI can handle)
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until refresh completes
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            if (!token) {
              reject(error);
              return;
            }
            if (
              originalRequest.headers &&
              typeof (originalRequest.headers as any).set === "function"
            ) {
              (originalRequest.headers as any).set(
                "Authorization",
                `Bearer ${token}`
              );
            } else {
              originalRequest.headers = originalRequest.headers ?? {};
              (originalRequest.headers as any).Authorization =
                `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Call refresh WITHOUT going through the same interceptor loop
      const { data } = await axios.post(
        `${BASE}/api/Authentication/refresh`,
        {
          accessToken: getAccessToken(),
          refreshToken,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      const newAccess =
        data?.accessToken || data?.data?.accessToken || data?.token;
      const newRefresh =
        data?.refreshToken || data?.data?.refreshToken || refreshToken;

      if (!newAccess) {
        throw new Error("Refresh did not return accessToken");
      }

      localStorage.setItem("accessToken", newAccess);
      localStorage.setItem("refreshToken", newRefresh);

      flushQueue(null, newAccess);

      if (
        originalRequest.headers &&
        typeof (originalRequest.headers as any).set === "function"
      ) {
        (originalRequest.headers as any).set(
          "Authorization",
          `Bearer ${newAccess}`
        );
      } else {
        originalRequest.headers = originalRequest.headers ?? {};
        (originalRequest.headers as any).Authorization = `Bearer ${newAccess}`;
      }

      return api(originalRequest);
    } catch (refreshError) {
      flushQueue(refreshError, null);
      clearSession();
      if (typeof window !== "undefined") {
        // Soft redirect – avoid infinite loops
        if (!window.location.pathname.startsWith("/")) {
          window.location.href = "/";
        } else if (window.location.pathname !== "/") {
          window.location.href = "/";
        }
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
