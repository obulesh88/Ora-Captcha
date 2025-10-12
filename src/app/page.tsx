
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import CaptchaSolver from "@/components/CaptchaSolver";
import Header from "@/components/common/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayCircle, Loader2, CheckCircle } from "lucide-react";
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [adWatched, setAdWatched] = useState(false);
  const [canClaimAdReward, setCanClaimAdReward] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (adWatched) {
      timer = setTimeout(() => {
        setCanClaimAdReward(true);
        toast({
            title: "Ready to Claim!",
            description: "You can now claim your reward for watching the ad.",
        });
      }, 10000); // 10 second delay
    }
    return () => clearTimeout(timer);
  }, [adWatched, toast]);

  const handleWatchAd = () => {
    window.open('https://enviousgarbage.com/b/3-Vk0.Ph3HpHv/bfmUVNJ_ZtDF0P2tN/jZISzUMtTPg_3tLmTzYv2XMWjBM/xROPD/gn', '_blank');
    setAdWatched(true);
    toast({
        title: "Ad Started!",
        description: "Please view the ad, then claim your reward.",
        className: 'bg-accent text-accent-foreground',
    });
  };

  const handleClaimAdReward = () => {
    if (!user || !canClaimAdReward) return;

    const adReward = 3;
    const userDocRef = doc(firestore, 'users', user.uid);
    
    updateDoc(userDocRef, {
      balance: increment(adReward)
    }).catch((error) => {
      const permissionError = new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'update',
        requestResourceData: { balance: `increment(${adReward})` }
      });
      errorEmitter.emit('permission-error', permissionError);
    });

    const transactionsColRef = collection(firestore, 'transactions');
    const transactionData = {
      userId: user.uid,
      type: 'Ad Watched',
      amount: adReward,
      date: serverTimestamp(),
      status: 'completed',
    };
    addDoc(transactionsColRef, transactionData)
      .then(() => {
        toast({
          title: "Success!",
          description: `You've earned ${adReward} ORA coins.`,
          className: 'bg-accent text-accent-foreground',
        });
      })
      .catch((error) => {
        const permissionError = new FirestorePermissionError({
          path: transactionsColRef.path,
          operation: 'create',
          requestResourceData: transactionData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
      
    // Reset state
    setAdWatched(false);
    setCanClaimAdReward(false);
  };


  if (loading || !user) {
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
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-2xl space-y-8">
          <CaptchaSolver />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="text-primary w-6 h-6" />
                <span>Earn Bonus ORA Coins</span>
              </CardTitle>
              <CardDescription>
                Watch a short ad to earn extra ORA coins. It's a quick and easy way to boost your balance!
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!adWatched ? (
                <Button className="w-full" size="lg" onClick={handleWatchAd}>
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Watch Rewarded Ad (3 ORA Coins)
                </Button>
              ) : (
                <Button className="w-full" size="lg" onClick={handleClaimAdReward} disabled={!canClaimAdReward}>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  {canClaimAdReward ? 'Claim Ad Reward' : 'Wait to Claim...'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
