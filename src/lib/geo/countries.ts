// A deliberately-scoped gazetteer, not an exhaustive ISO-3166 list — covers
// the countries most relevant to this dashboard's coverage (major powers,
// India + its listed neighbourhood, the EU, Middle East, and the largest
// states per other continent). Used by detectCountry() (lib/geo/detect.ts)
// to place non-geocoded news items (Guardian/GNews/NewsData.io/RSS) on the
// globe via a simple name match — GDELT items already carry real
// coordinates and skip this entirely. Extend this list before adding a new
// RSS/API source whose coverage isn't represented here yet.
export interface CountryInfo {
  name: string;
  aliases?: string[];
  iso2: string;
  lat: number;
  lng: number;
  continent: string;
}

export const COUNTRIES: CountryInfo[] = [
  // --- South Asia (priority region) ---
  { name: "India", iso2: "IN", lat: 28.6139, lng: 77.209, continent: "Asia" },
  { name: "Pakistan", iso2: "PK", lat: 33.6844, lng: 73.0479, continent: "Asia" },
  { name: "Bangladesh", iso2: "BD", lat: 23.8103, lng: 90.4125, continent: "Asia" },
  { name: "Sri Lanka", iso2: "LK", lat: 6.9271, lng: 79.8612, continent: "Asia" },
  { name: "Nepal", iso2: "NP", lat: 27.7172, lng: 85.324, continent: "Asia" },
  { name: "Myanmar", aliases: ["Burma"], iso2: "MM", lat: 16.8661, lng: 96.1951, continent: "Asia" },
  { name: "Afghanistan", iso2: "AF", lat: 34.5553, lng: 69.2075, continent: "Asia" },
  { name: "Maldives", iso2: "MV", lat: 4.1755, lng: 73.5093, continent: "Asia" },
  { name: "Bhutan", iso2: "BT", lat: 27.4712, lng: 89.6339, continent: "Asia" },

  // --- East / Southeast Asia ---
  { name: "China", iso2: "CN", lat: 39.9042, lng: 116.4074, continent: "Asia" },
  { name: "Japan", iso2: "JP", lat: 35.6762, lng: 139.6503, continent: "Asia" },
  { name: "South Korea", aliases: ["Korea"], iso2: "KR", lat: 37.5665, lng: 126.978, continent: "Asia" },
  { name: "North Korea", iso2: "KP", lat: 39.0392, lng: 125.7625, continent: "Asia" },
  { name: "Taiwan", iso2: "TW", lat: 25.033, lng: 121.5654, continent: "Asia" },
  { name: "Indonesia", iso2: "ID", lat: -6.2088, lng: 106.8456, continent: "Asia" },
  { name: "Thailand", iso2: "TH", lat: 13.7563, lng: 100.5018, continent: "Asia" },
  { name: "Vietnam", iso2: "VN", lat: 21.0278, lng: 105.8342, continent: "Asia" },
  { name: "Philippines", iso2: "PH", lat: 14.5995, lng: 120.9842, continent: "Asia" },
  { name: "Malaysia", iso2: "MY", lat: 3.139, lng: 101.6869, continent: "Asia" },
  { name: "Singapore", iso2: "SG", lat: 1.3521, lng: 103.8198, continent: "Asia" },

  // --- Middle East ---
  { name: "Israel", iso2: "IL", lat: 31.7683, lng: 35.2137, continent: "Asia" },
  { name: "Palestine", aliases: ["Gaza", "West Bank"], iso2: "PS", lat: 31.9522, lng: 35.2332, continent: "Asia" },
  { name: "Iran", iso2: "IR", lat: 35.6892, lng: 51.389, continent: "Asia" },
  { name: "Iraq", iso2: "IQ", lat: 33.3152, lng: 44.3661, continent: "Asia" },
  { name: "Saudi Arabia", iso2: "SA", lat: 24.7136, lng: 46.6753, continent: "Asia" },
  { name: "UAE", aliases: ["United Arab Emirates"], iso2: "AE", lat: 25.2048, lng: 55.2708, continent: "Asia" },
  { name: "Qatar", iso2: "QA", lat: 25.2854, lng: 51.531, continent: "Asia" },
  { name: "Turkey", aliases: ["Türkiye"], iso2: "TR", lat: 39.9334, lng: 32.8597, continent: "Asia" },
  { name: "Syria", iso2: "SY", lat: 33.5138, lng: 36.2765, continent: "Asia" },
  { name: "Lebanon", iso2: "LB", lat: 33.8938, lng: 35.5018, continent: "Asia" },
  { name: "Yemen", iso2: "YE", lat: 15.3694, lng: 44.191, continent: "Asia" },
  { name: "Jordan", iso2: "JO", lat: 31.9454, lng: 35.9284, continent: "Asia" },

  // --- Europe ---
  { name: "United Kingdom", aliases: ["UK", "Britain"], iso2: "GB", lat: 51.5072, lng: -0.1276, continent: "Europe" },
  { name: "France", iso2: "FR", lat: 48.8566, lng: 2.3522, continent: "Europe" },
  { name: "Germany", iso2: "DE", lat: 52.52, lng: 13.405, continent: "Europe" },
  { name: "Italy", iso2: "IT", lat: 41.9028, lng: 12.4964, continent: "Europe" },
  { name: "Spain", iso2: "ES", lat: 40.4168, lng: -3.7038, continent: "Europe" },
  { name: "Ukraine", iso2: "UA", lat: 50.4501, lng: 30.5234, continent: "Europe" },
  { name: "Russia", iso2: "RU", lat: 55.7558, lng: 37.6173, continent: "Europe" },
  { name: "Poland", iso2: "PL", lat: 52.2297, lng: 21.0122, continent: "Europe" },
  { name: "Netherlands", iso2: "NL", lat: 52.3676, lng: 4.9041, continent: "Europe" },
  { name: "Sweden", iso2: "SE", lat: 59.3293, lng: 18.0686, continent: "Europe" },
  { name: "Switzerland", iso2: "CH", lat: 46.948, lng: 7.4474, continent: "Europe" },
  { name: "Belgium", iso2: "BE", lat: 50.8503, lng: 4.3517, continent: "Europe" },
  { name: "Greece", iso2: "GR", lat: 37.9838, lng: 23.7275, continent: "Europe" },

  // --- Africa ---
  { name: "Egypt", iso2: "EG", lat: 30.0444, lng: 31.2357, continent: "Africa" },
  { name: "Nigeria", iso2: "NG", lat: 9.0765, lng: 7.3986, continent: "Africa" },
  { name: "South Africa", iso2: "ZA", lat: -25.7479, lng: 28.2293, continent: "Africa" },
  { name: "Kenya", iso2: "KE", lat: -1.2921, lng: 36.8219, continent: "Africa" },
  { name: "Ethiopia", iso2: "ET", lat: 9.025, lng: 38.7469, continent: "Africa" },
  { name: "Sudan", iso2: "SD", lat: 15.5007, lng: 32.5599, continent: "Africa" },
  { name: "Burkina Faso", iso2: "BF", lat: 12.3714, lng: -1.5197, continent: "Africa" },
  { name: "Mali", iso2: "ML", lat: 12.6392, lng: -8.0029, continent: "Africa" },
  { name: "Algeria", iso2: "DZ", lat: 36.7538, lng: 3.0588, continent: "Africa" },
  { name: "Morocco", iso2: "MA", lat: 33.9716, lng: -6.8498, continent: "Africa" },

  // --- North America ---
  { name: "United States", aliases: ["USA", "US", "America"], iso2: "US", lat: 38.9072, lng: -77.0369, continent: "North America" },
  { name: "Canada", iso2: "CA", lat: 45.4215, lng: -75.6972, continent: "North America" },
  { name: "Mexico", iso2: "MX", lat: 19.4326, lng: -99.1332, continent: "North America" },

  // --- South America ---
  { name: "Brazil", iso2: "BR", lat: -15.7939, lng: -47.8828, continent: "South America" },
  { name: "Argentina", iso2: "AR", lat: -34.6037, lng: -58.3816, continent: "South America" },
  { name: "Chile", iso2: "CL", lat: -33.4489, lng: -70.6693, continent: "South America" },
  { name: "Colombia", iso2: "CO", lat: 4.711, lng: -74.0721, continent: "South America" },
  { name: "Venezuela", iso2: "VE", lat: 10.4806, lng: -66.9036, continent: "South America" },
  { name: "Peru", iso2: "PE", lat: -12.0464, lng: -77.0428, continent: "South America" },

  // --- Oceania ---
  { name: "Australia", iso2: "AU", lat: -35.2809, lng: 149.13, continent: "Oceania" },
  { name: "New Zealand", iso2: "NZ", lat: -41.2865, lng: 174.7762, continent: "Oceania" },
];
