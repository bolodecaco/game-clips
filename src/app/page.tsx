"use client";

import { useAuth } from "@/components/auth-provider";
import { Navbar } from "@/components/navbar";
import { GameFeed } from "@/components/game-feed";
import { GameFilters } from "@/components/game-filters";
import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Genre } from "@/types/genre";
import { supabase } from "@/lib/supabaseClient";

export default function HomePage() {
  const { user, loading } = useAuth();
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [genres, setGenres] = useState<Genre[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!user && !loading) redirect("/auth/login");
    if (user) getGenres();
  }, [user, loading]);

  const getGenres = async () => {
    let { data: Genre, error } = await supabase.from("Genre").select("*");
    console.log("Aquiii", Genre);
    if (error)
      toast({
        title: "Erro",
        description: "Erro ao carregar gêneros. Tente novamente.",
        variant: "destructive",
      });
    setGenres(Genre || []);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 animate-fade-in">
            Descubra os Melhores Momentos do Gaming
          </h1>
          <p className="text-muted-foreground text-lg animate-fade-in">
            Compartilhe seus clipes épicos e descubra conteúdos incríveis da
            comunidade
          </p>
        </div>

        <GameFilters
          genres={genres}
          selectedGenre={selectedGenre}
          onGenreChange={setSelectedGenre}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        <GameFeed selectedGenre={selectedGenre} searchTerm={searchTerm} />
      </main>
    </div>
  );
}
