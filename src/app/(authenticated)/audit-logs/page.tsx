"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchAuditLogs, type AuditLog } from "@/src/lib/api/audit-logs";
import { toast } from "sonner";
import { format } from "date-fns";
import { SiteHeader } from "@/src/components/site-header";


export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(20);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await fetchAuditLogs({ 
        search, 
        per_page: perPage,
        page: currentPage 
      });
      setLogs(response.data);
      if (response.meta) {
        setTotalPages(response.meta.last_page || 1);
      }
    } catch (error) {
      console.error("Error loading audit logs:", error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [search, currentPage]);

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case "created":
        return "default";
      case "updated":
        return "secondary";
      case "deleted":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getModelName = (modelType: string) => {
    return modelType.split("\\").pop() || modelType;
  };

  return (
    <div className="flex flex-col gap-5 p-4">
      <SiteHeader
        title="Audit Logs"
        subtitle="System activity and change history."
      />

      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">
                    {format(new Date(log.created_at), "MMM d, yyyy HH:mm:ss")}
                  </TableCell>
                  <TableCell>
                    {log.user
                      ? `${log.user.first_name} ${log.user.last_name}`
                      : "System"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActionColor(log.action)}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>{getModelName(log.model_type)}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {log.model_id}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {log.ip_address || "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || loading}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
