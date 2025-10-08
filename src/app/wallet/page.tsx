import Header from "@/components/common/Header";

export default function WalletPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto p-4 sm:p-6 md:p-8">
        <div className="space-y-4 mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Redeem Your ORA Coins</h1>
            <p className="text-muted-foreground">
                Choose from the available rewards below. Once you redeem, the amount will be sent to your registered account within 24 hours.
            </p>
        </div>
        <div className="flex items-center justify-center h-40 border-2 border-dashed rounded-lg bg-muted">
            <p className="text-muted-foreground">No rewards available at the moment. Please check back later.</p>
        </div>
      </main>
    </div>
  );
}
