
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
import { collection, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy } from 'lucide-react';

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
  referenceId?: string;
}

const statusVariantMap: { [key in Transaction['status']]: 'default' | 'secondary' | 'destructive' | 'outline' | null | undefined } = {
    pending: 'secondary',
    successful: 'outline',
    completed: 'default',
    failed: 'destructive',
};

const statusClassMap: { [key in Transaction['status']]: string } = {
    pending: '',
    successful: 'text-accent-foreground border-accent',
    completed: 'bg-accent text-accent-foreground',
    failed: '',
}

export default function HistoryPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState<string | null>(null);

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Reference ID copied to clipboard.',
      className: 'bg-accent text-accent-foreground',
    });
  };
  
  const handleVerify = (transaction: Transaction) => {
    if (!user || !firestore) return;

    setVerifying(transaction.id);
    
    // Simulate checking an external API
    setTimeout(() => {
      const transactionRef = doc(firestore, 'transactions', transaction.id);
      
      const updateData = { status: 'completed' };

      updateDoc(transactionRef, updateData)
        .then(() => {
           toast({
            title: "Verification Complete",
            description: "Withdrawal has been marked as completed.",
            className: "bg-accent text-accent-foreground",
          });
        })
        .catch((error) => {
          const permissionError = new FirestorePermissionError({
            path: transactionRef.path,
            operation: 'update',
            requestResourceData: updateData
          });
          errorEmitter.emit('permission-error', permissionError);
          toast({
            variant: "destructive",
            title: "Verification Failed",
            description: "Could not update transaction status.",
          });
        }).finally(() => {
          setVerifying(null);
        });

    }, 2000); // Simulate a 2-second API call
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
        <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reference ID</TableHead>
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
                        variant={statusVariantMap[transaction.status]}
                        className={cn('capitalize', statusClassMap[transaction.status])}
                      >
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {transaction.referenceId && (
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(transaction.referenceId!)}
                                className="flex items-center gap-2"
                                >
                                <span className="font-mono text-xs truncate max-w-[100px]">{transaction.referenceId}</span>
                                <Copy className="h-3 w-3" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Copy Reference ID</p>
                            </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                       <Badge
                        variant={
                          transaction.amount > 0 ? 'default' : 'destructive'
                        }
                        className={cn(transaction.amount > 0 && 'bg-accent text-accent-foreground')}
                      >
                        {transaction.amount > 0 ? '+' : ''}
                        {transaction.amount.toLocaleString()} ORA 🪙
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {transaction.type === 'Withdrawal' && transaction.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerify(transaction)}
                          disabled={verifying === transaction.id}
                        >
                          {verifying === transaction.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No transactions yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableCaption>
              Your complete transaction history.
            </TableCaption>
          </Table>
          </TooltipProvider>
        </div>
      </main>
    </div>
  );
}

    