"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import {
    Smartphone,
    Laptop,
    Watch,
    Headphones,
    Tablet,
    User,
    Calendar,
    DollarSign,
    Wrench,
    FileText,
    Clock,
    CheckCircle,
    AlertCircle,
    XCircle,
} from "lucide-react";
import type { Repair } from "@/src/lib/api/repairs";

interface ViewRepairModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    repair: Repair | null;
    onEdit?: () => void;
    onDelete?: () => void;
}

export function ViewRepairModal({
    open,
    onOpenChange,
    repair,
    onEdit,
    onDelete,
}: ViewRepairModalProps) {
    if (!repair) return null;

    const getDeviceIcon = (device: string | null | undefined) => {
        const deviceLower = (device || "").toLowerCase();
        if (deviceLower.includes("smartphone") || deviceLower.includes("phone")) {
            return <Smartphone className="h-5 w-5" />;
        }
        if (deviceLower.includes("laptop") || deviceLower.includes("computer")) {
            return <Laptop className="h-5 w-5" />;
        }
        if (deviceLower.includes("watch")) {
            return <Watch className="h-5 w-5" />;
        }
        if (deviceLower.includes("headphone") || deviceLower.includes("audio")) {
            return <Headphones className="h-5 w-5" />;
        }
        if (deviceLower.includes("tablet") || deviceLower.includes("ipad")) {
            return <Tablet className="h-5 w-5" />;
        }
        return <Smartphone className="h-5 w-5" />;
    };

    const getStatusBadge = (status: string) => {
        const statusLower = status.toLowerCase();
        if (statusLower.includes("completed")) {
            return (
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    Completed
                </Badge>
            );
        }
        if (statusLower.includes("progress")) {
            return (
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                    <Wrench className="h-3.5 w-3.5 mr-1" />
                    In Progress
                </Badge>
            );
        }
        if (statusLower.includes("waiting") || statusLower.includes("pending")) {
            return (
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    Pending
                </Badge>
            );
        }
        if (statusLower.includes("cancel")) {
            return (
                <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Cancelled
                </Badge>
            );
        }
        return (
            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                <AlertCircle className="h-3.5 w-3.5 mr-1" />
                {status}
            </Badge>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {getDeviceIcon(repair.device)}
                        Repair Ticket: {repair.ticket_number}
                    </DialogTitle>
                    <DialogDescription>
                        Created on {repair.created_at?.split("T")[0] || "N/A"}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Status */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        {getStatusBadge(repair.status)}
                    </div>

                    <Separator />

                    {/* Customer Info */}
                    <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Customer Information
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">Name:</span>
                                <p className="font-medium">
                                    {repair.customer?.name || "Walk-in Customer"}
                                </p>
                            </div>
                            {repair.customer?.phone && (
                                <div>
                                    <span className="text-muted-foreground">Phone:</span>
                                    <p className="font-medium">{repair.customer.phone}</p>
                                </div>
                            )}
                            {repair.customer?.email && (
                                <div>
                                    <span className="text-muted-foreground">Email:</span>
                                    <p className="font-medium">{repair.customer.email}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Device Info */}
                    <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                            {getDeviceIcon(repair.device)}
                            Device Information
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">Device Type:</span>
                                <p className="font-medium">{repair.device || "N/A"}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Model:</span>
                                <p className="font-medium">{repair.device_model || "N/A"}</p>
                            </div>
                            {repair.serial_number && (
                                <div className="col-span-2">
                                    <span className="text-muted-foreground">Serial Number:</span>
                                    <p className="font-medium font-mono">{repair.serial_number}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Issue Description */}
                    <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Issue Description
                        </h4>
                        <p className="text-sm bg-muted p-3 rounded-md">
                            {repair.issue_description || "No description provided"}
                        </p>
                    </div>

                    {/* Resolution (if available) */}
                    {repair.resolution && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <h4 className="font-medium flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                                    Resolution
                                </h4>
                                <p className="text-sm bg-emerald-50 p-3 rounded-md text-emerald-800">
                                    {repair.resolution}
                                </p>
                            </div>
                        </>
                    )}

                    <Separator />

                    {/* Service Details */}
                    <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                            <Wrench className="h-4 w-4" />
                            Service Details
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    Estimated Cost:
                                </span>
                                <p className="font-medium">
                                    ${(repair.cost || 0).toFixed(2)}
                                </p>
                            </div>
                            <div>
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    Technician:
                                </span>
                                <p className="font-medium">
                                    {repair.technician || "Unassigned"}
                                </p>
                            </div>
                            <div>
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Est. Completion:
                                </span>
                                <p className="font-medium">
                                    {repair.promised_at?.split("T")[0] || "Not set"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex gap-2">
                    {onDelete && (
                        <Button variant="destructive" onClick={onDelete}>
                            Delete
                        </Button>
                    )}
                    {onEdit && (
                        <Button variant="outline" onClick={onEdit}>
                            Edit
                        </Button>
                    )}
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
