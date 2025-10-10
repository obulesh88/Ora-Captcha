
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import SideNav from "@/components/common/SideNav";
import FirebaseClientProvider from "@/firebase/client-provider";

export const metadata: Metadata = {
  title: "Ora Captcha – Earn Money Solving Captchas",
  description: "Solve captchas online with Ora Captcha and earn coins that you can convert to real rewards. Fast, easy, secure.",
  keywords: ["Ora Captcha", "earn money online", "captcha app", "reward app", "task earning"],
  robots: "index, follow",
  openGraph: {
    title: "Ora Captcha – Earn Money Solving Captchas",
    description: "Solve captchas online with Ora Captcha and earn coins that you can convert to real rewards.",
    type: "website",
    url: "https://www.oracaptcha.com",
  },
  alternates: {
    canonical: "https://www.oracaptcha.com",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-background text-foreground antialiased">
        <div className="overflow-x-hidden">
            <FirebaseClientProvider>
            <SidebarProvider>
                <Sidebar>
                    <SideNav />
                </Sidebar>
                <SidebarInset>
                    {children}
                    <Toaster />
                </SidebarInset>
            </SidebarProvider>
            </FirebaseClientProvider>
        </div>
      </body>
    </html>
  );
}
