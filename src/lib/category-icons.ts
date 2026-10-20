import {
  Handshake,
  Landmark,
  LineChart,
  Megaphone,
  Swords,
  type LucideIcon,
} from "lucide-react";
import type { EventCategory } from "@/lib/types";

export const CATEGORY_ICON: Record<EventCategory, LucideIcon> = {
  unrest: Megaphone,
  conflict: Swords,
  economics: LineChart,
  geopolitics: Handshake,
  india: Landmark,
};
