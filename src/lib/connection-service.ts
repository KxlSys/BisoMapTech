import { supabase } from "@/lib/supabase";
import type {
  Connection,
  ConnectionPartner,
  ConnectionState,
  ConnectionWithProfiles,
} from "@/types";

const PARTNER_FIELDS = "id, username, full_name, avatar_url, e2ee_public_key";

/**
 * Derive the connection state between the current user and another member.
 * Pure function — easy to unit test and the single source of UI truth.
 */
export function deriveConnectionState(
  myId: string | undefined | null,
  otherId: string,
  connection: Connection | null
): ConnectionState {
  if (myId && myId === otherId) return "self";
  if (!myId) return "none";
  if (!connection) return "none";
  if (connection.status === "accepted") return "connected";
  return connection.requester_id === myId ? "pending_outgoing" : "pending_incoming";
}

/** Pick the "other" participant's profile from a connection row. */
export function partnerOf(
  myId: string,
  conn: ConnectionWithProfiles
): ConnectionPartner | null {
  return conn.requester_id === myId ? conn.addressee : conn.requester;
}

/** Fetch the single connection row between me and another member, if any. */
export async function getConnectionWith(
  myId: string,
  otherId: string
): Promise<Connection | null> {
  const { data, error } = await supabase
    .from("connections")
    .select("*")
    .or(
      `and(requester_id.eq.${myId},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${myId})`
    )
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as Connection | null;
}

/** Send a connection request to another member. */
export async function sendConnectionRequest(
  myId: string,
  addresseeId: string
): Promise<Connection> {
  const { data, error } = await supabase
    .from("connections")
    .insert({ requester_id: myId, addressee_id: addresseeId, status: "pending" })
    .select("*")
    .single();

  if (error) throw error;
  return data as Connection;
}

/** Accept an incoming request (only the addressee may do this — enforced by DB). */
export async function acceptConnection(connectionId: string): Promise<void> {
  const { error } = await supabase
    .from("connections")
    .update({ status: "accepted" })
    .eq("id", connectionId);

  if (error) throw error;
}

/**
 * Remove a connection row. Covers declining a request, cancelling a sent
 * request, and disconnecting from an accepted contact.
 */
export async function removeConnection(connectionId: string): Promise<void> {
  const { error } = await supabase.from("connections").delete().eq("id", connectionId);
  if (error) throw error;
}

/** Pending requests addressed to me (with the requester's profile). */
export async function listIncomingRequests(
  myId: string
): Promise<ConnectionWithProfiles[]> {
  const { data, error } = await supabase
    .from("connections")
    .select(
      `*, requester:profiles!connections_requester_id_fkey(${PARTNER_FIELDS}), addressee:profiles!connections_addressee_id_fkey(${PARTNER_FIELDS})`
    )
    .eq("addressee_id", myId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ConnectionWithProfiles[];
}

/** All accepted connections involving me (with both profiles embedded). */
export async function listAcceptedConnections(
  myId: string
): Promise<ConnectionWithProfiles[]> {
  const { data, error } = await supabase
    .from("connections")
    .select(
      `*, requester:profiles!connections_requester_id_fkey(${PARTNER_FIELDS}), addressee:profiles!connections_addressee_id_fkey(${PARTNER_FIELDS})`
    )
    .eq("status", "accepted")
    .or(`requester_id.eq.${myId},addressee_id.eq.${myId}`)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ConnectionWithProfiles[];
}

/** Count of pending requests addressed to me (cheap head query). */
export async function countIncomingRequests(myId: string): Promise<number> {
  const { count, error } = await supabase
    .from("connections")
    .select("*", { count: "exact", head: true })
    .eq("addressee_id", myId)
    .eq("status", "pending");

  if (error) throw error;
  return count ?? 0;
}
