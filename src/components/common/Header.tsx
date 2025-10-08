"use client"

import {
  Gift,
  Home,
  LogIn,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navLinks = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/withdraw", label: "Withdraw", icon: Gift },
];

export default function Header() {
  const pathname = usePathname();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="w-6 h-6 flex items-center justify-center font-bold text-red-500">
              OR
            </div>
            <span className="font-headline">Captcha</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navLinks.map(link => (
            <Link 
              key={link.href}
              href={link.href} 
              className={cn(
                "transition-colors hover:text-primary",
                pathname === link.href ? "text-primary" : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2">
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-4 py-1.5 text-sm font-semibold">
                <span>Balance:</span>
                <span className="font-mono">1,250 🪙</span>
            </div>
            <Link href="/login">
              <Button>
                  <LogIn className="mr-2 h-4 w-4" />
                  <span>Login</span>
              </Button>
            </Link>
             <Link href="/signup">
              <Button variant="outline">
                  <UserPlus className="mr-2 h-4 w-4" />
                  <span>Sign Up</span>
              </Button>
            </Link>
        </div>
      </div>
    </header>
  );
}
