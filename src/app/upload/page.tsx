"use client";

import { useAuth } from "@/components/auth-provider";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { Game } from "@/types/game";
import { Genre } from "@/types/genre";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X } from "lucide-react";
import { redirect, useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Gera um caminho seguro para o arquivo no Storage, removendo acentos e caracteres inválidos
function generateSafeFilePath(file: File, userId?: string) {
  const originalName = file.name;
  const lastDotIndex = originalName.lastIndexOf(".");
  const baseName =
    lastDotIndex === -1 ? originalName : originalName.slice(0, lastDotIndex);
  const extension =
    lastDotIndex === -1 ? "" : originalName.slice(lastDotIndex + 1);

  // Remove acentos e normaliza para ASCII
  const asciiBase = baseName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Substitui espaços por hífens e remove caracteres inválidos
  const cleanedBase = asciiBase
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "");

  // Garante que não fique vazio
  const safeBase = cleanedBase.length > 0 ? cleanedBase : "arquivo";

  // Limita tamanho do nome base
  const truncatedBase = safeBase.slice(0, 80);

  const safeExt = extension
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "");

  const timestamp = Date.now();
  const owner = userId ? String(userId) : "anon";
  const fileName = safeExt
    ? `${owner}-${timestamp}-${truncatedBase}.${safeExt}`
    : `${owner}-${timestamp}-${truncatedBase}`;
  return `uploads/${fileName}`;
}

// Extrai um thumbnail (frame) de um arquivo de vídeo como imagem JPEG
async function extractVideoThumbnail(
  file: File,
  options?: { seekTimeSeconds?: number; quality?: number }
): Promise<File> {
  const seekTimeSeconds = options?.seekTimeSeconds ?? 1;
  const quality = options?.quality ?? 0.8;

  const objectUrl = URL.createObjectURL(file);
  try {
    const videoEl = document.createElement("video");
    videoEl.src = objectUrl;
    videoEl.crossOrigin = "anonymous";
    videoEl.muted = true;

    await new Promise<void>((resolve, reject) => {
      videoEl.addEventListener("loadedmetadata", () => {
        try {
          const duration = Number.isFinite(videoEl.duration)
            ? videoEl.duration
            : 0;
          // Busca em 1s ou no meio do vídeo, o que fizer sentido
          const targetTime =
            isNaN(duration) || duration <= 0
              ? seekTimeSeconds
              : Math.min(
                  Math.max(0.1, seekTimeSeconds),
                  Math.max(0.1, duration / 2)
                );
          const onSeeked = () => {
            videoEl.removeEventListener("seeked", onSeeked);
            resolve();
          };
          videoEl.addEventListener("seeked", onSeeked);
          videoEl.currentTime = targetTime;
        } catch (err) {
          reject(err);
        }
      });
      videoEl.addEventListener("error", () =>
        reject(new Error("Falha ao carregar vídeo para thumbnail"))
      );
    });

    const width = videoEl.videoWidth || 1280;
    const height = videoEl.videoHeight || 720;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context não disponível");
    ctx.drawImage(videoEl, 0, 0, width, height);

    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Falha ao gerar thumbnail"))),
        "image/jpeg",
        quality
      );
    });

    // Define um nome que preserve o base name e inclua o sufixo -thumb
    const originalName = file.name;
    const lastDotIndex = originalName.lastIndexOf(".");
    const baseName =
      lastDotIndex === -1 ? originalName : originalName.slice(0, lastDotIndex);
    const thumbName = `${baseName}-thumb.jpg`;

    return new File([blob], thumbName, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

const uploadSchema = z.object({
  title: z.string().min(1, "Título obrigatório"),
  description: z.string().min(1, "Descrição obrigatória"),
  game: z.string().min(1, "Selecione um jogo"),
  genre: z.string().min(1, "Selecione um gênero"),
});

type UploadFormData = z.infer<typeof uploadSchema>;

export default function UploadPage() {
  const { user, loading } = useAuth();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
  });

  useEffect(() => {
    if (!user) redirect("/auth/login");
    getGenres();
    getGames();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
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

  const uploadFileToSupabase = async (file: File) => {
    const filePath = generateSafeFilePath(
      file,
      user?.id as unknown as string | undefined
    );
    const { error } = await supabase.storage
      .from("gamepedia")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });
    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer upload do arquivo. Tente novamente.",
        variant: "destructive",
      });
      throw error;
    }
    const { data: media } = supabase.storage
      .from("gamepedia")
      .getPublicUrl(filePath);
    return media.publicUrl;
  };

  const onSubmit = async (data: UploadFormData) => {
    if (!mediaFile) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo de mídia.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const mediaUrl = await uploadFileToSupabase(mediaFile);
    let thumbnailUrl = mediaUrl;
    if (mediaType === "video") {
      try {
        const thumbFile = await extractVideoThumbnail(mediaFile, {
          seekTimeSeconds: 1,
        });
        thumbnailUrl = await uploadFileToSupabase(thumbFile);
      } catch (thumbErr) {
        // Mantém thumbnail como mediaUrl apenas como último recurso para não quebrar
        thumbnailUrl = "/placeholder.svg";
      }
    }

    try {
      await supabase.from("Publication").insert({
        title: data.title,
        description: data.description,
        mediaUrl: mediaUrl,
        game: data.game,
        thumbnail: thumbnailUrl,
        author_name: user?.username,
        author_avatar: user?.avatar,
        media_type: mediaType,
      });
      toast({
        title: "Sucesso!",
        description: "Seu conteúdo foi publicado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao publicar conteúdo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      reset();
      removeMedia();
      router.push("/");
    }
  };

  const getGenres = async () => {
    let { data: genres, error } = await supabase.from("Genre").select("*");
    if (error)
      toast({
        title: "Erro",
        description: "Erro ao carregar gêneros. Tente novamente.",
        variant: "destructive",
      });
    setGenres(genres || []);
  };

  const getGames = async () => {
    let { data: games, error } = await supabase.from("Game").select("*");
    if (error)
      toast({
        title: "Erro",
        description: "Erro ao carregar jogos. Tente novamente.",
        variant: "destructive",
      });
    setGames(games || []);
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

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
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
                      <img
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
                {!mediaFile && (
                  <span className="text-sm text-destructive">
                    Por favor, selecione um arquivo de mídia.
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  placeholder="Dê um título épico para seu conteúdo..."
                  {...register("title")}
                />
                {errors.title && (
                  <span className="text-sm text-destructive">
                    {errors.title.message}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Conte a história por trás deste momento..."
                  rows={4}
                  {...register("description")}
                />
                {errors.description && (
                  <span className="text-sm text-destructive">
                    {errors.description.message}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="game">Jogo</Label>
                <Select
                  value={undefined}
                  onValueChange={(value) =>
                    setValue("game", value, { shouldValidate: true })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o jogo" />
                  </SelectTrigger>
                  <SelectContent>
                    {games.map((gameItem) => (
                      <SelectItem key={gameItem.id} value={String(gameItem.id)}>
                        {gameItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.game && (
                  <span className="text-sm text-destructive">
                    {errors.game.message}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="genre">Gênero</Label>
                <Select
                  value={undefined}
                  onValueChange={(value) =>
                    setValue("genre", value, { shouldValidate: true })
                  }
                  required
                >
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
                {errors.genre && (
                  <span className="text-sm text-destructive">
                    {errors.genre.message}
                  </span>
                )}
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
