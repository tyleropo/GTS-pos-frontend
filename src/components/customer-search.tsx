import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, User } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/src/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { fetchCustomers, type Customer } from "@/src/lib/api/customers";
import { useDebounce } from "@/src/hooks/use-debounce";

interface CustomerSearchProps {
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  className?: string;
}

export function CustomerSearch({
  selectedCustomer,
  onSelectCustomer,
  className,
}: CustomerSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCustomers = async () => {
      setLoading(true);
      try {
        const response = await fetchCustomers({
          search: debouncedQuery,
          per_page: 5,
        });
        setCustomers(response.data);
      } catch (error) {
        console.error("Failed to fetch customers", error);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      loadCustomers();
    }
  }, [debouncedQuery, open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedCustomer ? (
            <span className="flex items-center gap-2 truncate">
              <User className="h-4 w-4 shrink-0 opacity-50" />
              {selectedCustomer.name}
            </span>
          ) : (
            <span className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4 shrink-0 opacity-50" />
              Walk-in Customer
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search customers..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {loading && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            )}
            {!loading && customers.length === 0 && (
              <CommandEmpty>No customer found.</CommandEmpty>
            )}
            {!loading && (
              <CommandGroup>
                <CommandItem
                  value="walk-in"
                  onSelect={() => {
                    onSelectCustomer(null);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCustomer === null ? "opacity-100" : "opacity-0"
                    )}
                  />
                  Walk-in Customer
                </CommandItem>
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={customer.name}
                    onSelect={() => {
                      onSelectCustomer(customer);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCustomer?.id === customer.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{customer.name}</span>
                      {customer.phone && (
                        <span className="text-xs text-muted-foreground">
                          {customer.phone}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
