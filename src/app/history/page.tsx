
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
import { collection, query, where, orderBy, doc, writeBatch, increment } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
  const { toast } = useToast();
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

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

  const handleVerify = async (transaction: Transaction) => {
    if (!user || !firestore) return;
    if (transaction.status !== 'pending' || transaction.type !== 'Withdrawal') return;

    setVerifyingId(transaction.id);

    const batch = writeBatch(firestore);

    // 1. Update transaction status
    const transactionRef = doc(firestore, 'transactions', transaction.id);
    batch.update(transactionRef, { status: 'successful' });

    // 2. Debit user's balance
    const userRef = doc(firestore, 'users', user.uid);
    // transaction.amount is negative for withdrawals, so incrementing by it will decrease the balance.
    batch.update(userRef, { balance: increment(transaction.amount) });

    try {
      await batch.commit();
      toast({
        title: 'Withdrawal Successful!',
        description: `${-transaction.amount} ORA coins have been transferred.`,
        className: 'bg-accent text-accent-foreground',
      });
    } catch (error: any) {
       const permissionError = new FirestorePermissionError({
          path: `batch write for ${userRef.path} and ${transactionRef.path}`,
          operation: 'update',
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
          variant: 'destructive',
          title: 'Verification Failed',
          description: error.message || "Could not complete the withdrawal.",
        });
    } finally {
        setVerifyingId(null);
    }
  };


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
                <TableHead className="text-right">Action</TableHead>
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
                    <TableCell className="text-right">
                      {transaction.type === 'Withdrawal' && transaction.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleVerify(transaction)}
                          disabled={verifyingId === transaction.id}
                        >
                          {verifyingId === transaction.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No transactions yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableCaption>
              Your transaction history. Pending withdrawals require verification.
            </TableCaption>
          </Table>
        </div>
      </main>
    </div>
  );
}
