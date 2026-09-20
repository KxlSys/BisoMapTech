import { ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFilterStore, type SortBy } from "@/store/filter-store";

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "default", label: "Derniers inscrits" },
  { value: "recent", label: "Actifs récemment" },
  { value: "available_first", label: "Disponibles d'abord" },
];

/** Le tri est exécuté par la base, il porte donc sur tous les résultats. */
export function SortSelect() {
  const { sortBy, setSortBy } = useFilterStore();

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
        <SelectTrigger
          aria-label="Trier les contributeurs"
          className="h-8 w-[170px] border-white/10 bg-white/5 text-xs"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value} className="text-xs">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
