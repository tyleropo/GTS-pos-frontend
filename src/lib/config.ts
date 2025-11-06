export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:8000/api";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "GTS POS";

export const AUTH_TOKEN_STORAGE_KEY =
  process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY || "pos.accessToken";

export const AUTH_REFRESH_TOKEN_STORAGE_KEY =
  process.env.NEXT_PUBLIC_REFRESH_TOKEN_KEY || "pos.refreshToken";
