

export enum AuditEventType {
  OTP_GENERATED = "OTP_GENERATED",
  OTP_VERIFIED_SUCCESS = "OTP_VERIFIED_SUCCESS",
  OTP_VERIFIED_FAILED = "OTP_VERIFIED_FAILED",
  ACCOUNT_LOCKED_5_ATTEMPTS = "ACCOUNT_LOCKED_5_ATTEMPTS",
  ACCOUNT_LOCKED_10_ATTEMPTS = "ACCOUNT_LOCKED_10_ATTEMPTS",
  ACCOUNT_UNLOCKED = "ACCOUNT_UNLOCKED",
  GIFT_OTP_FAILED = "GIFT_OTP_FAILED",
  GIFT_OTP_LOCKED = "GIFT_OTP_LOCKED",
}

interface AuditLogEntry {
  timestamp: Date;
  eventType: AuditEventType;
  userId?: string;
  giftId?: string;
  metadata?: Record<string, unknown>;
  message: string;
}


export function logAuditEvent(entry: AuditLogEntry): void {
  const logEntry = {
    ...entry,
    timestamp: entry.timestamp.toISOString(),
  };

  
  console.log("[SECURITY_AUDIT]", JSON.stringify(logEntry));
}


export function logOTPEvent(
  eventType: AuditEventType,
  userId: string,
  metadata?: Record<string, unknown>,
): void {
  logAuditEvent({
    timestamp: new Date(),
    eventType,
    userId,
    metadata,
    message: `OTP event: ${eventType} for user ${userId}`,
  });
}


export function logGiftOTPEvent(
  eventType: AuditEventType,
  giftId: string,
  metadata?: Record<string, unknown>,
): void {
  logAuditEvent({
    timestamp: new Date(),
    eventType,
    giftId,
    metadata,
    message: `Gift OTP event: ${eventType} for gift ${giftId}`,
  });
}
