// Words that identify a country without naming it ("French protests",
// "an Australian MP") plus common alternative names, keyed to ISO codes
// (Natural Earth's official names differ from everyday ones — "Republic of
// Serbia", "United Republic of Tanzania" — so ISO codes are the stable key).
//
// Measured before adding this: ~40% of BBC / UN News items were silently
// dropped because they only used a nationality word or a country missing
// from the old 70-country list.

export const DEMONYMS: Record<string, string> = {
  Afghan: "AF", Albanian: "AL", Algerian: "DZ", American: "US", Angolan: "AO",
  Argentine: "AR", Argentinian: "AR", Armenian: "AM", Australian: "AU", Austrian: "AT",
  Azerbaijani: "AZ", Bahraini: "BH", Bangladeshi: "BD", Belarusian: "BY", Belgian: "BE",
  Bhutanese: "BT", Bolivian: "BO", Bosnian: "BA", Brazilian: "BR", British: "GB",
  Bulgarian: "BG", Burmese: "MM", Burundian: "BI", Cambodian: "KH", Cameroonian: "CM",
  Canadian: "CA", Chadian: "TD", Chilean: "CL", Chinese: "CN", Colombian: "CO",
  Congolese: "CD", Croatian: "HR", Cuban: "CU", Cypriot: "CY", Czech: "CZ",
  Danish: "DK", Dutch: "NL", Ecuadorian: "EC", Egyptian: "EG", Emirati: "AE",
  Eritrean: "ER", Estonian: "EE", Ethiopian: "ET", Fijian: "FJ", Filipino: "PH",
  Finnish: "FI", French: "FR", German: "DE", Ghanaian: "GH", Greek: "GR",
  Guatemalan: "GT", Guinean: "GN", Haitian: "HT", Honduran: "HN", Hungarian: "HU",
  Icelandic: "IS", Indian: "IN", Indonesian: "ID", Iranian: "IR", Iraqi: "IQ",
  Irish: "IE", Israeli: "IL", Italian: "IT", Ivorian: "CI", Jamaican: "JM",
  Japanese: "JP", Jordanian: "JO", Kazakh: "KZ", Kenyan: "KE", Kuwaiti: "KW",
  Kyrgyz: "KG", Laotian: "LA", Latvian: "LV", Lebanese: "LB", Liberian: "LR",
  Libyan: "LY", Lithuanian: "LT", Malagasy: "MG", Malawian: "MW", Malaysian: "MY",
  Maldivian: "MV", Malian: "ML", Maltese: "MT", Mauritanian: "MR", Mexican: "MX",
  Moldovan: "MD", Mongolian: "MN", Montenegrin: "ME", Moroccan: "MA", Mozambican: "MZ",
  Namibian: "NA", Nepali: "NP", Nepalese: "NP", Nicaraguan: "NI", Nigerian: "NG",
  Nigerien: "NE", "North Korean": "KP", Norwegian: "NO", Omani: "OM", Pakistani: "PK",
  Palestinian: "PS", Panamanian: "PA", Paraguayan: "PY", Peruvian: "PE", Polish: "PL",
  Portuguese: "PT", Qatari: "QA", Romanian: "RO", Russian: "RU", Rwandan: "RW",
  Saudi: "SA", Senegalese: "SN", Serbian: "RS", "Sierra Leonean": "SL", Singaporean: "SG",
  Slovak: "SK", Slovenian: "SI", Somali: "SO", "South African": "ZA", "South Korean": "KR",
  "South Sudanese": "SS", Spanish: "ES", "Sri Lankan": "LK", Sudanese: "SD", Swedish: "SE",
  Swiss: "CH", Syrian: "SY", Taiwanese: "TW", Tajik: "TJ", Tanzanian: "TZ",
  Thai: "TH", Tunisian: "TN", Turkish: "TR", Turkmen: "TM", Ugandan: "UG",
  Ukrainian: "UA", Uruguayan: "UY", Uzbek: "UZ", Venezuelan: "VE", Vietnamese: "VN",
  Yemeni: "YE", Zambian: "ZM", Zimbabwean: "ZW",
};

/** Everyday names that differ from Natural Earth's official ones. Matched case-insensitively. */
export const ALT_NAMES: Record<string, string> = {
  Serbia: "RS", Tanzania: "TZ", "DR Congo": "CD", "Democratic Republic of Congo": "CD",
  "Ivory Coast": "CI", "Côte d'Ivoire": "CI", "Czech Republic": "CZ", Swaziland: "SZ",
  Eswatini: "SZ", "Timor-Leste": "TL", Bahamas: "BS", Macedonia: "MK",
  England: "GB", Scotland: "GB", Wales: "GB", "Northern Ireland": "GB",
  Kyiv: "UA", Kiev: "UA", Moscow: "RU", Beijing: "CN", Tehran: "IR", Kabul: "AF",
  Islamabad: "PK", Dhaka: "BD", Kathmandu: "NP", Colombo: "LK", "Tel Aviv": "IL",
  Jerusalem: "IL", Washington: "US", "White House": "US", Kremlin: "RU",
  "New Delhi": "IN",
};

/**
 * Short uppercase codes — matched CASE-SENSITIVELY. The old matcher was
 * case-insensitive, so the pronoun "us" in any headline ("Tell us…") was
 * read as the United States.
 */
export const ACRONYMS: Record<string, string> = {
  US: "US", USA: "US", "U.S.": "US", UK: "GB", "U.K.": "GB", UAE: "AE", DRC: "CD", PRC: "CN",
};

/**
 * Phrases that contain a country word but don't refer to that country.
 * They're matched (so the inner word isn't), then ignored.
 */
export const BLOCKERS: string[] = [
  "Latin American", "Latin America", "South American", "Central American", "North American",
  "African American", "Native American", "Indian Ocean", "American Samoa",
  "French Polynesia", "French Guiana", "British Columbia", "New Mexico", "Jordan River",
];
