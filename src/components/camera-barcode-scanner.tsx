import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BrowserMultiFormatReader,
  type IScannerControls,
} from "@zxing/browser";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/src/components/ui/drawer";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { AlertCircle, Camera, RefreshCcw } from "lucide-react";

type CameraBarcodeScannerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDetected: (value: string) => void;
  title?: string;
  description?: string;
};

const preferBackCamera = (devices: MediaDeviceInfo[]) => {
  const backFacing = devices.find((device) =>
    device.label.toLowerCase().includes("back")
  );
  return backFacing?.deviceId ?? devices[0]?.deviceId ?? "";
};

export function CameraBarcodeScanner({
  open,
  onOpenChange,
  onDetected,
  title = "Scan barcode or QR code",
  description = "Align the code inside the frame and hold steady until it is recognized.",
}: CameraBarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [isEnumerating, setIsEnumerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "scanning" | "detected">(
    "idle"
  );

  const stopScanner = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setStatus("idle");
  }, []);

  const loadDevices = useCallback(async () => {
    if (!open) return;
    setIsEnumerating(true);
    setError(null);
    try {
      const available = await BrowserMultiFormatReader.listVideoInputDevices();
      setDevices(available);
      if (available.length === 0) {
        setError("No camera devices were found on this device.");
        return;
      }
      setSelectedDeviceId((current) => {
        if (current) return current;
        return preferBackCamera(available);
      });
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Unable to access camera devices.";
      setError(message);
    } finally {
      setIsEnumerating(false);
    }
  }, [open]);

  const startScanner = useCallback(
    async (deviceId?: string) => {
      if (!open || !videoRef.current) return;
      setError(null);
      setStatus("scanning");
      try {
        const reader =
          readerRef.current ?? new BrowserMultiFormatReader(undefined, {
            delayBetweenScanAttempts: 300,
          });
        readerRef.current = reader;
        controlsRef.current?.stop();
        controlsRef.current = await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (result, error, controls) => {
            if (result) {
              const text = result.getText();
              setStatus("detected");
              controls.stop();
              onDetected(text);
              onOpenChange(false);
            }
            if (error && (error as Error).name !== "NotFoundException") {
              console.error(error);
            }
          }
        );
      } catch (cause) {
        const message =
          cause instanceof Error
            ? cause.message
            : "Unable to start the camera stream.";
        setError(message);
        setStatus("idle");
      }
    },
    [onDetected, onOpenChange, open]
  );

  useEffect(() => {
    if (open) {
      void loadDevices();
    } else {
      stopScanner();
    }
  }, [loadDevices, open, stopScanner]);

  useEffect(() => {
    if (!open || !selectedDeviceId) return;
    void startScanner(selectedDeviceId);
    return () => {
      stopScanner();
    };
  }, [open, selectedDeviceId, startScanner, stopScanner]);

  const statusLabel = useMemo(() => {
    switch (status) {
      case "scanning":
        return "Scanning…";
      case "detected":
        return "Code detected";
      default:
        return "Ready";
    }
  }, [status]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] rounded-t-3xl border-t bg-background">
        <DrawerHeader className="pb-0">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className="space-y-4 p-4 pt-0">
          <div className="space-y-2">
            <div className="relative overflow-hidden rounded-2xl border bg-black">
              <video
                ref={videoRef}
                className="aspect-video h-auto w-full object-cover"
                autoPlay
                muted
                playsInline
              />
              <div className="pointer-events-none absolute inset-0 border-4 border-white/30">
                <div className="absolute inset-4 rounded-2xl border-2 border-white/40" />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Status: {statusLabel}</span>
              {isEnumerating ? (
                <span>Detecting cameras…</span>
              ) : (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                  onClick={() => loadDevices()}
                >
                  <RefreshCcw className="h-3 w-3" />
                  Refresh cameras
                </button>
              )}
            </div>
          </div>

          {devices.length > 1 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Camera source
              </p>
              <Select
                value={selectedDeviceId}
                onValueChange={setSelectedDeviceId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a camera" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${device.deviceId.slice(0, 4)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Grant camera permissions if prompted. For best results, use the
              rear camera on mobile devices.
            </p>
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => onOpenChange(false)}
            >
              <Camera className="mr-2 h-4 w-4" />
              Close scanner
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
