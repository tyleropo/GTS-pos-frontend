import Calendar from "@/components/calendar";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Wrench } from "lucide-react";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader title="Dashboard" />
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          <div className="px-4 lg:px-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Sales Overview</CardTitle>
                </CardHeader>
                <CardContent className="p-2 ml-2">
                  <Calendar />
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest transactions and inventory changes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            i % 2 === 0 ? "bg-emerald-500" : "bg-sky-500"
                          }`}
                        ></div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {i % 2 === 0
                              ? "New sale completed"
                              : "Inventory updated"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {i % 2 === 0
                              ? "Customer purchased 3 items"
                              : "5 items restocked"}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {i * 10} min ago
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 my-5 md:grid-cols-3 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle> Low Stock Items</CardTitle>
                  <CardDescription>
                    {" "}
                    Items that needs to be restocked again
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-muted"></div>
                          <div>
                            <p className="text-sm font-medium">Product {i}</p>
                            <p className="text-xs text-muted-foreground">
                              SKU-00{i}
                            </p>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-rose-500">
                          {i} left
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle> Top Selling Products</CardTitle>
                  <CardDescription>
                    {" "}
                    Products with highest sales this month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-muted"></div>
                          <div>
                            <p className="text-sm font-medium">
                              Top Product {i}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              SKU-10{i}
                            </p>
                          </div>
                        </div>
                        <div className="text-sm font-medium">
                          {100 - i * 20} sold
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle> Pending Repairs</CardTitle>
                  <CardDescription>Repairs that need attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Wrench className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              Repair #{1000 + i}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Customer: John D.
                            </p>
                          </div>
                        </div>
                        <div className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                          In Progress
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
