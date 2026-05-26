import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { countIncomingRequests } from "@/lib/connection-service";
import type { Profile } from "@/types";
import type { User, Session } from "@supabase/supabase-js";

let authSubscription: { unsubscribe: () => void } | null = null;

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  /** True once the initial profile fetch has resolved (success OR not-found). */
  profileLoaded: boolean;
  isNewUser: boolean;
  unreadMessages: number;
  pendingRequests: number;
  authError: string | null;
  /** Last error encountered while fetching the profile (RLS, network, ...). */
  profileError: string | null;
  initialize: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<Profile | null>;
  setProfile: (profile: Profile | null) => void;
  setIsNewUser: (value: boolean) => void;
  fetchUnreadMessages: () => Promise<void>;
  fetchPendingRequests: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  profileLoaded: false,
  isNewUser: false,
  unreadMessages: 0,
  pendingRequests: 0,
  authError: null,
  profileError: null,

  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      set({
        session,
        user: session?.user ?? null,
        isLoading: false,
        authError: null,
      });

      if (session?.user) {
        await get().fetchProfile(session.user.id);
        await get().fetchUnreadMessages();
        await get().fetchPendingRequests();
      } else {
        // No session — mark profile as "loaded" so guarded routes don't hang.
        set({ profileLoaded: true });
      }

      authSubscription?.unsubscribe();
      authSubscription = supabase.auth.onAuthStateChange((_event, session) => {
        set({ session, user: session?.user ?? null, authError: null });
        if (session?.user) {
          (async () => {
            await get().fetchProfile(session.user.id);
            await get().fetchUnreadMessages();
            await get().fetchPendingRequests();
          })();
        } else {
          set({ profile: null, unreadMessages: 0, pendingRequests: 0, profileLoaded: true });
        }
      }).data.subscription;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Impossible d'initialiser la session.";
      console.error("Echec d'initialisation auth Supabase:", error);
      set({
        user: null,
        session: null,
        profile: null,
        unreadMessages: 0,
        pendingRequests: 0,
        isLoading: false,
        profileLoaded: true,
        authError: message,
      });
    }
  },

  signInWithGitHub: async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  },

  signInWithEmail: async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({
      user: null,
      session: null,
      profile: null,
      unreadMessages: 0,
      pendingRequests: 0,
      profileLoaded: true,
      profileError: null,
    });
  },

  fetchProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("fetchProfile error:", error);
        set({
          profile: null,
          profileLoaded: true,
          profileError: error.message,
        });
        return null;
      }

      const profile = (data ?? null) as Profile | null;

      set({
        profile,
        profileLoaded: true,
        profileError: null,
      });

      if (profile) {
        // Heartbeat: update last_seen_at without blocking the UI; failures
        // are intentionally ignored.
        supabase
          .from("profiles")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("id", userId)
          .then(() => {});
      }

      return profile;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur de chargement du profil.";
      console.error("fetchProfile threw:", error);
      set({
        profile: null,
        profileLoaded: true,
        profileError: message,
      });
      return null;
    }
  },

  setProfile: (profile) => set({ profile, profileLoaded: true }),

  setIsNewUser: (value: boolean) => set({ isNewUser: value }),

  fetchUnreadMessages: async () => {
    const user = get().user;
    if (!user) return;

    try {
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .is("read_at", null);

      set({ unreadMessages: count ?? 0 });
    } catch (error) {
      // Non-blocking — keep previous count.
      console.warn("fetchUnreadMessages failed:", error);
    }
  },

  fetchPendingRequests: async () => {
    const user = get().user;
    if (!user) return;

    try {
      set({ pendingRequests: await countIncomingRequests(user.id) });
    } catch (error) {
      // Non-blocking — keep previous count.
      console.warn("fetchPendingRequests failed:", error);
    }
  },
}));
