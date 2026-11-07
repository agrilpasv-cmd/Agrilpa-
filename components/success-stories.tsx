"use client"
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const testimonials = [
  {
    name: "Alfredo Gruber",
    initials: "AG",
    color: "#1f6f43",
    type: "Productor de Café",
    country: "Guatemala",
    quote: "Gracias a Agrilpa, logramos exportar nuestro café orgánico a Francia. En 3 meses duplicamos nuestros ingresos.",
    achievement: "Acceso al mercado europeo",
  },
  {
    name: "Mateo Lindqvist",
    initials: "ML",
    color: "#1e4d8c",
    type: "Exportador de Frutas",
    country: "Ecuador",
    quote: "Conectamos con compradores en Alemania que buscaban piña golden. Ahora exportamos 100 toneladas mensuales.",
    achievement: "Nuevo mercado en Alemania",
  },
  {
    name: "Carlos Mendoza",
    initials: "CM",
    color: "#b45309",
    type: "Productor de Quinoa",
    country: "Perú",
    quote: "Encontramos compradores para nuestra quinoa orgánica en España e Italia. La plataforma nos cambió el negocio.",
    achievement: "Expansión a 2 países europeos",
  },
  {
    name: "Sofía Keller",
    initials: "SK",
    color: "#6d28d9",
    type: "Productora de Aguacate",
    country: "México",
    quote: "Agrilpa nos ayudó a llegar a distribuidores en Reino Unido. Nuestra producción tiene ahora un mercado asegurado.",
    achievement: "Contrato anual en UK",
  },
  {
    name: "Diego Santamaría",
    initials: "DS",
    color: "#0f766e",
    type: "Comercializador Agrícola",
    country: "Honduras",
    quote: "Cerramos un acuerdo con una cadena hotelera en Dubái para suministrar frutas tropicales todo el año.",
    achievement: "Mercado en Medio Oriente",
  },
  {
    name: "Elena Moreau",
    initials: "EM",
    color: "#9d174d",
    type: "Productora Pecuaria",
    country: "Colombia",
    quote: "Vendemos carne premium a restaurantes en Suiza. La trazabilidad de Agrilpa nos dio credibilidad internacional.",
    achievement: "Exportación a Suiza",
  },
  {
    name: "Henrik Becker",
    initials: "HB",
    color: "#374151",
    type: "Cultivos Orgánicos",
    country: "Nicaragua",
    quote: "Accedimos a certificadores y compradores europeos que valoraron nuestras prácticas sostenibles.",
    achievement: "Certificación europea",
  },
  {
    name: "Valeria Castellanos",
    initials: "VC",
    color: "#0369a1",
    type: "Productora de Caña",
    country: "El Salvador",
    quote: "Conectamos con importadores en Japón a través de Agrilpa. Su equipo gestionó el proceso comercial y mejoramos nuestros márgenes.",
    achievement: "Exportación a Japón",
  },
  {
    name: "Lucas Vandergucht",
    initials: "LV",
    color: "#4338ca",
    type: "Productor de Mango",
    country: "Costa Rica",
    quote: "Exportamos mango a Canadá por primera vez. Agrilpa nos conectó con el comprador ideal en menos de 2 semanas.",
    achievement: "Primer envío a Canadá",
  },
  {
    name: "Andrés Montenegro",
    initials: "AM",
    color: "#15803d",
    type: "Exportador de Berries",
    country: "Chile",
    quote: "Consolidamos ventas de arándanos a 5 países europeos. La plataforma centralizó toda nuestra operación de exportación.",
    achievement: "5 mercados europeos",
  },
  {
    name: "Gabriela Salvatierra",
    initials: "GS",
    color: "#b91c1c",
    type: "Procesadora de Granos",
    country: "Bolivia",
    quote: "Vendemos harina de quinoa a distribuidores en Australia. Nunca pensamos llegar tan lejos.",
    achievement: "Expansión a Oceanía",
  },
  {
    name: "Camila Rossi",
    initials: "CR",
    color: "#7e22ce",
    type: "Productora Vitivinícola",
    country: "Argentina",
    quote: "Conectamos con importadores premium en Dinamarca y Noruega. Nuestros vinos ya están en tiendas escandinavas.",
    achievement: "Mercados nórdicos",
  },
];

const getVisibleCount = (width: number): number => {
  if (width >= 1280) return 6;
  if (width >= 1024) return 4;
  if (width >= 768) return 2;
  return 1;
};

export function SuccessStories() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      const newWidth = window.innerWidth;
      setWindowWidth(newWidth);
      
      const oldVisibleCount = getVisibleCount(windowWidth);
      const newVisibleCount = getVisibleCount(newWidth);
      
      if (oldVisibleCount !== newVisibleCount) {
        const maxIndexForNewWidth = Math.max(0, testimonials.length - newVisibleCount);
        if (currentIndex > maxIndexForNewWidth) {
          setCurrentIndex(maxIndexForNewWidth);
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [windowWidth, currentIndex]);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const startAutoPlay = () => {
      autoPlayRef.current = setInterval(() => {
        const visibleCount = getVisibleCount(windowWidth);
        const maxIndex = Math.max(0, testimonials.length - visibleCount);

        setCurrentIndex((prev) => {
          if (prev >= maxIndex) {
            return 0;
          }
          return prev + 1;
        });
      }, 4000);
    };

    startAutoPlay();

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, windowWidth]);

  const visibleCount = getVisibleCount(windowWidth);
  const maxIndex = Math.max(0, testimonials.length - visibleCount);

  const goNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    pauseAutoPlay();
  };

  const goPrev = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
    pauseAutoPlay();
  };

  const pauseAutoPlay = () => {
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  const handleDragEnd = (event: any, info: any) => {
    const { offset } = info;
    const swipeThreshold = 30;

    if (offset.x < -swipeThreshold) {
      goNext();
    } else if (offset.x > swipeThreshold) {
      goPrev();
    }
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    pauseAutoPlay();
  };

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-white/30 backdrop-blur-xl overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-12 md:mb-16">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary font-medium text-xs sm:text-sm uppercase tracking-wider mb-3">
            Impacto en Comercio Internacional
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Escenarios de Éxito en Exportación e Importación Agrícola
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ejemplos representativos de cómo productores y exportadores conectan con compradores mayoristas internacionales a través de Agrilpa
          </p>
        </motion.div>
      </div>

      <div className="w-full relative px-2 sm:px-4" ref={containerRef}>
        <div className="max-w-[1400px] mx-auto relative mb-6 sm:mb-0">
          <div className="flex justify-center sm:justify-end sm:absolute sm:-top-24 right-4 sm:right-6 lg:right-8 space-x-2 z-10">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={goPrev}
              className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50 text-primary transition-all duration-300"
              aria-label="Testimonio anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={goNext}
              className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50 text-primary transition-all duration-300"
              aria-label="Siguiente testimonio"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        <div className="overflow-hidden relative">
          <motion.div
            className="flex"
            animate={{ x: `-${currentIndex * (100 / visibleCount)}%` }}
            transition={{ 
              type: 'spring', 
              stiffness: 70, 
              damping: 20 
            }}
          >
            {testimonials.map((testimonial, idx) => (
              <motion.div
                key={idx}
                className="flex-shrink-0 px-2"
                style={{ width: `${100 / visibleCount}%` }}
                initial={{ opacity: 0.5, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.98, cursor: 'grabbing' }}
              >
                <motion.div 
                  className="relative overflow-hidden rounded-2xl p-5 h-full bg-white border border-gray-100 shadow-lg shadow-primary/5 cursor-grab flex flex-col"
                  whileHover={{
                    boxShadow: "0 10px 20px -5px rgba(139, 198, 70, 0.15), 0 4px 6px -2px rgba(139, 198, 70, 0.05)"
                  }}
                >
                  {/* Achievement badge */}
                  <div className="mb-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded-lg">
                      ✦ {testimonial.achievement}
                    </span>
                  </div>

                  <div className="absolute top-2 right-2 opacity-5 pointer-events-none">
                    <Quote size={60} className="text-primary" />
                  </div>
                  
                  <div className="relative z-10 flex-1 flex flex-col">
                    <p className="text-[13px] sm:text-sm text-gray-700 font-medium mb-6 leading-relaxed flex-1">
                      &ldquo;{testimonial.quote}&rdquo;
                    </p>
                    
                    <div className="mt-auto pt-4 border-t border-gray-100">
                      <div className="flex items-center">
                        <div className="relative flex-shrink-0">
                          <div
                            className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex-shrink-0 flex items-center justify-center text-white font-bold text-xs tracking-wide select-none"
                            style={{ backgroundColor: testimonial.color }}
                            aria-hidden="true"
                          >
                            {testimonial.initials}
                          </div>
                        </div>
                        <div className="ml-3">
                          <h4 className="font-bold text-sm text-gray-900 leading-tight line-clamp-1" title={testimonial.name}>
                            {testimonial.name}
                          </h4>
                          <p className="text-gray-500 text-[11px] mt-0.5 line-clamp-1">
                            {testimonial.type} · {testimonial.country}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
            
        <div className="flex justify-center mt-8">
          {Array.from({ length: testimonials.length - visibleCount + 1 }, (_: any, index: any) => (
            <motion.button
              key={index}
              onClick={() => goToSlide(index)}
              className="relative mx-1 focus:outline-none"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              aria-label={`Ir al testimonio ${index + 1}`}
            >
              <motion.div
                className={`w-2 h-2 rounded-full ${
                  index === currentIndex 
                    ? 'bg-primary' 
                    : 'bg-gray-300'
                }`}
                animate={{ 
                  scale: index === currentIndex ? [1, 1.2, 1] : 1
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: index === currentIndex ? Infinity : 0,
                  repeatDelay: 1
                }}
              />
              {index === currentIndex && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary/30"
                  animate={{ 
                    scale: [1, 1.8],
                    opacity: [1, 0] 
                  }}
                  transition={{ 
                    duration: 1.5,
                    repeat: Infinity,
                  }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
