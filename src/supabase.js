/* Supabase client + auth helpers. URL + publishable key are injected at build time by
   build.sh via esbuild --define (__SUPABASE_URL__ / __SUPABASE_KEY__); they fall back to
   env vars (node) and finally the public project defaults. The publishable key is
   designed to be public — it ships in the browser. RLS is what protects the data. */
import { createClient } from "@supabase/supabase-js";

const pick = (defName, envName, fallback) => {
  // `typeof X` is safe on an undeclared identifier; && short-circuits so X is only
  // evaluated when esbuild has --define'd it to a literal.
  const d = defName();
  if (d) return d;
  if (typeof process !== "undefined" && process.env && process.env[envName]) return process.env[envName];
  return fallback;
};
const SUPABASE_URL = pick(() => (typeof __SUPABASE_URL__ !== "undefined" ? __SUPABASE_URL__ : ""), "SUPABASE_URL", "https://kdtzfaobcgprivsxkger.supabase.co");
const SUPABASE_KEY = pick(() => (typeof __SUPABASE_KEY__ !== "undefined" ? __SUPABASE_KEY__ : ""), "SUPABASE_ANON_KEY", "sb_publishable_mVYVK10OZfARWUl3PcfhHQ_zHa7bVpS");

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---- auth ----
export const signInWithGoogle = () =>
  supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: typeof window !== "undefined" ? window.location.origin : undefined } });
export const signOut = () => supabase.auth.signOut();
export const getUser = async () => (await supabase.auth.getUser()).data.user;
export const onAuth = (cb) => supabase.auth.onAuthStateChange((_e, session) => cb(session?.user || null));
export const ADMIN_EMAIL = "paulkilroy@gmail.com";
export const isAdmin = (user) => !!user && user.email === ADMIN_EMAIL;
