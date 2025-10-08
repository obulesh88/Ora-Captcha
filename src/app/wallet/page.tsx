import Header from "@/components/common/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";

const rewards = [
  {
    id: "1",
    title: "Amazon Gift Card",
    cost: 10000,
    value: "$10",
    image: PlaceHolderImages.find((img) => img.id === "amazon-gift-card"),
  },
  {
    id: "2",
    title: "Paytm Cash",
    cost: 5000,
    value: "₹50",
    image: PlaceHolderImages.find((img) => img.id === "paytm-cash"),
  },
  {
    id: "3",
    title: "Google Play Card",
    cost: 25000,
    value: "$25",
    image: PlaceHolderImages.find((img) => img.id === "google-play-card"),
  },
  {
    id: "4",
    title: "App Wallet Top-up",
    cost: 1000,
    value: "$1",
    image: PlaceHolderImages.find((img) => img.id === "wallet-balance"),
  },
];

export default function WalletPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto p-4 sm:p-6 md:p-8">
        <div className="space-y-4 mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Redeem Your Coins</h1>
            <p className="text-muted-foreground">
                Choose from the available rewards below. Once you redeem, the amount will be sent to your registered account within 24 hours.
            </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rewards.map((reward) => (
            <Card key={reward.id} className="flex flex-col overflow-hidden">
                {reward.image && (
                    <div className="relative w-full h-40">
                        <Image
                            src={reward.image.imageUrl}
                            alt={reward.title}
                            fill
                            className="object-cover"
                            data-ai-hint={reward.image.imageHint}
                        />
                    </div>
                )}
              <CardHeader>
                <CardTitle>{reward.title}</CardTitle>
                <CardDescription>{reward.value}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-lg font-semibold text-primary">{reward.cost.toLocaleString()} Coins</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Redeem</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
