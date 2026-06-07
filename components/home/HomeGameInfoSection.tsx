import Image from "next/image";

const pixelTextClass =
  "font-normal leading-snug tracking-normal text-[#2d4143] [font-family:var(--font-pixel)] [font-synthesis:none]";

export default function HomeGameInfoSection() {
  return (
    <>
    <section
      className="bg-[#FDFDF0] py-8 sm:py-12"
      aria-labelledby="home-game-info-heading"
    >
      <div className="mx-auto max-w-5xl px-3 sm:px-5 lg:px-6">
        <h2 id="home-game-info-heading" className="sr-only">
          About the game
        </h2>

        <div className="grid w-full grid-cols-1 items-center gap-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-8 lg:gap-12">
          <div className="flex w-full min-w-0 justify-center md:justify-start">
            <Image
              src="/assets/octopus.png"
              alt=""
              width={420}
              height={420}
              className="h-auto w-[min(72vw,18rem)] max-w-full [image-rendering:pixelated] sm:w-[min(68vw,20rem)] md:w-full md:max-w-80 lg:max-w-88"
              sizes="(max-width: 768px) 288px, 352px"
            />
          </div>

          <div className="flex w-full min-w-0 flex-col items-center gap-6 sm:gap-7 md:items-center">
            <Image
              src="/assets/hazard.png"
              alt=""
              width={80}
              height={80}
              className="h-auto w-12 shrink-0 [image-rendering:pixelated] sm:w-14 md:w-16"
              sizes="64px"
            />

            <blockquote
              className={`${pixelTextClass} w-full text-left text-[0.58rem] leading-relaxed sm:text-[0.62rem] md:text-[0.68rem] lg:text-xs`}
            >
              &ldquo;Every humanitarian crisis today has two fronts:
              <br />
              1. The disaster
              <br />
              2. The misinformation surrounding the disaster&rdquo;
            </blockquote>

            <div
              className={`${pixelTextClass} flex w-full flex-wrap items-center justify-center text-[0.88rem] sm:flex-nowrap sm:text-[0.94rem] md:text-[1rem] lg:text-[1.08rem]`}
            >
              <span className="whitespace-nowrap">A Single Phone</span>
              <Image
                src="/assets/mobile-phone.png"
                alt=""
                width={80}
                height={120}
                className="h-auto w-14 shrink-0 rotate-6 [image-rendering:pixelated] sm:w-16 md:w-18"
                sizes="48px"
              />
              <span className="whitespace-nowrap">Multiplayer Game</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section
      className="bg-[#FDFDF0] pb-8 sm:pb-12"
      aria-labelledby="home-game-video-heading"
    >
      <div className="mx-auto max-w-5xl px-3 sm:px-5 lg:px-6">
        <h2 id="home-game-video-heading" className="sr-only">
          Game video
        </h2>
        <div className="relative aspect-video w-3/4 mx-auto overflow-hidden rounded-lg border-2 border-[#2d4143]">
          <iframe
            src="https://youtu.be/xmk0j-HdgwY?si=MqI9YIlD7-0EsPyu"
            title="Disinformer game video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
      </div>
    </section>
  </>
  );
}
