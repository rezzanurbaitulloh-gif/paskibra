"use client"

import Image from "next/image"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface SafeImageProps {
  src?: string | null
  alt: string
  fallback?: string
  className?: string
  imgClassName?: string
  fill?: boolean
  width?: number
  height?: number
  priority?: boolean
  sizes?: string
}

export function SafeImage({
  src,
  alt,
  fallback = "/logo.png",
  className,
  imgClassName,
  fill,
  width,
  height,
  priority,
  sizes,
}: SafeImageProps) {
  const [error, setError] = useState(false)
  const source = !src || error ? fallback : src

  return (
    <div className={cn("relative overflow-hidden", fill && "absolute inset-0", className)}>
      <Image
        src={source}
        alt={alt}
        fill={fill}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        priority={priority}
        sizes={sizes}
        onError={() => setError(true)}
        className={cn(fill && "object-cover", imgClassName)}
        style={!fill && (width || height) ? { width: "auto", height: "auto" } : undefined}
      />
    </div>
  )
}