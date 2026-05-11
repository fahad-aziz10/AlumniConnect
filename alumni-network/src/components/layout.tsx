import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Show, useAuth, useClerk, useUser } from "@clerk/react";
import { useGetMyProfile, getGetMyProfileQueryKey } from "@workspace/api-client-react";
import { Menu, X, Home, Search, MessageSquare, Briefcase, Settings, User as UserIcon, Shield, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import ProfileOnboarding from "./profile-onboarding";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  
  const { data: profile, isLoading: isProfileLoading } = useGetMyProfile({
    query: {
      enabled: isLoaded && !!isSignedIn,
      queryKey: getGetMyProfileQueryKey(),
    }
  });

  const navItems = [
    { href: "/feed", label: "Feed", icon: Home },
    { href: "/search", label: "Directory", icon: Search },
    { href: "/messages", label: "Messages", icon: MessageSquare },
    { href: "/careers", label: "Careers", icon: Briefcase },
  ];

  if (profile?.userRole === "admin") {
    navItems.push({ href: "/admin", label: "Admin", icon: Shield });
  }

  const handleSignOut = () => signOut();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Show when="signed-in">
        {!isProfileLoading && !profile && <ProfileOnboarding />}
      </Show>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] sm:w-[280px]">
                <nav className="flex flex-col gap-4 mt-8">
                  {navItems.map((item) => {
                    const isActive = location === item.href || location.startsWith(`${item.href}/`);
                    return (
                      <Link key={item.href} href={item.href} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
            <Link href={isSignedIn ? "/feed" : "/"} className="flex items-center gap-2">
              <img src="/logo.svg" alt="AlumniConnect Logo" className="h-6 w-6 dark:invert" />
              <span className="font-semibold tracking-tight hidden sm:inline-block">AlumniConnect</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 mr-4">
              {navItems.map((item) => {
                const isActive = location === item.href || location.startsWith(`${item.href}/`);
                return (
                  <Link key={item.href} href={item.href}>
                    <Button variant={isActive ? "secondary" : "ghost"} size="sm" className={`gap-2 ${isActive ? "" : "text-muted-foreground"}`}>
                      <item.icon className="h-4 w-4" />
                      <span className="hidden lg:inline-block">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </nav>

            <Show when="signed-in">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full overflow-hidden hover:opacity-80 transition-opacity focus-visible:ring-offset-0">
                    <Avatar className="h-8 w-8">
                      {isProfileLoading ? (
                        <Skeleton className="h-full w-full rounded-full" />
                      ) : (
                        <>
                          <AvatarImage src={profile?.avatarUrl || user?.imageUrl} alt={profile?.displayName || user?.fullName || "User"} />
                          <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
                        </>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {profile?.displayName && <p className="font-medium text-sm">{profile.displayName}</p>}
                      {user?.primaryEmailAddress?.emailAddress && <p className="text-xs text-muted-foreground truncate">{user.primaryEmailAddress.emailAddress}</p>}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile/me" className="cursor-pointer flex items-center w-full">
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Show>

            <Show when="signed-out">
              <div className="flex items-center gap-2">
                <Link href="/sign-in"><Button variant="ghost" size="sm">Log in</Button></Link>
                <Link href="/sign-up"><Button size="sm">Sign up</Button></Link>
              </div>
            </Show>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-5xl px-4 md:px-8 py-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}