import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, Settings2, Plus, X } from "lucide-react";

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
  const [primaryManagementType, setPrimaryManagementType] = useState(searchParams.get("management") || "");
  const [additionalTypes, setAdditionalTypes] = useState<string[]>([]);
  const [showAdditional, setShowAdditional] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { user, configuration, saveConfiguration, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if not authenticated or already configured
  if (!loading && !user) {
    navigate("/auth");
    return null;
  }
  if (!loading && configuration) {
    navigate("/dashboard");
    return null;
  }

  const handleAdditionalTypeToggle = (type: string) => {
    if (type === primaryManagementType) return; // Can't add primary as additional
    
    setAdditionalTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const removeAdditionalType = (type: string) => {
    setAdditionalTypes(prev => prev.filter(t => t !== type));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!industry || !primaryManagementType) {
      toast({
        title: "Selection Required",
        description: "Please select both an industry and management type.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await saveConfiguration(industry, primaryManagementType, additionalTypes);
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

  const availableAdditionalTypes = managementTypes.filter(
    t => t.value !== primaryManagementType && !additionalTypes.includes(t.value)
  );

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
                Primary Management Type
              </Label>
              <Select value={primaryManagementType} onValueChange={(v) => {
                setPrimaryManagementType(v);
                // Remove from additional if it was there
                setAdditionalTypes(prev => prev.filter(t => t !== v));
              }}>
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

            {/* Additional Management Types */}
            {primaryManagementType && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground">
                    Additional Management Types (Optional)
                  </Label>
                  {!showAdditional && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAdditional(true)}
                      className="gap-1 text-primary"
                    >
                      <Plus className="h-4 w-4" />
                      Add More
                    </Button>
                  )}
                </div>

                {/* Selected Additional Types */}
                {additionalTypes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {additionalTypes.map(type => {
                      const typeInfo = managementTypes.find(t => t.value === type);
                      return (
                        <Badge 
                          key={type} 
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
                          {typeInfo?.label}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 hover:bg-transparent"
                            onClick={() => removeAdditionalType(type)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      );
                    })}
                  </div>
                )}

                {/* Additional Types Selection */}
                {showAdditional && (
                  <div className="border border-border rounded-lg p-4 bg-muted/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Select additional types</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAdditional(false)}
                      >
                        Done
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {availableAdditionalTypes.map(type => (
                        <div key={type.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`add-${type.value}`}
                            checked={additionalTypes.includes(type.value)}
                            onCheckedChange={() => handleAdditionalTypeToggle(type.value)}
                          />
                          <label
                            htmlFor={`add-${type.value}`}
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            {type.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
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