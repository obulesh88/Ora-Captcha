'use server';

import { antiBotProtection } from '@/ai/flows/anti-bot-protection';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountKey) {
  throw new Error(
    'FIREBASE_SERVICE_ACCOUNT_KEY env var is not set. Provide the service account JSON as an env var.'
  );
}

if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(
      Buffer.from(serviceAccountKey, 'base64').toString('utf-8')
    );
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY contains invalid JSON: ' + error.message
    );
  }
}

const firestore = getFirestore();

export async function requestWithdrawal(
  userId: string,
  walletAddress: string,
  amount: number
) {
  if (!userId || !walletAddress || !amount || amount <= 0) {
    return { success: false, error: 'Invalid arguments provided.' };
  }

  // 1. Simulate calling the Supabase function
  const supabaseUrl = 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/wallet-transfer';
  const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'; // This should be a service_role key, kept securely on the server.

  const transferData = {
    to_address: walletAddress,
    amount: amount,
    currency: 'inr',
    reference_id: `ora_${userId}_${Date.now()}`,
  };

  try {
    /* 
    // This is where you would make the actual call to your Supabase function
    const response = await fetch(supabaseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transferData)
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(errorBody.error || `Supabase transfer failed with status: ${response.status}`);
    }
    
    const result = await response.json();
    */

    // 2. Atomically update Firestore after a successful API call simulation
    const userDocRef = firestore.collection('users').doc(userId);
    const newTransactionRef = firestore.collection('transactions').doc();

    await firestore.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists) {
        throw new Error('User does not exist!');
      }

      const currentBalance = userDoc.data()?.balance || 0;
      if (currentBalance < amount) {
        throw new Error('Insufficient funds.');
      }

      // Debit the user's balance
      transaction.update(userDocRef, { balance: currentBalance - amount });

      // Create the pending transaction record
      transaction.set(newTransactionRef, {
        userId: userId,
        type: 'Withdrawal',
        amount: -amount,
        date: new Date(),
        status: 'pending',
        // In a real scenario, you might store the transaction ID from the Supabase response
        referenceId: transferData.reference_id,
      });
    });

    return { success: true, referenceId: transferData.reference_id };
    
  } catch (error: any) {
    console.error('Withdrawal Request Error:', error);
    return {
      success: false,
      error: error.message || 'Could not complete your withdrawal request.',
    };
  }
}


export async function checkBotScore(actions: string[]) {
  try {
    const result = await antiBotProtection({
      userActions: actions,
      timestamp: Date.now(),
      // In a real app, you would get the user's IP address from the request.
      ipAddress: '127.0.0.1',
    });
    return result;
  } catch (error) {
    console.error('Error checking bot score:', error);
    return {
      botScore: 0,
      explanation: 'Error analyzing behavior.',
    };
  }
}
