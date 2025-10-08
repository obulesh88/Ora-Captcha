"use client"

import Link from "next/link";
import { SidebarTrigger } from "../ui/sidebar";

export default function Header() {
  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card shadow-sm">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center md:hidden">
          <SidebarTrigger />
        </div>
        <div className="mr-4 hidden md:flex items-center">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
             <div className="w-6 h-6 flex items-center justify-center font-bold text-red-500">
              OR
            </div>
            <span className="font-headline">ORA Captcha</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
            <div className="flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-4 py-1.5 text-sm font-semibold">
                <span>Balance:</span>
                <span className="font-mono">1,250 ORA 🪙</span>
            </div>
        </div>
      </div>
    </header>
  );
}
