// Industry and Management Type Configuration
// This file serves as the single source of truth for industries and their allowed management types

export interface Industry {
  value: string;
  label: string;
  description?: string;
}

export interface ManagementType {
  value: string;
  label: string;
  description?: string;
  icon?: string;
}

// All available industries
export const industries: Industry[] = [
  { value: "sme", label: "SME / Small Business", description: "Small and medium enterprises" },
  { value: "manufacturing", label: "Manufacturing", description: "Production and assembly" },
  { value: "healthcare", label: "Healthcare", description: "Medical and health services" },
  { value: "education", label: "Education", description: "Schools and training" },
  { value: "logistics", label: "Logistics & Transportation", description: "Supply chain and delivery" },
  { value: "retail", label: "Retail & E-commerce", description: "Sales and commerce" },
  { value: "consulting", label: "Consulting & Professional Services", description: "Advisory services" },
  { value: "construction", label: "Construction & Real Estate", description: "Building and property" },
  { value: "agriculture", label: "Agriculture & Farming", description: "Farming and agribusiness" },
  { value: "travel", label: "Travel & Hospitality", description: "Tourism and hotels" },
  { value: "food", label: "Food & Beverage", description: "Restaurants and catering" },
  { value: "media", label: "Media & Entertainment", description: "Content and broadcasting" },
  { value: "finance", label: "Finance & Banking", description: "Financial services" },
  { value: "technology", label: "Technology & IT", description: "Software and tech services" },
  { value: "property", label: "Property Management", description: "Real estate management" },
];

// All available management types
export const managementTypes: ManagementType[] = [
  { value: "project", label: "Project Management", description: "Track projects and milestones" },
  { value: "task", label: "Task Management", description: "Organize and assign tasks" },
  { value: "team", label: "Team Management", description: "Manage team members and roles" },
  { value: "resource", label: "Resource Management", description: "Allocate and track resources" },
  { value: "inventory", label: "Inventory Management", description: "Track stock and supplies" },
  { value: "crm", label: "CRM (Customer Relationship)", description: "Manage customer relationships" },
  { value: "sales", label: "Sales Management", description: "Track sales and revenue" },
  { value: "finance", label: "Finance & Accounting", description: "Financial tracking and reporting" },
  { value: "operations", label: "Operations Management", description: "Daily operations oversight" },
  { value: "quality", label: "Quality Management", description: "Quality control and assurance" },
  { value: "compliance", label: "Compliance & Risk", description: "Regulatory compliance tracking" },
  { value: "supply-chain", label: "Supply Chain Management", description: "End-to-end supply chain" },
  { value: "vendor", label: "Vendor Management", description: "Supplier relationships" },
  { value: "facility", label: "Facility Management", description: "Building and equipment" },
  { value: "time", label: "Time & Attendance", description: "Employee time tracking" },
  { value: "performance", label: "Performance Management", description: "Employee performance" },
  { value: "document", label: "Document Management", description: "File organization and storage" },
  { value: "communication", label: "Communication Management", description: "Internal communications" },
  { value: "patient", label: "Patient Management", description: "Patient records and care" },
  { value: "staff", label: "Staff Management", description: "Healthcare staff scheduling" },
  { value: "student", label: "Student Management", description: "Student records and progress" },
  { value: "curriculum", label: "Curriculum Management", description: "Course and curriculum planning" },
  { value: "fleet", label: "Fleet Management", description: "Vehicle and driver tracking" },
  { value: "booking", label: "Booking Management", description: "Reservations and appointments" },
  { value: "menu", label: "Menu Management", description: "Food menus and pricing" },
  { value: "content", label: "Content Management", description: "Media content organization" },
  { value: "campaign", label: "Campaign Management", description: "Marketing campaigns" },
  { value: "tenant", label: "Tenant Management", description: "Property tenants and leases" },
];

// Mapping of industries to their relevant management types
export const industryManagementMapping: Record<string, string[]> = {
  sme: [
    "project", "task", "team", "crm", "sales", "finance", 
    "operations", "document", "communication", "time", "performance"
  ],
  manufacturing: [
    "project", "task", "team", "inventory", "operations", "quality", 
    "supply-chain", "vendor", "facility", "resource", "compliance", "time"
  ],
  healthcare: [
    "patient", "staff", "team", "compliance", "quality", "document", 
    "resource", "facility", "time", "inventory", "communication", "finance"
  ],
  education: [
    "student", "curriculum", "team", "staff", "document", "communication", 
    "resource", "facility", "time", "performance", "project", "finance"
  ],
  logistics: [
    "fleet", "supply-chain", "inventory", "operations", "vendor", 
    "resource", "time", "compliance", "team", "task", "document", "finance"
  ],
  retail: [
    "inventory", "sales", "crm", "vendor", "operations", "team", 
    "task", "finance", "supply-chain", "document", "campaign", "performance"
  ],
  consulting: [
    "project", "task", "team", "crm", "time", "document", 
    "performance", "finance", "resource", "communication", "sales"
  ],
  construction: [
    "project", "task", "team", "resource", "vendor", "quality", 
    "compliance", "facility", "document", "finance", "inventory", "time"
  ],
  agriculture: [
    "inventory", "operations", "resource", "supply-chain", "vendor", 
    "team", "task", "finance", "document", "compliance", "quality"
  ],
  travel: [
    "booking", "crm", "sales", "team", "operations", "inventory", 
    "finance", "document", "communication", "vendor", "campaign"
  ],
  food: [
    "menu", "inventory", "team", "operations", "vendor", "quality", 
    "compliance", "finance", "booking", "crm", "time", "supply-chain"
  ],
  media: [
    "content", "project", "task", "team", "campaign", "resource", 
    "document", "communication", "finance", "crm", "performance"
  ],
  finance: [
    "compliance", "crm", "sales", "team", "document", "performance", 
    "task", "project", "communication", "resource", "quality", "finance"
  ],
  technology: [
    "project", "task", "team", "resource", "document", "quality", 
    "performance", "communication", "time", "crm", "sales", "finance"
  ],
  property: [
    "tenant", "facility", "team", "document", "compliance", "vendor", 
    "finance", "inventory", "communication", "task", "project", "operations"
  ],
};

// Get management types for a specific industry
export function getManagementTypesForIndustry(industryValue: string): ManagementType[] {
  const allowedTypes = industryManagementMapping[industryValue] || [];
  return managementTypes.filter(mt => allowedTypes.includes(mt.value));
}

// Get industry label by value
export function getIndustryLabel(value: string): string {
  return industries.find(i => i.value === value)?.label || value;
}

// Get management type label by value
export function getManagementTypeLabel(value: string): string {
  return managementTypes.find(m => m.value === value)?.label || value;
}

// Check if a management type is valid for an industry
export function isManagementTypeValidForIndustry(industryValue: string, managementValue: string): boolean {
  const allowedTypes = industryManagementMapping[industryValue] || [];
  return allowedTypes.includes(managementValue);
}
