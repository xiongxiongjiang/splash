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
          console.log('Using HLS.js')

          // 动态导入HLS.js
          const Hls = (await import('hls.js')).default

          if (Hls.isSupported()) {
            // 销毁之前的实例
            if (hlsRef.current) {
              hlsRef.current.destroy()
            }

            const hls = new Hls({
              enableWorker: false,
              lowLatencyMode: false, // 关闭低延迟模式以提高稳定性
              backBufferLength: 90, // 增加后缓冲长度
              maxBufferLength: 30, // 设置最大缓冲长度
              maxMaxBufferLength: 600, // 设置最大缓冲长度上限
              maxBufferSize: 60 * 1000 * 1000, // 60MB缓冲大小
              maxBufferHole: 0.5, // 缓冲洞的最大长度
              highBufferWatchdogPeriod: 2, // 高缓冲监控周期
              nudgeOffset: 0.1, // 微调偏移
              nudgeMaxRetry: 3, // 最大微调重试次数
              maxFragLookUpTolerance: 0.25, // 片段查找容差
              liveSyncDurationCount: 3, // 直播同步持续时间计数
              liveMaxLatencyDurationCount: Infinity, // 直播最大延迟持续时间计数
              liveDurationInfinity: false, // 直播持续时间无限
              liveBackBufferLength: Infinity, // 直播后缓冲长度
              maxLiveSyncPlaybackRate: 1, // 最大直播同步播放速率
              manifestLoadingTimeOut: 10000, // 清单加载超时
              manifestLoadingMaxRetry: 1, // 清单加载最大重试次数
              manifestLoadingRetryDelay: 1000, // 清单加载重试延迟
              fragLoadingTimeOut: 20000, // 片段加载超时
              fragLoadingMaxRetry: 6, // 片段加载最大重试次数
              fragLoadingRetryDelay: 1000, // 片段加载重试延迟
              startFragPrefetch: true, // 启动片段预取
              testBandwidth: true, // 测试带宽
            })

            hlsRef.current = hls

            hls.loadSource('/bg-video/gradient-background.m3u8')
            hls.attachMedia(video)

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              console.log('HLS manifest parsed successfully')
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
                // 非致命错误，记录但不停止播放
                console.warn('Non-fatal HLS error:', data)
              }
            })

            // 监听缓冲事件
            hls.on(Hls.Events.BUFFER_APPENDED, () => {
              console.log('Buffer appended')
            })

            hls.on(Hls.Events.BUFFER_EOS, () => {
              console.log('Buffer end of stream')
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
      console.log('Video can play')
      setIsLoading(false)
      video.play().catch(console.error)
    }

    const handleError = () => {
      console.error('Video loading error')
      setIsLoading(false)
    }

    const handleStalled = () => {
      console.warn('Video playback stalled')
      // 尝试重新开始播放
      if (video.readyState >= 2) {
        video.play().catch(console.error)
      }
    }

    const handleWaiting = () => {
      console.log('Video is waiting for data')
    }

    const handlePlaying = () => {
      console.log('Video is playing')
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
