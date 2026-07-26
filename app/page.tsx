import Header from "@/components/layout/Header";
import HeroDashboard from "@/components/dashboard/HeroDashboard";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#02040A] text-slate-100 flex flex-col justify-between">
      <Header />
      <HeroDashboard />
      <Footer />
    </main>
  );
}