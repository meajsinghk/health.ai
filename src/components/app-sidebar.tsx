"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, FileText, HeartPulse } from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();

  const menuItems = [
    {
      href: "/",
      label: "Assistant",
      icon: Bot,
    },
    {
      href: "/records",
      label: "Records",
      icon: FileText,
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="shrink-0 bg-primary/10 hover:bg-primary/20 text-primary">
            <HeartPulse className="size-5" />
          </Button>
          <h1 className="text-lg font-semibold tracking-tight truncate">Health Assistant</h1>
          <div className="ml-auto">
            <SidebarTrigger />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
         {/* Footer content can go here */}
      </SidebarFooter>
    </Sidebar>
  );
}
