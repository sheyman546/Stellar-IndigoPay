import { NextRequest } from "next/server";

const mockFindUserByPhoneNumber = jest.fn();
const mockCreateGift = jest.fn();
const mockCreateCheckoutSession = jest.fn();

jest.mock("@/server/db/authRepository", () => ({
  findUserByPhoneNumber: mockFindUserByPhoneNumber,
}));

jest.mock("@/server/db/giftRepository", () => ({
  createGift: mockCreateGift,
}));

jest.mock("@/server/services/stripeService", () => ({
  createCheckoutSession: mockCreateCheckoutSession,
  StripeCheckoutError: class StripeCheckoutError extends Error {
    constructor(
      message: string,
      public readonly cause?: unknown,
    ) {
      super(message);
      this.name = "StripeCheckoutError";
    }
  },
}));

const makeRequest = (body: unknown) =>
  new NextRequest("http://localhost/api/gifts/public", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const MOCK_RECIPIENT = {
  id: "recipient-uuid-123",
  email: "recipient@example.com",
  name: "Test Recipient",
  phoneNumber: "+2348012345678",
  role: "user",
  status: "active",
};

const MOCK_GIFT = {
  id: "gift-uuid-456",
  recipientId: "recipient-uuid-123",
  amount: 50,
  fee: 0,
  totalAmount: 50,
  currency: "NGN",
  paymentReference: "gift_test-ref-123",
  paymentProvider: "stripe",
  status: "pending_otp",
  createdAt: new Date("2026-06-20T00:00:00Z"),
};

const MOCK_SESSION = {
  sessionId: "cs_test_stripe123",
  checkoutUrl: "https://checkout.stripe.com/pay/cs_test_stripe123",
};

const VALID_BODY = {
  recipientPhone: "+2348012345678",
  amount: 50,
  currency: "NGN",
  senderName: "John Doe",
  senderEmail: "john@example.com",
};

describe("POST /api/gifts/public", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindUserByPhoneNumber.mockResolvedValue(MOCK_RECIPIENT);
    mockCreateGift.mockResolvedValue(MOCK_GIFT);
    mockCreateCheckoutSession.mockResolvedValue(MOCK_SESSION);
  });

  describe("success path", () => {
    it("returns 201 with giftId, paymentReference, checkoutUrl, and sessionId", async () => {
      const { POST } = await import("@/app/api/gifts/public/route");

      const res = await POST(makeRequest(VALID_BODY));
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.giftId).toBe("gift-uuid-456");
      expect(json.paymentReference).toMatch(/^gift_/);
      expect(json.checkoutUrl).toBe(
        "https://checkout.stripe.com/pay/cs_test_stripe123",
      );
      expect(json.sessionId).toBe("cs_test_stripe123");
    });

    it("stores amount in major units in the DB and converts to smallest unit for Stripe", async () => {
      const { POST } = await import("@/app/api/gifts/public/route");

      await POST(makeRequest({ ...VALID_BODY, amount: 50.5 }));

      expect(mockCreateGift).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 50.5 }),
      );
      expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 5050 }),
      );
    });

    it("creates the gift with senderId null and paymentProvider stripe", async () => {
      const { POST } = await import("@/app/api/gifts/public/route");

      await POST(makeRequest(VALID_BODY));

      expect(mockCreateGift).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId: "recipient-uuid-123",
          paymentProvider: "stripe",
          paymentReference: expect.stringMatching(/^gift_/),
          currency: "NGN",
        }),
      );
    });

    it("passes the payment_reference as client_reference_id to Stripe", async () => {
      const { POST } = await import("@/app/api/gifts/public/route");

      await POST(makeRequest(VALID_BODY));

      expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          giftId: "gift-uuid-456",
          paymentReference: expect.stringMatching(/^gift_/),
          currency: "NGN",
          senderEmail: "john@example.com",
        }),
      );
    });

    it("accepts optional fields and passes them through", async () => {
      const { POST } = await import("@/app/api/gifts/public/route");

      await POST(
        makeRequest({
          ...VALID_BODY,
          message: "Happy Birthday!",
          isAnonymous: true,
        }),
      );

      expect(mockCreateGift).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Happy Birthday!",
          isAnonymous: true,
        }),
      );
    });

    it("works when optional sender fields are omitted", async () => {
      const { POST } = await import("@/app/api/gifts/public/route");

      const res = await POST(
        makeRequest({ recipientPhone: "+2348012345678", amount: 100, currency: "NGN" }),
      );

      expect(res.status).toBe(201);
      expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({ senderEmail: null }),
      );
    });
  });

  describe("recipient resolution", () => {
    it("returns 404 when recipient phone is not registered", async () => {
      mockFindUserByPhoneNumber.mockResolvedValue(null);
      const { POST } = await import("@/app/api/gifts/public/route");

      const res = await POST(makeRequest(VALID_BODY));
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.detail).toBe("Recipient not found");
      expect(mockCreateGift).not.toHaveBeenCalled();
      expect(mockCreateCheckoutSession).not.toHaveBeenCalled();
    });
  });

  describe("Stripe failure", () => {
    it("returns 502 when Stripe throws StripeCheckoutError", async () => {
      const { POST } = await import("@/app/api/gifts/public/route");
      const { StripeCheckoutError } = await import(
        "@/server/services/stripeService"
      );

      mockCreateCheckoutSession.mockRejectedValue(
        new StripeCheckoutError("Stripe API error: card declined"),
      );

      const res = await POST(makeRequest(VALID_BODY));
      const json = await res.json();

      expect(res.status).toBe(502);
      expect(json.detail).toContain("Unable to create payment session");
    });

    it("still creates the gift before Stripe is called, leaving it saved on failure", async () => {
      const { POST } = await import("@/app/api/gifts/public/route");
      const { StripeCheckoutError } = await import(
        "@/server/services/stripeService"
      );

      mockCreateCheckoutSession.mockRejectedValue(
        new StripeCheckoutError("Stripe API error: network timeout"),
      );

      await POST(makeRequest(VALID_BODY));

      expect(mockCreateGift).toHaveBeenCalledTimes(1);
    });

    it("returns 500 for unexpected non-Stripe errors", async () => {
      const { POST } = await import("@/app/api/gifts/public/route");

      mockCreateCheckoutSession.mockRejectedValue(new Error("Unexpected DB error"));

      const res = await POST(makeRequest(VALID_BODY));

      expect(res.status).toBe(500);
    });
  });

  describe("validation", () => {
    it("returns 422 when amount is missing", async () => {
      const { POST } = await import("@/app/api/gifts/public/route");

      const res = await POST(
        makeRequest({ recipientPhone: "+2348012345678", currency: "NGN" }),
      );

      expect(res.status).toBe(422);
      expect(mockCreateGift).not.toHaveBeenCalled();
    });

    it("returns 422 when amount is negative", async () => {
      const { POST } = await import("@/app/api/gifts/public/route");

      const res = await POST(makeRequest({ ...VALID_BODY, amount: -10 }));

      expect(res.status).toBe(422);
    });

    it("returns 422 when amount is zero", async () => {
      const { POST } = await import("@/app/api/gifts/public/route");

      const res = await POST(makeRequest({ ...VALID_BODY, amount: 0 }));

      expect(res.status).toBe(422);
    });

    it("returns 422 when amount exceeds the maximum", async () => {
      const { POST } = await import("@/app/api/gifts/public/route");

      const res = await POST(makeRequest({ ...VALID_BODY, amount: 1_000_001 }));

      expect(res.status).toBe(422);
    });

    it("returns 422 when amount has more than 2 decimal places", async () => {
      const { POST } = await import("@/app/api/gifts/public/route");

      const res = await POST(makeRequest({ ...VALID_BODY, amount: 10.123 }));

      expect(res.status).toBe(422);
    });

    it("returns 422 when recipientPhone is missing", async () => {
      const { POST } = await import("@/app/api/gifts/public/route");

      const res = await POST(
        makeRequest({ amount: 50, currency: "NGN" }),
      );

      expect(res.status).toBe(422);
    });

    it("returns 422 when currency is missing", async () => {
      const { POST } = await import("@/app/api/gifts/public/route");

      const res = await POST(
        makeRequest({ recipientPhone: "+2348012345678", amount: 50 }),
      );

      expect(res.status).toBe(422);
    });

    it("returns 422 when senderEmail is not a valid email", async () => {
      const { POST } = await import("@/app/api/gifts/public/route");

      const res = await POST(
        makeRequest({ ...VALID_BODY, senderEmail: "not-an-email" }),
      );

      expect(res.status).toBe(422);
    });

    it("returns 400 when content-type is not application/json", async () => {
      const { POST } = await import("@/app/api/gifts/public/route");

      const req = new NextRequest("http://localhost/api/gifts/public", {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: JSON.stringify(VALID_BODY),
      });

      const res = await POST(req);

      expect(res.status).toBe(400);
    });

    it("returns 400 when body is not valid JSON", async () => {
      const { POST } = await import("@/app/api/gifts/public/route");

      const req = new NextRequest("http://localhost/api/gifts/public", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "not json {{{",
      });

      const res = await POST(req);

      expect(res.status).toBe(400);
    });
  });
});
