
'use client';

import Header from '@/components/common/Header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Wallet, IndianRupee, Loader2 } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useUser, useAuth, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp, setDoc, runTransaction, writeBatch } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface UserProfile {
  id: string;
  walletAddress?: string;
  balance: number;
  email: string;
}

export default function WalletPage() {
  const { user, loading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  
  const userDocRef = useMemo(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>(userDocRef);

  const [redeemAmount, setRedeemAmount] = useState('');
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [isSavingWallet, setIsSavingWallet] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [showConnectForm, setShowConnectForm] = useState(false);
  const { toast } = useToast();
  
  const walletAddress = userProfile?.walletAddress;
  const balance = userProfile?.balance ?? 0;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);


  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userDocRef) return;
    if (!newWalletAddress.trim()) {
      toast({ variant: 'destructive', title: 'Invalid Address', description: 'Please enter a valid wallet address.' });
      return;
    }

    setIsSavingWallet(true);
    const data = { walletAddress: newWalletAddress.trim() };
    setDoc(userDocRef, data, { merge: true })
      .then(() => {
        toast({
          title: 'Wallet Address Saved!',
          description: 'Your ORA wallet has been linked.',
          className: 'bg-accent text-accent-foreground',
        });
        setNewWalletAddress('');
        setShowConnectForm(false);
      })
      .catch((error) => {
       const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'update',
          requestResourceData: data
        });
        errorEmitter.emit('permission-error', permissionError);
    }).finally(() => {
      setIsSavingWallet(false);
    });
  };


  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userDocRef) return;

    const amount = parseInt(redeemAmount, 10);

    if (isNaN(amount) || amount <= 0) {
      toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid number of ORA coins to redeem.' });
      return;
    }
    if (amount < 1) {
      toast({ variant: 'destructive', title: 'Minimum Withdrawal', description: 'The minimum withdrawal amount is 1 ORA coin.' });
      return;
    }
    if (amount > 1000) {
      toast({ variant: 'destructive', title: 'Maximum Withdrawal', description: 'The maximum withdrawal amount is 1000 ORA coins.' });
      return;
    }
     if (balance < amount) {
      toast({ variant: "destructive", title: 'Insufficient Funds', description: "You don't have enough ORA coins to withdraw that amount." });
      return;
    }
    
    setIsRedeeming(true);

    const batch = writeBatch(firestore);

    // 1. Decrement user's balance
    batch.update(userDocRef, { balance: increment(-amount) });

    // 2. Create a transaction record
    const newTransactionRef = doc(collection(firestore, 'transactions'));
    batch.set(newTransactionRef, {
      userId: user.uid,
      type: 'Withdrawal',
      amount: -amount,
      date: serverTimestamp(),
    });
    
    try {
      await batch.commit();
      toast({
        title: 'Redemption Successful!',
        description: `You have redeemed ${amount} ORA coins.`,
        className: 'bg-accent text-accent-foreground',
      });
      setRedeemAmount('');

    } catch (error: any) {
      console.error("Batch write failed: ", error);
       if (error.code === 'permission-denied') {
         const permissionError = new FirestorePermissionError({
           path: 'batch-write', // Batched writes don't have a single path
           operation: 'update',
           requestResourceData: {
             userUpdate: { balance: `increment(${-amount})`},
             transactionCreate: { type: 'Withdrawal', amount: -amount }
           },
         });
         errorEmitter.emit('permission-error', permissionError);
      } else {
        toast({
          variant: 'destructive',
          title: 'Redemption Failed',
          description: error.message || "Could not complete the transaction.",
        });
      }
    } finally {
        setIsRedeeming(false);
    }
  };


  const rupeesValue = useMemo(() => {
    const amount = parseInt(redeemAmount, 10);
    if (!isNaN(amount) && amount > 0) {
      return (amount / 1000).toFixed(2);
    }
    return '0.00';
  }, [redeemAmount]);

  if (loading || profileLoading) {
     return (
       <div className="flex flex-col min-h-screen">
         <Header />
         <main className="flex-1 flex items-center justify-center">
           <Loader2 className="h-8 w-8 animate-spin text-primary" />
         </main>
       </div>
     );
  }

  if (!user) {
    return null; // or a redirect, which is handled by useEffect
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto p-4 sm:p-6 md:p-8">
        {!walletAddress ? (
          <>
            <div className="space-y-4 mb-8">
              <h1 className="text-3xl font-bold tracking-tight">
                Connect Your ORA Wallet
              </h1>
              <p className="text-muted-foreground">
                Connect your wallet to start redeeming coins.
              </p>
            </div>
            <Card className="max-w-md mx-auto">
              {!showConnectForm ? (
                <CardContent className="p-6 text-center">
                  <Button size="lg" onClick={() => setShowConnectForm(true)}>
                    <Wallet className="mr-2 h-5 w-5" />
                    Connect Wallet
                  </Button>
                </CardContent>
              ) : (
                <form onSubmit={handleSaveWallet}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="w-6 h-6 text-primary" />
                      Enter Your Wallet Address
                    </CardTitle>
                    <CardDescription>
                      Please provide your ORA wallet address to link it to your
                      account.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="wallet-address">ORA Wallet Address</Label>
                      <Input
                        id="wallet-address"
                        type="text"
                        placeholder="0x..."
                        value={newWalletAddress}
                        onChange={(e) => setNewWalletAddress(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2">
                    <Button
                      className="w-full"
                      size="lg"
                      type="submit"
                      disabled={isSavingWallet}
                    >
                      <Wallet className="mr-2 h-5 w-5" />
                      {isSavingWallet ? 'Saving...' : 'Save Wallet Address'}
                    </Button>
                  </CardFooter>
                </form>
              )}
            </Card>
          </>
        ) : (
          <>
            <div className="space-y-4 mb-8">
              <h1 className="text-3xl font-bold tracking-tight">
                Redeem ORA Coins
              </h1>
              <div className="text-muted-foreground">
                <p>
                  Your current balance is{' '}
                  <span className="font-bold text-primary">
                    {balance.toLocaleString()} ORA 🪙
                  </span>
                  .
                </p>
                <p className="text-sm truncate">
                  Connected as: {user.email} <br/>
                  Wallet: {walletAddress}
                </p>
              </div>
            </div>
            <Card className="max-w-md mx-auto">
              <form onSubmit={handleRedeem}>
                <CardHeader>
                  <CardTitle>Enter Amount to Redeem</CardTitle>
                  <CardDescription>
                    1,000 ORA Coins = ₹1.00 INR. Min 1, Max 1,000.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="redeem-amount">ORA Coins</Label>
                    <Input
                      id="redeem-amount"
                      type="number"
                      placeholder="e.g., 1000"
                      value={redeemAmount}
                      onChange={(e) => setRedeemAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex items-center justify-center text-lg font-semibold text-muted-foreground">
                    <span>=</span>
                    <IndianRupee className="mx-2 h-5 w-5" />
                    <span className="font-mono text-primary">{rupeesValue}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" size="lg" disabled={isRedeeming}>
                    {isRedeeming ? 'Processing...' : 'Redeem Now'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

    