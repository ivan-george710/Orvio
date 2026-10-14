"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import EventBanner from "@/components/events/EventBanner";
import { uploadEventBanner } from "@/lib/services/banners";

export default function BannerUpload({ value, onChange, onBusyChange, disabled }: {
  value: string | null;
  onChange: (value: string | null) => void;
  onBusyChange: (busy: boolean) => void;
  disabled: boolean;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function upload(file: File | undefined) {
    if (!file || uploading || disabled) return;
    setUploading(true);
    onBusyChange(true);
    setError("");
    setNotice("");
    try {
      onChange(await uploadEventBanner(file));
      setNotice("Banner uploaded. Save the event to use it.");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Your banner could not be uploaded.");
    } finally {
      setUploading(false);
      onBusyChange(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="space-y-3 sm:col-span-2">
      <Label htmlFor="event-banner-file">Event banner</Label>
      <Input ref={fileInput} id="event-banner-file" type="file" accept="image/jpeg,image/png,image/webp"
        disabled={disabled || uploading}
        aria-describedby={error ? "banner-help banner-error" : "banner-help"}
        aria-invalid={Boolean(error)}
        onChange={(event) => void upload(event.target.files?.[0])} />
      <p id="banner-help" className="text-xs text-muted-foreground">
        Optional JPEG, PNG or WebP image, up to 5 MB. Event banners are publicly visible.
      </p>
      {uploading && <p role="status" className="text-sm text-muted-foreground">Uploading banner...</p>}
      {error && <p id="banner-error" role="alert" className="text-sm text-red-200">{error}</p>}
      {notice && <p role="status" className="text-sm text-success">{notice}</p>}
      {value && (
        <>
          <EventBanner url={value} title="Preview" />
          <Button type="button" variant="outline" disabled={disabled || uploading} onClick={() => {
            onChange(null);
            setError("");
            setNotice("Banner removed from this draft. Save the event to apply the change.");
          }}>Remove banner</Button>
        </>
      )}
    </div>
  );
}
