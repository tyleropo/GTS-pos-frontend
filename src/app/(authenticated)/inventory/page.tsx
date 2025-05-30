"use client"
import React, { useState } from 'react'
import mockInventory from "@/src/data/mockInventory"
import { SiteHeader } from '@/src/components/site-header'
import { InventoryItem, NewInventoryItem } from '@/src/types/inventory'
import  InventoryTable from '@/src/app/(authenticated)/inventory/InventoryTable'
import  InventoryStats from '@/src/app/(authenticated)/inventory/InventoryStats'
import AddProductModal from '@/src/components/addProductModal'
import { Card, CardDescription, CardHeader, CardTitle,CardContent } from '@/src/components/ui/card'


const page = () => {

   const [items, setItems] = useState<InventoryItem[]>(mockInventory)
   const [showModal, setShowModal] = useState(false)

  const addProduct = (product: NewInventoryItem) => {
    const newItem: InventoryItem = {
      ...product,
      id: Date.now(),
      lastUpdated: new Date().toISOString(),
    }
    setItems(prev => [...prev, newItem])
    setShowModal(false)
  }
  return (
    <div className='p-6'>
        <SiteHeader title='Inventory Management'/>
        <div className="flex justify-between mb-6">
             <h1 className="text-3xl font-bold"></h1>
            {/* <Button onClick={() =>setShowModal(true)}><Plus className="h-4 w-4 mr-2" />Add Product</Button> */}
        
        </div>
        <InventoryStats items={items}/>
        <Card className='mt-5'>
          <CardHeader>
          <CardTitle className='text-2xl font-bold flex justify-between'>Inventory List
              <AddProductModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onAdd={addProduct}
      />
          </CardTitle>
          <CardDescription>Manage your product inventory, stock levels, and pricing
            
          </CardDescription>
          </CardHeader>
          <CardContent>
          <InventoryTable items={items} />
          </CardContent>
        </Card>
        
        
        
    </div>
  )
}

export default page