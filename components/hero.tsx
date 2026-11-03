"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, Variants, AnimatePresence } from "framer-motion"
import { AuthStorage } from "@/lib/auth-storage"
import { useEffect, useRef, useState, useCallback } from "react"
import Image from "next/image"

interface HeroImage {
  id: string
  image_url: string
  link_url?: string
}

export function Hero() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const [images, setImages] = useState<HeroImage[]>([])
  const [intervalMs, setIntervalMs] = useState(3500)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch("/api/hero")
        const data = await res.json()
        if (data.images && data.images.length > 0) {
          setImages(data.images)
        }
        if (data.interval) {
          setIntervalMs(data.interval)
        }
      } catch (error) {
        console.error("Error fetching hero images:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchImages()
  }, [])

  const nextSlide = useCallback(() => {
    if (images.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }
  }, [images.length])

  const prevSlide = useCallback(() => {
    if (images.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    }
  }, [images.length])

  // Auto-slide
  useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(nextSlide, intervalMs)
      return () => clearInterval(interval)
    }
  }, [images.length, nextSlide, intervalMs])

  useEffect(() => {
    // Play background video
    if (videoRef.current) {
      videoRef.current.defaultMuted = true
      videoRef.current.muted = true
      videoRef.current.play().catch(e => console.log("Autoplay did not start:", e))
    }
  }, [])

  const handleVenderClick = () => {
    const session = AuthStorage.getSession()
    if (session) {
      router.push("/dashboard/mis-publicaciones")
    } else {
      router.push("/auth")
    }
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      }
    }
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 80,
        damping: 15,
      }
    }
  }

  return (
    <section className="relative w-full min-h-[75svh] lg:min-h-screen flex items-center overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 w-full h-full z-0">
        <video
          ref={videoRef}
          src="https://szazlttrgsgcpwqatpwx.supabase.co/storage/v1/object/public/media/184808-874264370.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Video Overlay: Aún más claro */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-[85rem] mx-auto px-6 sm:px-10 lg:px-16 pt-24 pb-12 lg:pt-20 lg:pb-0 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        
        {/* Left Column: Text and Buttons */}
        <motion.div 
          className="flex flex-col items-start text-left w-full lg:w-[50%] xl:w-[45%] space-y-7"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Main Title */}
          <motion.h1 variants={itemVariants} className="text-[3.5rem] sm:text-7xl lg:text-[5rem] xl:text-[6rem] font-black text-white leading-[1.05] tracking-tighter drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
            Conecta<br />
            el campo<br />
            con el mundo.
          </motion.h1>

          {/* Description */}
          <motion.p variants={itemVariants} className="text-base sm:text-lg text-white leading-relaxed max-w-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            La plataforma B2B agrícola global que conecta a productores y compradores mayoristas internacionales. Del campo a tu negocio, nosotros gestionamos todo el proceso con total transparencia.
          </motion.p>

          {/* Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pt-4 w-full">
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/85 text-white font-bold px-8 h-14 rounded-2xl shadow-[0_0_32px_rgba(139,198,70,0.35)] hover:shadow-[0_0_48px_rgba(139,198,70,0.5)] hover:-translate-y-1 transition-all duration-300 text-base"
            >
              <Link href="/productos">
                Buscar Proveedores
              </Link>
            </Button>
            <button
              onClick={handleVenderClick}
              className="relative inline-flex items-center justify-center px-6 h-14 rounded-2xl font-semibold text-base text-white bg-black hover:bg-neutral-900 cursor-pointer select-none group hover:-translate-y-1 transition-all duration-300 shadow-xl hover:shadow-2xl border border-neutral-800"
            >
              <span className="relative z-10">Vender mis productos</span>
            </button>
          </motion.div>
        </motion.div>

        {/* Right Column: Banners Carousel */}
        {!isLoading && images.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5, type: "spring" }}
            className="hidden lg:block w-full lg:w-[50%] xl:w-[55%] relative"
          >
            <div className="relative w-full aspect-[16/7] sm:aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-black/10 backdrop-blur-sm group">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 w-full h-full"
                >
                  {images[currentIndex].link_url ? (
                    <Link href={images[currentIndex].link_url as string} className="w-full h-full block">
                      <Image
                        src={images[currentIndex].image_url}
                        alt="Promotional Banner"
                        fill
                        className="object-cover transition-transform duration-700 hover:scale-105"
                        priority
                      />
                    </Link>
                  ) : (
                    <Image
                      src={images[currentIndex].image_url}
                      alt="Promotional Banner"
                      fill
                      className="object-cover"
                      priority
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Controls */}
              {images.length > 1 && (
                <>
                  <button 
                    onClick={(e) => { e.preventDefault(); prevSlide(); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/20 hover:bg-black/50 text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 shadow-xl"
                    aria-label="Anterior imagen"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={(e) => { e.preventDefault(); nextSlide(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/20 hover:bg-black/50 text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 shadow-xl"
                    aria-label="Siguiente imagen"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>

                  {/* Dots Pagination */}
                  <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3 z-20">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => { e.preventDefault(); setCurrentIndex(idx); }}
                        className={`transition-all duration-300 rounded-full bg-white shadow-md ${
                          idx === currentIndex ? "w-8 h-2 opacity-100" : "w-2 h-2 opacity-50 hover:opacity-80 hover:scale-110"
                        }`}
                        aria-label={`Ir a imagen ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}

      </div>
    </section>
  )
}
