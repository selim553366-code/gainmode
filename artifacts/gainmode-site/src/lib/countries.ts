/** Countries for the phone field of the countdown list: ISO code, dialing code and English name. */
export type Country = { code: string; dial: string; name: string };

export const countries: Country[] = [
  { code: 'TR', dial: '+90', name: 'Türkiye' },
  { code: 'US', dial: '+1', name: 'United States' },
  { code: 'GB', dial: '+44', name: 'United Kingdom' },
  { code: 'DE', dial: '+49', name: 'Germany' },
  { code: 'FR', dial: '+33', name: 'France' },
  { code: 'ES', dial: '+34', name: 'Spain' },
  { code: 'IT', dial: '+39', name: 'Italy' },
  { code: 'NL', dial: '+31', name: 'Netherlands' },
  { code: 'BE', dial: '+32', name: 'Belgium' },
  { code: 'AT', dial: '+43', name: 'Austria' },
  { code: 'CH', dial: '+41', name: 'Switzerland' },
  { code: 'SE', dial: '+46', name: 'Sweden' },
  { code: 'NO', dial: '+47', name: 'Norway' },
  { code: 'DK', dial: '+45', name: 'Denmark' },
  { code: 'FI', dial: '+358', name: 'Finland' },
  { code: 'IE', dial: '+353', name: 'Ireland' },
  { code: 'PT', dial: '+351', name: 'Portugal' },
  { code: 'PL', dial: '+48', name: 'Poland' },
  { code: 'CZ', dial: '+420', name: 'Czechia' },
  { code: 'GR', dial: '+30', name: 'Greece' },
  { code: 'RO', dial: '+40', name: 'Romania' },
  { code: 'BG', dial: '+359', name: 'Bulgaria' },
  { code: 'HU', dial: '+36', name: 'Hungary' },
  { code: 'UA', dial: '+380', name: 'Ukraine' },
  { code: 'AZ', dial: '+994', name: 'Azerbaijan' },
  { code: 'CY', dial: '+357', name: 'Cyprus' },
  { code: 'CA', dial: '+1', name: 'Canada' },
  { code: 'MX', dial: '+52', name: 'Mexico' },
  { code: 'BR', dial: '+55', name: 'Brazil' },
  { code: 'AR', dial: '+54', name: 'Argentina' },
  { code: 'CL', dial: '+56', name: 'Chile' },
  { code: 'CO', dial: '+57', name: 'Colombia' },
  { code: 'AU', dial: '+61', name: 'Australia' },
  { code: 'NZ', dial: '+64', name: 'New Zealand' },
  { code: 'AE', dial: '+971', name: 'United Arab Emirates' },
  { code: 'SA', dial: '+966', name: 'Saudi Arabia' },
  { code: 'QA', dial: '+974', name: 'Qatar' },
  { code: 'KW', dial: '+965', name: 'Kuwait' },
  { code: 'EG', dial: '+20', name: 'Egypt' },
  { code: 'MA', dial: '+212', name: 'Morocco' },
  { code: 'ZA', dial: '+27', name: 'South Africa' },
  { code: 'NG', dial: '+234', name: 'Nigeria' },
  { code: 'IN', dial: '+91', name: 'India' },
  { code: 'PK', dial: '+92', name: 'Pakistan' },
  { code: 'ID', dial: '+62', name: 'Indonesia' },
  { code: 'MY', dial: '+60', name: 'Malaysia' },
  { code: 'SG', dial: '+65', name: 'Singapore' },
  { code: 'PH', dial: '+63', name: 'Philippines' },
  { code: 'TH', dial: '+66', name: 'Thailand' },
  { code: 'VN', dial: '+84', name: 'Vietnam' },
  { code: 'JP', dial: '+81', name: 'Japan' },
  { code: 'KR', dial: '+82', name: 'South Korea' },
  { code: 'CN', dial: '+86', name: 'China' },
  { code: 'HK', dial: '+852', name: 'Hong Kong' },
  { code: 'TW', dial: '+886', name: 'Taiwan' },
];

/** The flag emoji for an ISO country code. */
export const flag = (code: string) => String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)));

/** Best guess of the visitor's country from the browser language (e.g. tr-TR → TR), else Türkiye. */
export function guessCountry(): Country {
  const region = typeof navigator !== 'undefined'
    ? (navigator.languages ?? [navigator.language]).map((tag) => tag.split('-')[1]?.toUpperCase()).find(Boolean)
    : undefined;
  return countries.find((country) => country.code === region) ?? countries[0];
}

/** E.164 number from a dialing code and what the person typed, or null when it cannot be one. */
export function toE164(dial: string, typed: string): string | null {
  let digits = typed.replace(/\D/g, '');
  if (typed.trim().startsWith('+')) return /^[1-9]\d{6,14}$/.test(digits) ? `+${digits}` : null;
  digits = digits.replace(/^0+/, '');
  const full = `${dial.replace('+', '')}${digits}`;
  return /^[1-9]\d{6,14}$/.test(full) ? `+${full}` : null;
}
