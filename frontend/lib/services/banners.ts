import { createClient } from "@/lib/supabase/client";
import { EVENT_BANNER_BUCKET, inspectBannerFile, ownedBannerUrl } from "@/lib/event-metadata";

export async function uploadEventBanner(file: File): Promise<string> {
  const { extension } = await inspectBannerFile(file);
  const client = createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) throw new Error("Please log in before uploading a banner.");
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const bucket = client.storage.from(EVENT_BANNER_BUCKET);
  const { error } = await bucket.upload(path, file, {
    cacheControl: "3600", upsert: false, contentType: file.type,
  });
  if (error) throw new Error("Your banner could not be uploaded. Please try again.");
  const { data } = bucket.getPublicUrl(path);
  return ownedBannerUrl(data.publicUrl, user.id, process.env.NEXT_PUBLIC_SUPABASE_URL)!;
}
