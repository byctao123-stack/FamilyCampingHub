'use client'

import { useState } from 'react'

import { SearchIcon, CalendarDaysIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'

export type BlogPost = {
  id: number
  slug: string
  title: string
  description: string
  imageUrl: string
  imageAlt: string
  pubDate: string
  author: string
  avatarUrl: string
  category: string
  readTime: number
  featured: boolean
}

interface BlogProps {
  blogData?: BlogPost[]
}

const BlogGrid = ({ posts, onCategoryClick }: { posts: BlogPost[]; onCategoryClick: (category: string) => void }) => {
  return (
    <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
      {posts.map(post => (
        <a
          href={`/blog/${post.slug}`}
          key={post.id}
          className='group h-full cursor-pointer shadow-none transition-all duration-300'
          onClick={e => {
            const target = e.target as HTMLElement

            if (target.closest('.badge')) {
              e.preventDefault()
              e.stopPropagation()
            }
          }}
        >
          <Card className='shadow-none h-[385px] overflow-hidden'>
            <CardContent className='space-y-3.5'>
              <div className='mb-4 overflow-hidden rounded-lg sm:mb-4'>
                <img
                  src={post.imageUrl}
                  alt={post.imageAlt}
                  className='h-59.5 w-full object-cover transition-transform duration-300 group-hover:scale-105'
                  loading='lazy'
                />
              </div>
              <div className='flex items-center justify-between gap-1.5'>
                <div className='text-muted-foreground flex items-center gap-1.5'>
                  <CalendarDaysIcon className='size-5' />
                  <p className='text-base'>{post.pubDate}</p>
                </div>
                <Badge
                  className='bg-primary/10 text-primary badge h-auto rounded-full border-0 text-sm'
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    onCategoryClick(post.category)
                  }}
                >
                  {post.category}
                </Badge>
              </div>
              <h3 className='line-clamp-2 text-lg font-medium md:text-xl'>{post.title}</h3>
            </CardContent>
          </Card>
        </a>
      ))}
    </div>
  )
}

const Blog = ({ blogData = [] }: BlogProps) => {
  const [selectedTab, setSelectedTab] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter out featured posts to avoid duplication with hero section
  // Sort posts by pubDate in descending order (newest first)
  const nonFeaturedPosts = blogData.filter(post => !post.featured).sort((a, b) => b.pubDate.localeCompare(a.pubDate))

  // Dynamically generate categories from the available data
  const uniqueCategories = [...new Set(nonFeaturedPosts.map(post => post.category))]
  const categoryOrder = ['gear', 'camping-tips', 'camp-life']
  const categories = ['All', ...categoryOrder.filter(c => uniqueCategories.includes(c))]

  // Filter posts by category tab and search query
  const filteredPosts = nonFeaturedPosts.filter(post => {
    const matchesTab = selectedTab === 'All' || post.category === selectedTab
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  const handleTabChange = (tab: string) => {
    setSelectedTab(tab)

    if (tab === 'All') {
      window.location.href = '#categories'
    }
  }

  return (
    <section className='py-1 sm:py-2 lg:py-4' id='categories'>
      <div className='mx-auto max-w-7xl space-y-4 px-4 sm:px-6 lg:space-y-8 lg:px-8'>
        {/* Header */}
        <div className='space-y-4'>
          {selectedTab === 'All' && <p className='text-sm'>Blogs</p>}
          {selectedTab !== 'All' && (
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href='#'>Blog</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{selectedTab}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          )}

          <h2 className='text-2xl font-semibold md:text-3xl lg:text-4xl'>
            Explore Our Camping Topics.
          </h2>

          <p className='text-muted-foreground text-lg md:text-xl'>
            Whether you're buying gear, planning your first trip, or looking for family activities — we've got you covered.e your product from vision to reality.
          </p>
        </div>

        {/* Tabs and Search */}
        <Tabs defaultValue='All' value={selectedTab} onValueChange={handleTabChange} className='gap-4 lg:gap-6'>
          <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
            <ScrollArea className='bg-muted w-full rounded-lg sm:w-auto'>
              <TabsList className='h-auto gap-1 group-data-horizontal/tabs:h-auto'>
                {categories.map(category => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    id={`category-${category}`}
                    className='hover:bg-primary/10 cursor-pointer rounded-lg px-4 text-base group-data-horizontal/tabs:after:h-0'
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
              <ScrollBar orientation='horizontal' />
            </ScrollArea>

            <div className='relative max-md:w-full'>
              <div className='text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50'>
                <SearchIcon className='size-4' />
                <span className='sr-only'>Search</span>
              </div>
              <Input
                type='search'
                placeholder='Search'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='peer h-10 px-9 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none'
              />
            </div>
          </div>

          {/* All Posts Tab */}
          <TabsContent value='All'>
            <BlogGrid posts={filteredPosts} onCategoryClick={handleTabChange} />
          </TabsContent>

          {/* Category-specific Tabs */}
          {categories.slice(1).map((category, index) => (
            <TabsContent key={index} value={category}>
              <BlogGrid
                posts={filteredPosts.filter(post => post.category === category)}
                onCategoryClick={handleTabChange}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  )
}

export default Blog
