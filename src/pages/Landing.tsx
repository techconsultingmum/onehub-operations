import { forwardRef } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

const Landing = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div ref={ref} className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Features />
      <CTA />
      <Footer />
    </div>
  );
});

Landing.displayName = "Landing";

export default Landing;
