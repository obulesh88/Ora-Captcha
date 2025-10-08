import Header from "@/components/common/Header";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const transactions = [
  { id: "1", type: "Captcha Solved", amount: 15, date: "2024-07-29" },
  { id: "2", type: "Ad Watched", amount: 50, date: "2024-07-29" },
  { id: "3", type: "Withdrawal", amount: -1000, date: "2024-07-28" },
  { id: "4", type: "Captcha Solved", amount: 12, date: "2024-07-28" },
  { id: "5", type: "Captcha Solved", amount: 18, date: "2024-07-27" },
];

export default function HistoryPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto p-4 sm:p-6 md:p-8">
        <div className="space-y-4 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Transaction History
          </h1>
          <p className="text-muted-foreground">
            A record of all your earnings and withdrawals.
          </p>
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.type}</TableCell>
                  <TableCell>
                    {new Date(transaction.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={
                        transaction.amount > 0 ? "default" : "destructive"
                      }
                      className="text-white"
                    >
                      {transaction.amount > 0 ? "+" : ""}
                      {transaction.amount.toLocaleString()} 🪙
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableCaption>
              Your transaction history for the last 30 days.
            </TableCaption>
          </Table>
        </div>
      </main>
    </div>
  );
}
