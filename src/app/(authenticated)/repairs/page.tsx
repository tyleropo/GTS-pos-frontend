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
import { fetchRepairs } from "@/src/lib/api/repairs";
import { useEffect, useState } from "react";
import type { Repair } from "@/src/types/repair";
import { adaptRepair } from "@/src/lib/adapters";

function RepairsPage() {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRepairs = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchRepairs();
        const adapted = response.data.map(adaptRepair);
        setRepairs(adapted);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load repairs");
        console.error("Error loading repairs:", err);
      } finally {
        setLoading(false);
      }
    };

    loadRepairs();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-5 p-4">
        <SiteHeader
          title="Repairs"
          subtitle="Track service tickets and keep technicians aligned."
        />
        <p className="text-muted-foreground">Loading repairs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-5 p-4">
        <SiteHeader
          title="Repairs"
          subtitle="Track service tickets and keep technicians aligned."
        />
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

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
