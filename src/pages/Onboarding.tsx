import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, Settings2 } from "lucide-react";

const industries = [
  { value: "sme", label: "SME / Small Business" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "logistics", label: "Logistics & Transportation" },
  { value: "retail", label: "Retail & E-commerce" },
  { value: "consulting", label: "Consulting & Professional Services" },
  { value: "construction", label: "Construction & Real Estate" },
  { value: "agriculture", label: "Agriculture & Farming" },
  { value: "travel", label: "Travel & Hospitality" },
  { value: "food", label: "Food & Beverage" },
  { value: "media", label: "Media & Entertainment" },
  { value: "finance", label: "Finance & Banking" },
  { value: "technology", label: "Technology & IT" },
  { value: "property", label: "Property Management" },
];

const managementTypes = [
  { value: "project", label: "Project Management" },
  { value: "task", label: "Task Management" },
  { value: "team", label: "Team Management" },
  { value: "resource", label: "Resource Management" },
  { value: "inventory", label: "Inventory Management" },
  { value: "crm", label: "CRM (Customer Relationship)" },
  { value: "sales", label: "Sales Management" },
  { value: "finance", label: "Finance & Accounting" },
  { value: "operations", label: "Operations Management" },
  { value: "quality", label: "Quality Management" },
  { value: "compliance", label: "Compliance & Risk" },
  { value: "supply-chain", label: "Supply Chain Management" },
  { value: "vendor", label: "Vendor Management" },
  { value: "facility", label: "Facility Management" },
  { value: "time", label: "Time & Attendance" },
  { value: "performance", label: "Performance Management" },
  { value: "document", label: "Document Management" },
  { value: "communication", label: "Communication Management" },
];

export default function Onboarding() {
  const [searchParams] = useSearchParams();
  const [industry, setIndustry] = useState(searchParams.get("industry") || "");
  const [managementType, setManagementType] = useState(searchParams.get("management") || "");
  const [isLoading, setIsLoading] = useState(false);
  
  const { user, configuration, saveConfiguration, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
    if (!loading && configuration) {
      navigate("/dashboard");
    }
  }, [user, configuration, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!industry || !managementType) {
      toast({
        title: "Selection Required",
        description: "Please select both an industry and management type.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await saveConfiguration(industry, managementType);
    setIsLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save your preferences. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Setup Complete!",
        description: "Your dashboard has been customized for your needs.",
      });
      navigate("/dashboard");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      
      <Card className="w-full max-w-lg relative z-10 border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">M</span>
            </div>
            <span className="text-2xl font-bold">ManageX</span>
          </div>
          <CardTitle className="text-xl">Customize Your Experience</CardTitle>
          <CardDescription>
            Select your industry and management focus to personalize your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Industry
              </Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border z-50">
                  {industries.map((ind) => (
                    <SelectItem key={ind.value} value={ind.value}>
                      {ind.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                Management Type
              </Label>
              <Select value={managementType} onValueChange={setManagementType}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select management focus" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border z-50">
                  {managementTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Start Managing"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
