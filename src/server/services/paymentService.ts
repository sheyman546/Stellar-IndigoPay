import { createCheckoutSession, CheckoutSessionParams } from "@/lib/stripe/client";
import { db } from "@/lib/db";
import { gifts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface InitiateStripeCheckoutParams {
  giftId: string;
  amount: number;
  currency: string;
  baseUrl: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}


export async function initiateStripeCheckout(
  params: InitiateStripeCheckoutParams
): Promise<CheckoutSessionResult> {
  const { giftId, amount, currency, baseUrl } = params;

  
  const supportedCurrencies = ["usd", "eur", "gbp", "cad", "aud", "jpy", "sgd", "nzd"];
  const normalizedCurrency = currency.toLowerCase();

  if (!supportedCurrencies.includes(normalizedCurrency)) {
    throw new Error(
      `Currency ${currency.toUpperCase()} is not supported for Stripe Checkout. Supported: ${supportedCurrencies.map((c) => c.toUpperCase()).join(", ")}`
    );
  }

  const sessionParams: CheckoutSessionParams = {
    giftId,
    amount,
    currency: normalizedCurrency,
    giftDescription: "Zendvo Gift",
    successUrl: `${baseUrl}/gift/${giftId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${baseUrl}/gift/${giftId}?payment=cancelled`,
  };

  const session = await createCheckoutSession(sessionParams);

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  
  await db
    .update(gifts)
    .set({
      paymentReference: session.id,
      paymentProvider: "stripe",
      updatedAt: new Date(),
    })
    .where(eq(gifts.id, giftId));

  return { sessionId: session.id, url: session.url };
}
