import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.106.1";

const corsHeadersBase = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowListValue = Deno.env.get("ALLOWED_ORIGINS") ?? "";
  const allowList = allowListValue
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const allowedOrigin =
    origin && (allowList.length === 0 || allowList.includes(origin))
      ? origin
      : allowList[0] ?? "*";

  return {
    ...corsHeadersBase,
    "Access-Control-Allow-Origin": allowedOrigin,
    Vary: "Origin",
  };
}

interface GitHubRepo {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  html_url: string;
  fork: boolean;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { username, profile_id } = await req.json();

    if (!username || !profile_id) {
      return new Response(
        JSON.stringify({ error: "username and profile_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const isOwner = user.id === profile_id;
    if (!isOwner) {
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      const isAdmin = profileRow?.role === "admin";
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const githubResponse = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=30&sort=updated&direction=desc`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "TechCongo-Map",
        },
      }
    );

    if (!githubResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch GitHub repos" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const repos: GitHubRepo[] = await githubResponse.json();

    const filteredRepos = repos
      .filter((r) => !r.fork)
      .slice(0, 10)
      .map((r) => ({
        profile_id,
        name: r.name,
        description: r.description || "",
        language: r.language || "",
        stars: r.stargazers_count,
        url: r.html_url,
        is_pinned: false,
      }));

    await supabase
      .from("repositories")
      .delete()
      .eq("profile_id", profile_id);

    if (filteredRepos.length > 0) {
      const { error } = await supabase
        .from("repositories")
        .insert(filteredRepos);

      if (error) {
        return new Response(
          JSON.stringify({ error: "Failed to save repos" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ synced: filteredRepos.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
