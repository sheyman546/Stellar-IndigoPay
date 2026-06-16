import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthPayload } from "@/lib/auth-session";
import { createProblemDetails } from "@/lib/api-utils";
import {
  sanitizeInput,
  validateEmail,
  validateE164PhoneNumber,
  sanitizePhoneNumber,
} from "@/lib/validation";

const UpdateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  phoneNumber: z.string().optional(),
});

type UpdateProfileRequest = z.infer<typeof UpdateProfileSchema>;

type UpdatedUser = {
  id: string;
  email: string;
  name: string | null;
  phoneNumber: string | null;
  role: string;
  status: string;
};

export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const payload = await getAuthPayload(request);
    if (!payload) {
      return createProblemDetails(
        "about:blank",
        "Unauthorized",
        401,
        "Unauthorized",
      );
    }

    // Parse request body
    let body: UpdateProfileRequest;
    try {
      body = await request.json();
    } catch {
      return createProblemDetails(
        "about:blank",
        "Bad Request",
        400,
        "Invalid JSON payload",
      );
    }

    // Validate schema
    const validationResult = UpdateProfileSchema.safeParse(body);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return createProblemDetails(
        "about:blank",
        "Bad Request",
        400,
        firstError.message,
      );
    }

    const { firstName, lastName, email, phoneNumber } = validationResult.data;

    // Build update object
    const updateData: Record<string, unknown> = {};
    let fullName = null;

    // Validate and set name fields
    if (firstName !== undefined || lastName !== undefined) {
      const first = firstName ? sanitizeInput(firstName) : "";
      const last = lastName ? sanitizeInput(lastName) : "";
      fullName = `${first} ${last}`.trim() || null;
      updateData.name = fullName;
    }

    // Validate and set email
    if (email !== undefined) {
      const sanitizedEmail = sanitizeInput(email);
      if (!validateEmail(sanitizedEmail)) {
        return createProblemDetails(
          "about:blank",
          "Bad Request",
          400,
          "Invalid email format",
        );
      }
      updateData.email = sanitizedEmail;
    }

    // Validate and set phone number
    if (phoneNumber !== undefined) {
      if (phoneNumber === null || phoneNumber === "") {
        updateData.phoneNumber = null;
      } else {
        if (!validateE164PhoneNumber(phoneNumber)) {
          return createProblemDetails(
            "about:blank",
            "Bad Request",
            400,
            "Invalid phone number format",
          );
        }
        const sanitizedPhone = sanitizePhoneNumber(phoneNumber);
        updateData.phoneNumber = sanitizedPhone;
      }
    }

    // If no updates provided, return current user
    if (Object.keys(updateData).length === 0) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, payload.userId),
        columns: {
          id: true,
          email: true,
          name: true,
          phoneNumber: true,
          role: true,
          status: true,
        },
      });

      if (!user) {
        return createProblemDetails(
          "about:blank",
          "Not Found",
          404,
          "User not found",
        );
      }

      return NextResponse.json(
        {
          success: true,
          user,
        },
        { status: 200 },
      );
    }

    // Check if email is already taken (if updating email)
    if (updateData.email) {
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, updateData.email as string),
      });

      if (existingUser && existingUser.id !== payload.userId) {
        return createProblemDetails(
          "about:blank",
          "Conflict",
          409,
          "Email already in use",
        );
      }
    }

    // Check if phone number is already taken (if updating phone)
    if (updateData.phoneNumber) {
      const existingUser = await db.query.users.findFirst({
        where: eq(users.phoneNumber, updateData.phoneNumber as string),
      });

      if (existingUser && existingUser.id !== payload.userId) {
        return createProblemDetails(
          "about:blank",
          "Conflict",
          409,
          "Phone number already in use",
        );
      }
    }

    // Update user in database
    updateData.updatedAt = new Date();

    const updatedUser = await db
      .update(users)
      .set(updateData as any)
      .where(eq(users.id, payload.userId))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        phoneNumber: users.phoneNumber,
        role: users.role,
        status: users.status,
      });

    if (!updatedUser.length) {
      return createProblemDetails(
        "about:blank",
        "Not Found",
        404,
        "User not found",
      );
    }

    const user: UpdatedUser = updatedUser[0];

    return NextResponse.json(
      {
        success: true,
        user,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in users/profile PUT:", error);
    return createProblemDetails(
      "about:blank",
      "Internal Server Error",
      500,
      "Internal server error",
    );
  }
}
