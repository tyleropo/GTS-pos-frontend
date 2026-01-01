import React, { forwardRef } from 'react';
import { Repair } from '@/src/types/repair';
import { format } from 'date-fns';
import { formatCurrency } from '@/src/lib/billing';

interface RepairTicketProps {
  repair: Repair | null;
  companyName?: string;
}

export const RepairTicket = forwardRef<HTMLDivElement, RepairTicketProps>(
  ({ repair, companyName = "GTS Marketing" }, ref) => {
    if (!repair) return null;

    return (
      <div ref={ref} className="p-8 max-w-2xl mx-auto bg-white text-black print:p-0">
        <style jsx global>{`
          @media print {
            @page {
              margin: 20mm;
            }
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        `}</style>
        
        {/* Header */}
        <div className="text-center mb-8 border-b pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">{companyName}</h1>
          <h2 className="text-xl font-semibold">Service Ticket</h2>
          <p className="text-sm text-gray-500 mt-1">
            {format(new Date(), "MMMM dd, yyyy h:mm a")}
          </p>
        </div>

        {/* Ticket Details */}
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4 bg-gray-100 p-2 rounded">
                <span className="font-semibold text-lg">Ticket #: {repair.ticketNumber || repair.id}</span>
                {/* <span className="font-semibold text-lg">{repair.status}</span> */}
            </div>

            <div className="grid grid-cols-2 gap-8">
                <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-1">Customer</h3>
                    <p className="text-lg font-medium">{repair.customer}</p>
                    {repair.customerId && <p className="text-sm text-gray-600">ID: {repair.customerId}</p>}
                </div>
                <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-1">Date Received</h3>
                    <p className="text-lg">{repair.date}</p>
                    {/* {repair.completionDate && (
                        <>
                            <h3 className="text-sm font-bold text-gray-500 uppercase mt-2 mb-1">Est. Completion</h3>
                            <p className="text-lg">{repair.completionDate}</p>
                        </>
                    )} */}
                </div>
            </div>
        </div>

        {/* Device Info */}
        <div className="mb-8 border rounded p-4">
            <h3 className="text-md font-bold text-gray-700 border-b pb-2 mb-3">Device Information</h3>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <span className="block text-xs text-gray-500 uppercase">Type</span>
                    <span className="font-medium">{repair.device}</span>
                </div>
                <div>
                     <span className="block text-xs text-gray-500 uppercase">Model</span>
                     <span className="font-medium">{repair.deviceModel}</span>
                </div>
                {repair.serialNumber && (
                    <div className="col-span-2">
                        <span className="block text-xs text-gray-500 uppercase">Serial Number</span>
                        <span className="font-medium font-mono">{repair.serialNumber}</span>
                    </div>
                )}
            </div>
        </div>

        {/* Issue & Resolution */}
        <div className="mb-8">
            <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-1">Reported Issue</h3>
                <p className="bg-gray-50 p-3 rounded border text-gray-800 whitespace-pre-wrap">
                    {repair.issue}
                </p>
            </div>

            {repair.resolution && (
                <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-1">Resolution / Notes</h3>
                    <p className="bg-gray-50 p-3 rounded border text-gray-800 whitespace-pre-wrap">
                        {repair.resolution}
                    </p>
                </div>
            )}
        </div>

        {/* Cost */}
        <div className="mb-12 text-right">
             <div className="inline-block min-w-[200px]">
                <div className="flex justify-between items-center border-t border-b py-2 mb-1">
                    <span className="font-bold">Total Cost</span>
                    <span className="text-xl font-bold">{formatCurrency(repair.cost)}</span>
                </div>
                {repair.cost === 0 && (
                    <p className="text-xs text-gray-400 italic text-center">To be determined / Quote pending</p>
                )}
             </div>
        </div>

        {/* Footer / Terms */}
        <div className="text-xs text-gray-400 text-center mt-12 pt-8 border-t">
            <p className="mb-2">Terms and Conditions apply.</p>
            <p>Thank you for your business!</p>
            
            <div className="mt-12 flex justify-between px-8 text-black">
                <div className="text-center">
                    <div className="w-48 border-b border-black mb-2"></div>
                    <p>Customer Signature</p>
                </div>
                <div className="text-center">
                    <div className="w-48 border-b border-black mb-2"></div>
                     <p>Technician Signature</p>
                </div>
            </div>
        </div>
      </div>
    );
  }
);

RepairTicket.displayName = 'RepairTicket';
