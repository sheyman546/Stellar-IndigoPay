import cron from 'node-cron';
import { db } from '../../lib/db'; 
import { gifts, wallets, transactionHistory, notifications } from '../../lib/schema'; 
import { eq, and, lte, sql } from 'drizzle-orm';

// Execution lock guard to prevent overlapping ticks
let isProcessing = false;

/**
 * Scheduled Cron Job: Runs every minute to unlock and process mature gifts.
 */
export const startGiftReleaseJob = () => {
  cron.schedule('*/1 * * * *', async () => {
    // If the previous execution block is still busy, skip this iteration safely
    if (isProcessing) {
      console.warn('[Cron Job] Previous gift release batch is still running. Skipping tick.');
      return;
    }

    try {
      isProcessing = true;
      const now = new Date();

      console.log('[Cron Job] Checking for mature time-locked gifts...');

      // 1. Fetch all confirmed gifts whose lock time has expired
      const matureGifts = await db
        .select()
        .from(gifts)
        .where(
          and(
            eq(gifts.status, 'confirmed'),
            lte(gifts.unlockDatetime, now)
          )
        );

      if (matureGifts.length === 0) return;

      console.log(`[Cron Job] Found ${matureGifts.length} gifts ready for release.`);

      // 2. Process each gift sequentially in isolated database transactions
      for (const gift of matureGifts) {
        try {
          await db.transaction(async (tx) => {
            
            // A. Credit the recipient's wallet balance atomically in the DB
            // This prevents JavaScript float rounding bugs and uses the DB's native precision
            const updatedWallets = await tx
              .update(wallets)
              .set({ 
                balance: sql`${wallets.balance} + ${gift.amount}`, 
                updatedAt: new Date() 
              })
              .where(eq(wallets.userId, gift.recipientId))
              .returning(); // Returns the updated row to verify existence

            if (updatedWallets.length === 0) {
              throw new Error(`Wallet not found for recipient user ID: ${gift.recipientId}`);
            }

            // B. Update gift status to completed
            await tx
              .update(gifts)
              .set({ status: 'completed', updatedAt: new Date() })
              .where(eq(gifts.id, gift.id));

            // C. Create transaction history entry
            await tx.insert(transactionHistory).values({
              userId: gift.recipientId,
              amount: gift.amount,
              type: 'gift_receive',
              status: 'success',
              referenceId: gift.id,
              createdAt: new Date(),
            });

            // D. Dispatch an in-app notification entry
            await tx.insert(notifications).values({
              userId: gift.recipientId,
              title: '🎁 Gift Unlocked!',
              message: `Your time-locked cash gift of ${gift.amount} USDC has been released to your wallet.`,
              isRead: false,
              createdAt: new Date(),
            });
          });

          console.log(`[Cron Job] Successfully released gift ID: ${gift.id}`);
          
        } catch (giftError) {
          console.error(`[Cron Job] Failed to process gift ID ${gift.id}:`, giftError);
        }
      }
    } catch (error) {
      console.error('[Cron Job] Error executing gift release cron job:', error);
    } finally {
      // Always release the lock when execution finishes, even if errors occur
      isProcessing = false;
    }
  });
};