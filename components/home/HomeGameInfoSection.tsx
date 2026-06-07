import Image from "next/image";
import Link from "next/link";

const bodyTextClass =
  "font-['Play'] font-bold leading-snug tracking-tight text-[#2d4143]";

const dividerClass =
  "mx-auto h-0.5 w-[90%] max-w-full bg-[#2d4143] shadow-[0_2px_6px_rgba(45,65,67,0.35),0_1px_3px_rgba(0,0,0,0.12)]";

export default function HomeGameInfoSection() {
  return (
    <>
      <section
        className="bg-[#FDFDF0]"
        aria-labelledby="home-game-info-heading"
      >
        <div className="mx-auto max-w-5xl px-3 py-8 sm:px-5 sm:py-10 lg:px-6">
          <div className="grid w-full grid-cols-1 items-center md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <div className="flex w-full min-w-0 justify-center md:justify-start">
              <Image
                src="/assets/octopus.png"
                alt=""
                width={420}
                height={420}
                className="h-auto w-[min(65vw,16rem)] max-w-full [image-rendering:pixelated] sm:w-[min(60vw,18rem)] md:w-full md:max-w-72 lg:max-w-80"
                sizes="(max-width: 768px) 256px, 320px"
              />
            </div>

            <blockquote
              className={`${bodyTextClass} w-full text-center text-lg sm:text-xl md:text-[1.35rem] lg:text-[1.5rem]`}
            >
              In this game, players work together
              <br className="hidden sm:inline" />
              <span className="sm:hidden"> </span>
              under time limit to uncover the
              <br className="hidden sm:inline" />
              <span className="sm:hidden"> </span>
              original prompt, while contending
              <br className="hidden sm:inline" />
              <span className="sm:hidden"> </span>
              with a disruptive &ldquo;Disinformer&rdquo;
            </blockquote>
          </div>

          <p
            className={`${bodyTextClass} mt-8 text-center text-base sm:mt-10 sm:text-lg md:text-xl`}
          >
            Learn more about misinformation{" "}
            <Link
              target="_blank"
              href="https://wdr26.org/en"
              className="text-[#e85d04] underline decoration-[#e85d04] decoration-2 underline-offset-4"
            >
              here
            </Link>
          </p>
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
          <div className="relative mx-auto aspect-video w-full max-w-3xl overflow-hidden rounded-lg border-2 border-[#2d4143]">
            <iframe
              src="https://www.youtube.com/embed/xmk0j-HdgwY"
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
