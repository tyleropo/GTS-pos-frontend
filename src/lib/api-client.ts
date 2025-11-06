"use client";

import axios from "axios";
import {
  API_BASE_URL,
} from "@/src/lib/config";
import {
  clearAuthStorage,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "@/src/lib/auth/token-storage";

type RefreshResponse = {
  access_token?: string;
  token?: string;
  refresh_token?: string | null;
  expires_in?: number;
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
      return;
    }
    prom.resolve(token);
  });

  failedQueue = [];
};

apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          throw new Error("Missing refresh token");
        }

        const { data } = await axios.post<RefreshResponse>(
          `${API_BASE_URL}/auth/refresh`,
          { refresh_token: refreshToken },
          { withCredentials: true }
        );

        const accessToken = data.access_token ?? data.token;
        if (!accessToken) {
          throw new Error("Invalid refresh response");
        }

        setAccessToken(accessToken);
        if (data.refresh_token) {
          setRefreshToken(data.refresh_token);
        }

        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthStorage();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export { apiClient };
