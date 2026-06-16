import PublicGiftClaimView from "@/components/gift/PublicGiftClaimView";

export default async function PublicGiftClaimPage({
  params,
}: {
  params: Promise<{ giftId: string }>;
}) {
  const { giftId } = await params;

  return <PublicGiftClaimView giftId={giftId} />;
}
