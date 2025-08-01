"use client";

import { useState } from "react";
import { GamePost } from "@/components/game-post";

interface Post {
  id: string;
  title: string;
  description: string;
  game: string;
  genre: string;
  mediaType: "video" | "image";
  mediaUrl: string;
  thumbnail?: string;
  author: {
    username: string;
    avatar: string;
  };
  likes: number;
  comments: number;
  createdAt: string;
  isLiked: boolean;
}

interface GameFeedProps {
  selectedGenre: string;
  searchTerm: string;
}

// Mock data
const mockPosts: Post[] = [
  {
    id: "1",
    title: "Clutch épico no CS2!",
    description:
      "Consegui um ace incrível na última rodada. A tensão estava no máximo!",
    game: "Counter-Strike 2",
    genre: "fps",
    mediaType: "video",
    mediaUrl: "/placeholder.svg?height=400&width=600",
    thumbnail: "/placeholder.svg?height=200&width=300",
    author: {
      username: "ProGamer123",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    likes: 245,
    comments: 32,
    createdAt: "2024-01-15T10:30:00Z",
    isLiked: false,
  },
  {
    id: "2",
    title: "Screenshot épico do Cyberpunk",
    description: "Night City nunca esteve tão bonita! RTX ligado no máximo.",
    game: "Cyberpunk 2077",
    genre: "rpg",
    mediaType: "image",
    mediaUrl: "/placeholder.svg?height=400&width=600",
    author: {
      username: "CyberNinja",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    likes: 189,
    comments: 24,
    createdAt: "2024-01-14T15:45:00Z",
    isLiked: true,
  },
  {
    id: "3",
    title: "Boss fight épico no Elden Ring",
    description:
      "Finalmente derrotei Malenia depois de 50 tentativas! Que luta incrível.",
    game: "Elden Ring",
    genre: "action",
    mediaType: "video",
    mediaUrl: "/placeholder.svg?height=400&width=600",
    thumbnail: "/placeholder.svg?height=200&width=300",
    author: {
      username: "SoulsBorne",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    likes: 412,
    comments: 67,
    createdAt: "2024-01-13T20:15:00Z",
    isLiked: false,
  },
];

export function GameFeed({ selectedGenre, searchTerm }: GameFeedProps) {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [loading, setLoading] = useState(false);

  const filteredPosts = posts.filter((post) => {
    const matchesGenre =
      selectedGenre === "all" || post.genre === selectedGenre;
    const matchesSearch =
      searchTerm === "" ||
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.game.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author.username.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesGenre && matchesSearch;
  });

  const handleLike = (postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-muted rounded-lg h-64 mb-4"></div>
            <div className="bg-muted rounded h-4 mb-2"></div>
            <div className="bg-muted rounded h-4 w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {filteredPosts.map((post, index) => (
        <div
          key={post.id}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <GamePost post={post} onLike={handleLike} />
        </div>
      ))}

      {filteredPosts.length === 0 && (
        <div className="col-span-full text-center py-12">
          <p className="text-muted-foreground text-lg">
            Nenhum post encontrado para os filtros selecionados.
          </p>
        </div>
      )}
    </div>
  );
}
