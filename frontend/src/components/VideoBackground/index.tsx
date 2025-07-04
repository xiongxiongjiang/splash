'use client'

import {useEffect, useRef, useState} from 'react'

interface VideoBackgroundProps {
  className?: string
}

export default function VideoBackground({className = ''}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const retryCountRef = useRef(0)
  const maxRetries = 3

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const loadHLS = async () => {
      try {
        // 检查浏览器是否原生支持HLS
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          console.log('Using native HLS support')
          video.src = '/bg-video/gradient-background.m3u8'
          video.load()
        } else {
          // 动态导入HLS.js
          const Hls = (await import('hls.js')).default

          if (Hls.isSupported()) {
            // 销毁之前的实例
            if (hlsRef.current) {
              hlsRef.current.destroy()
            }

            const hls = new Hls({
              enableWorker: false,
              lowLatencyMode: false,
              // 优化缓冲配置以解决停滞问题
              backBufferLength: 30, // 减少后缓冲长度
              maxBufferLength: 60, // 增加最大缓冲长度
              maxMaxBufferLength: 300, // 减少最大缓冲长度上限
              maxBufferSize: 100 * 1000 * 1000, // 100MB缓冲大小
              maxBufferHole: 0.1, // 减少缓冲洞容忍度
              // 优化片段加载
              fragLoadingTimeOut: 30000,
              fragLoadingMaxRetry: 3,
              fragLoadingRetryDelay: 500,
              // 优化清单加载
              manifestLoadingTimeOut: 15000,
              manifestLoadingMaxRetry: 2,
              manifestLoadingRetryDelay: 500,
              // 启用预取和带宽测试
              startFragPrefetch: true,
              testBandwidth: false, // 关闭带宽测试以减少复杂性
              // 优化播放控制
              nudgeOffset: 0.05,
              nudgeMaxRetry: 5,
              maxFragLookUpTolerance: 0.1,
              // 禁用一些可能导致问题的功能
              debug: false,
              capLevelOnFPSDrop: false,
              capLevelToPlayerSize: false,
            })

            hlsRef.current = hls

            hls.loadSource('/bg-video/gradient-background.m3u8')
            hls.attachMedia(video)

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              // console.log('HLS manifest parsed successfully')
              setIsLoading(false)
              video.play().catch(console.error)
            })

            hls.on(Hls.Events.ERROR, (event: any, data: any) => {
              console.error('HLS error:', data)

              // 处理不同类型的错误
              if (data.fatal) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    console.log('Network error, attempting to recover...')
                    if (retryCountRef.current < maxRetries) {
                      retryCountRef.current++
                      setTimeout(() => {
                        hls.startLoad()
                      }, 1000)
                    } else {
                      setIsLoading(false)
                    }
                    break
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    console.log('Media error, attempting to recover...')
                    if (retryCountRef.current < maxRetries) {
                      retryCountRef.current++
                      hls.recoverMediaError()
                    } else {
                      setIsLoading(false)
                    }
                    break
                  default:
                    console.log('Fatal error, cannot recover')
                    setIsLoading(false)
                    break
                }
              } else {
                // 处理非致命错误
                if (data.type === Hls.ErrorTypes.OTHER_ERROR && data.details === 'bufferStalledError') {
                  console.warn('Buffer stalled, attempting to recover...')
                  // 尝试跳过停滞点
                  if (video.currentTime > 0) {
                    video.currentTime += 0.1
                  }
                  video.play().catch(console.error)
                } else {
                  console.warn('Non-fatal HLS error:', data)
                }
              }
            })

            // 监听缓冲和播放事件
            hls.on(Hls.Events.BUFFER_APPENDED, () => {
              // console.log('Buffer appended')
            })

            hls.on(Hls.Events.BUFFER_EOS, () => {
              // console.log('Buffer end of stream')
            })

            // 监听播放停滞事件
            hls.on(Hls.Events.ERROR, (event: any, data: any) => {
              if (data.details === 'bufferStalledError') {
                console.warn('Buffer stalled detected, seeking forward...')
                if (video.currentTime < video.duration - 1) {
                  video.currentTime += 0.1
                }
              }
            })

            // 监听片段加载事件
            hls.on(Hls.Events.FRAG_LOADED, () => {
              // console.log('Fragment loaded successfully')
            })

            return () => {
              if (hlsRef.current) {
                hlsRef.current.destroy()
                hlsRef.current = null
              }
            }
          } else {
            console.error('HLS is not supported')
            setIsLoading(false)
          }
        }
      } catch (error) {
        console.error('Failed to load HLS:', error)
        setIsLoading(false)
      }
    }

    const handleCanPlay = () => {
      // console.log('Video can play')
      setIsLoading(false)
      video.play().catch(console.error)
    }

    const handleError = () => {
      console.error('Video loading error')
      setIsLoading(false)
    }

    const handleStalled = () => {
      console.warn('Video playback stalled, attempting recovery...')
      // 更积极的恢复策略
      if (video.readyState >= 2) {
        // 尝试跳过停滞点
        if (video.currentTime < video.duration - 1) {
          video.currentTime += 0.1
        }
        video.play().catch(console.error)
      } else if (hlsRef.current) {
        // 如果视频数据不足，重新加载
        hlsRef.current.startLoad()
      }
    }

    const handleWaiting = () => {
      // console.log('Video is waiting for data')
    }

    const handlePlaying = () => {
      // console.log('Video is playing')
      retryCountRef.current = 0 // 重置重试计数
    }

    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('error', handleError)
    video.addEventListener('stalled', handleStalled)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('playing', handlePlaying)

    loadHLS()

    return () => {
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('error', handleError)
      video.removeEventListener('stalled', handleStalled)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('playing', handlePlaying)

      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [])

  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-fill"
        muted
        playsInline
        loop
        preload="metadata" // 改为metadata以减少初始加载
        crossOrigin="anonymous"
        style={{
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.5s ease-in-out',
        }}
      />
    </div>
  )
}
