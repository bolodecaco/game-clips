"use client";

import { GamePost } from "@/components/game-post";
import { supabase } from "@/lib/supabaseClient";
import { Publication } from "@/types/publication";
import { useEffect, useState } from "react";

interface GameFeedProps {
  selectedGenre: string;
  searchTerm: string;
}

export function GameFeed({ selectedGenre, searchTerm }: GameFeedProps) {
  const [posts, setPosts] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const result = await supabase.from("Publication").select(`
        *,
        gameData:Game (*)
      `);
    if (result.error) {
      console.error("Error fetching posts:", result.error);
      setLoading(false);
      return;
    }
    // Normaliza campos para o shape de Publication usado no front
    const normalized = (result.data as any[]).map((row) => ({
      ...row,
      mediaType: row.media_type ?? row.mediaType ?? "image",
      comments: row.comments_count ?? row.comments ?? 0,
      likes: row.likes ?? 0,
    }));

    // Aplica filtros em memória (gênero e busca)
    const filtered = normalized.filter((p) => {
      const genreOk =
        selectedGenre === "all" || p.gameData?.genre === selectedGenre;
      const term = searchTerm?.trim().toLowerCase();
      if (!term) return genreOk;
      const inTitle = p.title?.toLowerCase().includes(term);
      const inDesc = p.description?.toLowerCase().includes(term);
      const inAuthor = p.author_name?.toLowerCase().includes(term);
      const inGame = p.gameData?.name?.toLowerCase().includes(term);
      return genreOk && (inTitle || inDesc || inAuthor || inGame);
    });

    // Busca contagem de comentários por publicação apenas dos filtrados e aplica no array
    try {
      const publicationIds = filtered
        .map((p) => (typeof p.id === "string" ? Number(p.id) : p.id))
        .filter((id) => Number.isFinite(id));

      if (publicationIds.length > 0) {
        const { data: commentsRows, error: commentsError } = await supabase
          .from("Comment")
          .select("publication")
          .in("publication", publicationIds as number[]);

        if (commentsError) {
          console.error("Error fetching comments count:", commentsError);
          setPosts(filtered);
          setLoading(false);
          return;
        }

        const countsMap = new Map<number, number>();
        (commentsRows as any[])?.forEach((row) => {
          const pubId = row.publication as number;
          countsMap.set(pubId, (countsMap.get(pubId) ?? 0) + 1);
        });

        const withCounts = filtered.map((p) => {
          const key = typeof p.id === "string" ? Number(p.id) : p.id;
          return { ...p, comments: countsMap.get(key) ?? 0 };
        });

        setPosts(withCounts as any);
      } else {
        setPosts(filtered);
      }
    } catch (e) {
      console.error("Unexpected error computing comments count:", e);
      setPosts(filtered);
    }
    setLoading(false);
  };

  const handleLike = async (postId: string, isCurrentlyLiked: boolean) => {
    const { data: currentPost, error: fetchError } = await supabase
      .from("Publication")
      .select("likes")
      .eq("id", postId)
      .single();

    if (fetchError) {
      console.error("Error fetching current likes:", fetchError);
      return;
    }
    const increment = isCurrentlyLiked ? -1 : 1;
    const newLikes = (currentPost.likes || 0) + increment;
    const { error } = await supabase
      .from("Publication")
      .update({ likes: newLikes })
      .eq("id", postId);

    if (error) {
      console.error("Error updating likes:", error);
    } else {
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, likes: newLikes } : post
        )
      );
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedGenre, searchTerm]);

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
      {posts.map((post, index) => (
        <div
          key={post.id}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <GamePost post={post} onLike={handleLike} />
        </div>
      ))}

      {posts.length === 0 && (
        <div className="col-span-full text-center py-12">
          <p className="text-muted-foreground text-lg">
            Nenhum post encontrado para os filtros selecionados.
          </p>
        </div>
      )}
    </div>
  );
}
