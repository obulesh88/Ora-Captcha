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
import { Wallet, IndianRupee } from 'lucide-react';
import { useState, useMemo } from 'react';

export default function WalletPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [balance] = useState(1250); // Using local state for now
  const { toast } = useToast();

  const handleConnect = () => {
    toast({
      title: 'Wallet Connected',
      description: 'Your ORA Wallet has been successfully connected.',
      className: 'bg-accent text-accent-foreground',
    });
    setIsConnected(true);
  };

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(redeemAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Please enter a valid number of coins to redeem.',
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

    toast({
      title: 'Redemption Successful!',
      description: `You have redeemed ${amount} ORA coins.`,
      className: 'bg-accent text-accent-foreground',
    });
    // In a real app, you'd update the balance state here.
    setRedeemAmount('');
  };

  const rupeesValue = useMemo(() => {
    const amount = parseInt(redeemAmount, 10);
    if (!isNaN(amount) && amount > 0) {
      return (amount / 1000).toFixed(2);
    }
    return '0.00';
  }, [redeemAmount]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto p-4 sm:p-6 md:p-8">
        {!isConnected ? (
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
                >
                  <Wallet className="mr-2 h-5 w-5" />
                  Connect Wallet
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
              <p className="text-muted-foreground">
                Your current balance is{' '}
                <span className="font-bold text-primary">
                  {balance.toLocaleString()} ORA 🪙
                </span>
                .
              </p>
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
