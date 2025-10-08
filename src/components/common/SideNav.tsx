"use client";

import { CreditCard, History, Home } from "lucide-react";
import Link from "next/link";
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/wallet", label: "Wallet", icon: CreditCard },
  { href: "/history", label: "History", icon: History },
];

export default function SideNav() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="w-8 h-8 flex items-center justify-center font-bold text-red-500 text-2xl">
              OR
            </div>
            <span className="font-headline">Captcha</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navLinks.map((link) => (
            <SidebarMenuItem key={link.href}>
              <Link href={link.href} legacyBehavior passHref>
                <SidebarMenuButton
                  as="a"
                  isActive={pathname === link.href}
                >
                  <link.icon />
                  <span>{link.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
