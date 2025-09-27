import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";

export function ProductFilterTabs({ categories, selected, onSelect }: {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}) {
  return (
    <Tabs defaultValue={selected} onValueChange={onSelect}>
      <TabsList className="overflow-x-auto whitespace-nowrap">
        {categories.map((cat) => (
          <TabsTrigger key={cat} value={cat}>
            {cat}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
