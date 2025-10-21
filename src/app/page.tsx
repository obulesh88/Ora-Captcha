
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import CaptchaSolver from "@/components/CaptchaSolver";
import Header from "@/components/common/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayCircle, Loader2, CheckCircle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { recordAdReward } from './actions';

export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [adWatched, setAdWatched] = useState(false);
  const [canClaimAdReward, setCanClaimAdReward] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

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

  const handleClaimAdReward = async () => {
    if (!user || !canClaimAdReward) return;

    setIsClaiming(true);
    const result = await recordAdReward(user.uid);

    if (result.success) {
      toast({
        title: "Success!",
        description: result.message,
        className: 'bg-accent text-accent-foreground',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Claim Failed',
        description: result.message,
      });
    }

    // Reset state
    setAdWatched(false);
    setCanClaimAdReward(false);
    setIsClaiming(false);
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
                <Button className="w-full" size="lg" onClick={handleClaimAdReward} disabled={!canClaimAdReward || isClaiming}>
                  {isClaiming ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5" /> }
                  {isClaiming ? 'Claiming...' : (canClaimAdReward ? 'Claim Ad Reward' : 'Wait to Claim...')}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

    