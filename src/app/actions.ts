
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

  const supabaseUrl = 'https://nwxgjyamiborsgfnzqcj.supabase.co/functions/v1/wallet-transfer';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53eGdqeWFtaWJvcnNnZm56cWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNTM4OTgsImV4cCI6MjA3NTgyOTg5OH0.EtGjkpdoCWEH6YWNr2LjIcFdlsZ-7URjUiLMcRpcfZE'; 

  const transferData = {
    to_address: walletAddress,
    amount: amount, // 1 coin = 1 rupee, so amount is correct
    currency: 'inr', 
    reference_id: `ora_${userId}_${Date.now()}`,
  };

  try {
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

      transaction.update(userDocRef, { balance: currentBalance - amount });

      transaction.set(newTransactionRef, {
        userId: userId,
        type: 'Withdrawal',
        amount: -amount,
        date: new Date(),
        status: 'pending',
        referenceId: result.reference_id || transferData.reference_id,
      });
    });

    return { success: true, referenceId: result.reference_id || transferData.reference_id };
    
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
