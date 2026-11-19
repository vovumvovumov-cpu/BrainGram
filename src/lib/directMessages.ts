import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type DirectMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

function getClient() {
  if (!supabase) {
    throw new Error("Supabase не настроен. Добавь VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY.");
  }
  return supabase;
}

/**
 * Returns the one-to-one conversation for the current user and another account.
 * The database function creates it once and reuses it on later calls.
 */
export async function getOrCreateDirectConversation(otherUserId: string): Promise<string> {
  const client = getClient();
  const { data, error } = await client.rpc("get_or_create_direct_conversation", {
    other_user_id: otherUserId,
  });

  if (error) throw error;
  if (typeof data !== "string") {
    throw new Error("Не удалось получить идентификатор личного чата.");
  }
  return data;
}

/** Loads the latest messages in chronological order for display. */
export async function loadDirectMessages(
  conversationId: string,
  limit = 50,
): Promise<DirectMessage[]> {
  const client = getClient();
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 100));
  const { data, error } = await client
    .from("direct_messages")
    .select("id, conversation_id, sender_id, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(safeLimit);

  if (error) throw error;
  return (data ?? []) as DirectMessage[];
}

/** Sends a text message as the currently authenticated user. */
export async function sendDirectMessage(
  conversationId: string,
  body: string,
): Promise<DirectMessage> {
  const client = getClient();
  const cleanBody = body.trim();

  if (!cleanBody) throw new Error("Сообщение не может быть пустым.");
  if (cleanBody.length > 4000) throw new Error("Сообщение слишком длинное (максимум 4000 символов).");

  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("Нужно войти в BrainGram.");

  const { data, error } = await client
    .from("direct_messages")
    .insert({
      conversation_id: conversationId,
      sender_id: authData.user.id,
      body: cleanBody,
    })
    .select("id, conversation_id, sender_id, body, created_at")
    .single();

  if (error) throw error;
  return data as DirectMessage;
}

/** Subscribes to new messages. Call the returned function when leaving the chat. */
export function subscribeToDirectMessages(
  conversationId: string,
  onMessage: (message: DirectMessage) => void,
): () => void {
  const client = getClient();
  let channel: RealtimeChannel = client
    .channel(`direct-messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "direct_messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onMessage(payload.new as DirectMessage),
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
