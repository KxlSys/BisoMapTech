import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth-store";
import {
  acceptConnection,
  deriveConnectionState,
  getConnectionWith,
  removeConnection,
  sendConnectionRequest,
} from "@/lib/connection-service";
import type { Connection, ConnectionState } from "@/types";

interface UseConnectionResult {
  state: ConnectionState;
  connection: Connection | null;
  loading: boolean;
  busy: boolean;
  request: () => Promise<void>;
  accept: () => Promise<void>;
  remove: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Track and mutate the connection relationship between the current user and
 * `otherId`. Keeps itself fresh via Supabase Realtime on the `connections`
 * table (both directions involving me).
 */
export function useConnection(otherId: string | undefined | null): UseConnectionResult {
  const { user } = useAuthStore();
  const [connection, setConnection] = useState<Connection | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!user || !otherId || user.id === otherId) {
      setConnection(null);
      setLoading(false);
      return;
    }
    try {
      setConnection(await getConnectionWith(user.id, otherId));
    } catch (err) {
      console.warn("useConnection refresh failed:", err);
    } finally {
      setLoading(false);
    }
  }, [user, otherId]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  // Live updates: any change to a connection that involves me re-syncs state.
  useEffect(() => {
    if (!user || !otherId) return;

    const channel = supabase
      .channel(`connection-${user.id}-${otherId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "connections", filter: `requester_id=eq.${user.id}` },
        () => refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "connections", filter: `addressee_id=eq.${user.id}` },
        () => {
          refresh();
          useAuthStore.getState().fetchPendingRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, otherId, refresh]);

  const state = deriveConnectionState(user?.id, otherId ?? "", connection);

  const run = useCallback(
    async (fn: () => Promise<unknown>) => {
      setBusy(true);
      try {
        await fn();
        await refresh();
        useAuthStore.getState().fetchPendingRequests();
      } finally {
        setBusy(false);
      }
    },
    [refresh]
  );

  const request = useCallback(async () => {
    if (!user || !otherId) return;
    await run(() => sendConnectionRequest(user.id, otherId));
  }, [user, otherId, run]);

  const accept = useCallback(async () => {
    if (!connection) return;
    await run(() => acceptConnection(connection.id));
  }, [connection, run]);

  const remove = useCallback(async () => {
    if (!connection) return;
    await run(() => removeConnection(connection.id));
  }, [connection, run]);

  return { state, connection, loading, busy, request, accept, remove, refresh };
}
