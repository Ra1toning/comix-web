export const COMIC_TYPES = ["Манга", "Манхва", "Манхуа", "Комик"] as const;
export type ComicType = (typeof COMIC_TYPES)[number];

export const COMIC_STATUSES = ["Идэвхтэй", "Дууссан", "Завсарласан"] as const;
export type ComicStatus = (typeof COMIC_STATUSES)[number];

const TYPE_TRANSLATIONS: Record<string, ComicType> = {
  comic: "Комик",
  manga: "Манга",
  manhua: "Манхуа",
  manhwa: "Манхва",
  "манга": "Манга",
  "манхва": "Манхва",
  "манхуа": "Манхуа",
  "комик": "Комик",
};

const STATUS_TRANSLATIONS: Record<string, ComicStatus> = {
  active: "Идэвхтэй",
  completed: "Дууссан",
  hiatus: "Завсарласан",
  ongoing: "Идэвхтэй",
  paused: "Завсарласан",
  "дууссан": "Дууссан",
  "завсарласан": "Завсарласан",
  "идэвхтэй": "Идэвхтэй",
  "идэхитэй": "Идэвхтэй",
};

export const GENRE_TRANSLATIONS: Record<string, string> = {
  action: "Тулаант",
  adventure: "Адал явдал",
  comedy: "Инээдмийн",
  dark: "Харанхуй",
  drama: "Драм",
  fantasy: "Фэнтези",
  historical: "Түүхэн",
  horror: "Аймшгийн",
  isekai: "Исекай",
  magic: "Ид шид",
  "martial arts": "Тулааны урлаг",
  mystery: "Нууцлаг",
  psychological: "Сэтгэл зүйн",
  reincarnation: "Дахин төрөлт",
  romance: "Романтик",
  "school life": "Сургуулийн амьдрал",
  "sci-fi": "Шинжлэх ухааны уран зөгнөл",
  "slice of life": "Өдөр тутмын амьдрал",
  sports: "Спорт",
  supernatural: "Ер бусын",
  system: "Систем",
  thriller: "Триллер",
};

export const DEFAULT_GENRES = [
  "Тулаант",
  "Адал явдал",
  "Инээдмийн",
  "Драм",
  "Фэнтези",
  "Түүхэн",
  "Аймшгийн",
  "Исекай",
  "Тулааны урлаг",
  "Нууцлаг",
  "Сэтгэл зүйн",
  "Романтик",
  "Сургуулийн амьдрал",
  "Шинжлэх ухааны уран зөгнөл",
  "Өдөр тутмын амьдрал",
  "Спорт",
  "Ер бусын",
  "Систем",
  "Триллер",
  "Ид шид",
  "Дахин төрөлт",
  "Харанхуй",
] as const;

const taxonomyKey = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

export const normalizeComicType = (value?: string | null): ComicType =>
  TYPE_TRANSLATIONS[taxonomyKey(value || "")] || "Манга";

export const normalizeComicStatus = (value?: string | null): ComicStatus =>
  STATUS_TRANSLATIONS[taxonomyKey(value || "")] || "Идэвхтэй";

export const normalizeGenreName = (value: string) => {
  const normalized = value.trim().replace(/\s+/g, " ");
  return GENRE_TRANSLATIONS[taxonomyKey(normalized)] || normalized;
};

export const taxonomyId = (value: string) =>
  normalizeGenreName(value)
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04ff]+/g, "-")
    .replace(/^-|-$/g, "");

