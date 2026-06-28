import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, gt, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { gifts } from "@/lib/db/schema";
import { getAuthPayload } from "@/lib/auth-session";
import { createProblemDetails } from "@/lib/api-utils";

type LockedGift = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  message: string | null;
  template: string | null;
  unlock_datetime: Date | null;
  hide_amount: boolean;
  hide_sender: boolean;
  is_anonymous: boolean;
  sender_id: string | null;
  recipient_id: string;
  role: "sender" | "recipient";
  created_at: Date;
};

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuthPayload(request);
    if (!payload) {
      return createProblemDetails(
        "about:blank",
        "Unauthorized",
        401,
        "Unauthorized",
      );
    }

    const userId = payload.userId;

    const lockedGifts = await db
      .select({
        id: gifts.id,
        status: gifts.status,
        amount: gifts.amount,
        currency: gifts.currency,
        message: gifts.message,
        template: gifts.template,
        unlockDatetime: gifts.unlockDatetime,
        hideAmount: gifts.hideAmount,
        hideSender: gifts.hideSender,
        isAnonymous: gifts.isAnonymous,
        senderId: gifts.senderId,
        recipientId: gifts.recipientId,
        createdAt: gifts.createdAt,
      })
      .from(gifts)
      .where(
        and(
          gt(gifts.unlockDatetime, new Date()),
          or(eq(gifts.recipientId, userId), eq(gifts.senderId, userId)),
        ),
      )
      .orderBy(asc(gifts.unlockDatetime));

    const data: LockedGift[] = lockedGifts.map((gift) => {
      const isSender = gift.senderId === userId;
      const hideSenderFromRecipient =
        !isSender && (gift.hideSender || gift.isAnonymous);

      return {
        id: gift.id,
        status: gift.status,
        amount: gift.hideAmount && !isSender ? 0 : gift.amount,
        currency: gift.currency,
        message: gift.message,
        template: gift.template,
        unlock_datetime: gift.unlockDatetime,
        hide_amount: gift.hideAmount,
        hide_sender: gift.hideSender,
        is_anonymous: gift.isAnonymous,
        sender_id: hideSenderFromRecipient ? null : gift.senderId,
        recipient_id: gift.recipientId,
        role: isSender ? "sender" : "recipient",
        created_at: gift.createdAt,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data,
        total: data.length,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in gifts/locked:", error);
    return createProblemDetails(
      "about:blank",
      "Internal Server Error",
      500,
      "Internal server error",
    );
  }
}
