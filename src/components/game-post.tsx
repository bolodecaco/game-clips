"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, Play } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

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

interface GamePostProps {
  post: Post;
  onLike: (postId: string) => void;
}

export function GamePost({ post, onLike }: GamePostProps) {
  const [isHovered, setIsHovered] = useState(false);

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <Card
      className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] animate-scale-in"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={post.author.avatar || "/placeholder.svg"}
              alt={post.author.username}
            />
            <AvatarFallback>
              {post.author.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-sm">{post.author.username}</p>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {post.game}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Link href={`/post/${post.id}`}>
          <div className="relative group cursor-pointer">
            {post.mediaType === "video" ? (
              <div className="relative">
                <img
                  src={post.thumbnail || post.mediaUrl}
                  alt={post.title}
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Play className="h-12 w-12 text-white" />
                </div>
              </div>
            ) : (
              <img
                src={post.mediaUrl || "/placeholder.svg"}
                alt={post.title}
                className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
              />
            )}

            {isHovered && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4 animate-fade-in">
                <div className="text-white">
                  <h3 className="font-bold text-lg mb-1">{post.title}</h3>
                  <p className="text-sm opacity-90 line-clamp-2">
                    {post.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Link>

        <div className="p-4">
          <h3 className="font-semibold mb-2 line-clamp-2">{post.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {post.description}
          </p>
        </div>
      </CardContent>

      <CardFooter className="pt-0 px-4 pb-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLike(post.id)}
              className={`transition-all duration-200 hover:scale-110 ${
                post.isLiked ? "text-red-500" : ""
              }`}
            >
              <Heart
                className={`h-4 w-4 mr-1 ${post.isLiked ? "fill-current" : ""}`}
              />
              {post.likes}
            </Button>

            <Button variant="ghost" size="sm" asChild>
              <Link
                href={`/post/${post.id}`}
                className="transition-all duration-200 hover:scale-110"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                {post.comments}
              </Link>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="transition-all duration-200 hover:scale-110"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
