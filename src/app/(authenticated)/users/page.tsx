"use client";

import { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Badge } from "@/src/components/ui/badge";
import { MoreHorizontal, Search, UserPlus, Eye, EyeOff } from "lucide-react";
import { UserFormModal } from "./UserFormModal";
import { fetchUsers, deleteUser, type User, toggleUserStatus } from "@/src/lib/api/users";
import { toast } from "sonner";
import { format } from "date-fns";
import { SiteHeader } from "@/src/components/site-header";
import { ConvertToEmployeeModal } from "./ConvertToEmployeeModal";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>();
  const [showPasswordIds, setShowPasswordIds] = useState<Set<string | number>>(new Set());
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [userToConvert, setUserToConvert] = useState<User | undefined>();

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetchUsers({ search, per_page: 100 });
      setUsers(response.data);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadUsers();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const handleCreateClick = () => {
    setSelectedUser(undefined);
    setModalOpen(true);
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleDeleteClick = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.first_name} ${user.last_name}?`)) {
      return;
    }

    try {
      await deleteUser(String(user.id));
      toast.success("User deleted successfully");
      loadUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await toggleUserStatus(String(user.id));
      toast.success(`User ${user.is_active ? "deactivated" : "activated"} successfully`);
      loadUsers();
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error("Failed to update user status");
    }
  };

  const togglePasswordVisibility = (userId: string | number) => {
    setShowPasswordIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleConvertToEmployee = (user: User) => {
    setUserToConvert(user);
    setConvertModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-5 p-4">
      <SiteHeader
        title="Users"
        subtitle="Manage system users and their roles"
        actions={
          <Button onClick={handleCreateClick}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
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
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Password</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.first_name} {user.last_name}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone || "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role} variant="outline" className="capitalize">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.password_plain ? (
                        <>
                          <span className="font-mono text-sm">
                            {showPasswordIds.has(user.id)
                              ? user.password_plain
                              : "••••••••"}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePasswordVisibility(user.id)}
                          >
                            {showPasswordIds.has(user.id) ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.last_login_at
                      ? format(new Date(user.last_login_at), "MMM d, yyyy")
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditClick(user)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                          {user.is_active ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleConvertToEmployee(user)}>
                          Convert to Employee
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(user)}
                          className="text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <UserFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        user={selectedUser}
        onSuccess={loadUsers}
      />

      <ConvertToEmployeeModal
        open={convertModalOpen}
        onOpenChange={setConvertModalOpen}
        user={userToConvert}
        onSuccess={loadUsers}
      />
    </div>
  );
}
