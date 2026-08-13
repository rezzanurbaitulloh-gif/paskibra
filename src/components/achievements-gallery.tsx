"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

interface Achievement {
  id: string
  title: string
  category: string
  image: string
  year: string
}

interface AchievementsGalleryProps {
  achievements: Achievement[]
  categories: string[]
}

export function AchievementsGallery({ achievements, categories }: AchievementsGalleryProps) {
  const [activeCategory, setActiveCategory] = useState("All")
  const [selectedImage, setSelectedImage] = useState<Achievement | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const galleryRef = useRef<HTMLDivElement>(null)

  const filteredAchievements = activeCategory === "All"
    ? achievements
    : achievements.filter(achievement => achievement.category === activeCategory)

  const openLightbox = (achievement: Achievement) => {
    setSelectedImage(achievement)
    setCurrentIndex(filteredAchievements.findIndex(a => a.id === achievement.id))
  }

  const closeLightbox = () => {
    setSelectedImage(null)
  }

  const navigateLightbox = (direction: "next" | "prev") => {
    if (!selectedImage) return
    const newIndex = direction === "next"
      ? (currentIndex + 1) % filteredAchievements.length
      : (currentIndex - 1 + filteredAchievements.length) % filteredAchievements.length
    setCurrentIndex(newIndex)
    setSelectedImage(filteredAchievements[newIndex])
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage) return
      if (e.key === "Escape") closeLightbox()
      if (e.key === "ArrowRight") navigateLightbox("next")
      if (e.key === "ArrowLeft") navigateLightbox("prev")
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedImage, currentIndex, filteredAchievements])

  return (
    <section className="py-16 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
          Paskibra Achievements
        </h2>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Our proudest moments and accomplishments
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        {["All", ...categories].map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={twMerge(
              clsx(
                "px-6 py-2 rounded-full text-sm font-medium transition-all duration-300",
                activeCategory === category
                  ? "bg-white text-blue-600 shadow-lg shadow-blue-500/20"
                  : "bg-white/10 text-gray-300 hover:bg-white/20"
              )
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Masonry Grid */}
      <div
        ref={galleryRef}
        className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6"
      >
        <AnimatePresence>
          {filteredAchievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="mb-6 break-inside-avoid-column"
            >
              <div
                className="relative group cursor-pointer overflow-hidden rounded-xl aspect-[3/4] bg-gray-800"
                onClick={() => openLightbox(achievement)}
              >
                <img
                  src={achievement.image}
                  alt={achievement.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-semibold text-lg">{achievement.title}</h3>
                  <p className="text-gray-300 text-sm">{achievement.year}</p>
                </div>
                <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs">{achievement.category}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg"
            onClick={closeLightbox}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full mx-4 bg-white/10 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/20"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 rounded-full p-2 text-white transition-colors"
              >
                <X size={24} />
              </button>

              <div className="relative">
                <img
                  src={selectedImage.image}
                  alt={selectedImage.title}
                  className="w-full h-auto max-h-[80vh] object-contain"
                />

                <button
                  onClick={() => navigateLightbox("prev")}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full p-2 text-white transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>

                <button
                  onClick={() => navigateLightbox("next")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full p-2 text-white transition-colors"
                >
                  <ChevronRight size={24} />
                </button>
              </div>

              <div className="p-6 bg-gradient-to-t from-black/60 to-transparent">
                <h3 className="text-white text-2xl font-bold">{selectedImage.title}</h3>
                <div className="flex gap-4 mt-2 text-gray-300">
                  <span>{selectedImage.year}</span>
                  <span className="bg-white/10 px-3 py-1 rounded-full text-sm">{selectedImage.category}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}