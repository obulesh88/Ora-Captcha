import Header from "@/components/common/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Wallet } from "lucide-react";

export default function WalletPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto p-4 sm:p-6 md:p-8">
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
              To redeem your ORA Coins, you need to connect your ORA Wallet. This will allow for secure and seamless transfer of your earnings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg">
              <Wallet className="mr-2 h-5 w-5" />
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
