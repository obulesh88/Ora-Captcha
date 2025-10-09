
"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import Image from "next/image";
import { RefreshCw, Send, ShieldAlert, ShieldCheck, Captions, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { checkBotScore } from "@/app/actions";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { useUser, useFirestore } from "@/firebase";
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";


const generateCaptchaText = (length = 6) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function CaptchaSolver() {
  const [captchaText, setCaptchaText] = useState("");
  const [captchaImage, setCaptchaImage] = useState("");
  const [userInput, setUserInput] = useState("");
  const [userActions, setUserActions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingBot, startBotCheck] = useTransition();
  const [isFlaggedAsBot, setIsFlaggedAsBot] = useState(false);
  const [captchaCorrect, setCaptchaCorrect] = useState(false);
  const [canClaim, setCanClaim] = useState(false);

  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const generateNewCaptcha = useCallback(() => {
    const newText = generateCaptchaText();
    setCaptchaText(newText);
    const imageUrl = `https://placehold.co/300x100/e6f3ff/1d4ed8?text=${newText}&font=pt-sans`;
    setCaptchaImage(imageUrl);
    setUserInput("");
    setCaptchaCorrect(false);
    setCanClaim(false);
  }, []);

  useEffect(() => {
    generateNewCaptcha();
  }, [generateNewCaptcha]);

  useEffect(() => {
    if (userActions.length > 0 && userActions.length % 5 === 0) {
      startBotCheck(async () => {
        const result = await checkBotScore(userActions);
        if (result.botScore > 0.7) {
          setIsFlaggedAsBot(true);
          toast({
            variant: "destructive",
            title: "Security Alert",
            description: `Unusual activity detected. ${result.explanation}`,
          });
        }
      });
    }
  }, [userActions, toast]);

  useEffect(() => {
    if (captchaCorrect) {
      const timer = setTimeout(() => {
        setCanClaim(true);
      }, 10000); // 10 second delay

      return () => clearTimeout(timer);
    }
  }, [captchaCorrect]);


  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (captchaCorrect) return;

    if (isFlaggedAsBot) {
        toast({ variant: 'destructive', title: 'Account Flagged', description: 'Your account is under review due to unusual activity.' });
        return;
    }
    if (!user) {
        toast({ variant: 'destructive', title: 'Not Authenticated', description: 'You must be logged in to solve captchas.' });
        return;
    }
    setIsSubmitting(true);

    if (userInput.toLowerCase() === captchaText.toLowerCase()) {
      window.open('https://enviousgarbage.com/bW3aVx0.PZ3dpbvbbgmFVfJxZuD/0r2jN_jzIdzoMUTRgU3uLhTlYK2HMFjdMrxfORDJgv', '_blank');
      setCaptchaCorrect(true);
      setUserActions((prev) => [...prev, "captcha_solved_correctly"]);
       toast({
        title: "Captcha Correct!",
        description: "Please view the ad, then claim your reward.",
        className: "bg-accent text-accent-foreground",
      });
    } else {
      setUserActions((prev) => [...prev, "captcha_solved_incorrectly"]);
      toast({
        variant: "destructive",
        title: "Incorrect",
        description: "The captcha does not match. Please try again.",
      });
      setUserInput("");
    }
    setIsSubmitting(false);
  };

  const handleClaimReward = () => {
    if (!user) return;
    const earnedCoins = 2;
    const userDocRef = doc(firestore, 'users', user.uid);
    
    updateDoc(userDocRef, {
        balance: increment(earnedCoins)
    }).catch((error) => {
      const permissionError = new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'update',
        requestResourceData: { balance: `increment(${earnedCoins})` }
      });
      errorEmitter.emit('permission-error', permissionError);
    });

    const transactionsColRef = collection(firestore, 'transactions');
    const transactionData = {
        userId: user.uid,
        type: 'Captcha Solved',
        amount: earnedCoins,
        date: serverTimestamp()
    };
    addDoc(transactionsColRef, transactionData)
      .then(() => {
        toast({
          title: "Success!",
          description: `You've earned ${earnedCoins} ORA coins.`,
          className: "bg-accent text-accent-foreground",
        });
        generateNewCaptcha();
      })
      .catch((error) => {
        const permissionError = new FirestorePermissionError({
          path: transactionsColRef.path,
          operation: 'create',
          requestResourceData: transactionData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Captions className="text-primary w-6 h-6" />
            <span>Solve Captcha & Earn</span>
        </CardTitle>
        <CardDescription>
          Type the characters you see in the image to earn ORA coins.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {isFlaggedAsBot ? (
             <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Account Under Review</AlertTitle>
                <AlertDescription>
                  Our system has detected bot-like behavior. Please contact support if you believe this is an error.
                </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="bg-muted rounded-md flex items-center justify-center p-4 min-h-[120px]">
                {captchaImage ? (
                  <Image
                    src={captchaImage}
                    alt="Captcha"
                    width={300}
                    height={100}
                    unoptimized
                    priority
                    className={cn("rounded-md", { 'opacity-50': captchaCorrect })}
                  />
                ) : (
                  <p>Loading captcha...</p>
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter captcha text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  aria-label="Captcha input"
                  required
                  autoComplete="off"
                  disabled={isSubmitting || isCheckingBot || captchaCorrect}
                  className="text-lg tracking-widest"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={generateNewCaptcha}
                  disabled={isSubmitting || isCheckingBot || captchaCorrect}
                  aria-label="Refresh captcha"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

        </CardContent>
        {!isFlaggedAsBot && (
          <CardFooter className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              {isCheckingBot ? (
                <>
                  <ShieldAlert className="h-4 w-4 animate-pulse" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 text-accent-foreground" />
                  <span>Protected</span>
                </>
              )}
            </div>
            {!captchaCorrect ? (
              <Button type="submit" disabled={isSubmitting || isCheckingBot || !userInput}>
                {isSubmitting ? (
                  "Verifying..."
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Submit
                  </>
                )}
              </Button>
            ) : (
              <Button type="button" onClick={handleClaimReward} disabled={!canClaim}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {canClaim ? 'Claim Reward' : 'Wait to Claim...'}
              </Button>
            )}
          </CardFooter>
        )}
      </form>
    </Card>
  );
}
