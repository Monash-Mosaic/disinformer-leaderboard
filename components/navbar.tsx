"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Home",
    isActive: (pathname: string) => pathname === "/",
  },
  {
    href: "/leaderboard-offsetbased",
    label: "Leaderboard",
    isActive: (pathname: string) => pathname.startsWith("/leaderboard-offsetbased"),
  },
  {
    href: "#",
    label: "Report Bugs",
    isActive: () => false,
    external: true,
  },
] as const;

function NavLine() {
  return (
    <span
      className="h-px min-w-6 flex-1 bg-[#2d4143]"
      aria-hidden
    />
  );
}

function navLinkClass(active: boolean) {
  return `shrink-0 whitespace-nowrap px-1 font-['Play'] text-lg font-bold sm:text-2xl md:text-[28px] ${
    active ? "text-[#ff4805]" : "text-[#2d4143] hover:text-[#317070]"
  }`;
}

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-[#ffffef] py-4 md:py-5" aria-label="Main navigation">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <NavLine />
        {NAV_ITEMS.map((item) => {
          const active = item.isActive(pathname);
          const className = navLinkClass(active);

          return (
            <Fragment key={item.label}>
              {"external" in item && item.external ? (
                <a href={item.href} className={className}>
                  {item.label}
                </a>
              ) : (
                <Link href={item.href} className={className}>
                  {item.label}
                </Link>
              )}
              <NavLine />
            </Fragment>
          );
        })}
      </div>
    </nav>
  );
}
