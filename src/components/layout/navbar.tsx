import { Link, useLocation } from "react-router-dom";
import { Map, MapPin, Handshake, Shield, LogIn, LogOut, MessageSquare, User, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/talents", label: "Talents", icon: Map },
  { href: "/lieux", label: "Lieux", icon: MapPin },
  { href: "/matching", label: "Matching", icon: Handshake },
  { href: "/a-propos", label: "À propos", icon: Info },
];

export function Navbar() {
  const { user, profile, signOut, unreadMessages, pendingRequests } = useAuthStore();
  const location = useLocation();

  // Both unread messages and incoming connection requests live in /messages.
  const messagesBadge = unreadMessages + pendingRequests;

  return (
    <>
      {/* Desktop / tablet top navbar */}
      <header className="sticky top-0 z-50 hidden border-b border-white/10 md:block"
        style={{ background: "oklch(0.10 0.025 240 / 80%)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        <div className="mx-auto flex h-14 max-w-7xl items-center px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-semibold text-primary">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20">
              <Map className="h-4 w-4 text-primary" />
            </div>
            <span className="hidden sm:inline tracking-tight">BisoMapTech</span>
          </Link>

          {/* Nav links */}
          <nav className="ml-8 flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive =
                location.pathname === link.href ||
                (link.href !== "/" && location.pathname.startsWith(`${link.href}/`));
              return (
                <Link key={link.href} to={link.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "gap-2 text-sm font-medium",
                      isActive
                        ? "text-primary bg-primary/10 hover:bg-primary/15"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Button>
                </Link>
              );
            })}
            {user && (
              <Link to="/messages">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "relative gap-2 text-sm font-medium",
                    location.pathname === "/messages"
                      ? "text-primary bg-primary/10 hover:bg-primary/15"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  <MessageSquare className="h-4 w-4" />
                  Messages
                  {messagesBadge > 0 && (
                    <Badge className="absolute -right-1 -top-1 h-4 w-4 items-center justify-center rounded-full p-0 text-[10px] bg-primary text-primary-foreground">
                      {messagesBadge}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}
            {profile?.role === "admin" && (
              <Link to="/admin">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-2 text-sm font-medium",
                    location.pathname === "/admin"
                      ? "text-primary bg-primary/10 hover:bg-primary/15"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Button>
              </Link>
            )}
          </nav>

          {/* Right: user menu */}
          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 hover:bg-white/5">
                    <Avatar className="h-6 w-6 border border-primary/30">
                      <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {profile?.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm">
                      {profile?.full_name || profile?.username}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {profile && (
                    <DropdownMenuItem asChild>
                      <Link to={`/contributeurs/${profile.username}`}>Mon profil</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/profil/edit">Modifier mon profil</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/messages">
                      Messages
                      {messagesBadge > 0 && ` (${messagesBadge})`}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Se deconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-[0_2px_12px_oklch(0.82_0.16_155/30%)]">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Se connecter</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-50 flex h-12 items-center justify-between border-b border-white/10 px-4 md:hidden"
        style={{ background: "oklch(0.10 0.025 240 / 90%)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        <Link to="/" className="flex items-center gap-2 font-semibold text-primary">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/20">
            <Map className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm tracking-tight">BisoMapTech</span>
        </Link>

        <div className="flex items-center gap-1">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/5">
                  <Avatar className="h-6 w-6 border border-primary/30">
                    <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                    <AvatarFallback className="bg-primary/20 text-primary text-[10px]">
                      {profile?.full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {profile && (
                  <DropdownMenuItem asChild>
                    <Link to={`/contributeurs/${profile.username}`}>Mon profil</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/profil/edit">Modifier mon profil</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Se deconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button size="sm" className="h-7 gap-1.5 bg-primary text-primary-foreground text-xs hover:bg-primary/90 font-semibold shadow-[0_2px_10px_oklch(0.82_0.16_155/25%)]">
                <LogIn className="h-3.5 w-3.5" />
                Connexion
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-stretch border-t border-white/10 md:hidden"
        style={{ background: "oklch(0.10 0.025 240 / 95%)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        {NAV_LINKS.map((link) => {
          const isActive =
            location.pathname === link.href ||
            (link.href !== "/" && location.pathname.startsWith(`${link.href}/`));
          return (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <link.icon className={cn("h-5 w-5", isActive && "drop-shadow-[0_0_6px_oklch(0.82_0.16_155)]")} />
              <span className="text-[10px] font-medium">{link.label}</span>
              {isActive && (
                <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
        {user && (
          <Link
            to="/messages"
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors",
              location.pathname === "/messages" ? "text-primary" : "text-muted-foreground"
            )}
          >
            <MessageSquare className={cn("h-5 w-5", location.pathname === "/messages" && "drop-shadow-[0_0_6px_oklch(0.82_0.16_155)]")} />
            <span className="text-[10px] font-medium">Messages</span>
            {messagesBadge > 0 && (
              <span className="absolute right-4 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                {messagesBadge > 9 ? "9+" : messagesBadge}
              </span>
            )}
            {location.pathname === "/messages" && (
              <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-primary" />
            )}
          </Link>
        )}
        {!user && (
          <Link
            to="/login"
            className="flex flex-1 flex-col items-center justify-center gap-0.5 text-muted-foreground transition-colors"
          >
            <User className="h-5 w-5" />
            <span className="text-[10px] font-medium">Profil</span>
          </Link>
        )}
      </nav>
    </>
  );
}
