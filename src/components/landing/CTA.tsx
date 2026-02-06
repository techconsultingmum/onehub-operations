import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";

export function CTA() {
  return (
    <section className="py-24 relative overflow-hidden" aria-labelledby="cta-heading">
      {/* Background */}
      <div className="absolute inset-0 animated-gradient opacity-90" aria-hidden="true" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem]" aria-hidden="true" />

      <div className="container relative z-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm mb-8" aria-hidden="true">
            <Zap className="w-8 h-8 text-white" />
          </div>

          {/* Heading */}
          <h2 id="cta-heading" className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to streamline your operations?
          </h2>

          {/* Description */}
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-10">
            Join thousands of teams already using ManageX to manage their 
            operations more efficiently. Start free, scale as you grow.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="xl" 
              className="bg-white text-primary hover:bg-white/90 shadow-xl"
              asChild
            >
              <Link to="/auth">
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button 
              size="xl" 
              variant="ghost"
              className="text-white border-2 border-white/30 hover:bg-white/10 hover:border-white/50"
            >
              Schedule Demo
            </Button>
          </div>

          {/* Trust Badge */}
          <p className="text-sm text-white/60 mt-8">
            No credit card required • Free 14-day trial • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}
