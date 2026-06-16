import { Router } from "express";
import { makeExpressHandler } from "./adapter";
import { db } from "./lib/db";
import { gifts } from "./lib/db/schema";
import { eq } from "drizzle-orm";

// Auth
import { POST as authPost } from "./api/auth/route";
import { POST as forgotPasswordPost } from "./api/auth/forgot-password/route";
import { POST as loginPost } from "./api/auth/login/route";
import { POST as logoutPost } from "./api/auth/logout/route";
import { GET as meGet } from "./api/auth/me/route";
import { POST as refreshPost } from "./api/auth/refresh/route";
import { POST as registerPost } from "./api/auth/register/route";
import { POST as resendOtpPost } from "./api/auth/resend-otp/route";
import { POST as resendVerificationPost } from "./api/auth/resend-verification/route";
import { POST as resetPasswordPost } from "./api/auth/reset-password/route";
import { POST as revokePost } from "./api/auth/revoke/route";
import { POST as sendOtpPost } from "./api/auth/send-otp/route";
import { POST as sendPhoneOtpPost } from "./api/auth/send-phone-otp/route";
import { POST as sendVerificationPost } from "./api/auth/send-verification/route";
import { POST as verifyEmailPost } from "./api/auth/verify-email/route";
import { POST as verifyOtpPost } from "./api/auth/verify-otp/route";

// Dashboard
import { GET as dashboardActivityGet } from "./api/dashboard/activity/route";
import { GET as dashboardSummaryGet } from "./api/dashboard/summary/route";

// Gifts
import { GET as giftsGet, POST as giftsPost } from "./api/gifts/route";
import { POST as giftsBulkPost } from "./api/gifts/bulk/route";
import { POST as giftsPublicPost } from "./api/gifts/public/route";
import { POST as giftsPublicClaimPost } from "./api/gifts/public/[giftId]/claim/route";
import { POST as giftsPublicConfirmPost } from "./api/gifts/public/[giftId]/confirm/route";
import { GET as giftsPublicSummaryGet } from "./api/gifts/public/[giftId]/summary/route";
import { POST as giftsVerifyOtpPost } from "./api/gifts/verify-otp/route";
import { GET as giftGet } from "./api/gifts/[giftId]/route";
import { POST as giftCheckoutPost } from "./api/gifts/[giftId]/checkout/route";
import { POST as giftConfirmPost } from "./api/gifts/[giftId]/confirm/route";

// Notifications
import { POST as notificationsMarkReadPost } from "./api/notifications/mark-read/route";

// Transactions
import { GET as transactionsGet } from "./api/transactions/route";

// Users
import { POST as usersAvatarPost } from "./api/users/avatar/route";
import { POST as usersLookupPost } from "./api/users/lookup/route";
import { PUT as usersProfilePut } from "./api/users/profile/route";

// Wallet
import { GET as walletBalanceGet } from "./api/wallet/balance/route";
import { GET as walletBanksGet, POST as walletBanksPost } from "./api/wallet/banks/route";
import { POST as walletWithdrawPost } from "./api/wallet/withdraw/route";

// Webhooks
import { POST as webhooksPost } from "./api/webhooks/route";
import { POST as webhooksPaystackPost } from "./api/webhooks/paystack/route";
import { POST as webhooksStripePost } from "./api/webhooks/stripe/route";

export const apiRouter = Router();

// 1. Authentication routes
apiRouter.post("/api/auth", makeExpressHandler(authPost));
apiRouter.post("/api/auth/forgot-password", makeExpressHandler(forgotPasswordPost));
apiRouter.post("/api/auth/login", makeExpressHandler(loginPost));
apiRouter.post("/api/auth/logout", makeExpressHandler(logoutPost));
apiRouter.get("/api/auth/me", makeExpressHandler(meGet));
apiRouter.post("/api/auth/refresh", makeExpressHandler(refreshPost));
apiRouter.post("/api/auth/register", makeExpressHandler(registerPost));
apiRouter.post("/api/auth/resend-otp", makeExpressHandler(resendOtpPost));
apiRouter.post("/api/auth/resend-verification", makeExpressHandler(resendVerificationPost));
apiRouter.post("/api/auth/reset-password", makeExpressHandler(resetPasswordPost));
apiRouter.post("/api/auth/revoke", makeExpressHandler(revokePost));
apiRouter.post("/api/auth/send-otp", makeExpressHandler(sendOtpPost));
apiRouter.post("/api/auth/send-phone-otp", makeExpressHandler(sendPhoneOtpPost));
apiRouter.post("/api/auth/send-verification", makeExpressHandler(sendVerificationPost));
apiRouter.post("/api/auth/verify-email", makeExpressHandler(verifyEmailPost));
apiRouter.post("/api/auth/verify-otp", makeExpressHandler(verifyOtpPost));

// 2. Dashboard routes
apiRouter.get("/api/dashboard/activity", makeExpressHandler(dashboardActivityGet));
apiRouter.get("/api/dashboard/summary", makeExpressHandler(dashboardSummaryGet));

// 3. Gifts routes
apiRouter.get("/api/gifts", makeExpressHandler(giftsGet));
apiRouter.post("/api/gifts", makeExpressHandler(giftsPost));
apiRouter.post("/api/gifts/bulk", makeExpressHandler(giftsBulkPost));
apiRouter.post("/api/gifts/public", makeExpressHandler(giftsPublicPost));
apiRouter.post("/api/gifts/public/:giftId/claim", makeExpressHandler(giftsPublicClaimPost));
apiRouter.post("/api/gifts/public/:giftId/confirm", makeExpressHandler(giftsPublicConfirmPost));
apiRouter.get("/api/gifts/public/:giftId/summary", makeExpressHandler(giftsPublicSummaryGet));
apiRouter.post("/api/gifts/verify-otp", makeExpressHandler(giftsVerifyOtpPost));
apiRouter.get("/api/gifts/:giftId", makeExpressHandler(giftGet));
apiRouter.post("/api/gifts/:giftId/checkout", makeExpressHandler(giftCheckoutPost));
apiRouter.post("/api/gifts/:giftId/confirm", makeExpressHandler(giftConfirmPost));

// 4. Notifications routes
apiRouter.post("/api/notifications/mark-read", makeExpressHandler(notificationsMarkReadPost));

// 5. Transactions routes
apiRouter.get("/api/transactions", makeExpressHandler(transactionsGet));

// 6. Users routes
apiRouter.post("/api/users/avatar", makeExpressHandler(usersAvatarPost));
apiRouter.post("/api/users/lookup", makeExpressHandler(usersLookupPost));
apiRouter.put("/api/users/profile", makeExpressHandler(usersProfilePut));

// 7. Wallet routes
apiRouter.get("/api/wallet/balance", makeExpressHandler(walletBalanceGet));
apiRouter.get("/api/wallet/banks", makeExpressHandler(walletBanksGet));
apiRouter.post("/api/wallet/banks", makeExpressHandler(walletBanksPost));
apiRouter.post("/api/wallet/withdraw", makeExpressHandler(walletWithdrawPost));

// 8. Webhooks routes
apiRouter.post("/api/webhooks", makeExpressHandler(webhooksPost));
apiRouter.post("/api/webhooks/paystack", makeExpressHandler(webhooksPaystackPost));
apiRouter.post("/api/webhooks/stripe", makeExpressHandler(webhooksStripePost));

// 9. Custom Decoupled Slug Lookup route
apiRouter.get("/api/gifts/public/slug/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const gift = await db.query.gifts.findFirst({
      where: eq(gifts.shortCode, slug),
      columns: { id: true },
    });
    if (!gift) {
      return res.status(404).json({ success: false, error: "Gift not found" });
    }
    return res.status(200).json({ success: true, data: { id: gift.id } });
  } catch (error) {
    console.error("[SLUG_LOOKUP_ERROR]", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});
