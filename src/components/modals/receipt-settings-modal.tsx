import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import { useEffect, useState } from "react";

export interface ReceiptSettings {
  storeName: string;
  storeAddress: string;
  contactInfo: string;
  footerMessage: string;
  showReferenceNumber: boolean;
}

export const DEFAULT_RECEIPT_SETTINGS: ReceiptSettings = {
  storeName: "GTS POS",
  storeAddress: "123 Main St, City, Country",
  contactInfo: "Tel: (123) 456-7890 | Email: info@gtspos.com",
  footerMessage: "Thank you for your business! Please come again.",
  showReferenceNumber: true,
};

interface ReceiptSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (settings: ReceiptSettings) => void;
}

export function ReceiptSettingsModal({
  open,
  onOpenChange,
  onSave,
}: ReceiptSettingsModalProps) {
  const [settings, setSettings] = useState<ReceiptSettings>(DEFAULT_RECEIPT_SETTINGS);

  useEffect(() => {
    if (open) {
      const saved = localStorage.getItem("pos_receipt_settings");
      if (saved) {
        try {
            setSettings(JSON.parse(saved));
        } catch (e) {
            console.error("Failed to parse receipt settings", e);
        }
      }
    }
  }, [open]);

  const handleSave = () => {
    localStorage.setItem("pos_receipt_settings", JSON.stringify(settings));
    onSave(settings);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Receipt Settings</DialogTitle>
          <DialogDescription>
            Customize the layout and content of your printed receipts.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="storeName">Store Name</Label>
            <Input
              id="storeName"
              value={settings.storeName}
              onChange={(e) =>
                setSettings({ ...settings, storeName: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="storeAddress">Store Address</Label>
            <Textarea
              id="storeAddress"
              value={settings.storeAddress}
              onChange={(e) =>
                setSettings({ ...settings, storeAddress: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contactInfo">Contact Info</Label>
            <Input
              id="contactInfo"
              value={settings.contactInfo}
              onChange={(e) =>
                setSettings({ ...settings, contactInfo: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="footerMessage">Footer Message</Label>
            <Textarea
              id="footerMessage"
              value={settings.footerMessage}
              onChange={(e) =>
                setSettings({ ...settings, footerMessage: e.target.value })
              }
            />
          </div>
           <div className="flex items-center justify-between">
            <Label htmlFor="showReferenceNumber">Show Reference Number</Label>
            <Switch
              id="showReferenceNumber"
              checked={settings.showReferenceNumber}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, showReferenceNumber: checked })
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
