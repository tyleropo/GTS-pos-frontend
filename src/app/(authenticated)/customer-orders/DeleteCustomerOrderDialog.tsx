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
} from "@/src/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteCustomerOrder } from "@/src/lib/api/customer-orders";

interface DeleteCustomerOrderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customerOrder: { id: string | number; co_number: string; customer?: any } | null;
    onSuccess?: () => void;
}

export function DeleteCustomerOrderDialog({
    open,
    onOpenChange,
    customerOrder,
    onSuccess,
}: DeleteCustomerOrderDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!customerOrder) return;

        try {
            setIsDeleting(true);
            await deleteCustomerOrder(String(customerOrder.id));
            toast.success("Purchase order deleted successfully");
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            console.error("Error deleting purchase order:", error);
            toast.error("Failed to delete purchase order");
        } finally {
            setIsDeleting(false);
        }
    };

    if (!customerOrder) return null;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete purchase order{" "}
                        <span className="font-semibold">{customerOrder.co_number}</span>
                        {customerOrder.customer?.company_name && (
                            <>
                                {" "}
                                from{" "}
                                <span className="font-semibold">
                                    {customerOrder.customer.company_name}
                                </span>
                            </>
                        )}
                        . This action cannot be undone.
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
