import { Input } from "@/src/components/ui/input";
import { useCallback, useEffect, useRef } from "react";

type BarcodeInputProps = {
  onScan: (code: string) => void;
  placeholder?: string;
  hotkey?: string;
  inputClassName?: string;
  autoFocus?: boolean;
};

export function BarcodeInput({
  onScan,
  placeholder = "Search products or scan a barcode…",
  hotkey = "/",
  inputClassName,
  autoFocus = false,
}: BarcodeInputProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      ref.current?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (!hotkey) return;
    const handler = (event: KeyboardEvent) => {
      // Ignore if user is typing in another input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
         return;
      }
      
      if (event.key === hotkey) {
        event.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [hotkey]);

  const handleManualScan = useCallback(
    (value: string) => {
      const code = value.trim();
      if (!code) return;
      onScan(code);
      if (ref.current) {
        ref.current.value = "";
      }
    },
    [onScan]
  );

  return (
    <Input
      ref={ref}
      type="text"
      placeholder={placeholder}
      className={inputClassName}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          handleManualScan((event.target as HTMLInputElement).value);
        }
      }}
    />
  );
}
