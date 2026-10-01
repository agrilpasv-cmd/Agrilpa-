export interface ChatUser {
  id: string;
  name: string;
  companyName: string;
  avatar_url?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface ConversationProduct {
  id: string;
  title: string;
  price: string;
  currency: string;
  image: string;
  quantity: string;
}

export interface Conversation {
  id: string;
  product_id: string | null;
  is_support?: boolean;
  support_status?: 'open' | 'in_progress' | 'resolved';
  buyer_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
  
  // Joins (Fetched from DB or populated in the frontend)
  other_user?: ChatUser;
  product?: ConversationProduct;
  last_message?: Message;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachment_url?: string;
  attachment_type?: 'image' | 'pdf' | 'docx' | 'unknown';
  read_at?: string;
  created_at: string;
}
