import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://alva-sd.pages.dev",
  "https://alvasd.com",
  "https://www.alvasd.com",
  "https://admin.alvasd.com",
]);

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = allowedOrigins.has(origin) ? origin : "https://alva-sd.pages.dev";
  const cors = {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: cors });
  if (!allowedOrigins.has(origin)) return new Response(JSON.stringify({ error: "origin_not_allowed" }), { status: 403, headers: cors });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") || "";

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await callerClient.auth.getUser();
  const user = userData?.user;
  if (userError || !user?.id || !user.email) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: cors });

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const [{ data: profile }, { data: platformUser }] = await Promise.all([
    admin.from("alva_profiles").select("id,role_id,is_active").eq("id", user.id).maybeSingle(),
    admin.from("platform_users").select("platform_role").eq("user_id", user.id).maybeSingle(),
  ]);

  if (!profile?.is_active || platformUser?.platform_role !== "super_admin") return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: cors });
  const { data: role } = await admin.from("alva_roles").select("slug").eq("id", profile.role_id).maybeSingle();
  if (role?.slug !== "owner") return new Response(JSON.stringify({ error: "owner_required" }), { status: 403, headers: cors });

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email: user.email });
  const tokenHash = linkData?.properties?.hashed_token;
  if (linkError || !tokenHash) return new Response(JSON.stringify({ error: "handoff_failed" }), { status: 500, headers: cors });

  return new Response(JSON.stringify({ token_hash: tokenHash, type: "email", target: "https://ttd-alvasd.pages.dev/admin/" }), { status: 200, headers: cors });
});
