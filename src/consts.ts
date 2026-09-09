// Site Configuration
// Centralized configuration for site metadata, SEO, and branding

export const SITE_TITLE = 'Family Camping Hub'
export const SITE_DESCRIPTION =
  'Your ultimate resource for family camping tips, gear reviews, campground guides, and campfire recipes. Make every camping trip unforgettable.'

export const GITHUB_URL = 'https://github.com/familycampinghub'
export const SITE_URL = 'https://familycampinghub.shop/'

export const SITE_METADATA = {
  title: {
    default: 'Family Camping Hub'
  },
  description:
    'Your ultimate resource for family camping tips, gear reviews, campground guides, and campfire recipes. Make every camping trip unforgettable.',
  keywords: [
    'family camping',
    'camping tips',
    'camping gear',
    'campground guide',
    'camping with kids',
    'tent reviews',
    'sleeping bags',
    'camping recipes',
    'campfire fun',
    'outdoor activities',
    'beginner camping',
    'camping safety'
  ],
  authors: [{ name: 'Michael', url: SITE_URL }],
  creator: 'Michael',
  publisher: 'Michael',
  robots: {
    index: true,
    follow: true
  },
  language: 'en-US',
  locale: 'en_US',
  icons: {
    icon: [
      { url: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }
    ],
    shortcut: [{ url: '/favicon.svg' }],
    apple: [{ url: '/favicon.svg', sizes: '180x180' }]
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Family Camping Hub',
    title: 'Family Camping Hub',
    description:
      'Your ultimate resource for family camping tips, gear reviews, campground guides, and campfire recipes.',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Family Camping Hub',
        type: 'image/png'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    site: '@familycampinghub',
    creator: '@familycampinghub',
    title: 'Family Camping Hub',
    description:
      'Your ultimate resource for family camping tips, gear reviews, campground guides, and campfire recipes.',
    images: ['/images/og-image.png']
  },
  verification: {
    google: '',
    yandex: '',
    bing: ''
  }
}

// Social media links
export const SOCIAL_LINKS = {
  github: GITHUB_URL,
  twitter: 'https://twitter.com/familycampinghub',
  linkedin: 'https://linkedin.com/company/familycampinghub',
  discord: 'https://discord.com/invite/familycampinghub'
}

// Company information for structured data
export const COMPANY_INFO = {
  name: 'Family Camping Hub',
  legalName: 'Family Camping Hub',
  url: SITE_URL,
  logo: '/favicon.svg',
  foundingDate: '2024',
  address: {
    streetAddress: '',
    addressLocality: '',
    addressRegion: '',
    postalCode: '',
    addressCountry: 'US'
  },
  contactPoint: {
    telephone: '',
    contactType: 'customer support',
    email: 'hello@familycampinghub.com'
  },
  sameAs: Object.values(SOCIAL_LINKS)
}
