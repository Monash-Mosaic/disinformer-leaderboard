import Image from "next/image";

const comingSoonShadow = [
  "2px 0 0 rgba(45, 65, 67, 0.35)",
  "0 2px 0 rgba(45, 65, 67, 0.35)",
  "2px 2px 0 rgba(45, 65, 67, 0.28)",
  "4px 0 0 rgba(45, 65, 67, 0.2)",
  "0 4px 0 rgba(45, 65, 67, 0.2)",
  "4px 4px 0 rgba(45, 65, 67, 0.14)",
  "6px 6px 0 rgba(31, 38, 38, 0.12)",
].join(", ");

const taglineShadow = "0 1px 2px rgba(45, 65, 67, 0.06), 0 2px 8px rgba(45, 65, 67, 0.05)";

const comingSoonWordmarkClass =
  "text-center text-[clamp(1.15rem,4.5vw,2.35rem)] font-normal leading-tight tracking-tight [font-family:var(--font-pixel)]";

const disinformerTitleClass =
  "text-center text-[clamp(1.85rem,7.25vw,3.85rem)] font-normal leading-none [font-family:var(--font-bungee-shade)] text-[#2d4143]";

const pixelImg =
  "h-auto w-full max-w-[min(100%,5rem)] [image-rendering:pixelated] sm:max-w-[6.25rem] md:max-w-[7.25rem] lg:max-w-[8.5rem]";

export default function HomeHeroSection() {
  return (
    <section
      className="relative bg-[#FDFDF0] pb-8 pt-6 sm:pb-10 sm:pt-10"
      aria-labelledby="home-hero-title"
    >
      <div className="relative mx-auto max-w-5xl px-2 sm:px-4 md:px-6 lg:px-8">
        <div
          className="grid min-h-[min(48vh,26rem)] w-full grid-cols-[minmax(0,4.25rem)_1fr_minmax(0,4.25rem)] items-stretch gap-x-1 min-[400px]:grid-cols-[minmax(0,5rem)_1fr_minmax(0,5rem)] min-[400px]:gap-x-2 sm:min-h-[min(48vh,30rem)] sm:grid-cols-[minmax(0,5.75rem)_1fr_minmax(0,5.75rem)] sm:gap-x-3 md:grid-cols-[minmax(0,7rem)_1fr_minmax(0,7rem)] md:gap-x-4 lg:grid-cols-[minmax(0,8.5rem)_1fr_minmax(0,8.5rem)]"
        >
          <div
            className="pointer-events-none z-0 flex min-w-0 flex-col items-center justify-between gap-6 py-3 sm:gap-8 sm:py-5"
            aria-hidden
          >
            <Image
              src="/assets/rabbit.png"
              alt=""
              width={160}
              height={160}
              className={`${pixelImg} shrink-0`}
              sizes="(max-width: 480px) 64px, (max-width: 768px) 88px, 112px"
              priority
            />
            <Image
              src="/assets/brain.png"
              alt=""
              width={160}
              height={160}
              className={`${pixelImg} shrink-0`}
              sizes="(max-width: 480px) 64px, (max-width: 768px) 88px, 112px"
              priority
            />
          </div>

          <div className="relative z-10 mx-auto flex w-full min-w-0 max-w-2xl flex-col items-center px-1 pt-1 sm:px-3 sm:pt-2">
            <Image
              src="/assets/search-icon.png"
              alt=""
              width={360}
              height={360}
              className="h-auto w-[min(78vw,16.5rem)] [image-rendering:pixelated] sm:w-[min(72vw,19rem)] md:w-88"
              sizes="(max-width: 640px) 264px, 352px"
              priority
            />

            <h1
              id="home-hero-title"
              className={`${disinformerTitleClass} mt-4 sm:mt-6`}
              style={{
                letterSpacing: "1%",
                textShadow: "0 1px 2px rgba(45, 65, 67, 0.06), 0 2px 8px rgba(45, 65, 67, 0.05)",
              }}
            >
              DISINFORMER
            </h1>

            <p
              className="mt-4 max-w-xl text-center font-['Play'] font-semibold leading-snug tracking-tight text-[#e85d04] sm:mt-5 sm:text-[1.28rem] md:text-[1.58rem]"
              style={{ textShadow: taglineShadow }}
            >
              Compete in the age of misinformation
            </p>

            <p
              className={`${comingSoonWordmarkClass} mt-10 sm:mt-12 text-[#2d4143]`}
              style={{ textShadow: comingSoonShadow }}
            >
              COMING SOON
            </p>
          </div>

          <div
            className="pointer-events-none z-0 flex min-w-0 flex-col items-center justify-between gap-6 py-3 sm:gap-8 sm:py-5"
            aria-hidden
          >
            <Image
              src="/assets/question.png"
              alt=""
              width={160}
              height={160}
              className={`${pixelImg} shrink-0`}
              sizes="(max-width: 480px) 64px, (max-width: 768px) 88px, 112px"
              priority
            />
            <Image
              src="/assets/video-game.png"
              alt=""
              width={160}
              height={160}
              className={`${pixelImg} shrink-0`}
              sizes="(max-width: 480px) 64px, (max-width: 768px) 88px, 112px"
              priority
            />
          </div>
        </div>
      </div>

      <div
        className="mx-auto mt-8 h-0.5 w-[90%] max-w-full bg-[#2d4143] shadow-[0_2px_6px_rgba(45,65,67,0.35),0_1px_3px_rgba(0,0,0,0.12)] sm:mt-10"
        aria-hidden
      />
    </section>
  );
}
