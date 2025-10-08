import CaptchaSolver from "@/components/CaptchaSolver";
import Header from "@/components/common/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayCircle } from "lucide-react";

export default function Home() {
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
              <Button className="w-full" size="lg">
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
