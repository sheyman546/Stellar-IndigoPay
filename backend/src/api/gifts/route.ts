import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { createProblemDetails } from "@/lib/api-utils";
import { getAuthPayload } from "@/lib/auth-session";
import { gifts, transactions, wallets } from "@/lib/db/schema";
import { sanitizeInput } from "@/lib/validation";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const payload = await getAuthPayload(request);
    if (!payload) {
      return createProblemDetails("about:blank", "Unauthorized", 401, "Unauthorized");
    }

    const body = await request.json();
    const { recipient, amount, currency, message, template } = body;

    if (!recipient || typeof recipient !== "string") {
      return createProblemDetails("about:blank", "Bad Request", 400, "recipient (uuid) is required");
    }

    const recipientId = recipient.trim();

    if (!UUID_RE.test(recipientId)) {
      return createProblemDetails("about:blank", "Bad Request", 400, "recipient must be a valid UUID");
    }

    if (typeof amount !== "number" || amount <= 0) {
      return createProblemDetails("about:blank", "Bad Request", 400, "amount must be a positive number");
    }

    if (!currency || typeof currency !== "string") {
      return createProblemDetails("about:blank", "Bad Request", 400, "currency is required");
    }

    const senderId = payload.userId;

    if (recipientId === senderId) {
      return createProblemDetails("about:blank", "Bad Request", 400, "recipient must differ from sender");
    }

    const curr = sanitizeInput(currency).toUpperCase();
    const msg = message ? sanitizeInput(String(message)) : null;
    const tmpl = template ? sanitizeInput(String(template)) : null;

    try {
      await db.transaction(async (tx) => {
        const updated = await tx
          .update(wallets)
          .set({
            balance: sql`${wallets.balance} - ${amount}`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(wallets.userId, senderId),
              eq(wallets.currency, curr),
              sql`${wallets.balance} >= ${amount}`,
            ),
          )
          .returning({ id: wallets.id });

        if (updated.length === 0) {
          throw new Error("insufficient_funds");
        }

        const txId = crypto.randomUUID();

        await tx.insert(transactions).values({
          id: txId,
          userId: senderId,
          walletId: updated[0].id,
          type: "transfer",
          status: "completed",
          amount,
          currency: curr,
          reference: `gift-${txId}`,
          provider: null,
        });

        await tx.insert(gifts).values({
          id: crypto.randomUUID(),
          senderId,
          recipientId,
          amount,
          fee: 0,
          totalAmount: amount,
          currency: curr,
          message: msg,
          template: tmpl,
          status: "confirmed",
          transactionId: txId,
        });
      });
    } catch (txError) {
      if (txError instanceof Error && txError.message === "insufficient_funds") {
        return createProblemDetails("about:blank", "Unprocessable Entity", 422, "Insufficient funds");
      }
      throw txError;
    }

    return NextResponse.json({ success: true, message: "Gift created" }, { status: 201 });
  } catch (error) {
    console.error("[GIFTS_POST_ERROR]", error);
    return createProblemDetails("about:blank", "Internal Server Error", 500, "Internal server error");
  }
}