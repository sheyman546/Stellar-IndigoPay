import { notFound } from "next/navigation";
import PublicGiftClaimView from "@/components/gift/PublicGiftClaimView";

export default async function ShortLinkGiftPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const backendUrl = process.env.API_URL || "http://localhost:5000";

  try {
    const res = await fetch(`${backendUrl}/api/gifts/public/slug/${slug}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      notFound();
    }

    const payload = await res.json();
    if (!payload.success || !payload.data?.id) {
      notFound();
    }

    return <PublicGiftClaimView giftId={payload.data.id} />;
  } catch (error) {
    console.error("Error looking up gift shortcode:", error);
    notFound();
  }
}
