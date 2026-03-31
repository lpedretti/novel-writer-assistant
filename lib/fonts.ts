import {
  Playfair_Display,
  Crimson_Text,
  Cormorant_Garamond,
  Libre_Baskerville,
  Cinzel,
  EB_Garamond,
  Bodoni_Moda,
  Yeseva_One,
  Lora,
  Merriweather,
  Source_Serif_4,
  PT_Serif,
  Bitter,
  Roboto_Slab,
  Josefin_Slab,
  Alegreya,
  Spectral,
  Literata,
  Noto_Serif,
  Great_Vibes,
  Tangerine,
  Italianno,
  Herr_Von_Muellerhoff,
  Dancing_Script,
  Marck_Script,
} from 'next/font/google';

// Font loading configuration
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-playfair',
});

const crimsonText = Crimson_Text({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-crimson',
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-cormorant',
});

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-libre-baskerville',
});

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-cinzel',
});

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-eb-garamond',
});

const bodoniModa = Bodoni_Moda({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-bodoni',
});

const yesevaOne = Yeseva_One({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-yeseva',
});

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-lora',
});

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-merriweather',
});

const sourceSerif4 = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-source-serif',
});

const ptSerif = PT_Serif({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-pt-serif',
});

const bitter = Bitter({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-bitter',
});

const robotoSlab = Roboto_Slab({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-roboto-slab',
});

const josefinSlab = Josefin_Slab({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-josefin-slab',
});

const alegreya = Alegreya({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-alegreya',
});

const spectral = Spectral({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-spectral',
});

const literata = Literata({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-literata',
});

const notoSerif = Noto_Serif({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-noto-serif',
});

// Artistic/Poetic Fonts
const greatVibes = Great_Vibes({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-great-vibes',
});

const tangerine = Tangerine({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-tangerine',
});

const italianno = Italianno({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-italianno',
});

const herrVonMuellerhoff = Herr_Von_Muellerhoff({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-herr-von-muellerhoff',
});

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-dancing-script',
});

const marckScript = Marck_Script({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-marck-script',
});

// Font configuration types
export interface FontConfig {
  id: string;
  displayName: string;
  category: 'heading' | 'subheading' | 'body' | 'system';
  cssVariable: string;
  fontObject?: {
    className: string;
    style: { fontFamily: string; fontWeight?: number };
    variable: string;
  };
  fallback: string;
  googleFontsUrl?: string;
  description: string;
}

export interface FontExportData {
  fontId: string;
  googleFontsUrl: string;
  licenseType: 'OFL';
  weights: number[];
  formats: string[];
}

// Chapter Title Fonts (H1) - Decorative serif fonts
export const HEADING_FONTS: FontConfig[] = [
  {
    id: 'playfair-display',
    displayName: 'Playfair Display',
    category: 'heading',
    cssVariable: '--font-playfair',
    fontObject: playfairDisplay,
    fallback: 'var(--font-playfair), serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap',
    description: 'Classic high-contrast serif for dramatic chapter titles',
  },
  {
    id: 'crimson-text',
    displayName: 'Crimson Text',
    category: 'heading',
    cssVariable: '--font-crimson',
    fontObject: crimsonText,
    fallback: 'var(--font-crimson), serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&display=swap',
    description: 'Elegant old-style serif inspired by classic book typography',
  },
  {
    id: 'cormorant-garamond',
    displayName: 'Cormorant Garamond',
    category: 'heading',
    cssVariable: '--font-cormorant',
    fontObject: cormorantGaramond,
    fallback: 'var(--font-cormorant), serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap',
    description: 'Display serif with sophisticated elegance',
  },
  {
    id: 'libre-baskerville',
    displayName: 'Libre Baskerville',
    category: 'heading',
    cssVariable: '--font-libre-baskerville',
    fontObject: libreBaskerville,
    fallback: 'var(--font-libre-baskerville), serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap',
    description: 'Classic Baskerville revival for timeless titles',
  },
  {
    id: 'cinzel',
    displayName: 'Cinzel',
    category: 'heading',
    cssVariable: '--font-cinzel',
    fontObject: cinzel,
    fallback: 'var(--font-cinzel), serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap',
    description: 'Roman inscription inspired, powerful and formal',
  },
  {
    id: 'eb-garamond',
    displayName: 'EB Garamond',
    category: 'heading',
    cssVariable: '--font-eb-garamond',
    fontObject: ebGaramond,
    fallback: 'var(--font-eb-garamond), serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;600;700&display=swap',
    description: 'Classic Garamond revival with refined details',
  },
  {
    id: 'bodoni-moda',
    displayName: 'Bodoni Moda',
    category: 'heading',
    cssVariable: '--font-bodoni',
    fontObject: bodoniModa,
    fallback: 'var(--font-bodoni), serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Bodoni+Moda:wght@400;600;700&display=swap',
    description: 'High-contrast serif with dramatic modern appeal',
  },
  {
    id: 'yeseva-one',
    displayName: 'Yeseva One',
    category: 'heading',
    cssVariable: '--font-yeseva',
    fontObject: yesevaOne,
    fallback: 'var(--font-yeseva), serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Yeseva+One&display=swap',
    description: 'Bold display serif with strong personality',
  },
];

// Section/Subsection Heading Fonts (H2/H3) - Versatile fonts
export const SUBHEADING_FONTS: FontConfig[] = [
  {
    id: 'lora',
    displayName: 'Lora',
    category: 'subheading',
    cssVariable: '--font-lora',
    fontObject: lora,
    fallback: 'var(--font-lora), serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&display=swap',
    description: 'Contemporary serif with calligraphic roots',
  },
  {
    id: 'merriweather',
    displayName: 'Merriweather',
    category: 'subheading',
    cssVariable: '--font-merriweather',
    fontObject: merriweather,
    fallback: 'var(--font-merriweather), serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap',
    description: 'Designed for screen reading with excellent clarity',
  },
  {
    id: 'source-serif-4',
    displayName: 'Source Serif 4',
    category: 'subheading',
    cssVariable: '--font-source-serif',
    fontObject: sourceSerif4,
    fallback: 'var(--font-source-serif), serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600;700&display=swap',
    description: "Adobe's readable serif optimized for digital",
  },
  {
    id: 'pt-serif',
    displayName: 'PT Serif',
    category: 'subheading',
    cssVariable: '--font-pt-serif',
    fontObject: ptSerif,
    fallback: 'var(--font-pt-serif), serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=PT+Serif:wght@400;700&display=swap',
    description: 'Universal serif with excellent legibility',
  },
  {
    id: 'bitter',
    displayName: 'Bitter',
    category: 'subheading',
    cssVariable: '--font-bitter',
    fontObject: bitter,
    fallback: 'var(--font-bitter), serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Bitter:wght@400;600;700&display=swap',
    description: 'Contemporary slab serif for modern headings',
  },
  {
    id: 'roboto-slab',
    displayName: 'Roboto Slab',
    category: 'subheading',
    cssVariable: '--font-roboto-slab',
    fontObject: robotoSlab,
    fallback: 'var(--font-roboto-slab), serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;600;700&display=swap',
    description: 'Friendly slab serif with mechanical skeleton',
  },
  {
    id: 'josefin-slab',
    displayName: 'Josefin Slab',
    category: 'subheading',
    cssVariable: '--font-josefin-slab',
    fontObject: josefinSlab,
    fallback: 'var(--font-josefin-slab), serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Josefin+Slab:wght@400;600;700&display=swap',
    description: 'Geometric slab serif with vintage feel',
  },
  {
    id: 'alegreya',
    displayName: 'Alegreya',
    category: 'subheading',
    cssVariable: '--font-alegreya',
    fontObject: alegreya,
    fallback: 'var(--font-alegreya), serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Alegreya:wght@400;600;700&display=swap',
    description: 'Dynamic serif designed for literature',
  },
  {
    id: 'spectral',
    displayName: 'Spectral',
    category: 'subheading',
    cssVariable: '--font-spectral',
    fontObject: spectral,
    fallback: 'var(--font-spectral), serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Spectral:wght@400;600;700&display=swap',
    description: 'Designed for Google Docs, optimized for screens',
  },
];

// Body Text Fonts - Highly readable for long-form reading + Artistic fonts for quotes
export const BODY_FONTS: FontConfig[] = [
  {
    id: 'literata',
    displayName: 'Literata',
    category: 'body',
    cssVariable: '--font-literata',
    fontObject: literata,
    fallback: 'var(--font-literata), serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Literata:wght@400;600;700&display=swap',
    description: 'Designed for Google Play Books, e-reading optimized',
  },
  {
    id: 'lora-body',
    displayName: 'Lora',
    category: 'body',
    cssVariable: '--font-lora',
    fontObject: lora,
    fallback: 'var(--font-lora), serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&display=swap',
    description: 'Excellent for body text with high readability',
  },
  {
    id: 'merriweather-body',
    displayName: 'Merriweather',
    category: 'body',
    cssVariable: '--font-merriweather',
    fontObject: merriweather,
    fallback: 'var(--font-merriweather), serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap',
    description: 'Outstanding readability for paragraphs',
  },
  {
    id: 'source-serif-4-body',
    displayName: 'Source Serif 4',
    category: 'body',
    cssVariable: '--font-source-serif',
    fontObject: sourceSerif4,
    fallback: 'var(--font-source-serif), serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600;700&display=swap',
    description: 'Designed specifically for screen reading',
  },
  {
    id: 'pt-serif-body',
    displayName: 'PT Serif',
    category: 'body',
    cssVariable: '--font-pt-serif',
    fontObject: ptSerif,
    fallback: 'var(--font-pt-serif), serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=PT+Serif:wght@400;700&display=swap',
    description: 'Clear and readable for long paragraphs',
  },
  {
    id: 'spectral-body',
    displayName: 'Spectral',
    category: 'body',
    cssVariable: '--font-spectral',
    fontObject: spectral,
    fallback: 'var(--font-spectral), serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Spectral:wght@400;600;700&display=swap',
    description: 'Optimized for long-form reading',
  },
  {
    id: 'noto-serif',
    displayName: 'Noto Serif',
    category: 'body',
    cssVariable: '--font-noto-serif',
    fontObject: notoSerif,
    fallback: 'var(--font-noto-serif), serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;600;700&display=swap',
    description: 'Excellent coverage and readability',
  },
  {
    id: 'alegreya-body',
    displayName: 'Alegreya',
    category: 'body',
    cssVariable: '--font-alegreya',
    fontObject: alegreya,
    fallback: 'var(--font-alegreya), serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Alegreya:wght@400;600;700&display=swap',
    description: 'Dynamic serif perfect for literature',
  },
  {
    id: 'great-vibes',
    displayName: 'Great Vibes',
    category: 'body',
    cssVariable: '--font-great-vibes',
    fontObject: greatVibes,
    fallback: 'var(--font-great-vibes), cursive',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap',
    description: 'Romantic flowing script, perfect for poetic quotes',
  },
  {
    id: 'tangerine',
    displayName: 'Tangerine',
    category: 'body',
    cssVariable: '--font-tangerine',
    fontObject: tangerine,
    fallback: 'var(--font-tangerine), cursive',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Tangerine:wght@400;700&display=swap',
    description: 'Traditional calligraphy with graceful curves',
  },
  {
    id: 'italianno',
    displayName: 'Italianno',
    category: 'body',
    cssVariable: '--font-italianno',
    fontObject: italianno,
    fallback: 'var(--font-italianno), cursive',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Italianno&display=swap',
    description: 'Sleek cursive with luxury aesthetic',
  },
  {
    id: 'herr-von-muellerhoff',
    displayName: 'Herr Von Muellerhoff',
    category: 'body',
    cssVariable: '--font-herr-von-muellerhoff',
    fontObject: herrVonMuellerhoff,
    fallback: 'var(--font-herr-von-muellerhoff), cursive',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Herr+Von+Muellerhoff&display=swap',
    description: 'Ornate script with sophisticated artistry',
  },
  {
    id: 'dancing-script',
    displayName: 'Dancing Script',
    category: 'body',
    cssVariable: '--font-dancing-script',
    fontObject: dancingScript,
    fallback: 'var(--font-dancing-script), cursive',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap',
    description: 'Lively bouncy script for modern poetry',
  },
  {
    id: 'marck-script',
    displayName: 'Marck Script',
    category: 'body',
    cssVariable: '--font-marck-script',
    fontObject: marckScript,
    fallback: 'var(--font-marck-script), cursive',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Marck+Script&display=swap',
    description: 'Friendly handwritten script for personal quotes',
  },
];

// System Fonts - Generic fallbacks (no fontObject)
export const SYSTEM_FONTS: FontConfig[] = [
  {
    id: 'serif',
    displayName: 'Serif (System)',
    category: 'system',
    cssVariable: '--font-serif',
    fallback: 'serif',
    description: 'Generic serif system font',
  },
  {
    id: 'sans-serif',
    displayName: 'Sans Serif (System)',
    category: 'system',
    cssVariable: '--font-sans-serif',
    fallback: 'sans-serif',
    description: 'Generic sans-serif system font',
  },
  {
    id: 'monospace',
    displayName: 'Monospace (System)',
    category: 'system',
    cssVariable: '--font-monospace',
    fallback: 'monospace',
    description: 'Generic monospace system font',
  },
];

// Complete font registry
export const ALL_FONTS: FontConfig[] = [
  ...HEADING_FONTS,
  ...SUBHEADING_FONTS,
  ...BODY_FONTS,
  ...SYSTEM_FONTS,
];

// Utility functions
export function getFontById(id: string | undefined): FontConfig | undefined {
  if (!id) return undefined;
  return ALL_FONTS.find((font) => font.id === id);
}

export function getFontsByCategory(category: string): FontConfig[] {
  return ALL_FONTS.filter((font) => font.category === category);
}

export function normalizeFontId(fontId: string | undefined): string {
  if (!fontId) return 'serif';

  // Check if valid font ID
  const font = getFontById(fontId);
  if (font) return fontId;

  // Map legacy system fonts
  if (['serif', 'sans-serif', 'monospace'].includes(fontId)) {
    return fontId;
  }

  // Unknown font - fallback to serif
  console.warn(`Unknown font ID: ${fontId}, falling back to serif`);
  return 'serif';
}

export function getFontCssClass(fontId: string): string {
  const font = getFontById(fontId);
  return font?.fontObject?.className || '';
}

export function getFontExportData(fontId: string): FontExportData | null {
  const font = getFontById(fontId);
  if (!font || font.category === 'system' || !font.googleFontsUrl) {
    return null;
  }

  return {
    fontId: font.id,
    googleFontsUrl: font.googleFontsUrl,
    licenseType: 'OFL',
    weights: [400, 600, 700],
    formats: ['woff2', 'woff'],
  };
}
