'use client'

import { useEffect, useRef, ReactNode, CSSProperties } from 'react'

export function Reveal({
  children,
  delay = 0,
  className = '',
  style,
}: {
  children: ReactNode
  delay?: number
  className?: string
  style?: CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.opacity = '1'
      el.style.transform = 'none'
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setTimeout(() => {
          el.style.opacity = '1'
          el.style.transform = 'translateY(0)'
        }, delay)
        observer.disconnect()
      },
      { threshold: 0.1, rootMargin: '0px 0px -48px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: 0,
        transform: 'translateY(18px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
