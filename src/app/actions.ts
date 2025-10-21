
"use server";

import { doc, runTransaction, collection, serverTimestamp, getFirestore, initializeApp, getApps, App, cert } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import { antiBotProtection } from '@/ai/flows/anti-bot-protection';

// Helper function to initialize Firebase Admin SDK
function getAdminFirestore() {
  if (admin.apps.length === 0) {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountString) {
      throw new Error('The FIREBASE_SERVICE_ACCOUNT environment variable is not set.');
    }
    
    try {
      // Decode the Base64 encoded service account
      const decodedServiceAccount = Buffer.from(serviceAccountString, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(decodedServiceAccount);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } catch (error: any) {
       console.error("Failed to parse or use FIREBASE_SERVICE_ACCOUNT:", error.message);
       throw new Error("Firebase Admin initialization failed. Check your FIREBASE_SERVICE_ACCOUNT environment variable.");
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
