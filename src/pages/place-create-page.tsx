import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, MapPin, Save } from "lucide-react";
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
  description: z.string().max(500, "La description ne peut pas dépasser 500 caractères").optional().default(""),
  city: z.string().min(1, "Choisissez une ville"),
  address: z.string().max(160, "L'adresse est trop longue").optional().default(""),
  phone: z.string().max(30).optional().default(""),
  whatsapp: z.string().max(30).optional().default(""),
  website: z
    .string()
    .optional()
    .default("")
    .refine((v) => v === "" || /^https?:\/\//i.test(v), "Le site doit commencer par http:// ou https://"),
  latitude: z
    .preprocess((v) => (v === "" || v === undefined || v === null ? undefined : Number(v)), z.number().min(-90).max(90).optional()),
  longitude: z
    .preprocess((v) => (v === "" || v === undefined || v === null ? undefined : Number(v)), z.number().min(-180).max(180).optional()),
});

type PlaceFormData = z.infer<typeof placeSchema>;

export function PlaceCreatePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PlaceFormData>({
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
      latitude: undefined,
      longitude: undefined,
    },
  });

  const description = watch("description");

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  async function onSubmit(data: PlaceFormData) {
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

      toast.success("Lieu proposé. Il sera validé avant d’apparaître sur la carte.");
      navigate("/lieux");
    } catch {
      toast.error("Erreur lors de la proposition du lieu");
    }
  }

  if (!user) return null;

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
                        setValue("latitude", coords.latitude);
                        setValue("longitude", coords.longitude);
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
                  <Input {...field} placeholder="Ex: Avenue…, quartier…" className="bg-white/5 border-white/10" />
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
                  <Textarea {...field} rows={3} placeholder="Ce qu’on y trouve, horaires, etc." className="bg-white/5 border-white/10 resize-none" />
                  <div className="flex items-center justify-between">
                    {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
                    <p className="ml-auto text-xs text-muted-foreground/60">
                      {description?.length || 0}/500
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
                  <Input {...field} placeholder="Ex: +242..." className="bg-white/5 border-white/10" />
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
          <p className="mb-4 text-sm font-semibold text-foreground">Position (optionnel)</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              name="latitude"
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Latitude</Label>
                  <Input
                    value={field.value === undefined ? "" : String(field.value)}
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
                    value={field.value === undefined ? "" : String(field.value)}
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

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full gap-2 bg-tertiary text-background hover:bg-tertiary/90 font-semibold"
        >
          <Save className="h-4 w-4" />
          {isSubmitting ? "Envoi..." : "Envoyer pour validation"}
        </Button>
      </form>
    </div>
  );
}
