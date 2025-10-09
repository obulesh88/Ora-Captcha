"use client"

import Link from "next/link";
import { SidebarTrigger } from "../ui/sidebar";
import { useUser } from "@/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { LogOut, User as UserIcon } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { signOut } from "firebase/auth";
import { useAuth } from "@/firebase";


export default function Header() {
  const { user, loading } = useUser();
  const auth = useAuth();


  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card shadow-sm">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center md:hidden">
          <SidebarTrigger />
        </div>
        <div className="mr-4 hidden md:flex items-center">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
             <div className="w-6 h-6 flex items-center justify-center font-bold text-primary">
              OR
            </div>
            <span className="font-headline">ORA Captcha</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
            <div className="flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-4 py-1.5 text-sm font-semibold">
                <span>Balance:</span>
                <span className="font-mono">1,250 ORA 🪙</span>
            </div>
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                        <AvatarFallback>
                          <UserIcon />
                        </AvatarFallback>
                      </Avatar>
                   </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut(auth)}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
        </div>
      </div>
    </header>
  );
}
