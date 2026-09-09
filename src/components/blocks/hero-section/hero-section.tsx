import { ArrowUpRightIcon, CalendarDaysIcon } from 'lucide-react'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import type { BlogPost } from '@/components/blocks/blog-component/blog-component'

const heroSlides = [
  '/images/hero/hero-family-camping.jpg',
  '/images/hero/hero-campgrounds.jpg',
  '/images/hero/hero-family-tent.jpg'
]

const HeroSection = ({ blogData }: { blogData: BlogPost[] }) => {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length)
    }, 8000)

    return () => clearInterval(interval)
  }, [])

  const featuredPosts = blogData.filter(post => post.featured)

  return (
    <section id='home' className='bg-muted -mt-32 pt-32 pb-4 sm:pb-6 lg:pb-8'>
      {/* Background Image Carousel - full width, only behind text area */}
      <div className='relative overflow-hidden'>
        {/* Slides */}
        {heroSlides.map((src, index) => (
          <div
            key={src}
            className={`absolute inset-0 z-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={src}
              alt=''
              className='h-full w-full object-cover opacity-80'
              loading={index === 0 ? 'eager' : 'lazy'}
            />
            <div className='absolute inset-0 bg-black/50' />
          </div>
        ))}

        {/* Slide Indicators */}
        <div className='absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2'>
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'w-6 bg-white' : 'w-2 bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Text Content - centered with max width */}
        <div className='relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 md:py-24 lg:px-8'>
          <div className='text-center max-w-3xl mx-auto'>
            <h1 className='text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl'>
              Your Family's <span className='text-forest-300'>Camping</span> Adventure Starts Here
            </h1>
            <p className='mt-6 text-lg text-green-100 md:text-xl leading-relaxed'>
              From gear reviews to trip planning guides, we help families create unforgettable memories under the stars.
            </p>
          </div>
        </div>
      </div>

      {/* Featured Posts */}
      <div className='mx-auto mt-8 max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8'>
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {featuredPosts.map((item, index) => (
            <a
              href={`/blog/${item.slug}`}
              key={`${item.author}-${index}`}
              className='group h-full cursor-pointer shadow-none transition-all duration-300'
              onClick={e => {
                const target = e.target as HTMLElement

                if (target.closest('.badge')) {
                  e.preventDefault()
                  e.stopPropagation()
                }
              }}
            >
              <Card className='shadow-none h-[450px] overflow-hidden'>
                <CardContent className='space-y-3.5'>
                  <div className='mb-4 overflow-hidden rounded-lg'>
                    <img
                      src={item.imageUrl}
                      alt={item.imageAlt}
                      className='h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105'
                      loading='lazy'
                    />
                  </div>
                  <div className='flex items-center justify-between gap-1.5'>
                    <div className='text-muted-foreground flex items-center gap-1.5'>
                      <CalendarDaysIcon className='size-5' />
                      <p className='text-base'>{item.pubDate}</p>
                    </div>
                    <Badge
                      className='bg-primary/10 text-primary badge h-auto rounded-full border-0 text-sm'
                      onClick={e => {
                        e.preventDefault()
                        e.stopPropagation()
                        window.location.href = `/#category-${item.category}`
                      }}
                    >
                      {item.category}
                    </Badge>
                  </div>
                  <h3 className='line-clamp-2 text-lg font-medium md:text-xl'>{item.title}</h3>
                  <p className='text-muted-foreground line-clamp-2 text-base'>{item.description}</p>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>{item.author}</span>
                    <Button
                      size='icon'
                      className='group-hover:bg-primary! bg-background text-foreground hover:bg-primary! hover:text-primary-foreground group-hover:text-primary-foreground group-hover:border-primary hover:border-primary border-border border bg-clip-border'
                    >
                      <ArrowUpRightIcon className='size-4 -rotate-45' />
                      <span className='sr-only'>Read more: {item.title}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HeroSection
