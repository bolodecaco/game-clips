import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Genre } from "@/types/genre";
import { Search } from "lucide-react";

interface GameFiltersProps {
  genres: Genre[];
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function GameFilters({
  genres,
  selectedGenre,
  onGenreChange,
  searchTerm,
  onSearchChange,
}: GameFiltersProps) {
  return (
    <div className="mb-8 space-y-4 animate-slide-up">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar jogos, clipes ou usuários..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {genres.map((genre) => (
          <Button
            key={genre.id}
            variant={selectedGenre === genre.id ? "default" : "outline"}
            size="sm"
            onClick={() => onGenreChange(genre.id)}
            className="transition-all duration-200 hover:scale-105"
          >
            {genre.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
