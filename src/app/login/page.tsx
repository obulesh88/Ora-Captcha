
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { useAuth, useUser, useFirestore } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Wallet } from 'lucide-react';

export default function LoginPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, loading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const loggedInUser = result.user;

      const userDocRef = doc(firestore, 'users', loggedInUser.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        const newWalletAddress = `0x${[...Array(40)]
          .map(() => Math.floor(Math.random() * 16).toString(16))
          .join('')}`;
        await setDoc(userDocRef, {
          uid: loggedInUser.uid,
          email: loggedInUser.email,
          displayName: loggedInUser.displayName,
          walletAddress: newWalletAddress,
          createdAt: new Date(),
        });
      }
      toast({
        title: 'Successfully signed in!',
        description: `Welcome back, ${loggedInUser.displayName}.`,
        className: 'bg-accent text-accent-foreground',
      });
      router.push('/wallet');
    } catch (error) {
      console.error('Error signing in:', error);
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: 'Could not sign in with Google.',
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>
              Sign in with your Google account to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={handleSignIn} disabled={loading}>
              <Wallet className="mr-2 h-4 w-4" /> 
              {loading ? 'Loading...' : 'Sign in with Google'}
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
