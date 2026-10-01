export type ChatChannel = "b2b" | "support"

export function isSupportConversation(conversation: { product_id?: string | null; is_support?: boolean }) {
  return conversation.is_support ?? !conversation.product_id
}

export function conversationPath(conversation: { id: string; product_id?: string | null; is_support?: boolean }) {
  return `${isSupportConversation(conversation) ? "/dashboard/soporte" : "/dashboard/mensajes"}?conversation=${encodeURIComponent(conversation.id)}`
}
