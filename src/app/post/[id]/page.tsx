"use client";

import type React from "react";

import { useAuth } from "@/components/auth-provider";
import { Navbar } from "@/components/navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import { Publication } from "@/types/publication";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, MessageCircle, Send, Share2 } from "lucide-react";
import { redirect, useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Comment {
  id: number | string;
  publication: number;
  user_id: string | null;
  author_name: string | null;
  author_avatar: string | null;
  content: string | null;
  created_at: string;
}

export default function PostPage() {
  const { user, loading } = useAuth();
  const params = useParams();
  const [post, setPost] = useState<Publication | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from("Publication")
        .select("*, gameData:Game (*)")
        .eq("id", params.id)
        .single();

      if (error) {
        console.error("Erro ao buscar post:", error);
        return;
      }

      if (data) {
        const publication: Publication = {
          ...data,
          author: {
            username: data.author_username || "Usuário",
            avatar: data.author_avatar,
          },
          mediaType: data.media_type || "image",
          likes: data.likes || 0,
          comments: data.comments_count || 0,
          isLiked: false,
        };
        setPost(publication);
      }
    };

    if (params.id) {
      fetchPost();
    }
  }, [params.id]);

  useEffect(() => {
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from("Comment")
        .select(
          "id, publication, user_id, author_name, author_avatar, content, created_at"
        )
        .eq(
          "publication",
          typeof params.id === "string" ? Number(params.id) : (params.id as any)
        )
        .order("created_at", { ascending: true });

      if (error) {
        const anyError = error as any;
        console.error(
          `Erro ao buscar comentários: message=${
            anyError?.message || ""
          } details=${anyError?.details || ""} hint=${anyError?.hint || ""}`
        );
        return;
      }

      setComments((data || []) as Comment[]);
    };

    if (params.id) {
      fetchComments();
    }
  }, [params.id]);

  useEffect(() => {
    if (!params.id) return;

    const channel = supabase
      .channel(`comments-${params.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Comment",
          filter: `publication=eq.${params.id}`,
        },
        (payload) => {
          const newComment = payload.new as Comment;
          setComments((prev) => [...prev, newComment]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
    if (!newComment.trim() || !user || !post) return;

    setSubmittingComment(true);

    const { data, error } = await supabase
      .from("Comment")
      .insert({
        publication:
          typeof post.id === "string" ? Number(post.id) : (post.id as any),
        user_id: user.id,
        content: newComment.trim(),
        author_name: user.username,
        author_avatar: user.avatar || "/placeholder.svg?height=32&width=32",
      })
      .select()
      .single();

    if (error) {
      const anyError = error as any;
      console.error(
        `Erro ao enviar comentário: message=${
          anyError?.message || ""
        } details=${anyError?.details || ""} hint=${anyError?.hint || ""}`
      );
    } else if (data) {
      setComments((prev) => [...prev, data as Comment]);
      setNewComment("");
    }

    setSubmittingComment(false);
  };

  const timeAgo = hasMounted
    ? formatDistanceToNow(new Date(post.created_at), {
        addSuffix: true,
        locale: ptBR,
      })
    : "";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Card className="animate-fade-in">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={post.author_avatar || "/placeholder.svg"}
                      alt={post.author_name}
                    />
                    <AvatarFallback>
                      {post.author_name[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{post.author_name}</p>
                    <p
                      className="text-sm text-muted-foreground"
                      suppressHydrationWarning
                    >
                      {timeAgo}
                    </p>
                  </div>
                  <Badge variant="secondary">{post.gameData?.name}</Badge>
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
                      poster={post.thumbnail || "/placeholder.svg"}
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
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      if (target.src !== "/placeholder.svg")
                        target.src = "/placeholder.svg";
                    }}
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
                        } relative`}
                      >
                        <AnimatePresence>
                          {post.isLiked && (
                            <motion.span
                              key="like-burst"
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 2.1, opacity: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.45, ease: "easeOut" }}
                              className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-red-500/40"
                              aria-hidden
                            />
                          )}
                        </AnimatePresence>

                        <motion.span
                          key={post.isLiked ? "liked" : "unliked"}
                          initial={{ scale: 1 }}
                          animate={{
                            scale: post.isLiked ? [1, 1.45, 1] : [1, 0.9, 1],
                          }}
                          transition={{
                            duration: 0.35,
                            times: [0, 0.5, 1],
                            ease: "easeOut",
                          }}
                          whileTap={{ scale: 0.85 }}
                          className="inline-flex items-center"
                        >
                          <Heart
                            className={`h-5 w-5 mr-2 ${
                              post.isLiked ? "fill-current" : ""
                            }`}
                          />
                        </motion.span>
                        {post.likes}
                      </Button>

                      <Button variant="ghost">
                        <MessageCircle className="h-5 w-5 mr-2" />
                        {comments.length}
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

          <div className="space-y-6 lg:col-span-2">
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

            <Card
              className="animate-slide-up"
              style={{ animationDelay: "0.1s" }}
            >
              <CardHeader>
                <h3 className="font-semibold">
                  Comentários ({comments.length})
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="flex space-x-3 overflow-hidden"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={comment.author_avatar || "/placeholder.svg"}
                        alt={comment.author_name || "Usuário"}
                      />
                      <AvatarFallback>
                        {comment.author_name?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-semibold text-sm">
                          {comment.author_name}
                        </p>
                        <p
                          className="text-xs text-muted-foreground"
                          suppressHydrationWarning
                        >
                          {hasMounted
                            ? formatDistanceToNow(
                                new Date(comment.created_at),
                                {
                                  addSuffix: true,
                                  locale: ptBR,
                                }
                              )
                            : ""}
                        </p>
                      </div>
                      <p className="text-sm break-words whitespace-pre-wrap max-w-full overflow-hidden">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}

                {comments.length === 0 && (
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
