import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createProblemDetails } from "@/lib/api-utils";
import { sanitizePhoneNumber } from "@/lib/validation";
import { findUserByPhoneNumber } from "@/server/db/authRepository";
import { createGift } from "@/server/db/giftRepository";
import {
  createCheckoutSession,
  StripeCheckoutError,
} from "@/server/services/stripeService";

const bodySchema = z.object({
  recipientPhone: z.string().trim().min(7, "Recipient phone number is required"),
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be positive")
    .max(1_000_000, "Amount exceeds maximum allowed value")
    .refine((v) => {
      const parts = v.toString().split(".");
      return parts.length === 1 || parts[1].length <= 2;
    }, "Amount must have at most 2 decimal places"),
  currency: z
    .string()
    .trim()
    .min(1, "Currency is required")
    .max(3, "Currency code must be at most 3 characters")
    .transform((v) => v.toUpperCase()),
  senderName: z.string().trim().min(1).max(200).optional(),
  senderEmail: z.string().trim().email("Invalid sender email").optional(),
  message: z.string().trim().max(1000).optional(),
  isAnonymous: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return createProblemDetails(
        "about:blank",
        "Bad Request",
        400,
        "Invalid Content-Type. Expected application/json",
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createProblemDetails(
        "about:blank",
        "Bad Request",
        400,
        "Invalid JSON body",
      );
    }

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return createProblemDetails(
        "about:blank",
        "Unprocessable Entity",
        422,
        parsed.error.issues[0]?.message ?? "Validation failed",
        undefined,
        {
          errors: parsed.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        },
      );
    }

    const {
      recipientPhone,
      amount,
      currency,
      senderName,
      senderEmail,
      message,
      isAnonymous,
    } = parsed.data;

    const normalizedPhone = sanitizePhoneNumber(recipientPhone);
    const recipient = await findUserByPhoneNumber(normalizedPhone);

    if (!recipient) {
      return createProblemDetails(
        "about:blank",
        "Not Found",
        404,
        "Recipient not found",
      );
    }

    const paymentReference = `gift_${crypto.randomUUID()}`;

    const gift = await createGift({
      recipientId: recipient.id,
      amount,
      currency,
      paymentReference,
      paymentProvider: "stripe",
      senderName: senderName ?? null,
      senderEmail: senderEmail ?? null,
      message: message ?? null,
      recipientPhone: normalizedPhone,
      isAnonymous: isAnonymous ?? false,
    });

    let checkoutUrl: string;
    let sessionId: string;

    try {
      // Stripe requires the smallest currency unit. Math.round(amount * 100)
      // assumes a 2-decimal currency (NGN, USD, GBP, EUR). Zero-decimal
      // currencies (JPY, KRW) would need a different multiplier — follow-up.
      const stripeAmount = Math.round(amount * 100);

      ({ checkoutUrl, sessionId } = await createCheckoutSession({
        giftId: gift.id,
        paymentReference,
        amount: stripeAmount,
        currency,
        senderEmail: senderEmail ?? null,
      }));
    } catch (err) {
      if (err instanceof StripeCheckoutError) {
        console.error("[PUBLIC_GIFT_STRIPE_ERROR]", err.cause ?? err);
        return createProblemDetails(
          "about:blank",
          "Payment Processor Error",
          502,
          "Unable to create payment session. The gift has been saved and can be retried.",
        );
      }
      throw err;
    }

    return NextResponse.json(
      {
        giftId: gift.id,
        paymentReference,
        checkoutUrl,
        sessionId,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[PUBLIC_GIFT_CREATE_ERROR]", error);
    return createProblemDetails(
      "about:blank",
      "Internal Server Error",
      500,
      "Internal server error",
    );
  }
}
