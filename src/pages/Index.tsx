import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProblemSection from "@/components/ProblemSection";
import ValueSection from "@/components/ValueSection";
import ActivitiesSection from "@/components/ActivitiesSection";
import TeamSection from "@/components/TeamSection";
import JoinSection from "@/components/JoinSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <ValueSection />
      <ActivitiesSection />
      <TeamSection />
      <JoinSection />
      <FAQSection />
      <Footer />
    </main>
  );
};

export default Index;
