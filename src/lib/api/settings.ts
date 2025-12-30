import { apiClient } from "@/src/lib/api-client";

export interface Setting {
  key: string;
  value: any;
}

export async function getSetting(key: string): Promise<Setting | null> {
  try {
    const response = await apiClient.get(`/settings/${key}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function upsertSetting(key: string, value: any, description?: string): Promise<Setting> {
  const response = await apiClient.put(`/settings/${key}`, {
    value,
    description
  });
  return response.data;
}

export async function deleteSetting(key: string): Promise<void> {
  await apiClient.delete(`/settings/${key}`);
}
