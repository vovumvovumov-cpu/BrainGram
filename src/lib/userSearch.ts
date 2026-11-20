import { supabase } from "./supabase";

export type UserSearchResult = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

/**
 * Finds other BrainGram accounts by the beginning of their @username.
 * The database RPC requires an authenticated session and returns only
 * the public identity fields needed to start a conversation.
 */
export async function searchUsersByUsername(
  query: string,
  limit = 20,
): Promise<UserSearchResult[]> {
  if (!supabase) {
    throw new Error("Supabase не настроен. Добавь VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY.");
  }

  const normalizedQuery = query
    .trim()
    .replace(/^@/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");

  if (normalizedQuery.length < 3) return [];

  const safeLimit = Math.max(1, Math.min(Math.floor(limit) || 20, 20));
  const { data, error } = await supabase.rpc("search_profiles", {
    search_query: normalizedQuery,
    result_limit: safeLimit,
  });

  if (error) throw error;
  return (data ?? []) as UserSearchResult[];
}
