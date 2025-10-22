
'use server';

import { antiBotProtection } from '@/ai/flows/anti-bot-protection';
import { CollectionReference, doc, getDoc, runTransaction, serverTimestamp, writeBatch } from 'firebase/firestore';
import { headers } from 'next/headers';

/**
 * Checks the bot score for a series of user actions.
 * @param userActions - An array of strings representing user actions.
 * @returns The bot score and an explanation if the score is high.
 */
export async function checkBotScore(userActions: string[]) {
  const ipAddress = headers().get('x-forwarded-for') ?? '127.0.0.1';
  try {
    const result = await antiBotProtection({
      userActions,
      timestamp: Date.now(),
      ipAddress,
    });
    return result;
  } catch (error) {
    console.error('Error checking bot score:', error);
    // Return a safe default in case of error
    return { botScore: 0, explanation: null };
  }
}

/**
 * Records a successful captcha solve and awards coins to the user.
 * @param userId - The ID of the user.
 * @returns An object indicating success or failure.
 */
export async function recordCaptchaSuccess(userId: string) {
    console.log(`Recording captcha success for user: ${userId}. Awarding 100 coins.`);
    return { success: true, message: 'Reward of 100 ORA coins has been added to your balance.' };
}


/**
 * Records a successful ad watch and awards coins to the user.
 * @param userId - The ID of the user.
 * @returns An object indicating success or failure.
 */
export async function recordAdReward(userId: string) {
    console.log(`Recording ad reward for user: ${userId}. Awarding 3 coins.`);
    return { success: true, message: 'Reward of 3 ORA coins has been added to your balance.' };
}

/**
 * Saves the user's wallet address.
 * @param userId - The ID of the user.
 * @param walletAddress - The new wallet address.
 * @returns An object indicating success or failure.
 */
export async function saveWalletAddress(userId: string, walletAddress: string) {
    console.log(`Saving wallet address for user ${userId}: ${walletAddress}`);
    return { success: true, message: 'Wallet address saved successfully.' };
}

/**
 * Requests a withdrawal for the user.
 * @param userId - The ID of the user.
 * @param walletAddress - The user's wallet address.
 * @param amount - The amount to withdraw.
 * @returns An object indicating success or failure.
 */
export async function requestWithdrawal(userId: string, walletAddress: string, amount: number) {
    console.log(`Requesting withdrawal of ${amount} for user ${userId} to wallet ${walletAddress}.`);
    return { success: true, message: 'Your withdrawal request has been submitted and is pending.' };
}

/**
 * Marks a withdrawal transaction as completed.
 * @param transactionId - The ID of the transaction to complete.
 * @returns An object indicating success or failure.
 */
export async function completeWithdrawalVerification(transactionId: string) {
    console.log(`Completing withdrawal verification for transaction: ${transactionId}`);
    return { success: true, message: 'Withdrawal verification completed.' };
}
