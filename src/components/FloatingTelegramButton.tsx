import { useState, useEffect, useRef } from 'react'
import { ChevronUp, ChevronDown, MessageCircle, Bot } from 'lucide-react'

export function FloatingTelegramButton() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  // Check if user is at bottom of page (for mobile)
  useEffect(() => {
    function handleScroll() {
      // Keep visible if menu is expanded
      if (isExpanded) {
        setIsVisible(true)
        return
      }

      // Only apply on mobile (screen width < 768px)
      if (window.innerWidth >= 768) {
        setIsVisible(true)
        return
      }

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      // Show button when within 100px of bottom
      const threshold = 100
      const isAtBottom = scrollTop + windowHeight >= documentHeight - threshold

      setIsVisible(isAtBottom)
    }

    // Check on mount
    handleScroll()

    // Listen to scroll events
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [isExpanded])

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
      }
    }

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isExpanded])

  if (!isVisible) return null

  return (
    <div ref={containerRef} className="fixed bottom-10 right-10 sm:right-auto sm:left-6 z-50">
      {/* Expanded Menu */}
      {isExpanded && (
        <div className="absolute bottom-full right-0 sm:right-auto sm:left-0 mb-2 space-y-2 animate-fade-in">
          {/* PinTool Bot Button */}
          <a
            href="https://t.me/PinTool_Bot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#E4EAF2] text-[#0E0F28] outline outline-2 outline-[#0E0F28] shadow-[0px_2px_0px_black] hover:-translate-y-[1px] hover:shadow-[0px_3px_0px_black] active:translate-y-[1px] active:shadow-[0px_1px_0px_black] transition-all duration-200 font-bold text-sm uppercase tracking-wider whitespace-nowrap"
          >
            <Bot className="w-5 h-5" />
            <span>PinTool Bot</span>
          </a>

          {/* PinTool Community Button */}
          <a
            href="https://t.me/pintoolfam"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#E4EAF2] text-[#0E0F28] outline outline-2 outline-[#0E0F28] shadow-[0px_2px_0px_black] hover:-translate-y-[1px] hover:shadow-[0px_3px_0px_black] active:translate-y-[1px] active:shadow-[0px_1px_0px_black] transition-all duration-200 font-bold text-sm uppercase tracking-wider whitespace-nowrap"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Community</span>
          </a>
        </div>
      )}

      {/* Main Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="group flex items-center justify-center w-14 h-14 rounded-xl bg-[#E4EAF2] outline outline-2 outline-[#0E0F28] shadow-[0px_2px_0px_black] hover:-translate-y-[1px] hover:shadow-[0px_3px_0px_black] active:translate-y-[1px] active:shadow-[0px_1px_0px_black] transition-all duration-200"
        title="Telegram Options"
      >
        {isExpanded ? (
          <ChevronDown className="w-7 h-7 text-[#0E0F28]" />
        ) : (
          <ChevronUp className="w-7 h-7 text-[#0E0F28]" />
        )}
      </button>
    </div>
  )
}

