'use client'

import {useEffect, useRef, useState} from 'react'

interface VideoBackgroundProps {
  className?: string
}

export default function VideoBackground({className = ''}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const loadHLS = async () => {
      try {
        // 检查浏览器是否原生支持HLS
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          console.log(1)

          video.src = '/bg-video/gradient-background.m3u8'
          video.load()
        } else {
          console.log(2)

          // 动态导入HLS.js
          const Hls = (await import('hls.js')).default

          if (Hls.isSupported()) {
            const hls = new Hls({
              enableWorker: false,
              lowLatencyMode: true,
            })

            hls.loadSource('/bg-video/gradient-background.m3u8')
            hls.attachMedia(video)

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              setIsLoading(false)
              video.play().catch(console.error)
            })

            hls.on(Hls.Events.ERROR, (event: any, data: any) => {
              console.error('HLS error:', data)
              setHasError(true)
              setIsLoading(false)
            })

            return () => {
              hls.destroy()
            }
          } else {
            console.error('HLS is not supported')
            setHasError(true)
            setIsLoading(false)
          }
        }
      } catch (error) {
        console.error('Failed to load HLS:', error)
        setHasError(true)
        setIsLoading(false)
      }
    }

    const handleCanPlay = () => {
      setIsLoading(false)
      video.play().catch(console.error)
    }

    const handleError = () => {
      console.error('Video loading error')
      setHasError(true)
      setIsLoading(false)
    }

    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('error', handleError)

    loadHLS()

    return () => {
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('error', handleError)
    }
  }, [])

  // 如果有错误，显示简单的渐变背景
  if (hasError) {
    return (
      <div className={`fixed inset-0 -z-10 overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-blue-900/30 to-indigo-900/30" />
      </div>
    )
  }

  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-fill"
        muted
        playsInline
        loop
        preload="auto"
        style={{opacity: isLoading ? 0 : 1}}
      />
    </div>
  )
}
