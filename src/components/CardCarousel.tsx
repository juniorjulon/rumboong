import { useRef, useState, useEffect, useCallback, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CardCarouselProps {
  children: ReactNode[];
  arrowColorClass?: string;
}

const CardCarousel = ({ children, arrowColorClass = "text-foreground" }: CardCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-carousel-card]");
    if (!card) return;
    const gap = parseInt(getComputedStyle(el).gap) || 0;
    const cardWidth = card.offsetWidth + gap;
    el.scrollBy({ left: direction === "right" ? cardWidth : -cardWidth, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children.map((child, i) => (
          <div key={i} data-carousel-card className="snap-start shrink-0 w-[85vw] sm:w-[70vw] md:w-auto md:shrink md:snap-align-none">
            {child}
          </div>
        ))}
      </div>

      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur shadow-md flex items-center justify-center hover:bg-background transition-colors ${arrowColorClass}`}
          aria-label="Anterior"
        >
          <ChevronLeft size={20} />
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur shadow-md flex items-center justify-center hover:bg-background transition-colors ${arrowColorClass}`}
          aria-label="Siguiente"
        >
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  );
};

export default CardCarousel;
