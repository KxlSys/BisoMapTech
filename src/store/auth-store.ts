import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types";
import type { User, Session } from "@supabase/supabase-js";

let authSubscription: { unsubscribe: () => void } | null = null;

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isNewUser: boolean;
  unreadMessages: number;
  initialize: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
  setIsNewUser: (value: boolean) => void;
  fetchUnreadMessages: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isNewUser: false,
  unreadMessages: 0,

  initialize: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    set({ session, user: session?.user ?? null, isLoading: false });

    if (session?.user) {
      await get().fetchProfile(session.user.id);
      await get().fetchUnreadMessages();
    }

    authSubscription?.unsubscribe();
    authSubscription = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
      if (session?.user) {
        (async () => {
          await get().fetchProfile(session.user.id);
          await get().fetchUnreadMessages();
        })();
      } else {
        set({ profile: null, unreadMessages: 0 });
      }
    }).data.subscription;
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
    set({ user: null, session: null, profile: null, unreadMessages: 0 });
  },

  fetchProfile: async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (data) {
      set({ profile: data as Profile });
      supabase
        .from("profiles")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", userId)
        .then(() => {});
    }
  },

  setIsNewUser: (value: boolean) => set({ isNewUser: value }),

  fetchUnreadMessages: async () => {
    const user = get().user;
    if (!user) return;

    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .is("read_at", null);

    set({ unreadMessages: count ?? 0 });
  },
}));
