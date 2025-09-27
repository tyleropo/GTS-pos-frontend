import { Input } from "@/src/components/ui/input";
import { useEffect, useRef } from "react";

export function BarcodeInput({ onScan }: { onScan: (code: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <Input
      ref={ref}
      type="text"
      placeholder="Scan barcode (press /)"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onScan((e.target as HTMLInputElement).value);
          (e.target as HTMLInputElement).value = "";
        }
      }}
    />
  );
}
