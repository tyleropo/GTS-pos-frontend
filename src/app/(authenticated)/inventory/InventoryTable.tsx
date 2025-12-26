import { useMemo, useState } from "react";
import type { InventoryItem } from "@/src/types/inventory";
import type { Category } from "@/src/lib/api/products";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/src/components/ui/dropdown-menu";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/src/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import {
  Search,
  Filter,
  AlertCircle,
  MoreHorizontal,
  Edit,
  Plus,
  Trash2,
  QrCode,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Skeleton } from "@/src/components/ui/skeleton";
import { CameraBarcodeScanner } from "@/src/components/camera-barcode-scanner";

type InventoryTableProps = {
  items: InventoryItem[];
  categories: Category[];
  isLoading?: boolean;
  onProductUpdated?: () => void;
  onEdit?: (product: InventoryItem) => void;
};

const deriveStatus = (item: InventoryItem) => {
  if (item.stock_quantity <= 0) return "out-of-stock";
  if (item.stock_quantity <= item.reorder_level) return "low-stock";
  return "in-stock";
};

const statusLabel: Record<string, string> = {
  "in-stock": "In Stock",
  "low-stock": "Low Stock",
  "out-of-stock": "Out of Stock",
};

export function InventoryTable({
  items,
  categories,
  isLoading,
  onEdit,
}: InventoryTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const normalizedStatus = deriveStatus(item);

      const matchesStatus =
        statusFilter === "all" || normalizedStatus === statusFilter;

      const matchesCategory =
        categoryFilter === "all" ||
        String(item.category_id) === categoryFilter ||
        String(item.category?.id) === categoryFilter;

      const searchTerm = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !searchTerm ||
        [item.name, item.sku, item.barcode, item.category?.name, item.supplier?.company_name]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(searchTerm));

      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [categoryFilter, items, searchQuery, statusFilter]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs
        defaultValue="all"
        value={statusFilter}
        onValueChange={setStatusFilter}
        className="space-y-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="w-full max-w-xl justify-start">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
            <TabsTrigger value="out-of-stock">Out of Stock</TabsTrigger>
          </TabsList>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name, SKU, or supplier..."
                className="pl-8"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => setIsScannerOpen(true)}
            >
              <QrCode className="mr-2 h-4 w-4" />
              Scan SKU
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end">
                <DropdownMenuLabel>Filter inventory</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="space-y-2 p-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Category
                  </p>
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 p-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Availability
                  </p>
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Show all</SelectItem>
                      <SelectItem value="in-stock">In Stock</SelectItem>
                      <SelectItem value="low-stock">Low Stock</SelectItem>
                      <SelectItem value="out-of-stock">
                        Out of Stock
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU / Barcode</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">On Hand</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    No products match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const status = deriveStatus(item);
                  const stockBadgeVariant =
                    status === "in-stock"
                      ? "outline"
                      : status === "low-stock"
                        ? "secondary"
                        : "destructive";

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{item.sku}</span>
                          {item.barcode ? (
                            <span className="text-xs text-muted-foreground">
                              {item.barcode}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{item.category?.name ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        ₱{item.cost_price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ₱{item.selling_price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.stock_quantity}
                        {status !== "in-stock" ? (
                          <AlertCircle className="ml-1 inline h-4 w-4 text-amber-500" />
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant={stockBadgeVariant}>
                          {statusLabel[status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.supplier?.company_name ?? "Unassigned"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => onEdit?.(item)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Plus className="mr-2 h-4 w-4" />
                              Adjust stock
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Archive product
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Tabs>
      <CameraBarcodeScanner
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onDetected={(code) => {
          setSearchQuery(code);
          setIsScannerOpen(false);
        }}
        title="Scan SKU or barcode"
        description="Use your camera to locate products instantly."
      />
    </div>
  );
}
