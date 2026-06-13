"use client";

import Image from "next/image";
import { useCallback, useId, useState } from "react";

const SLIDES = [
  {
    before: "Choose from a wide range of ",
    highlight: "Categories",
    after: "",
    src: "/assets/carousal-1.png",
    alt: "Disinformer app screen: choose a category",
  },
  {
    before: "Work ",
    highlight: "Together",
    after: " to solve the clue",
    src: "/assets/carousal-2.png",
    alt: "Disinformer app screen: collaborate on the clue",
  },
  {
    before: "Persuade others from the Truth as ",
    highlight: "Disinformer",
    after: "",
    src: "/assets/carousal-3.png",
    alt: "Disinformer app screen: disinformer role",
  },
] as const;

const SLIDE_COUNT = SLIDES.length;

/** Matches carousel image column width so dots line up with the slides. */
const carouselViewportClass = "w-[min(88vw,300px)]";

const SLIDE_IMG = { width: 300, height: 636 } as const;

const slideHeadingClass =
  "mx-auto block max-w-[min(100%,42rem)] text-center font-['Play'] text-lg font-bold leading-snug tracking-tight text-[#2d4143] sm:text-xl md:text-2xl";

const taglineClass =
  "mt-5 text-center font-['Play'] text-base font-bold leading-snug tracking-tight text-[#2d4143] sm:mt-6 sm:text-lg md:text-xl [text-shadow:0_1px_2px_rgba(45,65,67,0.08),0_2px_8px_rgba(45,65,67,0.06)]";

export default function HomeCarouselSection() {
  const labelId = useId();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const last = SLIDE_COUNT - 1;

  const goPrev = useCallback(() => {
    setIndex((i) => (i === 0 ? last : i - 1));
  }, [last]);

  const goNext = useCallback(() => {
    setIndex((i) => (i === last ? 0 : i + 1));
  }, [last]);

  return (
    <section
      className="bg-[#FDFDF0] py-6 outline-none focus-visible:ring-2 focus-visible:ring-[#2d4143]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDFDF0] sm:py-10"
      aria-labelledby={labelId}
      aria-roledescription="carousel"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          goPrev();
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          goNext();
        }
      }}
    >
      <div className="mx-auto max-w-5xl px-3 sm:px-5 lg:px-6">
        <h2
          id={labelId}
          className={slideHeadingClass}
          aria-live="polite"
        >
          {slide.before}
          <span className="text-[#e85d04] underline decoration-[#e85d04] decoration-2 underline-offset-4">
            {slide.highlight}
          </span>
          {slide.after}
        </h2>

        <div className="mt-5 flex flex-col items-center sm:mt-6 md:mt-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4">
            <button
              type="button"
              onClick={goPrev}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border-2 border-[#2d4143] bg-[#ffffef] shadow-[2px_2px_0_#2d4143] transition hover:bg-[#fff8e6] active:translate-x-px active:translate-y-px active:shadow-none sm:h-12 sm:w-12"
              aria-label="Previous slide"
            >
              <Image
                src="/assets/arrow-prev.png"
                alt=""
                width={28}
                height={28}
                className="h-6 w-6 sm:h-7 sm:w-7 [image-rendering:pixelated]"
              />
            </button>

            <div
              className={`relative shrink-0 overflow-hidden ${carouselViewportClass}`}
            >
              <div
                className="flex items-start transition-transform duration-550 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                style={{
                  width: `${SLIDE_COUNT * 100}%`,
                  transform: `translateX(-${(index * 100) / SLIDE_COUNT}%)`,
                }}
              >
                {SLIDES.map((s, i) => (
                  <div
                    key={s.src}
                    className="flex min-w-0 shrink-0 justify-center"
                    style={{ width: `${100 / SLIDE_COUNT}%` }}
                  >
                    <Image
                      src={s.src}
                      alt={s.alt}
                      width={SLIDE_IMG.width}
                      height={SLIDE_IMG.height}
                      sizes="(max-width: 640px) 88vw, 300px"
                      className="h-auto w-full max-w-full [image-rendering:pixelated]"
                      priority={i === 0}
                      draggable={false}
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={goNext}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border-2 border-[#2d4143] bg-[#ffffef] shadow-[2px_2px_0_#2d4143] transition hover:bg-[#fff8e6] active:translate-x-px active:translate-y-px active:shadow-none sm:h-12 sm:w-12"
              aria-label="Next slide"
            >
              <Image
                src="/assets/arrow-next.png"
                alt=""
                width={28}
                height={28}
                className="h-6 w-6 sm:h-7 sm:w-7 [image-rendering:pixelated]"
              />
            </button>
          </div>

          <div
            className={`mt-3 flex justify-center gap-2 sm:mt-4 ${carouselViewportClass}`}
            role="group"
            aria-label="Slide indicators"
          >
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-current={i === index ? true : undefined}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2.5 w-2.5 shrink-0 rounded-full border border-[#2d4143]/30 transition sm:h-3 sm:w-3 ${
                  i === index
                    ? "bg-[#e85d04]"
                    : "bg-[#2d4143]/45 hover:bg-[#2d4143]/60"
                }`}
              />
            ))}
          </div>

          <p className={taglineClass}>
            May the <span className="text-[#317070]">Truth</span> alone Triumph
          </p>
        </div>
      </div>
    </section>
  );
}
