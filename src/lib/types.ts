export type Category = "tarjima" | "serial" | "multfilm";

export interface Episode {
  id: string;
  season: number;
  episode: number;
  title: string;
  duration: string;
  videoUrl: string;
}

export interface Movie {
  id: string;
  slug: string;
  title: string;
  originalTitle: string;
  category: Category;
  genres: string[];
  year: number;
  country: string;
  duration: string;
  quality: string;
  ageRating: string;
  imdb: number;
  kp: number;
  views: number;
  isPremiere: boolean;
  isFeatured: boolean;
  director: string;
  cast: string[];
  description: string;
  poster: string;
  backdrop: string;
  videoUrl: string;
  trailerUrl: string;
  episodes: Episode[];
  createdAt: string;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  tarjima: "Tarjima kinolar",
  serial: "Seriallar",
  multfilm: "Multfilmlar",
};

export const ALL_GENRES = [
  "Jangari",
  "Sarguzasht",
  "Fantastika",
  "Drama",
  "Komediya",
  "Triller",
  "Qo'rqinchli",
  "Melodrama",
  "Detektiv",
  "Kriminal",
  "Fentezi",
  "Oilaviy",
  "Tarixiy",
  "Hujjatli",
];

export const ALL_COUNTRIES = [
  "AQSH",
  "Buyuk Britaniya",
  "Niderlandiya",
  "Fransiya",
  "Turkiya",
  "Janubiy Koreya",
  "Yaponiya",
  "Hindiston",
  "Rossiya",
  "O'zbekiston",
  "Germaniya",
  "Ispaniya",
];
