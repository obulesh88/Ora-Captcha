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
import { signOut } from 'firebase/auth';
import { useUser, useAuth, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  walletAddress: string;
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
  const { toast } = useToast();
  
  const walletAddress = userProfile?.walletAddress;
  const balance = userProfile?.balance ?? 0;

  const handleConnect = () => {
    router.push('/login');
  };

  const handleDisconnect = async () => {
    if(!auth) return;
    await signOut(auth);
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    router.push('/login');
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userDocRef) return;

    const amount = parseInt(redeemAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Please enter a valid number of ORA coins to redeem.',
      });
      return;
    }
    if (amount > balance) {
      toast({
        variant: 'destructive',
        title: 'Insufficient Balance',
        description: "You don't have enough ORA coins to redeem this amount.",
      });
      return;
    }
    
    try {
      await updateDoc(userDocRef, {
        balance: increment(-amount)
      });

      const transactionsColRef = collection(firestore, 'transactions');
      await addDoc(transactionsColRef, {
        userId: user.uid,
        type: 'Withdrawal',
        amount: -amount,
        date: serverTimestamp(),
      });

      toast({
        title: 'Redemption Successful!',
        description: `You have redeemed ${amount} ORA coins.`,
        className: 'bg-accent text-accent-foreground',
      });
      setRedeemAmount('');
    } catch (error) {
       console.error("Error redeeming coins:", error);
       toast({
         variant: "destructive",
         title: "Error",
         description: "Could not redeem your coins.",
       });
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

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto p-4 sm:p-6 md:p-8">
        {!user || !walletAddress ? (
          <>
            <div className="space-y-4 mb-8">
              <h1 className="text-3xl font-bold tracking-tight">
                Redeem Your ORA Coins
              </h1>
              <p className="text-muted-foreground">
                Connect your ORA Wallet to redeem your earned coins.
              </p>
            </div>
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-6 h-6 text-primary" />
                  Connect to ORA Wallet
                </CardTitle>
                <CardDescription>
                  To redeem your ORA Coins, you need to connect your ORA
                  Wallet. This will allow for secure and seamless transfer of
                  your earnings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleConnect}
                  disabled={loading}
                >
                  <Wallet className="mr-2 h-5 w-5" />
                  {loading ? 'Loading...' : 'Connect Wallet'}
                </Button>
              </CardContent>
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
                <Button variant="link" onClick={handleDisconnect} className="p-0 h-auto text-xs">Disconnect</Button>
              </div>
            </div>
            <Card className="max-w-md mx-auto">
              <form onSubmit={handleRedeem}>
                <CardHeader>
                  <CardTitle>Enter Amount to Redeem</CardTitle>
                  <CardDescription>
                    1,000 ORA Coins = ₹1.00 INR.
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
                  <Button type="submit" className="w-full" size="lg">
                    Redeem Now
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
