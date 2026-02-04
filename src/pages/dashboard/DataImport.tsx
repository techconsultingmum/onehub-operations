import { useState, useRef } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { validateTaskRow, validateTeamMemberRow, parseCSVSafely, parseCSVForImport, sanitizeCSVCell } from "@/lib/validation";
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  ArrowRight, 
  Check, 
  X, 
  Loader2,
  RefreshCw,
  Table,
  AlertTriangle
} from "lucide-react";

interface ColumnMapping {
  csvColumn: string;
  targetColumn: string;
}

interface CSVPreviewData {
  headers: string[];
  rows: string[][];
}

interface ImportError {
  row: number;
  errors: string[];
}

const targetTables = [
  { value: "tasks", label: "Tasks", columns: ["title", "description", "status", "priority", "due_date"] },
  { value: "team_members", label: "Team Members", columns: ["name", "email", "role", "department"] },
];

export default function DataImport() {
  const [file, setFile] = useState<File | null>(null);
  const [targetTable, setTargetTable] = useState("");
  const [csvData, setCsvData] = useState<CSVPreviewData | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: ImportError[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Use secure CSV parsing with formula injection protection
  const parseCSV = (text: string): CSVPreviewData | null => {
    const result = parseCSVSafely(text);
    if (result.error) {
      toast({
        title: "CSV Parsing Error",
        description: result.error,
        variant: "destructive",
      });
      return null;
    }
    return { headers: result.headers, rows: result.rows };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      // Check file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "CSV file must be less than 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);
        if (!parsed) {
          setFile(null);
          return;
        }
        setCsvData(parsed);
        // Auto-map columns if names match
        if (targetTable) {
          autoMapColumns(parsed.headers, targetTable);
        }
      };
      reader.readAsText(selectedFile);
      setImportResult(null);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid CSV file.",
        variant: "destructive",
      });
    }
  };

  const autoMapColumns = (headers: string[], table: string) => {
    const tableConfig = targetTables.find(t => t.value === table);
    if (!tableConfig) return;

    const mappings: ColumnMapping[] = headers.map(header => {
      const normalizedHeader = header.toLowerCase().replace(/[_\s-]/g, "");
      const matchedColumn = tableConfig.columns.find(col => 
        col.toLowerCase().replace(/[_\s-]/g, "") === normalizedHeader
      );
      return {
        csvColumn: header,
        targetColumn: matchedColumn || "",
      };
    });
    setColumnMappings(mappings);
  };

  const handleTargetTableChange = (value: string) => {
    setTargetTable(value);
    if (csvData) {
      autoMapColumns(csvData.headers, value);
    }
  };

  const updateMapping = (csvColumn: string, targetColumn: string) => {
    setColumnMappings(prev => 
      prev.map(m => m.csvColumn === csvColumn ? { ...m, targetColumn } : m)
    );
  };

  const handleImport = async () => {
    if (!file || !targetTable || !user) return;

    setIsImporting(true);
    const importErrors: ImportError[] = [];
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        
        // Use secure parsing with formula injection protection
        const parseResult = parseCSVForImport(text);
        if (parseResult.error) {
          toast({
            title: "CSV Parsing Error",
            description: parseResult.error,
            variant: "destructive",
          });
          setIsImporting(false);
          return;
        }
        
        const { headers, rows, totalRows } = parseResult;
        
        // Limit to 1000 rows per import
        const maxRows = Math.min(totalRows, 1000);
        if (totalRows > 1000) {
          toast({
            title: "Row Limit",
            description: "Only the first 1000 rows will be imported.",
          });
        }
        
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < maxRows; i++) {
          const values = rows[i];
          const rowData: Record<string, string> = {};
          
          columnMappings.forEach(mapping => {
            if (mapping.targetColumn) {
              const csvIndex = headers.indexOf(mapping.csvColumn);
              if (csvIndex !== -1 && values[csvIndex] !== undefined) {
                // Values are already sanitized by parseCSVForImport
                rowData[mapping.targetColumn] = values[csvIndex];
              }
            }
          });

          if (Object.keys(rowData).length > 0) {
            // Validate row data based on target table
            let validationResult;
            if (targetTable === "tasks") {
              validationResult = validateTaskRow(rowData);
            } else if (targetTable === "team_members") {
              validationResult = validateTeamMemberRow(rowData);
            }
            
            if (validationResult && !validationResult.success) {
              const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
              importErrors.push({ row: i, errors });
              failCount++;
              continue;
            }
            
            // Insert validated data
            let insertError;
            if (targetTable === "tasks" && validationResult?.success) {
              const { error } = await supabase.from("tasks").insert({
                user_id: user.id,
                title: validationResult.data.title,
                description: validationResult.data.description,
                status: validationResult.data.status,
                priority: validationResult.data.priority,
                due_date: validationResult.data.due_date,
              });
              insertError = error;
            } else if (targetTable === "team_members" && validationResult?.success) {
              const { error } = await supabase.from("team_members").insert({
                user_id: user.id,
                name: validationResult.data.name,
                email: validationResult.data.email,
                role: validationResult.data.role,
                department: validationResult.data.department,
              });
              insertError = error;
            }
            
            if (insertError) {
              importErrors.push({ row: i, errors: [insertError.message] });
              failCount++;
            } else {
              successCount++;
            }
          }
        }

        setImportResult({ success: successCount, failed: failCount, errors: importErrors });
        
        // Log the import
        const importData = {
          user_id: user.id,
          file_name: file.name,
          target_table: targetTable,
          column_mapping: columnMappings as unknown as Record<string, unknown>,
          total_rows: totalRows,
          imported_rows: successCount,
          failed_rows: failCount,
          status: failCount === 0 ? "completed" : "completed_with_errors",
          error_details: importErrors.length > 0 ? importErrors.slice(0, 10) as unknown as Record<string, unknown> : null,
        };
        await supabase.from("data_imports").insert(importData as never);

        toast({
          title: "Import Complete",
          description: `Successfully imported ${successCount} rows. ${failCount > 0 ? `${failCount} rows failed validation.` : ""}`,
          variant: failCount > 0 ? "destructive" : "default",
        });

        setIsImporting(false);
      };
      reader.readAsText(file);
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "An error occurred during import.",
        variant: "destructive",
      });
      setIsImporting(false);
    }
  };

  const handleExport = async (table: string) => {
    if (!user) return;
    
    setIsExporting(true);
    try {
      const { data, error } = await supabase
        .from(table as "tasks" | "team_members")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "No Data",
          description: "No data found to export.",
          variant: "destructive",
        });
        setIsExporting(false);
        return;
      }

      // Convert to CSV - exclude sensitive columns
      const excludeColumns = ["user_id", "id"];
      const headers = Object.keys(data[0]).filter(k => !excludeColumns.includes(k));
      const csvContent = [
        headers.join(","),
        ...data.map(row => headers.map(h => {
          const value = row[h as keyof typeof row];
          // Escape quotes and wrap in quotes
          const stringValue = value?.toString() || "";
          return `"${stringValue.replace(/"/g, '""')}"`;
        }).join(","))
      ].join("\n");

      // Download
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${table}_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Successfully exported ${data.length} rows.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "An error occurred during export.",
        variant: "destructive",
      });
    }
    setIsExporting(false);
  };

  const resetImport = () => {
    setFile(null);
    setCsvData(null);
    setColumnMappings([]);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const selectedTableConfig = targetTables.find(t => t.value === targetTable);

  return (
    <div>
      <DashboardHeader
        title="Data Import"
        subtitle="Import and export data using CSV files"
      />

      <div className="p-6 space-y-6">
        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Export Data
            </CardTitle>
            <CardDescription>
              Download your data as CSV files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {targetTables.map(table => (
                <Button
                  key={table.value}
                  variant="outline"
                  onClick={() => handleExport(table.value)}
                  disabled={isExporting}
                  className="gap-2"
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Table className="h-4 w-4" />
                  )}
                  Export {table.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Import Data
            </CardTitle>
            <CardDescription>
              Upload a CSV file and map columns to import data (max 5MB, 1000 rows)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Select Target Table */}
            <div className="space-y-2">
              <Label>Step 1: Select Target Table</Label>
              <Select value={targetTable} onValueChange={handleTargetTableChange}>
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="Choose where to import" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {targetTables.map(table => (
                    <SelectItem key={table.value} value={table.value}>
                      {table.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Step 2: Upload File */}
            {targetTable && (
              <div className="space-y-2">
                <Label>Step 2: Upload CSV File</Label>
                <div className="flex items-center gap-4">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="max-w-xs"
                  />
                  {file && (
                    <Badge variant="secondary" className="gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      {file.name}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Column Mapping */}
            {csvData && selectedTableConfig && (
              <div className="space-y-4">
                <Label>Step 3: Map Columns</Label>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium">CSV Column</th>
                        <th className="px-4 py-2 text-center text-sm font-medium w-12"></th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Target Column</th>
                      </tr>
                    </thead>
                    <tbody>
                      {columnMappings.map((mapping, idx) => (
                        <tr key={idx} className="border-t border-border">
                          <td className="px-4 py-2">
                            <Badge variant="outline">{mapping.csvColumn}</Badge>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto" />
                          </td>
                          <td className="px-4 py-2">
                            <Select 
                              value={mapping.targetColumn} 
                              onValueChange={(v) => updateMapping(mapping.csvColumn, v)}
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue placeholder="Skip this column" />
                              </SelectTrigger>
                              <SelectContent className="bg-background border-border">
                                <SelectItem value="">Skip this column</SelectItem>
                                {selectedTableConfig.columns.map(col => (
                                  <SelectItem key={col} value={col}>
                                    {col.replace(/_/g, " ")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Validation Info */}
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Validation Rules</h4>
                  {targetTable === "tasks" && (
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• <strong>title</strong>: Required, max 200 characters</li>
                      <li>• <strong>status</strong>: Must be "todo", "in-progress", or "completed"</li>
                      <li>• <strong>priority</strong>: Must be "low", "medium", "high", or "urgent"</li>
                      <li>• <strong>due_date</strong>: Valid date format (e.g., 2025-01-15)</li>
                    </ul>
                  )}
                  {targetTable === "team_members" && (
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• <strong>name</strong>: Required, 2-100 characters</li>
                      <li>• <strong>email</strong>: Required, valid email format</li>
                      <li>• <strong>role</strong>: Required, max 50 characters</li>
                      <li>• <strong>department</strong>: Optional, max 100 characters</li>
                    </ul>
                  )}
                </div>

                {/* Preview */}
                <div className="space-y-2">
                  <Label>Preview (First 5 Rows)</Label>
                  <div className="border border-border rounded-lg overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          {csvData.headers.map((header, idx) => (
                            <th key={idx} className="px-4 py-2 text-left font-medium whitespace-nowrap">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.rows.map((row, rowIdx) => (
                          <tr key={rowIdx} className="border-t border-border">
                            {row.map((cell, cellIdx) => (
                              <td key={cellIdx} className="px-4 py-2 whitespace-nowrap">
                                {cell || <span className="text-muted-foreground italic">empty</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Import Result */}
            {importResult && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="h-5 w-5" />
                    <span>{importResult.success} imported</span>
                  </div>
                  {importResult.failed > 0 && (
                    <div className="flex items-center gap-2 text-destructive">
                      <X className="h-5 w-5" />
                      <span>{importResult.failed} failed</span>
                    </div>
                  )}
                </div>
                
                {/* Validation Errors */}
                {importResult.errors.length > 0 && (
                  <div className="p-4 border border-destructive/30 bg-destructive/10 rounded-lg">
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      Validation Errors (first 10 shown)
                    </h4>
                    <ul className="text-sm space-y-1">
                      {importResult.errors.slice(0, 10).map((error, idx) => (
                        <li key={idx} className="text-muted-foreground">
                          Row {error.row}: {error.errors.join(", ")}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            {csvData && (
              <div className="flex gap-4">
                <Button 
                  onClick={handleImport} 
                  disabled={isImporting || columnMappings.filter(m => m.targetColumn).length === 0}
                  className="gap-2"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Import Data
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={resetImport} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Reset
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
