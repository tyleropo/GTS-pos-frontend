import type { Category } from "@/src/lib/api/products";
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";

type ProductFilterTabsProps = {
  categories: Category[];
  selectedCategoryId: string;
  onSelect: (categoryId: string) => void;
};

export function ProductFilterTabs({
  categories,
  selectedCategoryId,
  onSelect,
}: ProductFilterTabsProps) {
  return (
    <Tabs
      value={selectedCategoryId}
      onValueChange={onSelect}
      className="w-full"
    >
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="all">All products</TabsTrigger>
        {categories.map((category) => (
          <TabsTrigger key={category.id} value={category.id}>
            {category.name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
