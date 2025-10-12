
'use client';

import Header from '@/components/common/Header';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCollection } from '@/firebase';
import { useUser } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  date: {
    seconds: number;
    nanoseconds: number;
  };
  userId: string;
  status: 'pending' | 'successful' | 'failed' | 'completed';
}

const statusVariantMap = {
    pending: 'secondary',
    successful: 'default',
    completed: 'default',
    failed: 'destructive',
};

export default function HistoryPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();

  const transactionsQuery = useMemo(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );
  }, [user, firestore]);

  const {
    data: transactions,
    loading: transactionsLoading,
  } = useCollection<Transaction>(transactionsQuery);

  if (userLoading || transactionsLoading) {
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
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions && transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.type}</TableCell>
                    <TableCell>
                      {new Date(
                        transaction.date.seconds * 1000
                      ).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={statusVariantMap[transaction.status] || 'default'}
                        className={cn('capitalize', (statusVariantMap[transaction.status] === 'default' || statusVariantMap[transaction.status] === 'destructive') && 'text-white')}
                      >
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <Badge
                        variant={
                          transaction.amount > 0 ? 'default' : 'destructive'
                        }
                        className="text-white"
                      >
                        {transaction.amount > 0 ? '+' : ''}
                        {transaction.amount.toLocaleString()} ORA 🪙
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No transactions yet.
                  </TableCell>
                </TableRow>
              )}
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
