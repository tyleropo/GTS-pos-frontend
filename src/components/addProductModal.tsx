import React, { useState } from 'react'
import { NewInventoryItem } from '../types/inventory'
import { Button } from '@/src/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/src/components/ui/dialog'
import { Plus } from 'lucide-react'
import { Label } from '@/src/components/ui/label'
import { Input } from '@/src/components/ui/input'
type AddProductModalProps ={
    onClose : () => void
    onAdd : (product: NewInventoryItem) => void
}
const addProductModal = ({onClose, onAdd}: AddProductModalProps) => {
  
    const [form, setForm] = useState<NewInventoryItem[]>({
        name:"",
        sku:"",
        category:"Electronics",
        stock: 0,
        price: 0,
        cost: 0,
        status: "In Stock",
        supplier:"",
        reorderLevel:1,
    })
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value} =e.target
        const newValue = ["stock", "price", "cost", "reorderLevel"].includes(name)
        ? Number(value)
        :value

        setForm((prev) => ({...prev, [name] : newValue}))
    }
  return (
     <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {["name", "sku", "category", "price", "cost", "stock", "supplier"].map((field) => (
            <div key={field} className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={field} className="text-right capitalize">
                {field}
              </Label>
              <Input
                id={field}
                name={field}
                value={(form as any)[field]}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleChange}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default addProductModal