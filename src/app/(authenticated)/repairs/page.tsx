"use client";

import { SiteHeader } from "@/src/components/site-header";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Plus } from "lucide-react";
import RepairsTable from "./RepairsTable";
import RepairsStats from "./RepairsStats";
import { repairs } from "@/src/data/mockRepairs";

function RepairsPage() {
  return (
    <div className="flex flex-col gap-5 p-4">
      <SiteHeader
        title="Repairs"
        subtitle="Track service tickets and keep technicians aligned."
      />

      <RepairsStats repairs={repairs} />

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between text-2xl font-bold">
            Repair tickets
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New repair
            </Button>
          </CardTitle>
          <CardDescription>
            Track and manage device repairs and service tickets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RepairsTable repairs={repairs} />
        </CardContent>
      </Card>
    </div>
  );
}

export default RepairsPage;
