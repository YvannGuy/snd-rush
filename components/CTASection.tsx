'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface CTASectionProps {
  title: string
  description: string
  primaryAction: {
    label: string
    href: string
    isPhone?: boolean
  }
  secondaryAction?: {
    label: string
    href: string
  }
  variant?: 'default' | 'inverted'
}

export default function CTASection({
  title,
  description,
  primaryAction,
  secondaryAction,
  variant = 'default',
}: CTASectionProps) {
  const isInverted = variant === 'inverted'
  const bgColor = isInverted ? 'bg-[#F2431E]' : 'bg-gray-50'
  const textColor = isInverted ? 'text-white' : 'text-gray-900'
  const descColor = isInverted ? 'text-gray-100' : 'text-gray-600'

  const PrimaryButton = primaryAction.isPhone ? (
    <a
      href={primaryAction.href}
      className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#F2431E] font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition-colors text-lg"
    >
      {primaryAction.label}
    </a>
  ) : (
    <Link
      href={primaryAction.href}
      className="inline-flex items-center justify-center px-8 py-4 bg-[#F2431E] text-white font-semibold rounded-lg shadow-lg hover:bg-[#E63A1A] transition-colors text-lg"
    >
      {primaryAction.label}
    </Link>
  )

  const SecondaryButton = secondaryAction && (
    <Link
      href={secondaryAction.href}
      className={`inline-flex items-center justify-center px-8 py-4 ${
        isInverted
          ? 'bg-transparent border-2 border-white text-white hover:bg-white hover:text-[#F2431E]'
          : 'bg-white text-gray-900 border-2 border-gray-300 hover:bg-gray-100'
      } font-semibold rounded-lg shadow-lg transition-colors text-lg`}
    >
      {secondaryAction.label}
    </Link>
  )

  return (
    <section className={`py-16 ${bgColor}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className={`text-3xl font-bold mb-4 ${textColor}`}>{title}</h2>
        <p className={`text-xl mb-8 ${descColor}`}>{description}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {PrimaryButton}
          {SecondaryButton}
        </div>
      </div>
    </section>
  )
}

