import HomeCarouselSection from "@/components/home/HomeCarouselSection";
import HomeHeroSection from "@/components/home/HomeHeroSection";

export default function HomePage() {
  return (
    <main className="min-h-[calc(100vh-12rem)] bg-[#ffffef] text-[#2d4143]">
      <HomeHeroSection />
      <HomeCarouselSection />
    </main>
  );
}
