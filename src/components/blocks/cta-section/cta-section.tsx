'use client'

import { ArrowRightIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

const CTA = () => {
  return (
    <section className=' py-16 sm:py-24 lg:py-32'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='text-center'>
          <h2 className='text-3xl font-bold text-green-700 md:text-4xl lg:text-5xl'>
            Ready to Start Your Camping Adventure?
          </h2>
          <p className='mx-auto mt-4 max-w-2xl text-lg text-green-500 md:text-xl'>
            Join thousands of families who trust Family Camping Hub for their outdoor adventures.
          </p>

        </div>
      </div>
    </section>
  )
}

export default CTA
