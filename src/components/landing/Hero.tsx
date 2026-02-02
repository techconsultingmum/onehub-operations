import { forwardRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles, ChevronDown, Building2, Factory, GraduationCap, HeartPulse, Truck, ShoppingBag, Briefcase, Hammer, Leaf, Plane, Utensils, Film, Landmark, Cpu, Home } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const industries = [
  { value: "sme", label: "Small & Medium Enterprises", icon: Building2 },
  { value: "manufacturing", label: "Manufacturing & Production", icon: Factory },
  { value: "healthcare", label: "Healthcare & Medical", icon: HeartPulse },
  { value: "education", label: "Education & Training", icon: GraduationCap },
  { value: "logistics", label: "Logistics & Supply Chain", icon: Truck },
  { value: "retail", label: "Retail & E-commerce", icon: ShoppingBag },
  { value: "consulting", label: "Consulting & Professional Services", icon: Briefcase },
  { value: "construction", label: "Construction & Real Estate", icon: Hammer },
  { value: "agriculture", label: "Agriculture & Farming", icon: Leaf },
  { value: "travel", label: "Travel & Hospitality", icon: Plane },
  { value: "food", label: "Food & Beverage", icon: Utensils },
  { value: "media", label: "Media & Entertainment", icon: Film },
  { value: "finance", label: "Finance & Banking", icon: Landmark },
  { value: "technology", label: "Technology & IT", icon: Cpu },
  { value: "property", label: "Property Management", icon: Home },
];

const managementTypes = [
  { value: "project", label: "Project Management" },
  { value: "task", label: "Task & Workflow Management" },
  { value: "team", label: "Team & HR Management" },
  { value: "resource", label: "Resource & Asset Management" },
  { value: "inventory", label: "Inventory Management" },
  { value: "customer", label: "Customer Relationship (CRM)" },
  { value: "sales", label: "Sales & Pipeline Management" },
  { value: "finance", label: "Financial Management" },
  { value: "operations", label: "Operations Management" },
  { value: "quality", label: "Quality Control & Assurance" },
  { value: "compliance", label: "Compliance & Risk Management" },
  { value: "supply", label: "Supply Chain Management" },
  { value: "vendor", label: "Vendor & Procurement" },
  { value: "facility", label: "Facility Management" },
  { value: "time", label: "Time & Attendance Tracking" },
  { value: "performance", label: "Performance Management" },
  { value: "document", label: "Document Management" },
  { value: "communication", label: "Communication & Collaboration" },
];

export const Hero = forwardRef<HTMLElement>((_, ref) => {
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");
  const [selectedManagement, setSelectedManagement] = useState<string>("");

  const canStart = selectedIndustry && selectedManagement;

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-accent/30" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      <div className="container relative z-10 px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-primary/20 text-sm font-medium mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Introducing ManageX 1.0</span>
            <span className="text-primary">— Now Live</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            One platform to manage{" "}
            <span className="text-gradient">every industry</span>
            <br />
            <span className="text-muted-foreground">every operation</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Centralize your operations, coordinate teams, and scale your business with
            our unified management platform. Built for SMEs to enterprises across every sector.
          </p>

          {/* Industry & Management Selectors */}
          <div className="max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "0.25s" }}>
            <div className="p-6 rounded-2xl bg-card/80 backdrop-blur-xl border border-border shadow-lg">
              <p className="text-sm text-muted-foreground mb-4">Select your industry and management needs to get started</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Industry Dropdown */}
                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                  <SelectTrigger className="h-12 bg-background border-border text-left">
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border max-h-80 z-50">
                    <SelectGroup>
                      <SelectLabel className="text-muted-foreground">Industries</SelectLabel>
                      {industries.map((industry) => {
                        const Icon = industry.icon;
                        return (
                          <SelectItem 
                            key={industry.value} 
                            value={industry.value}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-primary" />
                              <span>{industry.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                {/* Management Type Dropdown */}
                <Select value={selectedManagement} onValueChange={setSelectedManagement}>
                  <SelectTrigger className="h-12 bg-background border-border text-left">
                    <SelectValue placeholder="Select management type" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border max-h-80 z-50">
                    <SelectGroup>
                      <SelectLabel className="text-muted-foreground">Management Types</SelectLabel>
                      {managementTypes.map((type) => (
                        <SelectItem 
                          key={type.value} 
                          value={type.value}
                          className="cursor-pointer"
                        >
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Summary */}
              {(selectedIndustry || selectedManagement) && (
                <div className="text-sm text-muted-foreground mb-4 p-3 rounded-lg bg-accent/50">
                  {selectedIndustry && (
                    <span className="inline-flex items-center gap-1 mr-2">
                      <span className="text-foreground font-medium">
                        {industries.find(i => i.value === selectedIndustry)?.label}
                      </span>
                    </span>
                  )}
                  {selectedIndustry && selectedManagement && <span>•</span>}
                  {selectedManagement && (
                    <span className="inline-flex items-center gap-1 ml-2">
                      <span className="text-foreground font-medium">
                        {managementTypes.find(t => t.value === selectedManagement)?.label}
                      </span>
                    </span>
                  )}
                </div>
              )}

              {/* Start Button */}
              {canStart ? (
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full"
                  asChild
                >
                  <Link to={`/auth?industry=${selectedIndustry}&management=${selectedManagement}`}>
                    Start Managing Your {industries.find(i => i.value === selectedIndustry)?.label.split(' ')[0]} Business
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              ) : (
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full" 
                  disabled
                >
                  Select Industry & Management Type
                  <ChevronDown className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Secondary CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Button variant="hero-outline" size="lg">
              <Play className="w-5 h-5" />
              Watch Demo
            </Button>
            <Button variant="subtle" size="lg" asChild>
              <Link to="/auth">
                Sign In
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: "0.4s" }}>
            {[
              { value: "10K+", label: "Active Teams" },
              { value: "50+", label: "Industries" },
              { value: "99.9%", label: "Uptime" },
              { value: "4.9/5", label: "Rating" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-20 max-w-6xl mx-auto animate-fade-in" style={{ animationDelay: "0.5s" }}>
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-3xl blur-2xl opacity-50" />
            
            {/* Dashboard Preview Card */}
            <div className="relative bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-warning/60" />
                  <div className="w-3 h-3 rounded-full bg-success/60" />
                </div>
                <div className="flex-1 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-background text-xs text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    app.managex.io/dashboard
                  </div>
                </div>
              </div>
              
              <div className="aspect-[16/9] bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-muted-foreground text-lg">Interactive Dashboard Preview</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">Click "Get Started" to explore</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

Hero.displayName = "Hero";
