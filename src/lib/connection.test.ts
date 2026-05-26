import { describe, test, expect } from "vitest";
import { deriveConnectionState, partnerOf } from "./connection-service";
import type { Connection, ConnectionWithProfiles } from "@/types";

const ME = "me-id";
const OTHER = "other-id";

function makeConnection(overrides: Partial<Connection> = {}): Connection {
  return {
    id: "conn-1",
    requester_id: ME,
    addressee_id: OTHER,
    status: "pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("deriveConnectionState", () => {
  test("renvoie 'self' quand c'est mon propre profil", () => {
    expect(deriveConnectionState(ME, ME, null)).toBe("self");
  });

  test("renvoie 'none' quand l'utilisateur n'est pas connecté (pas de session)", () => {
    expect(deriveConnectionState(undefined, OTHER, null)).toBe("none");
    expect(deriveConnectionState(null, OTHER, null)).toBe("none");
  });

  test("renvoie 'none' quand aucune relation n'existe", () => {
    expect(deriveConnectionState(ME, OTHER, null)).toBe("none");
  });

  test("renvoie 'connected' quand la connexion est acceptée", () => {
    expect(deriveConnectionState(ME, OTHER, makeConnection({ status: "accepted" }))).toBe(
      "connected"
    );
  });

  test("renvoie 'pending_outgoing' quand j'ai émis la demande", () => {
    expect(
      deriveConnectionState(ME, OTHER, makeConnection({ requester_id: ME, addressee_id: OTHER }))
    ).toBe("pending_outgoing");
  });

  test("renvoie 'pending_incoming' quand j'ai reçu la demande", () => {
    expect(
      deriveConnectionState(ME, OTHER, makeConnection({ requester_id: OTHER, addressee_id: ME }))
    ).toBe("pending_incoming");
  });
});

describe("partnerOf", () => {
  const base: ConnectionWithProfiles = {
    ...makeConnection({ status: "accepted" }),
    requester: { id: ME, username: "me", full_name: "Moi", avatar_url: "" },
    addressee: { id: OTHER, username: "other", full_name: "Autre", avatar_url: "" },
  };

  test("retourne l'autre participant quand je suis le demandeur", () => {
    expect(partnerOf(ME, base)?.id).toBe(OTHER);
  });

  test("retourne l'autre participant quand je suis le destinataire", () => {
    const reversed: ConnectionWithProfiles = {
      ...base,
      requester_id: OTHER,
      addressee_id: ME,
      requester: { id: OTHER, username: "other", full_name: "Autre", avatar_url: "" },
      addressee: { id: ME, username: "me", full_name: "Moi", avatar_url: "" },
    };
    expect(partnerOf(ME, reversed)?.id).toBe(OTHER);
  });
});
