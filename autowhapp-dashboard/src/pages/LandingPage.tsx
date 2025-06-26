import React from "react";
import LandingHeader from "@/components/LandingHeader";
import HeroSection from "@/components/HeroSection";
import ValuePropositions from "@/components/ValuePropositions";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";
import { Toaster } from "@/components/ui/toaster";

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-autowhapp-blue text-white font-poppins p-4">
      <LandingHeader />
      <HeroSection />
      <ValuePropositions />
      <HowItWorks />
      <Features />
      <Pricing />
      <Testimonials />
      <ContactForm />
      <Footer />
      <Toaster />
      <div className="mt-4 bg-autowhapp-black text-autowhapp-white p-6">Prueba de estilo</div>
    </div>
  );
};

export default LandingPage;