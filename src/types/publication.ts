import { Game } from "./game";

export interface Publication {
  id: string;
  title: string;
  description: string;
  mediaUrl: string;
  game: string;
  gameData?: Game;
  thumbnail: string;
  created_at: string;
  author_name: string;
  author_avatar: string;
  mediaType: "video" | "image";
  likes: number;
  comments: number;
  isLiked: boolean;
}
