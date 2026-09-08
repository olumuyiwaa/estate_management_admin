import api from "./axios";
import {
  LoginPayload,
  LoginResponse,
  ChangePasswordDto,
  AuthUser,
} from "./types";

/** Decode JWT payload (no verification – server already issued it) */
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const padded = part + "=".repeat((4 - (part.length % 4)) % 4);
    const json =
      typeof atob !== "undefined"
        ? atob(padded.replace(/-/g, "+").replace(/_/g, "/"))
        : Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function userFromToken(token: string, fallbackUserName?: string): AuthUser {
  const claims = decodeJwtPayload(token);
  if (!claims) {
    return { userName: fallbackUserName, displayName: fallbackUserName };
  }
  return {
    id: claims.sub || claims.NameIdentifier,
    userName:
      claims.unique_name || claims.email || claims.name || fallbackUserName,
    email: claims.email || claims.unique_name,
    firstName: claims.given_name,
    lastName: claims.family_name,
    displayName:
      [claims.given_name, claims.family_name].filter(Boolean).join(" ") ||
      claims.unique_name ||
      claims.email,
    role: claims.Role || claims.role,
    roles: claims.Role ? [claims.Role] : claims.roles,
    mobileNo: claims.MobilePhone,
    permissions: claims.permissions,
    tenantCode: claims.TenantCode,
    userCode: claims.UserCode,
    userType: claims.UserType,
    position: claims.Position,
  };
}

/**
 * Corvanta login returns:
 * { "token": { "accessToken": "...", "refreshToken": "..." } }
 *
 * Also supports flatter shapes just in case.
 */
function extractTokens(data: any): {
  accessToken?: string;
  refreshToken?: string;
} {
  if (!data) return {};

  // Raw JWT string
  if (typeof data === "string" && data.split(".").length === 3) {
    return { accessToken: data };
  }

  if (typeof data !== "object") return {};

  const pick = (obj: any): { accessToken?: string; refreshToken?: string } => {
    if (!obj || typeof obj !== "object") return {};
    const access =
      typeof obj.accessToken === "string"
        ? obj.accessToken
        : typeof obj.access_token === "string"
          ? obj.access_token
          : typeof obj.jwt === "string"
            ? obj.jwt
            : undefined;
    // Only accept string tokens – never an object
    const refresh =
      typeof obj.refreshToken === "string"
        ? obj.refreshToken
        : typeof obj.refresh_token === "string"
          ? obj.refresh_token
          : undefined;
    return { accessToken: access, refreshToken: refresh };
  };

  // 1) Exact Corvanta shape: { token: { accessToken, refreshToken } }
  if (data.token && typeof data.token === "object") {
    const fromToken = pick(data.token);
    if (fromToken.accessToken) return fromToken;
  }

  // 2) Nested under data
  if (data.data) {
    if (data.data.token && typeof data.data.token === "object") {
      const nested = pick(data.data.token);
      if (nested.accessToken) return nested;
    }
    const fromData = pick(data.data);
    if (fromData.accessToken) return fromData;
  }

  // 3) Flat root
  const fromRoot = pick(data);
  if (fromRoot.accessToken) return fromRoot;

  // 4) tokens alias
  if (data.tokens && typeof data.tokens === "object") {
    const fromTokens = pick(data.tokens);
    if (fromTokens.accessToken) return fromTokens;
  }

  return {};
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await api.post("/api/Authentication/login", {
      userName: payload.userName,
      password: payload.password,
    });

    const data = response.data;
    const { accessToken, refreshToken } = extractTokens(data);

    if (!accessToken || typeof accessToken !== "string") {
      console.error("[auth] Login response had no accessToken string:", data);
      throw {
        response: {
          data: {
            message:
              data?.message ||
              data?.title ||
              "Login failed: no access token in response",
          },
        },
      };
    }

    // Must be a JWT-looking string
    if (accessToken.split(".").length !== 3) {
      console.error("[auth] accessToken does not look like a JWT:", accessToken);
      throw {
        response: {
          data: {
            message: "Login failed: invalid token format",
          },
        },
      };
    }

    localStorage.setItem("accessToken", accessToken);
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    } else {
      localStorage.removeItem("refreshToken");
    }

    const user: AuthUser =
      data?.user ||
      data?.data?.user ||
      userFromToken(accessToken, payload.userName);

    localStorage.setItem("user", JSON.stringify(user));

    console.info("[auth] Login OK", {
      tokenPreview: accessToken.slice(0, 24) + "…",
      hasRefresh: !!refreshToken,
      user: user.userName || user.email,
    });

    return {
      accessToken,
      refreshToken,
      user,
      ...data,
    };
  },

  refresh: async (refreshToken: string) => {
    const { data } = await api.post("/api/Authentication/refresh", {
      accessToken: localStorage.getItem("accessToken"),
      refreshToken,
    });

    const { accessToken: newAccess, refreshToken: newRefresh } =
      extractTokens(data);

    if (newAccess && typeof newAccess === "string") {
      localStorage.setItem("accessToken", newAccess);
      localStorage.setItem("user", JSON.stringify(userFromToken(newAccess)));
    }
    if (newRefresh) localStorage.setItem("refreshToken", newRefresh);

    return data;
  },

  changePassword: async (payload: ChangePasswordDto) => {
    const { data } = await api.post(
      "/api/Authentication/ChangePassword",
      payload
    );
    return data;
  },

  logout: async () => {
    try {
      await api.post("/api/Authentication/logout");
    } catch {
      // ignore
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }
  },
};

export default authApi;
