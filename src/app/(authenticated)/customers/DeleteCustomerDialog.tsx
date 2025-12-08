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
import { deleteCustomer } from "@/src/lib/api/customers";

interface DeleteCustomerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer: {
        id: string | number;
        name: string;
    } | null;
    onSuccess?: () => void;
}

export function DeleteCustomerDialog({
    open,
    onOpenChange,
    customer,
    onSuccess,
}: DeleteCustomerDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!customer) return;

        try {
            setIsDeleting(true);
            await deleteCustomer(String(customer.id));
            toast.success(`Customer "${customer.name}" deleted successfully`);
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            console.error("Error deleting customer:", error);
            toast.error("Failed to delete customer");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the customer{" "}
                        <span className="font-semibold">{customer?.name}</span> and all
                        associated data. This action cannot be undone.
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
