"use client";

import { useAuth } from "@/components/auth-provider";
import { Navbar } from "@/components/navbar";
import { GameFeed } from "@/components/game-feed";
import { GameFilters } from "@/components/game-filters";
import { useState } from "react";
import { redirect } from "next/navigation";

export default function HomePage() {
  const { user, loading } = useAuth();
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

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
