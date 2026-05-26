import { useNavigate, Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, MapPin, Save, LogIn } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/auth-store";
import { createPlace } from "@/lib/place-service";
import { PLACE_CATEGORIES } from "@/lib/constants";
import { CONGO_CITIES, getCityCoordinates } from "@/lib/cities";
import { toast } from "sonner";

const placeSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(80),
  category: z.string().min(1, "Choisissez une catégorie"),
  description: z.string().max(500, "La description ne peut pas dépasser 500 caractères").optional(),
  city: z.string().min(1, "Choisissez une ville"),
  address: z.string().max(160, "L'adresse est trop longue").optional(),
  phone: z.string().max(30).optional(),
  whatsapp: z.string().max(30).optional(),
  website: z
    .string()
    .optional()
    .refine((v) => !v || /^https?:\/\//i.test(v), "Le site doit commencer par http:// ou https://"),
  latitude: z.union([z.string(), z.number(), z.undefined(), z.null()]).optional().transform(v => {
    if (v === "" || v === undefined || v === null) return undefined;
    return Number(v);
  }).pipe(z.number().min(-90).max(90).optional()),
  longitude: z.union([z.string(), z.number(), z.undefined(), z.null()]).optional().transform(v => {
    if (v === "" || v === undefined || v === null) return undefined;
    return Number(v);
  }).pipe(z.number().min(-180).max(180).optional()),
});

type PlaceFormInput = z.input<typeof placeSchema>;
type PlaceFormOutput = z.output<typeof placeSchema>;

export function PlaceCreatePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PlaceFormInput, any, PlaceFormOutput>({
    resolver: zodResolver(placeSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      city: "",
      address: "",
      phone: "",
      whatsapp: "",
      website: "",
      latitude: "",
      longitude: "",
    },
  });

  const description = watch("description");

  // Synchronous auth gate — no useEffect flash
  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-6 md:pb-8">
        <Link to="/lieux" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
        <div className="mt-12 flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <MapPin className="h-7 w-7 text-tertiary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Proposer un lieu</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Connectez-vous pour soumettre un espace tech, coworking, incubateur ou autre lieu utile à la communauté.
          </p>
          <Link to="/login">
            <Button className="gap-2 bg-tertiary text-background hover:bg-tertiary/90 font-semibold">
              <LogIn className="h-4 w-4" />
              Se connecter
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  async function onSubmit(data: PlaceFormOutput) {
    if (!user) return;
    try {
      const coords = getCityCoordinates(data.city);
      const latitude = data.latitude ?? coords?.latitude ?? 0;
      const longitude = data.longitude ?? coords?.longitude ?? 0;

      await createPlace({
        name: data.name,
        category: data.category,
        description: data.description ?? "",
        city: data.city,
        address: data.address ?? "",
        latitude,
        longitude,
        phone: data.phone ?? "",
        whatsapp: data.whatsapp ?? "",
        website: data.website ?? "",
        created_by: user.id,
      });

      toast.success("Lieu proposé ! Il sera visible après validation.");
      navigate("/lieux");
    } catch {
      toast.error("Erreur lors de la proposition du lieu");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6 md:pb-8">
      <Link to="/lieux" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Proposer un lieu
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Les lieux proposés sont vérifiés avant publication.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <section className="glass-panel rounded-2xl border border-white/10 p-5">
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-tertiary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Informations</h2>
          </div>

          <div className="space-y-4">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Nom</Label>
                  <Input {...field} placeholder="Nom du lieu" className="bg-white/5 border-white/10" />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Ville</Label>
                    <Select value={field.value} onValueChange={(v) => {
                      field.onChange(v);
                      const coords = getCityCoordinates(v);
                      if (coords) {
                        setValue("latitude", String(coords.latitude));
                        setValue("longitude", String(coords.longitude));
                      }
                    }}>
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue placeholder="Choisir une ville" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONGO_CITIES.map((c) => (
                          <SelectItem key={c.name} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
                  </div>
                )}
              />

              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Catégorie</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue placeholder="Choisir" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLACE_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
                  </div>
                )}
              />
            </div>

            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Adresse / repère</Label>
                  <Input {...field} placeholder="Ex: Avenue…, quartier… ou repère visible" className="bg-white/5 border-white/10" />
                  <p className="text-[11px] text-muted-foreground/60">
                    À Brazzaville, décrivez un repère visible (ex : « En face du marché Total Poto-Poto »)
                  </p>
                  {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
                </div>
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Description (optionnel)</Label>
                  <Textarea {...field} rows={3} placeholder="Ce qu'on y trouve, horaires, ambiance…" className="bg-white/5 border-white/10 resize-none" />
                  <div className="flex items-center justify-between">
                    {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
                    <p className="ml-auto text-xs text-muted-foreground/60">
                      {(description ?? "").length}/500
                    </p>
                  </div>
                </div>
              )}
            />
          </div>
        </section>

        <section className="glass-panel rounded-2xl border border-white/10 p-5">
          <p className="mb-4 text-sm font-semibold text-foreground">Contact (optionnel)</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Téléphone</Label>
                  <Input {...field} placeholder="Ex: +242..." className="bg-white/5 border-white/10" />
                </div>
              )}
            />
            <Controller
              name="whatsapp"
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">WhatsApp</Label>
                  <Input {...field} placeholder="Ex: +242... (si différent)" className="bg-white/5 border-white/10" />
                </div>
              )}
            />
            <Controller
              name="website"
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Site web</Label>
                  <Input {...field} placeholder="https://..." className="bg-white/5 border-white/10" />
                  {errors.website && <p className="text-xs text-destructive">{errors.website.message}</p>}
                </div>
              )}
            />
          </div>
        </section>

        <section className="glass-panel rounded-2xl border border-white/10 p-5">
          <div className="mb-1">
            <p className="text-sm font-semibold text-foreground">Position précise (optionnel)</p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              Laissez vide pour utiliser automatiquement les coordonnées de la ville sélectionnée.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 mt-4">
            <Controller
              name="latitude"
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Latitude</Label>
                  <Input
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Ex: -4.27"
                    className="bg-white/5 border-white/10"
                  />
                  {errors.latitude && <p className="text-xs text-destructive">{errors.latitude.message}</p>}
                </div>
              )}
            />
            <Controller
              name="longitude"
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Longitude</Label>
                  <Input
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Ex: 15.28"
                    className="bg-white/5 border-white/10"
                  />
                  {errors.longitude && <p className="text-xs text-destructive">{errors.longitude.message}</p>}
                </div>
              )}
            />
          </div>
        </section>

        <div className="flex gap-3">
          <Link to="/lieux" className="flex-shrink-0">
            <Button type="button" variant="ghost" className="border border-white/10 bg-white/5 hover:bg-white/8">
              Annuler
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 gap-2 bg-tertiary text-background hover:bg-tertiary/90 font-semibold"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? "Envoi en cours…" : "Envoyer pour validation"}
          </Button>
        </div>
      </form>
    </div>
  );
}
