import { useState, useEffect, forwardRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, Settings2, Plus, X, AlertCircle } from "lucide-react";
import { 
  industries, 
  getManagementTypesForIndustry,
  getIndustryLabel,
  getManagementTypeLabel,
  type ManagementType 
} from "@/lib/industry-config";

const Onboarding = forwardRef<HTMLDivElement>((_, ref) => {
  const [searchParams] = useSearchParams();
  const [industry, setIndustry] = useState(searchParams.get("industry") || "");
  const [primaryManagementType, setPrimaryManagementType] = useState(searchParams.get("management") || "");
  const [additionalTypes, setAdditionalTypes] = useState<string[]>([]);
  const [showAdditional, setShowAdditional] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableManagementTypes, setAvailableManagementTypes] = useState<ManagementType[]>([]);
  
  const { user, configuration, saveConfiguration, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [loading, user, navigate]);

  // Redirect if already configured
  useEffect(() => {
    if (!loading && configuration) {
      navigate("/dashboard");
    }
  }, [loading, configuration, navigate]);

  // Update available management types when industry changes
  useEffect(() => {
    if (industry) {
      const types = getManagementTypesForIndustry(industry);
      setAvailableManagementTypes(types);
      
      // Reset primary management type if it's not available for this industry
      if (primaryManagementType && !types.find(t => t.value === primaryManagementType)) {
        setPrimaryManagementType("");
      }
      
      // Reset additional types that are no longer valid
      setAdditionalTypes(prev => prev.filter(t => types.find(mt => mt.value === t)));
    } else {
      setAvailableManagementTypes([]);
      setPrimaryManagementType("");
      setAdditionalTypes([]);
    }
  }, [industry]);

  const handleAdditionalTypeToggle = (type: string) => {
    if (type === primaryManagementType) return;
    
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

  if (!user) {
    return null;
  }

  const availableAdditionalTypes = availableManagementTypes.filter(
    t => t.value !== primaryManagementType && !additionalTypes.includes(t.value)
  );

  return (
    <div ref={ref} className="min-h-screen bg-background flex items-center justify-center p-4">
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
          <CardTitle className="text-xl">Select your industry and management needs to get started</CardTitle>
          <CardDescription>
            Your dashboard will be customized based on your selections
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
                <SelectContent className="bg-background border-border z-50 max-h-60">
                  {industries.map((ind) => (
                    <SelectItem key={ind.value} value={ind.value}>
                      {ind.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {industry && (
                <p className="text-xs text-muted-foreground">
                  {industries.find(i => i.value === industry)?.description}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                Primary Management Type
              </Label>
              {!industry ? (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/50 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  Select an industry first to see available management types
                </div>
              ) : (
                <>
                  <Select 
                    value={primaryManagementType} 
                    onValueChange={(v) => {
                      setPrimaryManagementType(v);
                      setAdditionalTypes(prev => prev.filter(t => t !== v));
                    }}
                    disabled={!industry}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select management focus" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border z-50 max-h-60">
                      {availableManagementTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {primaryManagementType && (
                    <p className="text-xs text-muted-foreground">
                      {availableManagementTypes.find(t => t.value === primaryManagementType)?.description}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Additional Management Types */}
            {primaryManagementType && availableAdditionalTypes.length > 0 && (
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
                      const typeInfo = availableManagementTypes.find(t => t.value === type);
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
                      <Label className="text-sm">Select additional types for {getIndustryLabel(industry)}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAdditional(false)}
                      >
                        Done
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {availableAdditionalTypes.map(type => (
                        <div key={type.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`add-${type.value}`}
                            checked={additionalTypes.includes(type.value)}
                            onCheckedChange={() => handleAdditionalTypeToggle(type.value)}
                          />
                          <label
                            htmlFor={`add-${type.value}`}
                            className="text-sm font-medium leading-none cursor-pointer truncate"
                            title={type.description}
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
            
            <Button type="submit" className="w-full" disabled={isLoading || !industry || !primaryManagementType}>
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
});

Onboarding.displayName = "Onboarding";

export default Onboarding;
