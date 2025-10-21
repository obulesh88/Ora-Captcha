
"use server";

import { doc, runTransaction, collection, serverTimestamp, getFirestore, initializeApp, getApps, App, cert } from 'firebase-admin/firestore';
import admin from 'firebase-admin';

// Helper function to initialize Firebase Admin SDK
function getAdminFirestore() {
  const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  return admin.firestore();
}

export async function requestWithdrawal(userId: string, walletAddress: string, amount: number) {
  const db = getAdminFirestore();
  const userDocRef = db.collection('users').doc(userId);

  try {
    await db.runTransaction(async (transaction) => {
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
      const referenceId = `WID-${Date.now()}-${newTransactionRef.id.slice(0, 6)}`;

      // Create the pending transaction record
      transaction.set(newTransactionRef, {
        userId: userId,
        type: 'Withdrawal',
        amount: -amount,
        date: admin.firestore.FieldValue.serverTimestamp(),
        status: 'pending',
        referenceId: referenceId,
      });

      // Call the Supabase function
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error('Supabase environment variables are not set.');
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
          throw new Error(`Failed to process withdrawal via Supabase: ${errorData.error || response.statusText}`);
      }
    });

    return { success: true, message: `Your request for ${amount} ORA is now pending.` };

  } catch (error: any) {
    console.error("Withdrawal transaction failed:", error);
    // In a real app, you might want to add logic to refund the user's balance
    // if the Supabase call fails after the Firestore transaction is committed.
    return { success: false, message: error.message || "Could not complete your withdrawal request." };
  }
}
