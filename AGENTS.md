
- AI chat (Penasihat AI) runs in the `finance-assistant` edge function; it builds user finance context server-side with the caller JWT (RLS) and persists UIMessages in `ai_chat_messages`. Why: keeps AI key and prompts server-side and data scoped per user.
