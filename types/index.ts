export interface ChatMessageDTO {
  id: string;
  content: string;
  userId: string | null;
  guestId: string | null;
  guestName: string | null;
  user: { name: string | null; image: string | null } | null;
  createdAt: string;
}
