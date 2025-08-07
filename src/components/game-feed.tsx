"use client";

import { useEffect, useState } from "react";
import { GamePost } from "@/components/game-post";
import { supabase } from "@/lib/supabaseClient";
import { Publication } from "@/types/publication";

interface GameFeedProps {
  selectedGenre: string;
  searchTerm: string;
}

export function GameFeed({ selectedGenre, searchTerm }: GameFeedProps) {
  const [posts, setPosts] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    const result = await supabase.from("Publication").select(`
        *,
        gameData:Game (*)
      `);
    if (result.error) {
      console.error("Error fetching posts:", result.error);
      return;
    }
    setPosts(result.data);
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

  useEffect(() => {
    fetchData();
  }, []);

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
