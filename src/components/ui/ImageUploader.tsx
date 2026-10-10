"use client";

import React, { useState } from "react";
import Image from "next/image";
import { UploadCloud, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  className?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  onRemove,
  className,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to upload image");
      }

      onChange(data.url);
    } catch (err: any) {
      setError(err.message || "Upload error");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className={cn("w-full space-y-2", className)}>
      {value ? (
        <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200 group">
          <Image
            src={value}
            alt="Uploaded preview"
            fill
            className="object-cover"
          />
          <button
            type="button"
            onClick={() => {
              onChange("");
              if (onRemove) onRemove();
            }}
            className="absolute top-2 right-2 bg-rose-600 text-white p-2 rounded-full shadow-md hover:bg-rose-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Remove image"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-emerald-50/30 min-h-[160px]"
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
            id="image-upload-input"
          />
          <label
            htmlFor="image-upload-input"
            className="w-full flex flex-col items-center justify-center cursor-pointer"
          >
            {loading ? (
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                <span className="text-sm font-medium text-gray-600">
                  Uploading image to Cloudinary...
                </span>
              </div>
            ) : (
              <>
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full mb-2">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  Click to upload or drag & drop
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  JPG, PNG, or WEBP (Max 5MB)
                </span>
              </>
            )}
          </label>
        </div>
      )}

      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
};
