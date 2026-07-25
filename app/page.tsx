import Navbar from "@/components/layout/Navbar";
import AnnouncementBadge from "@/components/hero/AnnouncementBadge";
import HeroActions from "@/components/hero/HeroActions";
import HeroContent from "@/components/hero/HeroContent";
import FlowHero from "@/components/flow/FlowHero";

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="flex min-h-screen flex-col items-center px-6 pt-36 pb-20">
        <AnnouncementBadge />

        <div className="mt-8">
          <HeroContent />
        </div>

        <HeroActions />

        <div className="mt-16 w-full">
          <FlowHero />
        </div>
      </main>
    </>
  );
}