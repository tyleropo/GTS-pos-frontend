"use client";

import { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteRepair, type Repair } from "@/src/lib/api/repairs";

interface DeleteRepairDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    repair: Repair | null;
    onSuccess?: () => void;
}

export function DeleteRepairDialog({
    open,
    onOpenChange,
    repair,
    onSuccess,
}: DeleteRepairDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!repair) return;

        try {
            setIsDeleting(true);
            await deleteRepair(String(repair.id));
            toast.success("Repair ticket deleted successfully");
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            console.error("Error deleting repair:", error);
            toast.error("Failed to delete repair ticket");
        } finally {
            setIsDeleting(false);
        }
    };

    if (!repair) return null;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Repair Ticket</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete repair ticket{" "}
                        <strong>{repair.ticket_number}</strong>? This action cannot be
                        undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
