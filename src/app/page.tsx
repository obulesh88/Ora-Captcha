
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import CaptchaSolver from "@/components/CaptchaSolver";
import Header from "@/components/common/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayCircle, Loader2 } from "lucide-react";
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleWatchAd = () => {
    if (!user) return;
    const userDocRef = doc(firestore, 'users', user.uid);
    const adReward = 3;

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
              <Button className="w-full" size="lg" onClick={handleWatchAd}>
                <PlayCircle className="mr-2 h-5 w-5" />
                Watch Rewarded Ad (3 ORA Coins)
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
