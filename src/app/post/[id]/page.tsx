"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useParams } from "next/navigation";
import { redirect } from "next/navigation";

interface Comment {
  id: string;
  author: {
    username: string;
    avatar: string;
  };
  content: string;
  createdAt: string;
}

interface Post {
  id: string;
  title: string;
  description: string;
  game: string;
  genre: string;
  mediaType: "video" | "image";
  mediaUrl: string;
  author: {
    username: string;
    avatar: string;
  };
  likes: number;
  comments: Comment[];
  createdAt: string;
  isLiked: boolean;
}

export default function PostPage() {
  const { user, loading } = useAuth();
  const params = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    const mockPost: Post = {
      id: params.id as string,
      title: "Clutch épico no CS2!",
      description:
        "Consegui um ace incrível na última rodada. A tensão estava no máximo! Foi uma das partidas mais intensas que já joguei. O time adversário estava dominando o jogo inteiro, mas conseguimos virar nos últimos rounds.",
      game: "Counter-Strike 2",
      genre: "fps",
      mediaType: "video",
      mediaUrl: "/placeholder.svg?height=400&width=600",
      author: {
        username: "ProGamer123",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      likes: 245,
      isLiked: false,
      createdAt: "2024-01-15T10:30:00Z",
      comments: [
        {
          id: "1",
          author: {
            username: "GamerFan",
            avatar: "/placeholder.svg?height=32&width=32",
          },
          content: "Que jogada incrível! Parabéns pelo ace!",
          createdAt: "2024-01-15T11:00:00Z",
        },
        {
          id: "2",
          author: {
            username: "CSPro",
            avatar: "/placeholder.svg?height=32&width=32",
          },
          content: "Essa mira está afiada! Qual sua config?",
          createdAt: "2024-01-15T11:15:00Z",
        },
      ],
    };
    setPost(mockPost);
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    redirect("/auth/login");
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Post não encontrado</h1>
            <p className="text-muted-foreground">
              O post que você está procurando não existe.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const handleLike = () => {
    setPost((prev) =>
      prev
        ? {
            ...prev,
            isLiked: !prev.isLiked,
            likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1,
          }
        : null
    );
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);

    // Simular envio de comentário
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const comment: Comment = {
      id: Date.now().toString(),
      author: {
        username: user.username,
        avatar: user.avatar || "/placeholder.svg?height=32&width=32",
      },
      content: newComment,
      createdAt: new Date().toISOString(),
    };

    setPost((prev) =>
      prev
        ? {
            ...prev,
            comments: [...prev.comments, comment],
          }
        : null
    );

    setNewComment("");
    setSubmittingComment(false);
  };

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Conteúdo principal */}
          <div className="lg:col-span-2">
            <Card className="animate-fade-in">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={post.author.avatar || "/placeholder.svg"}
                      alt={post.author.username}
                    />
                    <AvatarFallback>
                      {post.author.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{post.author.username}</p>
                    <p className="text-sm text-muted-foreground">{timeAgo}</p>
                  </div>
                  <Badge variant="secondary">{post.game}</Badge>
                </div>

                <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
                <p className="text-muted-foreground">{post.description}</p>
              </CardHeader>

              <CardContent className="p-0">
                {post.mediaType === "video" ? (
                  <div className="video-container">
                    <video
                      controls
                      className="w-full rounded-lg"
                      poster="/placeholder.svg?height=400&width=600"
                    >
                      <source src={post.mediaUrl} type="video/mp4" />
                      Seu navegador não suporta o elemento de vídeo.
                    </video>
                  </div>
                ) : (
                  <img
                    src={post.mediaUrl || "/placeholder.svg"}
                    alt={post.title}
                    className="w-full rounded-lg"
                  />
                )}

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        onClick={handleLike}
                        className={`transition-all duration-200 hover:scale-110 ${
                          post.isLiked ? "text-red-500" : ""
                        }`}
                      >
                        <Heart
                          className={`h-5 w-5 mr-2 ${
                            post.isLiked ? "fill-current" : ""
                          }`}
                        />
                        {post.likes}
                      </Button>

                      <Button variant="ghost">
                        <MessageCircle className="h-5 w-5 mr-2" />
                        {post.comments.length}
                      </Button>
                    </div>

                    <Button variant="ghost">
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar com comentários */}
          <div className="space-y-6">
            {/* Formulário de comentário */}
            <Card className="animate-slide-up">
              <CardHeader>
                <h3 className="font-semibold">Adicionar comentário</h3>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitComment} className="space-y-4">
                  <Input
                    placeholder="Escreva um comentário..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={submittingComment}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!newComment.trim() || submittingComment}
                    className="w-full"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submittingComment ? "Enviando..." : "Comentar"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Lista de comentários */}
            <Card
              className="animate-slide-up"
              style={{ animationDelay: "0.1s" }}
            >
              <CardHeader>
                <h3 className="font-semibold">
                  Comentários ({post.comments.length})
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={comment.author.avatar || "/placeholder.svg"}
                        alt={comment.author.username}
                      />
                      <AvatarFallback>
                        {comment.author.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-semibold text-sm">
                          {comment.author.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))}

                {post.comments.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Seja o primeiro a comentar!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
