"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from "@/src/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import { ArrowLeft, Edit, Lock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  fetchPayrollPeriod,
  finalizePayroll,
  markPayrollAsPaid,
  type PayrollPeriod,
  type PayrollRecord,
} from "@/src/lib/api/payroll";
import { PayrollRecordModal } from "./PayrollRecordModal";


interface PayrollPeriodDetailProps {
  period: PayrollPeriod;
  onBack: () => void;
}

export function PayrollPeriodDetail({ period: initialPeriod, onBack }: PayrollPeriodDetailProps) {
  const [period, setPeriod] = useState<PayrollPeriod & { payroll_records?: PayrollRecord[] }>(initialPeriod);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadPeriodDetails = async () => {
    try {
      setLoading(true);
      const data = await fetchPayrollPeriod(period.id);
      setPeriod(data);
    } catch (error) {
      console.error("Error loading period details:", error);
      toast.error("Failed to load period details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPeriodDetails();
  }, []);

  const handleFinalize = async () => {
    try {
      await finalizePayroll(period.id);
      toast.success("Payroll period finalized");
      loadPeriodDetails();
    } catch (error) {
      console.error("Error finalizing period:", error);
      toast.error("Failed to finalize payroll period");
    }
  };

  const handleMarkPaid = async () => {
    if (!confirm("Mark this payroll period as paid?")) {
      return;
    }

    try {
      await markPayrollAsPaid(period.id);
      toast.success("Payroll period marked as paid");
      loadPeriodDetails();
    } catch (error) {
      console.error("Error marking as paid:", error);
      toast.error("Failed to mark as paid");
    }
  };

  const handleEditRecord = (record: PayrollRecord) => {
    setSelectedRecord(record);
    setModalOpen(true);
  };

  const handleRecordUpdate = () => {
    setModalOpen(false);
    loadPeriodDetails();
  };

  const totalNetPay = period.payroll_records?.reduce((sum, r) => sum + r.net_pay, 0) || 0;

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Periods
        </Button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{period.name}</h1>
            <p className="text-muted-foreground">
              {format(new Date(period.start_date), "MMM d")} - {format(new Date(period.end_date), "MMM d, yyyy")}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant={period.status === 'paid' ? 'default' : 'secondary'} className="capitalize">
              {period.status}
            </Badge>
            {period.status === 'draft' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button>
                    <Lock className="mr-2 h-4 w-4" />
                    Finalize
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Finalize Payroll Period?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will lock the payroll period and prevent further edits to employee records. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleFinalize}>Finalize Period</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {period.status === 'finalized' && (
              <Button onClick={handleMarkPaid}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark Paid
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{period.payroll_records?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Net Pay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₱{totalNetPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Period Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{period.period_type.replace('-', ' ')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{period.status}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Payroll Records</CardTitle>
          <CardDescription>View and edit individual employee compensation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-right">Base Salary</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">Gross Pay</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : !period.payroll_records || period.payroll_records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">No employee records</TableCell>
                  </TableRow>
                ) : (
                  period.payroll_records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.user?.first_name} {record.user?.last_name}
                      </TableCell>
                      <TableCell className="text-right">
                        ₱{record.base_salary.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        ₱{record.commission.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        ₱{record.gross_pay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        ₱{record.total_deductions.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ₱{record.net_pay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditRecord(record)}
                          disabled={period.status !== 'draft'}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedRecord && (
        <PayrollRecordModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          record={selectedRecord}
          periodId={period.id}
          onSuccess={handleRecordUpdate}
        />
      )}
    </div>
  );
}
