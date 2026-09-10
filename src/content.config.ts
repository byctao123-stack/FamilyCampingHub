import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    id: z.number(),
    slug: z.string(),
    title: z.string(),
    description: z.string(),
    imageUrl: z.string().optional(),
    imageAlt: z.string().optional(),
    pubDate: z.string(),
    author: z.string().default('shadcn Studio'),
    avatarUrl: z.string().optional(),
    category: z.string().default('General'),
    readTime: z.number().optional(),
    featured: z.boolean().default(false),
    productCard: z.object({
      title: z.string(),
      imageUrl: z.string(),
      imageAlt: z.string(),
      rating: z.string().optional(),
      reviewCount: z.string().optional(),
      priceRange: z.string(),
      features: z.array(z.string()).optional(),
      affiliateUrl: z.string().url(),
      badge: z.string().optional()
    }).optional()
  })
})

export const collections = { blog }
