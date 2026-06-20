import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAuthPayload } from "@/lib/auth-session";

jest.mock("drizzle-orm", () => ({
  and: jest.fn(() => ({})),
  or: jest.fn(() => ({})),
  eq: jest.fn(() => ({})),
  gt: jest.fn(() => ({})),
  asc: jest.fn(() => ({})),
}));

const orderByMock = jest.fn();
const whereMock = jest.fn(() => ({ orderBy: orderByMock }));
const fromMock = jest.fn(() => ({ where: whereMock }));
const selectMock = jest.fn(() => ({ from: fromMock }));

jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn(() => ({ from: jest.fn() })),
  },
}));

jest.mock("@/lib/db/schema", () => ({
  gifts: {
    id: "id",
    status: "status",
    amount: "amount",
    currency: "currency",
    message: "message",
    template: "template",
    unlockDatetime: "unlock_datetime",
    hideAmount: "hide_amount",
    hideSender: "hide_sender",
    isAnonymous: "is_anonymous",
    senderId: "sender_id",
    recipientId: "recipient_id",
    createdAt: "created_at",
  },
}));

jest.mock("@/lib/auth-session", () => ({
  getAuthPayload: jest.fn(),
}));

describe("GET /api/gifts/locked", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (db.select as jest.Mock).mockImplementation(selectMock);
  });

  const makeRequest = () =>
    new NextRequest("http://localhost/api/gifts/locked", { method: "GET" });

  it("returns unauthorized when no auth payload is present", async () => {
    (getAuthPayload as jest.Mock).mockResolvedValue(null);
    const { GET } = await import("@/app/api/gifts/locked/route");

    const response = await GET(makeRequest());
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.detail).toBe("Unauthorized");
    expect(db.select).not.toHaveBeenCalled();
  });

  it("returns locked gifts for the authenticated user sorted by release date", async () => {
    (getAuthPayload as jest.Mock).mockResolvedValue({ userId: "user-1" });
    orderByMock.mockResolvedValue([
      {
        id: "gift-1",
        status: "confirmed",
        amount: 100,
        currency: "USD",
        message: "Happy birthday",
        template: "balloons",
        unlockDatetime: new Date("2026-07-01T00:00:00.000Z"),
        hideAmount: false,
        hideSender: false,
        isAnonymous: false,
        senderId: "user-2",
        recipientId: "user-1",
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
      },
    ]);

    const { GET } = await import("@/app/api/gifts/locked/route");
    const response = await GET(makeRequest());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.total).toBe(1);
    expect(json.data[0].id).toBe("gift-1");
    expect(json.data[0].role).toBe("recipient");
    expect(json.data[0].amount).toBe(100);
    expect(whereMock).toHaveBeenCalled();
    expect(orderByMock).toHaveBeenCalled();
  });

  it("hides amount and sender from recipient when flagged, but not from sender", async () => {
    (getAuthPayload as jest.Mock).mockResolvedValue({ userId: "user-1" });
    orderByMock.mockResolvedValue([
      {
        id: "gift-hidden",
        status: "confirmed",
        amount: 250,
        currency: "USD",
        message: null,
        template: null,
        unlockDatetime: new Date("2026-07-01T00:00:00.000Z"),
        hideAmount: true,
        hideSender: true,
        isAnonymous: true,
        senderId: "user-2",
        recipientId: "user-1",
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
      },
    ]);

    const { GET } = await import("@/app/api/gifts/locked/route");
    const response = await GET(makeRequest());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data[0].role).toBe("recipient");
    expect(json.data[0].amount).toBe(0);
    expect(json.data[0].sender_id).toBeNull();
  });

  it("marks the user as sender and reveals hidden details to them", async () => {
    (getAuthPayload as jest.Mock).mockResolvedValue({ userId: "user-2" });
    orderByMock.mockResolvedValue([
      {
        id: "gift-sent",
        status: "confirmed",
        amount: 250,
        currency: "USD",
        message: null,
        template: null,
        unlockDatetime: new Date("2026-07-01T00:00:00.000Z"),
        hideAmount: true,
        hideSender: true,
        isAnonymous: true,
        senderId: "user-2",
        recipientId: "user-1",
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
      },
    ]);

    const { GET } = await import("@/app/api/gifts/locked/route");
    const response = await GET(makeRequest());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data[0].role).toBe("sender");
    expect(json.data[0].amount).toBe(250);
    expect(json.data[0].sender_id).toBe("user-2");
  });

  it("returns an empty list when the user has no locked gifts", async () => {
    (getAuthPayload as jest.Mock).mockResolvedValue({ userId: "user-3" });
    orderByMock.mockResolvedValue([]);

    const { GET } = await import("@/app/api/gifts/locked/route");
    const response = await GET(makeRequest());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toEqual([]);
    expect(json.total).toBe(0);
  });
});
