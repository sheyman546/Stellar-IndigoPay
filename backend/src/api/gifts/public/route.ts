import { NextRequest, NextResponse } from "next/server";
import {
  validateEmail,
  sanitizeInput,
} from "@/lib/validation";
import { isRateLimited } from "@/lib/rate-limiter";
import { createProblemDetails } from "@/lib/api-utils";

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

    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 10240) {
      return createProblemDetails(
        "about:blank",
        "Payload Too Large",
        413,
        "Request body too large",
      );
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    if (isRateLimited(ip)) {
      return createProblemDetails(
        "about:blank",
        "Too Many Requests",
        429,
        "Too many requests. Please try again later.",
      );
    }

    const body = await request.json();
    const { senderEmail, "confirm-email": confirmEmail } = body;

    if (!senderEmail) {
      return createProblemDetails(
        "about:blank",
        "Bad Request",
        400,
        "senderEmail is required",
      );
    }

    if (!confirmEmail) {
      return createProblemDetails(
        "about:blank",
        "Bad Request",
        400,
        "confirm-email is required",
      );
    }

    const sanitizedEmail = sanitizeInput(senderEmail);
    const sanitizedConfirm = sanitizeInput(confirmEmail);

    if (!validateEmail(sanitizedEmail)) {
      return createProblemDetails(
        "about:blank",
        "Bad Request",
        400,
        "Invalid sender email format",
      );
    }

    if (sanitizedEmail.toLowerCase() !== sanitizedConfirm.toLowerCase()) {
      return createProblemDetails(
        "about:blank",
        "Bad Request",
        400,
        "senderEmail must match confirmEmail",
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          giftId: "",
          status: "pending_review",
          slug: "",
          shortCode: "",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[GIFTS_PUBLIC_POST_ERROR]", error);

    return createProblemDetails(
      "about:blank",
      "Internal Server Error",
      500,
      "Internal server error",
    );
  }
}
