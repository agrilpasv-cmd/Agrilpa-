import { createAdminClient } from "@/lib/supabase/admin";
import { type NextRequest, NextResponse } from "next/server";
import { cancelPendingChatEmail } from "@/lib/chat-notifications";
import { markConversationAdminSeen } from "@/lib/admin-chat-seen-state";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, userId: requestedUserId } = body;

    if (!conversationId) {
      return NextResponse.json({ error: "Falta conversationId" }, { status: 400 });
    }

    const client = await createClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sesión requerida" }, { status: 401 });
    if (requestedUserId && requestedUserId !== user.id && requestedUserId !== "admin") {
      return NextResponse.json({ error: "Usuario no autorizado" }, { status: 403 });
    }
    const userId = user.id;
    const adminClient = createAdminClient();
    const { data: conversation } = await adminClient.from("conversations")
      .select("buyer_id, seller_id")
      .eq("id", conversationId)
      .maybeSingle();
    if (!conversation || (conversation.buyer_id !== userId && conversation.seller_id !== userId)) {
      return NextResponse.json({ error: "No perteneces a esta conversación" }, { status: 403 });
    }
    const readTimestamp = new Date().toISOString();

    const query = adminClient
      .from("messages")
      .update({ read_at: readTimestamp })
      .eq("conversation_id", conversationId)
      .is("read_at", null)
      .neq("sender_id", userId);

    const { data, error } = await query.select("id");

    if (error) {
      console.error("[Mark as Read API] Error updating messages:", error);
      return NextResponse.json({ error: "Error al marcar como leído" }, { status: 500 });
    }

    // Keep admin seen state synchronized
    try {
      markConversationAdminSeen(conversationId, true);
    } catch (seenErr) {
      console.error("[Mark as Read API] Error setting admin seen state:", seenErr);
    }

    // Cancel any pending debounced email notification for this conversation since the user read them
    if (userId) {
      cancelPendingChatEmail(conversationId, userId);
    }

    return NextResponse.json({ success: true, updatedCount: data?.length || 0 });
  } catch (error) {
    console.error("[Mark as Read API] Server error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
