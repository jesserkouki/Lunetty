import type { OpticianStore } from "./marketplace-demo";

export type ShopService = {
  id: string;
  title: string;
  description: string;
  icon: "eye" | "lens" | "repair" | "progressive" | "children";
};

export type ShopDemoDetails = {
  foundedYear: number;
  email: string;
  gallery: string[];
  values: string[];
  featuredFrameIds: string[];
  services: ShopService[];
  openDays: number[];
  appointmentSlots: string[];
};

const COMMON_SERVICES: ShopService[] = [
  { id: "eye-exam", title: "Examen de la vue", description: "Un bilan visuel réalisé sur rendez-vous.", icon: "eye" },
  { id: "lens-fitting", title: "Adaptation de lentilles", description: "Conseils et accompagnement pour vos lentilles.", icon: "lens" },
  { id: "adjustment", title: "Réparation et ajustage", description: "Réglage et entretien de votre monture.", icon: "repair" },
  { id: "progressive-lenses", title: "Verres progressifs", description: "Des solutions adaptées à votre confort visuel.", icon: "progressive" },
  { id: "children", title: "Optique pour enfants", description: "Une sélection et un ajustage dédiés aux plus jeunes.", icon: "children" },
];

export const SHOP_DEMO_DETAILS: Record<string, ShopDemoDetails> = {
  "atelier-vision-tunis": {
    foundedYear: 2016,
    email: "bonjour@atelier-vision.example",
    gallery: ["/images/boutiques.svg", "/images/craft-1.svg", "/images/craft-2.svg"],
    values: ["Créateurs indépendants", "Conseil personnalisé", "Ajustage en boutique"],
    featuredFrameIds: ["aurore-01", "sillage-05"],
    services: COMMON_SERVICES.filter((service) => service.id !== "children"),
    openDays: [1, 2, 3, 4, 5, 6],
    appointmentSlots: ["10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"],
  },
  "maison-du-regard-sousse": {
    foundedYear: 2012,
    email: "contact@maison-du-regard.example",
    gallery: ["/images/boutiques.svg", "/images/craft-2.svg", "/images/craft-3.svg"],
    values: ["Expertise optique", "Sélection contemporaine", "Service de proximité"],
    featuredFrameIds: ["meridien-02", "horizon-06"],
    services: COMMON_SERVICES.filter((service) => service.id !== "lens-fitting"),
    openDays: [1, 2, 3, 4, 5, 6],
    appointmentSlots: ["09:30", "10:30", "11:30", "14:00", "15:00", "16:00"],
  },
  "optique-carre-sfax": {
    foundedYear: 2018,
    email: "bonjour@optique-carre.example",
    gallery: ["/images/boutiques.svg", "/images/craft-1.svg", "/images/craft-3.svg"],
    values: ["Écoute attentive", "Montures de caractère", "Ajustage précis"],
    featuredFrameIds: ["ecaille-03", "atelier-07"],
    services: COMMON_SERVICES.filter((service) => service.id !== "children" && service.id !== "progressive-lenses"),
    openDays: [1, 2, 3, 4, 5, 6],
    appointmentSlots: ["09:00", "10:00", "11:00", "13:30", "14:30", "15:30"],
  },
  "lunetterie-du-cap-nabeul": {
    foundedYear: 2020,
    email: "bonjour@lunetterie-du-cap.example",
    gallery: ["/images/boutiques.svg", "/images/craft-2.svg", "/images/craft-3.svg"],
    values: ["Maison indépendante", "Accueil convivial", "Conseils sur mesure"],
    featuredFrameIds: ["ligne-04", "nuance-08"],
    services: COMMON_SERVICES.filter((service) => service.id !== "lens-fitting"),
    openDays: [1, 2, 3, 4, 5, 6],
    appointmentSlots: ["09:30", "10:30", "11:30", "14:00", "15:00", "16:00"],
  },
};

export function getShopDemoDetails(store: OpticianStore): ShopDemoDetails {
  return SHOP_DEMO_DETAILS[store.id] ??
    SHOP_DEMO_DETAILS[store.slug] ?? {
      foundedYear: 2020,
      email: "",
      gallery: [store.cover],
      values: ["Accueil personnalisé", "Conseil optique"],
      featuredFrameIds: [],
      services: [],
      openDays: [1, 2, 3, 4, 5, 6],
      appointmentSlots: ["10:00", "11:00", "14:00", "15:00"],
    };
}

export function getDemoAppointmentDates(store: OpticianStore, startDate: Date, count = 10) {
  const { openDays } = getShopDemoDetails(store);
  const dates: string[] = [];
  const date = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  for (let offset = 0; offset < 30 && dates.length < count; offset += 1) {
    if (openDays.includes(date.getDay())) {
      dates.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`);
    }
    date.setDate(date.getDate() + 1);
  }
  return dates;
}

export function getDemoAppointmentSlots(store: OpticianStore, date: string) {
  const weekday = new Date(`${date}T12:00:00`).getDay();
  const details = getShopDemoDetails(store);
  return details.openDays.includes(weekday) ? details.appointmentSlots : [];
}
