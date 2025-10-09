
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

  const handleWatchAd = async () => {
    if (!user) return;
    const userDocRef = doc(firestore, 'users', user.uid);
    try {
      await updateDoc(userDocRef, {
        balance: increment(3)
      });
       const transactionsColRef = collection(firestore, 'transactions');
       await addDoc(transactionsColRef, {
         userId: user.uid,
         type: 'Ad Watched',
         amount: 3,
         date: serverTimestamp(),
       });
      toast({
        title: "Success!",
        description: `You've earned 3 ORA coins.`,
        className: 'bg-accent text-accent-foreground',
      });
    } catch (error) {
      console.error("Error updating balance:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not update your balance.",
      });
    }
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
