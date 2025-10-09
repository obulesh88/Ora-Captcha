
"use client"

import Link from "next/link";
import { SidebarTrigger } from "../ui/sidebar";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { LogOut, User as UserIcon } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { signOut } from "firebase/auth";
import { useAuth } from "@/firebase";
import { usePathname } from "next/navigation";
import { doc } from 'firebase/firestore';
import { useMemo } from 'react';

interface UserProfile {
  id: string;
  balance: number;
}

export default function Header() {
  const { user } = useUser();
  const auth = useAuth();
  const pathname = usePathname();
  const firestore = useFirestore();

  const isAuthPage = pathname === '/login' || pathname === '/signup';

  const userDocRef = useMemo(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userDocRef);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card shadow-sm">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center md:hidden">
          {!isAuthPage && <SidebarTrigger />}
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
            {!isAuthPage && user && (
              <>
                <div className="flex items-center gap-2 rounded-full border border-primary/50 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                    <span>Balance:</span>
                    <span className="font-mono">{(userProfile?.balance ?? 0).toLocaleString()} 🪙</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                        <Avatar className="h-9 w-9 border">
                          <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                          <AvatarFallback>
                            <UserIcon className="w-5 h-5"/>
                          </AvatarFallback>
                        </Avatar>
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.displayName || user.email}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => signOut(auth)}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
        </div>
      </div>
    </header>
  );
}
