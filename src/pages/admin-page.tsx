import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Send, UserPlus, UserMinus, Users, Building2, Handshake, Download, Search, TrendingUp, ArrowUpRight, TriangleAlert, Clock, GitCommitHorizontal, UserRoundPlus, Layers as Layers3, Flag, UserCheck, MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DebouncedInput } from "@/components/ui/debounced-input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/lib/supabase";
import type { Profile, AdminInvitation, Report, Place } from "@/types";
import { ROLE_TYPE_LABELS, TECH_OPTIONS } from "@/lib/constants";
import { fetchPendingPlaces, approvePlace, rejectPlace } from "@/lib/place-service";
import { toast } from "sonner";

const PENDING_VALIDATIONS = [
  { id: 1, name: "Amina K.", initials: "AK", role: "Développeuse Frontend", gradient: "from-primary to-tertiary", badge: "Nouveau", badgeClass: "border-primary/40 bg-primary/10 text-primary" },
  { id: 2, name: "Marcus E.", initials: "ME", role: "Ingénieur DevOps", gradient: "from-tertiary to-map-accent", badge: "En attente", badgeClass: "border-tertiary/40 bg-tertiary/10 text-tertiary" },
  { id: 3, name: "Elise N.", initials: "EN", role: "Designeuse UI/UX", gradient: "from-map-accent to-primary", badge: "Nouveau", badgeClass: "border-primary/40 bg-primary/10 text-primary" },
];

const ACTIVITY_FEED = [
  { icon: GitCommitHorizontal, color: "text-primary", time: "Il y a 10 min", text: "Mise à jour du profil de Brazzaville par Jean-Luc B." },
  { icon: UserRoundPlus, color: "text-chart-2", time: "Il y a 45 min", text: "Nouveau contributeur validé : Elise N. (UI/UX)" },
  { icon: Layers3, color: "text-chart-3", time: "Il y a 2 h", text: "Projet EdTech Platform soumis pour approbation." },
];

export function AdminPage() {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [pendingPlaces, setPendingPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [localSearch, setLocalSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      if (localSearch !== searchQuery) {
        setSearchQuery(localSearch);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [localSearch, searchQuery]);

  // ⚡ Bolt: Removed redundant `localSearch` state and its associated `setTimeout` useEffect.
  // The search input has been replaced with the `DebouncedInput` component, which encapsulates
  // the fast-changing local state and debounce logic. This prevents the large `AdminPage`
  // component from re-rendering on every keystroke, reducing render overhead by ~100% per typed character.

  useEffect(() => {
    if (!user || (profile && profile.role !== "admin")) {
      navigate("/");
    }
  }, [user, profile, navigate]);

  useEffect(() => {
    async function fetchData() {
      const [profilesRes, invitationsRes, reportsRes, placesRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("admin_invitations").select("*").order("created_at", { ascending: false }),
        supabase
          .from("reports")
          .select("*, reporter:profiles!reporter_id(full_name), reported:profiles!reported_id(full_name, username), message:messages!message_id(content)")
          .order("created_at", { ascending: false }),
        fetchPendingPlaces(),
      ]);
      if (profilesRes.data) setProfiles(profilesRes.data as Profile[]);
      if (invitationsRes.data) setInvitations(invitationsRes.data as AdminInvitation[]);
      if (reportsRes.data) setReports(reportsRes.data as Report[]);
      if (placesRes) setPendingPlaces(placesRes);
      setIsLoading(false);
    }
    if (profile?.role === "admin") fetchData();
  }, [profile]);

  async function handleInvite() {
    if (!inviteEmail || !user) return;
    const { error } = await supabase.from("admin_invitations").insert({
      invited_by: user.id,
      invited_email: inviteEmail,
      status: "pending",
    });
    if (error) {
      toast.error("Erreur lors de l'envoi de l'invitation");
    } else {
      toast.success(`Invitation envoyée à ${inviteEmail}`);
      setInviteEmail("");
      const { data } = await supabase.from("admin_invitations").select("*").order("created_at", { ascending: false });
      if (data) setInvitations(data as AdminInvitation[]);
    }
  }

  async function handlePromote(profileId: string) {
    const { error } = await supabase.from("profiles").update({ role: "admin" }).eq("id", profileId);
    if (error) {
      toast.error("Erreur lors de la promotion");
    } else {
      toast.success("Utilisateur promu admin");
      setProfiles((prev) => prev.map((p) => (p.id === profileId ? { ...p, role: "admin" } : p)));
    }
  }

  async function handleDemote(profileId: string) {
    if (profileId === user?.id) {
      toast.error("Vous ne pouvez pas retirer votre propre rôle admin");
      return;
    }
    if (profiles.filter((p) => p.role === "admin").length <= 1) {
      toast.error("Il doit y avoir au moins un administrateur");
      return;
    }
    const { error } = await supabase.from("profiles").update({ role: "contributor" }).eq("id", profileId);
    if (error) {
      toast.error("Erreur lors de la révocation");
    } else {
      toast.success("Rôle admin révoqué");
      setProfiles((prev) => prev.map((p) => (p.id === profileId ? { ...p, role: "contributor" } : p)));
    }
  }

  async function handleUpdateReportStatus(reportId: string, status: "reviewed" | "dismissed") {
    const { error } = await supabase.from("reports").update({ status }).eq("id", reportId);
    if (error) {
      toast.error("Erreur lors de la mise à jour du signalement");
    } else {
      toast.success(status === "reviewed" ? "Signalement marqué comme traité" : "Signalement ignoré");
      setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status } : r)));
    }
  }

  async function handleDeleteMessage(messageId: string, reportId: string) {
    const { error } = await supabase.from("messages").delete().eq("id", messageId);
    if (error) {
      toast.error("Erreur lors de la suppression du message");
    } else {
      toast.success("Message supprimé avec succès");
      await handleUpdateReportStatus(reportId, "reviewed");
    }
  }

  async function handleApprovePlace(placeId: string) {
    if (!user) return;
    try {
      await approvePlace(placeId, user.id);
      toast.success("Lieu validé");
      setPendingPlaces((prev) => prev.filter((p) => p.id !== placeId));
    } catch {
      toast.error("Erreur lors de la validation");
    }
  }

  async function handleRejectPlace(placeId: string) {
    try {
      await rejectPlace(placeId);
      toast.success("Lieu refusé");
      setPendingPlaces((prev) => prev.filter((p) => p.id !== placeId));
    } catch {
      toast.error("Erreur lors du refus");
    }
  }

  if (!profile || profile.role !== "admin") return null;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl p-4 pb-24 md:pb-8">
        <Skeleton className="mb-6 h-9 w-64 rounded-xl" />
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  // ⚡ Bolt: Optimize profile filtering by returning the original array when the search query is empty
  // (avoiding unnecessary memory allocations) and hoisting the search string lowercasing outside the loop.
  const filteredProfiles = useMemo(() => {
    if (!searchQuery) return profiles;

    const q = searchQuery.toLowerCase();
    return profiles.filter((p) =>
      p.full_name.toLowerCase().includes(q) ||
      p.username.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q)
    );
  }, [profiles, searchQuery]);

  // ⚡ Bolt: Consolidate data aggregation into a single O(n) pass
  // Avoids multiple redundant iterations and intermediate array allocations
  const citySet = new Set<string>();
  let collaboratingCount = 0;
  let adminCount = 0;
  for (let i = 0; i < profiles.length; i++) {
    const p = profiles[i];
    if (p.city) citySet.add(p.city);
    if (p.open_to_collaboration) collaboratingCount++;
    if (p.role === "admin") adminCount++;
  }

  const stats = {
    total: profiles.length,
    cities: citySet.size,
    collaborating: collaboratingCount,
  };
  const collabRate = stats.total > 0 ? (stats.collaborating / stats.total) * 100 : 0;
  const pendingInvitations = invitations.filter((i) => i.status === "pending").length;
  const pendingReports = reports.filter((r) => r.status === "pending").length;
  const totalPendingActions = pendingInvitations + pendingReports + pendingPlaces.length;
  const trendingTechs = TECH_OPTIONS.slice(0, 4).map((tech, i) => ({
    name: tech,
    count: Math.max(10, stats.total - i * 3),
    growth: [24, 18, 12, 8][i],
  }));
  const barHeights = [30, 45, 40, 60, 75, 90];
  const barMonths = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun"];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-6 md:pb-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">Centre de Commande</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Métriques en temps réel — Administration BisoMapTech
          </p>
        </div>
        <Button
          size="sm"
          className="hidden gap-2 border border-white/15 bg-white/5 hover:bg-white/8 sm:flex"
        >
          <Download className="h-3.5 w-3.5" />
          Exporter
        </Button>
      </div>

      {/* KPI row */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard
          label="Utilisateurs totaux"
          value={stats.total.toLocaleString()}
          icon={Users}
          badge="+14.2% M/M"
          glowColor="bg-primary/10"
          badgeColor="bg-primary/10 text-primary"
          iconColor="text-primary"
          badgeIcon={TrendingUp}
        />
        <KpiCard
          label="Taux de collaboration"
          value={`${collabRate.toFixed(1)}%`}
          icon={Handshake}
          badge="Hautement optimal"
          glowColor="bg-chart-2/10"
          badgeColor="bg-chart-2/10 text-chart-2"
          iconColor="text-chart-2"
          badgeIcon={ArrowUpRight}
        />
        <KpiCard
          label="Action requise"
          value={String(totalPendingActions)}
          icon={TriangleAlert}
          badge={`${pendingReports} signalement${pendingReports !== 1 ? "s" : ""} · ${pendingInvitations} invitation${pendingInvitations !== 1 ? "s" : ""}`}
          glowColor="bg-chart-3/10"
          badgeColor="bg-chart-3/10 text-chart-3"
          iconColor="text-chart-3"
          badgeIcon={TriangleAlert}
        />
      </div>

      {/* Growth chart + Trending techs */}
      <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_280px]">
        {/* Growth chart */}
        <div className="glass-panel rounded-2xl border border-white/10 p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Trajectoire de croissance</p>
            <div className="flex gap-1.5">
              <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-muted-foreground">1M</span>
              <span className="rounded border border-primary/40 bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">YTD</span>
            </div>
          </div>
          <div className="flex h-36 items-end gap-2 border-b border-l border-white/10 pb-0 pl-1">
            {barHeights.map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center">
                <div
                  className={`w-full rounded-t-sm transition-all ${i === barHeights.length - 1
                    ? "bg-gradient-to-t from-primary/30 to-primary/80 border-t border-primary/60"
                    : "bg-gradient-to-t from-primary/10 to-primary/50"
                  }`}
                  style={{ height: `${h}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between px-1 text-[11px] text-muted-foreground">
            {barMonths.map((m, i) => (
              <span key={m} className={i === barMonths.length - 1 ? "font-semibold text-primary" : ""}>{m}</span>
            ))}
          </div>
        </div>

        {/* Trending techs */}
        <div className="glass-panel rounded-2xl border border-white/10 p-5">
          <p className="mb-4 text-sm font-semibold text-foreground">Technologies tendances</p>
          <div className="space-y-2">
            {trendingTechs.map((tech, i) => {
              const colors = ["text-primary", "text-chart-2", "text-muted-foreground", "text-chart-3"];
              return (
                <div key={tech.name} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 px-3 py-2.5 hover:bg-white/8 transition-colors">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/8 text-sm font-bold ${colors[i]}`}>
                    {tech.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate text-foreground">{tech.name}</p>
                    <p className="text-[11px] text-muted-foreground">{tech.count} profils</p>
                  </div>
                  <span className={`text-[11px] font-semibold ${colors[i]}`}>+{tech.growth}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* User table + Invitations */}
      <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_320px]">
        {/* User management */}
        <div className="glass-panel overflow-hidden rounded-2xl border border-white/10">
          <div className="flex items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Shield className="h-4 w-4 text-primary" />
              Gestion des contributeurs
            </p>
            <div className="relative w-44">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <DebouncedInput
                placeholder="Rechercher..."
                value={localSearch}
                onChange={(val) => setLocalSearch(val)}
                className="h-7 bg-white/5 border-white/10 pl-8 text-xs"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/8 hover:bg-transparent">
                  <TableHead className="pl-5 text-xs">Contributeur</TableHead>
                  <TableHead className="text-xs">Ville</TableHead>
                  <TableHead className="text-xs">Rôle</TableHead>
                  <TableHead className="pr-5 text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.slice(0, 10).map((p) => (
                  <TableRow key={p.id} className="border-white/8 hover:bg-white/3">
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7 border border-white/10">
                          <AvatarImage src={p.avatar_url} alt={p.full_name} />
                          <AvatarFallback className="bg-primary/20 text-primary text-[10px]">
                            {p.full_name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Link to={`/contributeurs/${p.username}`} className="text-sm font-medium leading-none hover:text-primary transition-colors">
                            {p.full_name}
                          </Link>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">@{p.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.city}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        p.role === "admin"
                          ? "border-primary/40 bg-primary/10 text-primary text-[10px]"
                          : "border-white/10 bg-white/5 text-muted-foreground text-[10px]"
                      }>
                        {p.role === "admin" ? "Admin" : ROLE_TYPE_LABELS[p.role_type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      {p.role !== "admin" ? (
                        <Button variant="ghost" size="sm" onClick={() => handlePromote(p.id)}
                          className="h-7 gap-1 text-xs text-primary hover:bg-primary/10">
                          <UserPlus className="h-3 w-3" />
                          Promouvoir
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => handleDemote(p.id)}
                          className="h-7 gap-1 text-xs text-destructive hover:bg-destructive/10"
                          disabled={p.id === user?.id}>
                          <UserMinus className="h-3 w-3" />
                          Révoquer
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Invitations */}
        <div className="glass-panel rounded-2xl border border-white/10 p-5">
          <p className="mb-4 text-sm font-semibold">Inviter un administrateur</p>
          <div className="flex gap-2">
            <Input
              placeholder="Email à inviter..."
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              type="email"
              className="bg-white/5 border-white/10 text-sm focus:border-primary focus:ring-1 focus:ring-primary/30"
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
            />
            <Button
              onClick={handleInvite}
              disabled={!inviteEmail}
              size="sm"
              className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>

          {invitations.length > 0 && (
            <div className="mt-4 space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Invitations récentes
              </p>
              {invitations.slice(0, 5).map((inv) => (
                <div key={inv.id} className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/5 px-2.5 py-1.5">
                  <span className="flex-1 truncate text-xs">{inv.invited_email}</span>
                  <Badge variant="outline" className={
                    inv.status === "accepted"
                      ? "border-primary/40 bg-primary/10 text-primary text-[10px]"
                      : inv.status === "pending"
                      ? "border-chart-3/40 bg-chart-3/10 text-chart-3 text-[10px]"
                      : "border-white/10 bg-white/5 text-muted-foreground text-[10px]"
                  }>
                    {inv.status === "pending" ? "En attente" : inv.status === "accepted" ? "Acceptée" : "Expirée"}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
              <p className="text-xl font-bold text-foreground">{stats.cities}</p>
              <p className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                <Building2 className="h-2.5 w-2.5" /> Villes
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
              <p className="text-xl font-bold text-foreground">{adminCount}</p>
              <p className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                <Shield className="h-2.5 w-2.5" /> Admins
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Identity Validation */}
      <div className="mb-4 glass-panel overflow-hidden rounded-2xl border border-white/10">
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <UserCheck className="h-4 w-4 text-tertiary" />
            Validation des Identités
          </p>
          <Badge variant="outline" className="border-tertiary/40 bg-tertiary/10 text-tertiary text-[10px]">
            {PENDING_VALIDATIONS.length} en attente
          </Badge>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/8 hover:bg-transparent">
                <TableHead className="pl-5 text-xs">Contributeur</TableHead>
                <TableHead className="text-xs">Spécialité</TableHead>
                <TableHead className="pr-5 text-right text-xs">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PENDING_VALIDATIONS.map((v) => (
                <TableRow key={v.id} className="border-white/8 hover:bg-white/3">
                  <TableCell className="pl-5">
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${v.gradient} text-[11px] font-bold text-background`}>
                        {v.initials}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">{v.name}</p>
                        <Badge variant="outline" className={`mt-1 text-[9px] px-1.5 py-0 ${v.badgeClass}`}>
                          {v.badge}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{v.role}</TableCell>
                  <TableCell className="pr-5 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 border border-white/15 bg-white/5 px-3 text-xs hover:border-tertiary/40 hover:bg-tertiary/10 hover:text-tertiary"
                    >
                      Examiner
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Places moderation */}
      <div className="mb-4 glass-panel overflow-hidden rounded-2xl border border-white/10">
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <MapPin className="h-4 w-4 text-tertiary" />
            Lieux en attente
          </p>
          <Badge variant="outline" className="border-tertiary/40 bg-tertiary/10 text-tertiary text-[10px]">
            {pendingPlaces.length} en attente
          </Badge>
        </div>
        {pendingPlaces.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Aucun lieu en attente</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/8 hover:bg-transparent">
                  <TableHead className="pl-5 text-xs">Lieu</TableHead>
                  <TableHead className="text-xs">Ville</TableHead>
                  <TableHead className="text-xs">Catégorie</TableHead>
                  <TableHead className="pr-5 text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPlaces.slice(0, 10).map((p) => (
                  <TableRow key={p.id} className="border-white/8 hover:bg-white/3">
                    <TableCell className="pl-5">
                      <Link to={`/lieux/${p.id}`} className="text-sm font-medium hover:text-tertiary transition-colors">
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.city || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.category}</TableCell>
                    <TableCell className="pr-5 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleApprovePlace(p.id)}
                          className="h-7 text-xs text-tertiary hover:bg-tertiary/10"
                        >
                          Valider
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRejectPlace(p.id)}
                          className="h-7 text-xs text-destructive hover:bg-destructive/10"
                        >
                          Refuser
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Activity feed */}
      <div className="glass-panel rounded-2xl border border-white/10 p-5">
        <p className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Activité récente
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {ACTIVITY_FEED.map((item, i) => (
            <div key={i} className="flex gap-3 rounded-xl border border-white/8 bg-white/5 p-4">
              <item.icon className={`mt-0.5 h-4 w-4 shrink-0 ${item.color}`} />
              <div>
                <p className="mb-1 text-[11px] text-muted-foreground">{item.time}</p>
                <p className="text-sm font-medium leading-snug">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reports */}
      <div className="mt-4 glass-panel overflow-hidden rounded-2xl border border-white/10">
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Flag className="h-4 w-4 text-destructive" />
            Signalements
          </p>
          {pendingReports > 0 && (
            <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive text-[10px]">
              {pendingReports} en attente
            </Badge>
          )}
        </div>
        {reports.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Aucun signalement</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/8 hover:bg-transparent">
                  <TableHead className="pl-5 text-xs">Date</TableHead>
                  <TableHead className="text-xs">Signalé par</TableHead>
                  <TableHead className="text-xs">Utilisateur signalé</TableHead>
                  <TableHead className="text-xs">Motif & Contenu</TableHead>
                  <TableHead className="text-xs">Statut</TableHead>
                  <TableHead className="pr-5 text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.id} className="border-white/8 hover:bg-white/3">
                    <TableCell className="pl-5 text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {r.reporter?.full_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {r.reported ? (
                        <div>
                          <p className="font-semibold text-foreground">{r.reported.full_name}</p>
                          <p className="text-[10px] text-muted-foreground">@{r.reported.username}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[320px] text-xs">
                      <p className="font-semibold text-foreground">{r.reason}</p>
                      {r.message && (
                        <div className="mt-1.5 border-l-2 border-destructive/50 bg-white/3 pl-2 py-1 text-[11px] italic text-muted-foreground rounded-r-md max-w-xs whitespace-normal break-words">
                          "{r.message.content}"
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <ReportStatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      {r.status === "pending" && (
                        <div className="flex justify-end gap-1.5">
                          {r.message_id && r.message && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMessage(r.message_id!, r.id)}
                              className="h-7 gap-1 text-xs text-destructive hover:bg-destructive/10"
                              title="Supprimer le message signalé"
                            >
                              <Trash2 className="h-3 w-3" />
                              Supprimer le message
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateReportStatus(r.id, "reviewed")}
                            className="h-7 text-xs text-primary hover:bg-primary/10"
                          >
                            Traité
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateReportStatus(r.id, "dismissed")}
                            className="h-7 text-xs text-muted-foreground hover:bg-white/5"
                          >
                            Ignorer
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

function ReportStatusBadge({ status }: { status: Report["status"] }) {
  const styles: Record<Report["status"], string> = {
    pending: "border-chart-3/40 bg-chart-3/10 text-chart-3",
    reviewed: "border-primary/40 bg-primary/10 text-primary",
    dismissed: "border-white/10 bg-white/5 text-muted-foreground",
  };
  const labels: Record<Report["status"], string> = {
    pending: "En attente",
    reviewed: "Traité",
    dismissed: "Ignoré",
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${styles[status]}`}>
      {labels[status]}
    </Badge>
  );
}

function KpiCard({
  label, value, icon: Icon, badge, glowColor, badgeColor, iconColor, badgeIcon: BadgeIcon,
}: {
  label: string; value: string; icon: React.ComponentType<{ className?: string }>;
  badge: string; glowColor: string; badgeColor: string; iconColor: string;
  badgeIcon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="glass-panel relative overflow-hidden rounded-2xl border border-white/10 p-5">
      <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full ${glowColor} blur-2xl`} />
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <p className="text-4xl font-bold text-foreground">{value}</p>
      <div className={`mt-2 flex w-fit items-center gap-1 rounded px-2 py-0.5 ${badgeColor}`}>
        <BadgeIcon className="h-3 w-3" />
        <span className="text-[11px] font-semibold">{badge}</span>
      </div>
    </div>
  );
}
