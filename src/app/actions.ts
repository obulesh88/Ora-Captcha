
"use server";

import admin from 'firebase-admin';
import { antiBotProtection } from '@/ai/flows/anti-bot-protection';

const serviceAccount = {
  "type": "service_account",
  "project_id": "captcha-c5478",
  "private_key_id": "c2617b4ca7e453d701f30c4b7c05eb5a53ceb832",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDJuhkIH5KUWUQk\nQHD0EtMug71SMiJ8YFPpDVhL2q3n/L5ctqJZhv4hW4x9C2mW32uVt1xOMyIVokow\n2o0P/GU5+T04JxF105u4KKishSgMEHxxXXdXYjdFS3SKjy0xOBsPrXbQG4/c5fvb\nwy+dXnbgB0j4RxOS8GHPDFOp+3g/N+KMy512IQMy24qXzfoVtLFKXZS5Eg4mg0tb\nD+gZTyBkW9FGujWTQyXquMg1czZJYnmNmZFZRG5/4qjlDpBheITzRTSWQKeoFO65\nPqEXPunZCTPXV5TJZmf3OfBcMmqmdn6YgZG0xwY9qiqzYdx11r+tWLOVTHPXsC/c\nTWcvFtHVAgMBAAECggEABnXH9u9h54/LQ5jvtRVEP41W+wKhgZepIEG95eH5J0B8\nDSaJIPJWgZV3tIpwxXTesmL2mQeArC4wD4v0MAKecEKX0AxKPhp6dmWQ70NtYqOF\nhLDgUUNTL0wpDYXjxdt83F3q++OiEgoobGN+Cx1bE7YQA2ltSkuZ6kJEDKHBuk5+\nhZ5M6S0XMl2HdgFFhebittwmvhoohcwPGDqPGlQuW1D9NVgIKtWmCX/U96KPeDFv\nV62ZsQQouFh577Z/mYpxeWMRRBtPCv/QCM6UhgoX12nTvWTut2RsVurk5/LgWb9K\nZPATXfR34eJ1OH6NvbPEh0wBL+A3VQd8U7OAGWj3wQKBgQDw7OMd4/TonWV/V9gx\n7W9GDt1h1VXJgMQzscUjPqKU1UZqHqndVajOFJgwulafNgUPqQ39pwNWjbOGZ9eK\noZLSpVvNQhKnmF4Md1WO6tMHJzEyLTswFqGLJok1tCVI+oVTvkDJ6RkXEG66Fws9\nDQsc2haFgS8vAwrwymPG4UVOQQKBgQDWWVXgwmI3YDiO2/ilGSBqQdRZxPqNiMwg\ncGbAuHxXafXWmms3ah3ZsZxu7W58Na7EqR5kgeDDeeP2VzoYQT++lXJGKQVk3lyW\nAcwfPbKOMa+dAZQCWE5FtGTCPPtRGxOjpK2bqqTGfBRdIXF1oaLGpfCcDkVvXu3X\nJyhgnLrGlQKBgHc1/7tOjGR9XTeBk+xAfArCWDCMiwJFwM+DavRhjbjvPwRLX+mw\n9PHjptqVmT72T9LL56xW84PkYaxjvXdPM4MfZylNREXBUugANEmfUAP+FI2ra9oD\nmLNtwf7cwIY3z7j8Lrq5qDyNWPyjYmA3EASatQIiReKRMtyqiGxkExMBAoGANQ57\n4Vx8LzTUCxiL3WHw0hxlUaseUbZQwJ7R8FY6APErdulWLKtJpD8Ad7yxonEvR2KN\nMVesqPYc5TcGHEbaXnRjitZQjX008bSUMA93iRbnXzeqyUHObhaO8j1h/9tx6wmy\nJ1v/2VmRONQ0X2eZAQ7GFfq6WSzoNl9s8S0aVlkCgYBguMCSpO0T0sYBsCqFms2z\nLyxpa4Ru9mGcIOcngCbFbWD/5YB9rjiKguWV9w/QfhFk/z5r9ruCJUN3/ASo79zv\nWH0WbaIbTtCyPEQjPJnnnWKjNdHqzrJjcN5uV0QeDra8kFY62z4Z6CW3jZhQOWF0\n1gN+GrcyoUGxrG4Zf+G34w==\n-----END PRIVATE KEY-----\n".replace(/\\n/g, '\n'),
  "client_email": "firebase-adminsdk-fbsvc@captcha-c5478.iam.gserviceaccount.com",
};


// Helper function to initialize Firebase Admin SDK
function getAdminFirestore() {
  if (admin.apps.length === 0) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } catch (error: any) {
       console.error("Failed to initialize Firebase Admin:", error.message);
       throw new Error("Firebase Admin initialization failed. Check the hardcoded service account credentials.");
    }
  }
  return admin.firestore();
}

export async function requestWithdrawal(userId: string, walletAddress: string, amount: number) {
  const db = getAdminFirestore();
  const userDocRef = db.collection('users').doc(userId);

  try {
    const referenceId = await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists) {
        throw new Error("User does not exist!");
      }

      const currentBalance = userDoc.data()?.balance || 0;
      if (currentBalance < amount) {
        throw new Error("Insufficient funds.");
      }

      // Hold funds by debiting balance immediately
      transaction.update(userDocRef, { balance: admin.firestore.FieldValue.increment(-amount) });

      // Create a unique reference ID for the withdrawal
      const newTransactionRef = db.collection('transactions').doc();
      const refId = `WID-${Date.now()}-${newTransactionRef.id.slice(0, 6)}`;

      // Create the pending transaction record
      transaction.set(newTransactionRef, {
        userId: userId,
        type: 'Withdrawal',
        amount: -amount,
        date: admin.firestore.FieldValue.serverTimestamp(),
        status: 'pending',
        referenceId: refId,
      });

      return refId; // Return the referenceId from the transaction
    });

    // Call the Supabase function after the transaction is successful
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Supabase environment variables are not set.');
        // Don't throw here, as the Firestore transaction has already committed.
        // Log this for monitoring. The withdrawal is pending and can be retried.
        return { success: true, message: `Your request for ${amount} ORA is pending. There was a delay in processing.` };
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/wallet-transfer-firebase`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
            to_address: walletAddress,
            amount: amount,
            currency: 'ORA',
            reference_id: referenceId,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Supabase function error:", errorData);
        // Don't throw here. The withdrawal is pending and can be retried.
        // A more robust system would queue this for retry.
        return { success: true, message: `Your request for ${amount} ORA is pending. There was an issue with the final processing step.` };
    }

    return { success: true, message: `Your request for ${amount} ORA is now pending.` };

  } catch (error: any) {
    console.error("Withdrawal transaction failed:", error);
    // In a real app, you would have a refund mechanism if the initial transaction fails.
    // For now, we just report the failure.
    return { success: false, message: error.message || "Could not complete your withdrawal request." };
  }
}

export async function checkBotScore(userActions: string[]) {
  try {
    const result = await antiBotProtection({
      userActions,
      timestamp: Date.now(),
      ipAddress: "127.0.0.1", // In a real app, you'd get this from the request
    });
    return result;
  } catch (error) {
    console.error("Error checking bot score:", error);
    return { botScore: 0, explanation: "Error checking bot score" };
  }
}


export async function recordCaptchaSuccess(userId: string) {
    const db = getAdminFirestore();
    const userDocRef = db.collection('users').doc(userId);
    const transactionsColRef = db.collection('transactions');
    const earnedCoins = 2;

    try {
        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists) {
                throw new Error("User not found.");
            }
            
            transaction.update(userDocRef, {
                balance: admin.firestore.FieldValue.increment(earnedCoins)
            });

            const newTransactionRef = transactionsColRef.doc();
            transaction.set(newTransactionRef, {
                userId: userId,
                type: 'Captcha Solved',
                amount: earnedCoins,
                date: admin.firestore.FieldValue.serverTimestamp(),
                status: 'completed',
            });
        });
        return { success: true, message: `You've earned ${earnedCoins} ORA coins.` };
    } catch (error: any) {
        console.error("Captcha success transaction failed:", error);
        return { success: false, message: error.message || "Could not record captcha success." };
    }
}

export async function recordAdReward(userId: string) {
    const db = getAdminFirestore();
    const userDocRef = db.collection('users').doc(userId);
    const transactionsColRef = db.collection('transactions');
    const adReward = 3;

    try {
        await db.runTransaction(async (transaction) => {
             const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists) {
                throw new Error("User not found.");
            }

            transaction.update(userDocRef, {
                balance: admin.firestore.FieldValue.increment(adReward)
            });

            const newTransactionRef = transactionsColRef.doc();
            transaction.set(newTransactionRef, {
                userId: userId,
                type: 'Ad Watched',
                amount: adReward,
                date: admin.firestore.FieldValue.serverTimestamp(),
                status: 'completed',
            });
        });
        return { success: true, message: `You've earned ${adReward} ORA coins.` };
    } catch (error: any) {
        console.error("Ad reward transaction failed:", error);
        return { success: false, message: error.message || "Could not record ad reward." };
    }
}

export async function saveWalletAddress(userId: string, walletAddress: string) {
    if (!walletAddress.trim()) {
        return { success: false, message: 'Please enter a valid wallet address.' };
    }

    const db = getAdminFirestore();
    const userDocRef = db.collection('users').doc(userId);

    try {
        await userDocRef.update({ walletAddress: walletAddress.trim() });
        return { success: true, message: 'Wallet Address Saved!' };
    } catch (error: any) {
        console.error("Save wallet address failed:", error);
        return { success: false, message: error.message || "Could not save wallet address." };
    }
}


export async function completeWithdrawalVerification(transactionId: string) {
    const db = getAdminFirestore();
    const transactionRef = db.collection('transactions').doc(transactionId);

    try {
        await transactionRef.update({ status: 'completed' });
        return { success: true, message: 'Verification Complete' };
    } catch (error: any) {
        console.error("Withdrawal verification failed:", error);
        return { success: false, message: error.message || "Could not update transaction status." };
    }
}

    