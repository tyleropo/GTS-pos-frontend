import { useState } from 'react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/src/components/ui/dropdown-menu'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/src/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Search, Filter, AlertCircle, MoreHorizontal, Edit, Trash2, CheckCircle, Wrench, Clock, FileText, Calendar, Download, Smartphone, Laptop, Watch, Headphones, Eye } from 'lucide-react'
import { Badge } from '@/src/components/ui/badge'
import { Repair } from '@/src/types/repair'
import { DateRangePicker } from '@/src/components/date-range-picker'
import { DateRange } from 'react-day-picker'

interface RepairsTableProps {
  repairs: Repair[];
  technicians?: Array<{ id: string | number; first_name: string; last_name: string }>;
  onView?: (repair: Repair) => void;
  onEdit?: (repair: Repair) => void;
  onDelete?: (repair: Repair) => void;
  onUpdateStatus?: (repair: Repair, status: "pending" | "in_progress" | "completed" | "cancelled") => void;
}

const RepairsTable = ({
  repairs,
  technicians = [],
  onView,
  onEdit,
  onDelete,
  onUpdateStatus
}: RepairsTableProps) => {
  // 1. React state for search + filters + active tab
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [technicianFilter, setTechnicianFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all-repairs");

  // 2. Combine all filtering logic:
  //    a) Tab filter (matches repair.status → activeTab)
  //    b) Search filter (id, customer, deviceModel, or issue contains text)
  //    c) Status dropdown (exact match or "all")
  //    d) Device dropdown (exact match or "all")
  const filteredRepairs = repairs.filter((r) => {
    // a) Tab filter
    if (
      activeTab !== "all-repairs" &&
      r.status.toLowerCase().replace(/\s+/g, "-") !== activeTab
    ) {
      return false;
    }

    // b) Search filter
    const lcSearch = searchQuery.toLowerCase();
    const matchesSearch =
      r.id.toLowerCase().includes(lcSearch) ||
      r.ticketNumber?.toLowerCase().includes(lcSearch) ||
      r.customer.toLowerCase().includes(lcSearch) ||
      r.deviceModel.toLowerCase().includes(lcSearch) ||
      r.issue.toLowerCase().includes(lcSearch);

    // c) Status dropdown filter
    const matchesStatus =
      statusFilter === "all" ||
      r.status.toLowerCase().replace(/\s+/g, "-") === statusFilter.toLowerCase();

    // d) Device dropdown filter
    const matchesDevice =
      deviceFilter === "all" || r.device.toLowerCase() === deviceFilter.toLowerCase();

    // e) Technician dropdown filter
    const matchesTechnician =
      technicianFilter === "all" || r.technician === technicianFilter;

    return matchesSearch && matchesStatus && matchesDevice && matchesTechnician;
  });

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      {/* 3. Tabs at the top */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <TabsList>
          <TabsTrigger value="all-repairs">All Repairs</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="diagnostic">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        {/* 4. Search input, Dropdown filters, and icons */}
        <div className="flex flex-1 items-center gap-2 max-w-md ml-auto">
          {/* 4a. Search box */}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search repairs..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* 4b. Filter dropdown (status + device) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Filter By</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Status filter group */}
              <div className="p-2">
                <p className="text-sm font-medium mb-2">Status</p>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="diagnostic">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DropdownMenuSeparator />

              {/* Device filter group */}
              <div className="p-2">
                <p className="text-sm font-medium mb-2">Device Type</p>
                <Select value={deviceFilter} onValueChange={setDeviceFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Devices" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Devices</SelectItem>
                    <SelectItem value="smartphone">Smartphone</SelectItem>
                    <SelectItem value="laptop">Laptop</SelectItem>
                    <SelectItem value="tablet">Tablet</SelectItem>
                    <SelectItem value="smartwatch">Smartwatch</SelectItem>
                    <SelectItem value="headphones">Headphones</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DropdownMenuSeparator />

              {/* Technician filter group */}
              <div className="p-2">
                <p className="text-sm font-medium mb-2">Technician</p>
                <Select value={technicianFilter} onValueChange={setTechnicianFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Technicians" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Technicians</SelectItem>
                    {technicians.map((tech) => (
                      <SelectItem key={tech.id} value={`${tech.first_name} ${tech.last_name}`}>
                        {tech.first_name} {tech.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 4c. Calendar icon (just an example extra button) */}
          {/* <Button variant="outline" size="icon">
            <Calendar className="h-4 w-4" />
          </Button> */}

          {/* 4d. Download icon */}
          {/* <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button> */}
        </div>
      </div>

      {/* 5. Table rows */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket ID</TableHead>
              <TableHead>Date Created</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Issue</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead>Technician</TableHead>
              <TableHead>Est. Completion</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredRepairs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              filteredRepairs.map((repair) => (
                <TableRow key={repair.id}>
                  {/* Ticket ID */}
                  <TableCell className="font-medium">{repair.ticketNumber || repair.id}</TableCell>

                  {/* Date Created */}
                  <TableCell>{repair.date}</TableCell>

                  {/* Customer */}
                  <TableCell>{repair.customer}</TableCell>

                  {/* Device + Icon */}
                  <TableCell>
                    <div className="flex items-center">
                      {repair.device.toLowerCase().includes("smartphone") && (
                        <Smartphone className="h-4 w-4 mr-2 text-muted-foreground" />
                      )}
                      {repair.device.toLowerCase().includes("laptop") && (
                        <Laptop className="h-4 w-4 mr-2 text-muted-foreground" />
                      )}
                      {repair.device.toLowerCase().includes("watch") && (
                        <Watch className="h-4 w-4 mr-2 text-muted-foreground" />
                      )}
                      {repair.device.toLowerCase().includes("headphone") && (
                        <Headphones className="h-4 w-4 mr-2 text-muted-foreground" />
                      )}
                      {repair.device.toLowerCase().includes("tablet") && (
                        <Laptop className="h-4 w-4 mr-2 text-muted-foreground" />
                      )}
                      <span>{repair.deviceModel}</span>
                    </div>
                  </TableCell>

                  {/* Issue */}
                  <TableCell className="max-w-[200px] truncate">{repair.issue}</TableCell>

                  {/* Status Badge + Icon */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        repair.status === "Completed"
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                          : repair.status === "In Progress"
                          ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                          : repair.status === "Cancelled"
                          ? "bg-red-100 text-red-700 hover:bg-red-100"
                          : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                      }
                    >
                      <span className="flex items-center">
                        {repair.status === "Completed" && (
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        )}
                        {repair.status === "In Progress" && (
                          <Wrench className="h-3.5 w-3.5 mr-1" />
                        )}
                        {(repair.status === "Diagnostic" || repair.status === "Pending") && (
                          <Clock className="h-3.5 w-3.5 mr-1" />
                        )}
                        {repair.status === "Cancelled" && (
                          <AlertCircle className="h-3.5 w-3.5 mr-1" />
                        )}
                        {repair.status}
                      </span>
                    </Badge>
                  </TableCell>

                  {/* Cost */}
                  <TableCell className="text-right">
                    {repair.cost > 0 ? `₱${repair.cost.toFixed(2)}` : "Pending"}
                  </TableCell>

                  {/* Technician */}
                  <TableCell>{repair.technician}</TableCell>

                  {/* Estimated Completion */}
                  <TableCell>{repair.completionDate}</TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Quick Edit Button */}
                      {repair.status !== "Cancelled" && onEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(repair)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}

                      {/* Dropdown for more actions */}
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onView?.(repair)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit?.(repair)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Ticket
                          </DropdownMenuItem>
                          
                          {/* Status update options */}
                          {repair.status !== "In Progress" && repair.status !== "Completed" && repair.status !== "Cancelled" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => onUpdateStatus?.(repair, "in_progress")}>
                                <Wrench className="h-4 w-4 mr-2" />
                                Start Repair
                              </DropdownMenuItem>
                            </>
                          )}

                          {/* Only show "Mark as Completed" if not already completed */}
                          {repair.status !== "Completed" && repair.status !== "Cancelled" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => onUpdateStatus?.(repair, "completed")}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark as Completed
                              </DropdownMenuItem>
                            </>
                          )}

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => onDelete?.(repair)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Ticket
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Tabs>
  )
}

export default RepairsTable