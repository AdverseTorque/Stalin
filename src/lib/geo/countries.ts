// A deliberately-scoped gazetteer, not an exhaustive ISO-3166 list — covers
// the countries most relevant to this dashboard's coverage (major powers,
// India + its listed neighbourhood, the EU, Middle East, and the largest
// states per other continent). Used by detectCountry() (lib/geo/detect.ts)
// to place non-geocoded news items (Guardian/GNews/NewsData.io/RSS) on the
// globe via a simple name match, AND by the GDELT adapter (via `fips`) to
// resolve a proper country/continent from GDELT's ActionGeo_CountryCode.
// Extend this list before adding a new RSS/API source whose coverage isn't
// represented here yet.
//
// `fips` is the FIPS 10-4 two-letter code GDELT actually uses for
// ActionGeo_CountryCode — NOT the same as ISO 3166-1 alpha-2 for many
// countries (verified live, e.g. Germany=GM not DE, Austria=AU which
// collides with ISO's code for Australia, South Korea=KS not KR). Values
// below were checked against Wikipedia's FIPS country code list; a few
// lower-priority entries (Maldives, Bhutan, Palestine) are best-effort since
// they weren't in that verification pass.
export interface CountryInfo {
  name: string;
  aliases?: string[];
  iso2: string;
  fips: string;
  lat: number;
  lng: number;
  continent: string;
}

export const COUNTRIES: CountryInfo[] = [
  // --- South Asia (priority region) ---
  { name: "India", iso2: "IN", fips: "IN", lat: 28.6139, lng: 77.209, continent: "Asia" },
  { name: "Pakistan", iso2: "PK", fips: "PK", lat: 33.6844, lng: 73.0479, continent: "Asia" },
  { name: "Bangladesh", iso2: "BD", fips: "BG", lat: 23.8103, lng: 90.4125, continent: "Asia" },
  { name: "Sri Lanka", iso2: "LK", fips: "CE", lat: 6.9271, lng: 79.8612, continent: "Asia" },
  { name: "Nepal", iso2: "NP", fips: "NP", lat: 27.7172, lng: 85.324, continent: "Asia" },
  { name: "Myanmar", aliases: ["Burma"], iso2: "MM", fips: "BM", lat: 16.8661, lng: 96.1951, continent: "Asia" },
  { name: "Afghanistan", iso2: "AF", fips: "AF", lat: 34.5553, lng: 69.2075, continent: "Asia" },
  { name: "Maldives", iso2: "MV", fips: "MV", lat: 4.1755, lng: 73.5093, continent: "Asia" },
  { name: "Bhutan", iso2: "BT", fips: "BT", lat: 27.4712, lng: 89.6339, continent: "Asia" },

  // --- East / Southeast Asia ---
  { name: "China", iso2: "CN", fips: "CH", lat: 39.9042, lng: 116.4074, continent: "Asia" },
  { name: "Japan", iso2: "JP", fips: "JA", lat: 35.6762, lng: 139.6503, continent: "Asia" },
  { name: "South Korea", aliases: ["Korea"], iso2: "KR", fips: "KS", lat: 37.5665, lng: 126.978, continent: "Asia" },
  { name: "North Korea", iso2: "KP", fips: "KN", lat: 39.0392, lng: 125.7625, continent: "Asia" },
  { name: "Taiwan", iso2: "TW", fips: "TW", lat: 25.033, lng: 121.5654, continent: "Asia" },
  { name: "Indonesia", iso2: "ID", fips: "ID", lat: -6.2088, lng: 106.8456, continent: "Asia" },
  { name: "Thailand", iso2: "TH", fips: "TH", lat: 13.7563, lng: 100.5018, continent: "Asia" },
  { name: "Vietnam", iso2: "VN", fips: "VM", lat: 21.0278, lng: 105.8342, continent: "Asia" },
  { name: "Philippines", iso2: "PH", fips: "RP", lat: 14.5995, lng: 120.9842, continent: "Asia" },
  { name: "Malaysia", iso2: "MY", fips: "MY", lat: 3.139, lng: 101.6869, continent: "Asia" },
  { name: "Singapore", iso2: "SG", fips: "SN", lat: 1.3521, lng: 103.8198, continent: "Asia" },

  // --- Middle East ---
  { name: "Israel", iso2: "IL", fips: "IS", lat: 31.7683, lng: 35.2137, continent: "Asia" },
  { name: "Palestine", aliases: ["Gaza", "West Bank"], iso2: "PS", fips: "WE", lat: 31.9522, lng: 35.2332, continent: "Asia" },
  { name: "Iran", iso2: "IR", fips: "IR", lat: 35.6892, lng: 51.389, continent: "Asia" },
  { name: "Iraq", iso2: "IQ", fips: "IZ", lat: 33.3152, lng: 44.3661, continent: "Asia" },
  { name: "Saudi Arabia", iso2: "SA", fips: "SA", lat: 24.7136, lng: 46.6753, continent: "Asia" },
  { name: "UAE", aliases: ["United Arab Emirates"], iso2: "AE", fips: "AE", lat: 25.2048, lng: 55.2708, continent: "Asia" },
  { name: "Qatar", iso2: "QA", fips: "QA", lat: 25.2854, lng: 51.531, continent: "Asia" },
  { name: "Turkey", aliases: ["Türkiye"], iso2: "TR", fips: "TU", lat: 39.9334, lng: 32.8597, continent: "Asia" },
  { name: "Syria", iso2: "SY", fips: "SY", lat: 33.5138, lng: 36.2765, continent: "Asia" },
  { name: "Lebanon", iso2: "LB", fips: "LE", lat: 33.8938, lng: 35.5018, continent: "Asia" },
  { name: "Yemen", iso2: "YE", fips: "YM", lat: 15.3694, lng: 44.191, continent: "Asia" },
  { name: "Jordan", iso2: "JO", fips: "JO", lat: 31.9454, lng: 35.9284, continent: "Asia" },

  // --- Europe ---
  { name: "United Kingdom", aliases: ["UK", "Britain"], iso2: "GB", fips: "UK", lat: 51.5072, lng: -0.1276, continent: "Europe" },
  { name: "France", iso2: "FR", fips: "FR", lat: 48.8566, lng: 2.3522, continent: "Europe" },
  { name: "Germany", iso2: "DE", fips: "GM", lat: 52.52, lng: 13.405, continent: "Europe" },
  { name: "Italy", iso2: "IT", fips: "IT", lat: 41.9028, lng: 12.4964, continent: "Europe" },
  { name: "Spain", iso2: "ES", fips: "SP", lat: 40.4168, lng: -3.7038, continent: "Europe" },
  { name: "Ukraine", iso2: "UA", fips: "UP", lat: 50.4501, lng: 30.5234, continent: "Europe" },
  { name: "Russia", iso2: "RU", fips: "RS", lat: 55.7558, lng: 37.6173, continent: "Europe" },
  { name: "Poland", iso2: "PL", fips: "PL", lat: 52.2297, lng: 21.0122, continent: "Europe" },
  { name: "Netherlands", iso2: "NL", fips: "NL", lat: 52.3676, lng: 4.9041, continent: "Europe" },
  { name: "Sweden", iso2: "SE", fips: "SW", lat: 59.3293, lng: 18.0686, continent: "Europe" },
  { name: "Switzerland", iso2: "CH", fips: "SZ", lat: 46.948, lng: 7.4474, continent: "Europe" },
  { name: "Belgium", iso2: "BE", fips: "BE", lat: 50.8503, lng: 4.3517, continent: "Europe" },
  { name: "Greece", iso2: "GR", fips: "GR", lat: 37.9838, lng: 23.7275, continent: "Europe" },
  { name: "Lithuania", iso2: "LT", fips: "LH", lat: 54.6833, lng: 25.3167, continent: "Europe" },
  { name: "Belarus", iso2: "BY", fips: "BO", lat: 53.9, lng: 27.5667, continent: "Europe" },
  { name: "Austria", iso2: "AT", fips: "AU", lat: 48.2082, lng: 16.3738, continent: "Europe" },

  // --- Africa ---
  { name: "Egypt", iso2: "EG", fips: "EG", lat: 30.0444, lng: 31.2357, continent: "Africa" },
  { name: "Nigeria", iso2: "NG", fips: "NI", lat: 9.0765, lng: 7.3986, continent: "Africa" },
  { name: "South Africa", iso2: "ZA", fips: "SF", lat: -25.7479, lng: 28.2293, continent: "Africa" },
  { name: "Kenya", iso2: "KE", fips: "KE", lat: -1.2921, lng: 36.8219, continent: "Africa" },
  { name: "Ethiopia", iso2: "ET", fips: "ET", lat: 9.025, lng: 38.7469, continent: "Africa" },
  { name: "Sudan", iso2: "SD", fips: "SU", lat: 15.5007, lng: 32.5599, continent: "Africa" },
  { name: "Burkina Faso", iso2: "BF", fips: "UV", lat: 12.3714, lng: -1.5197, continent: "Africa" },
  { name: "Mali", iso2: "ML", fips: "ML", lat: 12.6392, lng: -8.0029, continent: "Africa" },
  { name: "Algeria", iso2: "DZ", fips: "AG", lat: 36.7538, lng: 3.0588, continent: "Africa" },
  { name: "Morocco", iso2: "MA", fips: "MO", lat: 33.9716, lng: -6.8498, continent: "Africa" },

  // --- North America ---
  { name: "United States", aliases: ["USA", "US", "America"], iso2: "US", fips: "US", lat: 38.9072, lng: -77.0369, continent: "North America" },
  { name: "Canada", iso2: "CA", fips: "CA", lat: 45.4215, lng: -75.6972, continent: "North America" },
  { name: "Mexico", iso2: "MX", fips: "MX", lat: 19.4326, lng: -99.1332, continent: "North America" },

  // --- South America ---
  { name: "Brazil", iso2: "BR", fips: "BR", lat: -15.7939, lng: -47.8828, continent: "South America" },
  { name: "Argentina", iso2: "AR", fips: "AR", lat: -34.6037, lng: -58.3816, continent: "South America" },
  { name: "Chile", iso2: "CL", fips: "CI", lat: -33.4489, lng: -70.6693, continent: "South America" },
  { name: "Colombia", iso2: "CO", fips: "CO", lat: 4.711, lng: -74.0721, continent: "South America" },
  { name: "Venezuela", iso2: "VE", fips: "VE", lat: 10.4806, lng: -66.9036, continent: "South America" },
  { name: "Peru", iso2: "PE", fips: "PE", lat: -12.0464, lng: -77.0428, continent: "South America" },

  // --- Oceania ---
  { name: "Australia", iso2: "AU", fips: "AS", lat: -35.2809, lng: 149.13, continent: "Oceania" },
  { name: "New Zealand", iso2: "NZ", fips: "NZ", lat: -41.2865, lng: 174.7762, continent: "Oceania" },
];
