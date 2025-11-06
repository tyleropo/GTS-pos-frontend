"use client"
import React from 'react'
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
import RepairsTable from './RepairsTable';
import RepairsStats from './RepairsStats';
import { repairs } from '@/src/data/mockRepairs';
// TODO add a component for the New Repair button 
const Page = () => {
  return (
 <div className="p-4 flex flex-col gap-5">
    <SiteHeader title="Repairs" />

      {/* 4.2. Stats section */}
      <RepairsStats repairs={repairs} />

      {/* 4.3. Table wrapped in a Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex justify-between">Repair Tickets
               <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Repair
        </Button>
          </CardTitle>
          <CardDescription>Track and manage device repairs and service tickets</CardDescription>
        </CardHeader>
        <CardContent>
          <RepairsTable repairs={repairs} />
        </CardContent>
      </Card>
    </div>  )
}

export default Page