"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import Webcam from "react-webcam";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Camera, Upload, X } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  value?: string | File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  disabled = false,
}: ImageUploadProps) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const [preview, setPreview] = useState<string | null>(
    typeof value === "string" ? value : value ? URL.createObjectURL(value) : null
  );

  useEffect(() => {
    if (typeof value === "string") {
      setPreview(value);
    } else if (value instanceof File) {
      const objectUrl = URL.createObjectURL(value);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreview(null);
    }
  }, [value]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        onChange(file);
        setPreview(URL.createObjectURL(file));
      }
    },
    [onChange]
  );

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      fetch(imageSrc)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], "camera-capture.jpg", {
            type: "image/jpeg",
          });
          onChange(file);
          setPreview(imageSrc);
          setIsCameraOpen(false);
        });
    }
  }, [webcamRef, onChange]);

  const removeImage = () => {
    onChange(null);
    setPreview(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 1,
    disabled,
  });

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
          <Image
            src={preview}
            alt="Product preview"
            fill
            className="object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full"
            onClick={removeImage}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`relative flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-lg p-6 transition-colors hover:bg-muted/50 cursor-pointer ${
            isDragActive ? "border-primary bg-muted" : "border-muted-foreground/25"
          }`}
        >
          <input {...getInputProps()} />
          <div className="rounded-full bg-muted p-4">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
             <p className="text-sm font-medium">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              SVG, PNG, JPG or GIF (max 5MB)
            </p>
          </div>
        </div>
      )}

      {!preview && (
          <div className="flex justify-center">
             <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCameraOpen(true)}
                disabled={disabled}
            >
                <Camera className="mr-2 h-4 w-4" />
                Take Photo
            </Button>
          </div>
      )}

      <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Take Photo</DialogTitle>
          </DialogHeader>
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width="100%"
              height="100%"
              videoConstraints={{ facingMode: "environment" }}
            />
          </div>
          <DialogFooter>
             <Button variant="outline" onClick={() => setIsCameraOpen(false)}>
              Cancel
            </Button>
            <Button onClick={capture}>Capture</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
