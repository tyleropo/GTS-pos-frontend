import { apiClient as api } from "@/src/lib/api-client";

export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  position: string;
  department: string | null;
  salary: number;
  hire_date: string | null;
  status: "active" | "inactive" | "terminated";
  user_id: number | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export interface CreateEmployeePayload {
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  position: string;
  department?: string | null;
  salary: number;
  hire_date?: string | null;
  status: "active" | "inactive" | "terminated";
  user_id?: number | null;
}

export interface UpdateEmployeePayload extends Partial<CreateEmployeePayload> {}

export interface CreateEmployeeFromUserPayload {
  position: string;
  department?: string | null;
  salary: number;
  hire_date?: string | null;
}

export const fetchEmployees = async (params?: { search?: string; status?: string }) => {
  const response = await api.get<Employee[]>("/employees", { params });
  return response.data;
};

export const fetchEmployee = async (id: number | string) => {
  const response = await api.get<Employee>(`/employees/${id}`);
  return response.data;
};

export const createEmployee = async (data: CreateEmployeePayload) => {
  const response = await api.post<Employee>("/employees", data);
  return response.data;
};

export const updateEmployee = async (id: number | string, data: UpdateEmployeePayload) => {
  const response = await api.put<Employee>(`/employees/${id}`, data);
  return response.data;
};

export const deleteEmployee = async (id: number | string) => {
  await api.delete(`/employees/${id}`);
};

export const createEmployeeFromUser = async (userId: number | string, data: CreateEmployeeFromUserPayload) => {
  const response = await api.post<Employee>(`/employees/from-user/${userId}`, data);
  return response.data;
};
