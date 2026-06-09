"use client"

import { useEffect, useState } from "react"

const DEFAULT_AVATAR = "/profile.jpg"

interface UserAvatarProps {
  src?: string | null
  alt: string
  className?: string
  onLoad?: () => void
}

export function UserAvatar({ src, alt, className, onLoad }: UserAvatarProps) {
  const requestedSource = src || DEFAULT_AVATAR
  const [imageSource, setImageSource] = useState(requestedSource)

  useEffect(() => {
    setImageSource(requestedSource)
  }, [requestedSource])

  return (
    <img
      src={imageSource}
      alt={alt}
      className={className}
      onLoad={onLoad}
      onError={() => {
        if (imageSource !== DEFAULT_AVATAR) setImageSource(DEFAULT_AVATAR)
      }}
    />
  )
}
