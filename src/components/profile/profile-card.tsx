import React from "react";
import { Link } from "react-router-dom";
import { MapPin, ExternalLink, Handshake } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/types";
import { ROLE_TYPE_LABELS, EXPERIENCE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ProfileCardProps {
  profile: Profile;
  matchScore?: number;
  onClick?: (profile: Profile, e: React.MouseEvent<HTMLAnchorElement>) => void;
}

function formatLastSeen(lastSeenAt?: string): string | null {
  if (!lastSeenAt) return null;
  const diff = Date.now() - new Date(lastSeenAt).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 5) return "En ligne";
  if (minutes < 60) return `il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days}j`;
  return null;
}

export const ProfileCard = React.memo(function ProfileCard({ profile, matchScore, onClick }: ProfileCardProps) {
  const lastSeen = formatLastSeen(profile.last_seen_at);
  const isOnline = lastSeen === "En ligne";

  // ⚡ Bolt Performance Optimization
  // Wrapped ProfileCard in React.memo to prevent unnecessary re-renders when the parent
  // component (like MapPage or ContributorsPage) updates its state (e.g. from typing in the search bar).
  return (
    <Link to={`/contributeurs/${profile.username}`} onClick={(e) => onClick?.(profile, e)}>
      <div className={cn(
        "group rounded-xl border border-white/10 bg-white/5 p-3 transition-all",
        "hover:border-primary/30 hover:bg-white/8",
      )}>
        <div className="flex items-start gap-2.5">
          <div className="relative shrink-0">
            <Avatar className="h-9 w-9 border border-white/15">
              <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                {profile.full_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            {isOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold leading-tight group-hover:text-primary transition-colors">
                {profile.full_name}
              </h3>
              {matchScore !== undefined && (
                <Badge className="shrink-0 bg-primary/20 border-primary/40 text-primary text-[10px] px-1.5 py-0">
                  {matchScore}%
                </Badge>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{profile.city || "Congo"}</span>
              <span className="text-white/20">·</span>
              <span>{EXPERIENCE_LABELS[profile.experience_level]}</span>
              {lastSeen && !isOnline && (
                <>
                  <span className="text-white/20">·</span>
                  <span className="text-muted-foreground/60">{lastSeen}</span>
                </>
              )}
            </div>
          </div>

          {profile.open_to_collaboration && (
            <div
              className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 border border-primary/30"
              title="Ouvert à la collaboration"
            >
              <Handshake className="h-2.5 w-2.5 text-primary" />
            </div>
          )}
        </div>

        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
          <Badge
            variant="outline"
            className="border-white/10 bg-white/5 text-[10px] text-muted-foreground px-1.5 py-0"
          >
            {ROLE_TYPE_LABELS[profile.role_type] || profile.role_type}
          </Badge>
          {profile.tech_stack.slice(0, 2).map((tech) => (
            <Badge
              key={tech}
              variant="outline"
              className="border-white/10 bg-white/5 text-[10px] text-muted-foreground px-1.5 py-0"
            >
              {tech}
            </Badge>
          ))}
          {profile.tech_stack.length > 2 && (
            <span className="text-[10px] text-muted-foreground">
              +{profile.tech_stack.length - 2}
            </span>
          )}
          {profile.github_url && (
            <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground/40" />
          )}
        </div>
      </div>
    </Link>
  );
});
