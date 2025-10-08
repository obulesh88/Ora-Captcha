"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import Image from "next/image";
import { RefreshCw, Send, ShieldAlert, ShieldCheck, Captions } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { checkBotScore } from "@/app/actions";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

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
  const [balance, setBalance] = useState(1250);
  const [userActions, setUserActions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingBot, startBotCheck] = useTransition();
  const [isFlaggedAsBot, setIsFlaggedAsBot] = useState(false);
  const { toast } = useToast();

  const generateNewCaptcha = useCallback(() => {
    const newText = generateCaptchaText();
    setCaptchaText(newText);
    const imageUrl = `https://placehold.co/300x100/e6f3ff/1d4ed8?text=${newText}&font=pt-sans`;
    setCaptchaImage(imageUrl);
    setUserInput("");
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isFlaggedAsBot) {
        toast({ variant: 'destructive', title: 'Account Flagged', description: 'Your account is under review due to unusual activity.' });
        return;
    }
    setIsSubmitting(true);

    setTimeout(() => {
      if (userInput.toLowerCase() === captchaText.toLowerCase()) {
        const earnedCoins = 10 + Math.floor(Math.random() * 6);
        setBalance((prev) => prev + earnedCoins);
        setUserActions((prev) => [...prev, "captcha_solved_correctly"]);
        toast({
          title: "Success!",
          description: `You've earned ${earnedCoins} ORA coins.`,
          className: "bg-accent text-accent-foreground",
        });
        generateNewCaptcha();
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
    }, 500);
  };

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
                    className="rounded-md"
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
                  disabled={isSubmitting || isCheckingBot}
                  className="text-lg tracking-widest"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={generateNewCaptcha}
                  disabled={isSubmitting || isCheckingBot}
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
            <Button type="submit" disabled={isSubmitting || isCheckingBot || !userInput}>
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" /> Submit
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </form>
    </Card>
  );
}
