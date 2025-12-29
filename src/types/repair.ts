export type Repair = {
  id: string;
  ticketNumber: string;
  date: string;
  customer: string;
  customerId?: string;
  device: string;
  deviceModel: string;
  serialNumber?: string;
  issue: string;
  status: string;
  resolution?: string;
  cost: number;
  technician: string;
  completionDate: string;
};
