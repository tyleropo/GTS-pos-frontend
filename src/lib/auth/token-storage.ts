"use client";

import { AUTH_REFRESH_TOKEN_STORAGE_KEY, AUTH_TOKEN_STORAGE_KEY } from "@/src/lib/config";

const isBrowser = () => typeof window !== "undefined";

export function getAccessToken() {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setAccessToken(token: string) {
  if (!isBrowser()) return;
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearAccessToken() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export function getRefreshToken() {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(AUTH_REFRESH_TOKEN_STORAGE_KEY);
}

export function setRefreshToken(token: string) {
  if (!isBrowser()) return;
  window.localStorage.setItem(AUTH_REFRESH_TOKEN_STORAGE_KEY, token);
}

export function clearRefreshToken() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(AUTH_REFRESH_TOKEN_STORAGE_KEY);
}

export function clearAuthStorage() {
  clearAccessToken();
  clearRefreshToken();
}
