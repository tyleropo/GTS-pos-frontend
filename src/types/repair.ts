
export type Repair = {
  id: string;
  date: string;
  customer: string;
  device: string;
  deviceModel: string;
  issue: string;
  status: string;
  cost: number;
  technician: string;
  completionDate: string;
  customer_id?: string | number;
};
