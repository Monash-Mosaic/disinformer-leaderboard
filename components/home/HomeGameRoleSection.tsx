import Image from "next/image";

const ROLE_ICONS = [
  { src: "/assets/person-1.png", alt: "Disinformer role character" },
  { src: "/assets/person-2.png", alt: "Disinformer role character" },
  { src: "/assets/octopus.png", alt: "Octopus mascot" },
  { src: "/assets/person-3.png", alt: "Informer role character" },
  { src: "/assets/person4.png", alt: "Public role character" },
  { src: "/assets/person-5.png", alt: "Public role character" },
] as const;

const roleLinkClass =
  "underline decoration-2 underline-offset-4 decoration-current";

export default function HomeGameRoleSection() {
  return (
    <section
      className="bg-[#FDFDF0] py-8 sm:py-12"
      aria-labelledby="home-game-role-heading"
    >
      <div className="mx-auto max-w-5xl px-3 sm:px-5 lg:px-6">
        <h2
          id="home-game-role-heading"
          className="text-center font-['Play'] text-lg font-bold leading-snug text-[#2d4143] sm:text-xl md:text-2xl"
        >
          3 Roles:{" "}
          <span className={`${roleLinkClass} text-[#e85d04]`}>Disinformer,</span>{" "}
          <span className={`${roleLinkClass} text-[#317070]`}>Misinformed</span> and{" "}
          <span className={`${roleLinkClass} text-[#317070]`}>Netizen</span>
        </h2>

        <ul className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:mt-10 sm:gap-5 md:gap-6 lg:gap-8">
          {ROLE_ICONS.map((icon) => (
            <li key={icon.src}>
              <Image
                src={icon.src}
                alt={icon.alt}
                width={160}
                height={160}
                className="h-auto w-16 [image-rendering:pixelated] sm:w-18 md:w-20 lg:w-24"
                sizes="(max-width: 640px) 64px, (max-width: 768px) 72px, 96px"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
