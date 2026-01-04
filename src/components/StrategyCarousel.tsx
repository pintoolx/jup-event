import { useState, useEffect } from 'react'

export function StrategyCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const images = ['/standard.svg', '/hedge.svg', '/degen.svg']

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 7000)

    return () => clearInterval(interval)
  }, [currentIndex, images.length])

  return (
    <div className="w-full mt-4 sm:mt-5 overflow-hidden">
      <div className="relative">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((src, index) => (
            <div
              key={index}
              className="w-full flex-shrink-0"
            >
              <img
                src={src}
                alt={`Strategy ${index + 1}`}
                className="w-full h-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Dots indicator */}
      <div className="flex justify-center gap-2 mt-3">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-1.5 rounded-full transition-all ${
              currentIndex === index
                ? 'w-6 bg-[#2050F2]'
                : 'w-1.5 bg-[#2050F2]/30'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

