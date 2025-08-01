"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, ImageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { set } from "date-fns";
import { Genre } from "@/types/genre";

const games = [
  "Counter-Strike 2",
  "Valorant",
  "League of Legends",
  "Cyberpunk 2077",
  "Elden Ring",
  "God of War",
  "The Witcher 3",
  "Minecraft",
  "Fortnite",
  "Apex Legends",
];

export default function UploadPage() {
  const { user, loading } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [game, setGame] = useState("");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [genre, setGenre] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    getGenres();
  }, []);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem ou vídeo.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "O arquivo deve ter no máximo 50MB.",
        variant: "destructive",
      });
      return;
    }

    setMediaFile(file);
    setMediaType(file.type.startsWith("image/") ? "image" : "video");

    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !game || !genre || !mediaFile) {
      toast({
        title: "Erro",
        description:
          "Por favor, preencha todos os campos e selecione um arquivo.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: "Sucesso!",
        description: "Seu conteúdo foi publicado com sucesso.",
      });

      router.push("/");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao publicar conteúdo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getGenres = async () => {
    let { data: Genre, error } = await supabase.from("Genre").select("*");
    if (error)
      toast({
        title: "Erro",
        description: "Erro ao carregar gêneros. Tente novamente.",
        variant: "destructive",
      });
    setGenres(Genre || []);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl">Compartilhar Conteúdo</CardTitle>
            <CardDescription>
              Compartilhe seus melhores momentos de gaming com a comunidade
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Upload de mídia */}
              <div className="space-y-2">
                <Label>Mídia</Label>
                {!mediaPreview ? (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="media-upload"
                    />
                    <label htmlFor="media-upload" className="cursor-pointer">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">
                        Clique para fazer upload
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Suporte para imagens e vídeos (máx. 50MB)
                      </p>
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    {mediaType === "image" ? (
                      <ImageIcon
                        src={mediaPreview}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    ) : (
                      <video
                        src={mediaPreview}
                        controls
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removeMedia}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Título */}
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  placeholder="Dê um título épico para seu conteúdo..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Conte a história por trás deste momento..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              {/* Jogo */}
              <div className="space-y-2">
                <Label htmlFor="game">Jogo</Label>
                <Select value={game} onValueChange={setGame} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o jogo" />
                  </SelectTrigger>
                  <SelectContent>
                    {games.map((gameName) => (
                      <SelectItem key={gameName} value={gameName}>
                        {gameName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Gênero */}
              <div className="space-y-2">
                <Label htmlFor="genre">Gênero</Label>
                <Select value={genre} onValueChange={setGenre} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o gênero" />
                  </SelectTrigger>
                  <SelectContent>
                    {genres.map((genreItem) => (
                      <SelectItem
                        key={genreItem.id}
                        value={String(genreItem.id)}
                      >
                        {genreItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading ? "Publicando..." : "Publicar Conteúdo"}
              </Button>
            </CardContent>
          </form>
        </Card>
      </main>
    </div>
  );
}
