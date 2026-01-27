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
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  ArrowRight, 
  Check, 
  X, 
  Loader2,
  RefreshCw,
  Table
} from "lucide-react";

interface ColumnMapping {
  csvColumn: string;
  targetColumn: string;
}

interface CSVPreviewData {
  headers: string[];
  rows: string[][];
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
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const parseCSV = (text: string): CSVPreviewData => {
    const lines = text.split("\n").filter(line => line.trim());
    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
    const rows = lines.slice(1, 6).map(line => 
      line.split(",").map(cell => cell.trim().replace(/^"|"$/g, ""))
    );
    return { headers, rows };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);
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
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        const lines = text.split("\n").filter(line => line.trim());
        const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
        
        let successCount = 0;
        let failCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
          const rowData: Record<string, string> = {};
          
          columnMappings.forEach(mapping => {
            if (mapping.targetColumn) {
              const csvIndex = headers.indexOf(mapping.csvColumn);
              if (csvIndex !== -1) {
                rowData[mapping.targetColumn] = values[csvIndex];
              }
            }
          });

          if (Object.keys(rowData).length > 0) {
            rowData.user_id = user.id;
            // Insert based on target table type
            let insertError;
            if (targetTable === "tasks") {
              const { error } = await supabase.from("tasks").insert({
                user_id: user.id,
                title: rowData.title || "Untitled",
                description: rowData.description,
                status: rowData.status,
                priority: rowData.priority,
                due_date: rowData.due_date,
              });
              insertError = error;
            } else if (targetTable === "team_members") {
              const { error } = await supabase.from("team_members").insert({
                user_id: user.id,
                name: rowData.name || "Unknown",
                email: rowData.email || "",
                role: rowData.role || "Member",
                department: rowData.department,
              });
              insertError = error;
            }
            if (insertError) {
              failCount++;
            } else {
              successCount++;
            }
          }
        }

        setImportResult({ success: successCount, failed: failCount });
        
        // Log the import - use type assertion to avoid type issues
        const importData = {
          user_id: user.id,
          file_name: file.name,
          target_table: targetTable,
          column_mapping: columnMappings as unknown as Record<string, unknown>,
          total_rows: lines.length - 1,
          imported_rows: successCount,
          failed_rows: failCount,
          status: failCount === 0 ? "completed" : "completed_with_errors",
        };
        await supabase.from("data_imports").insert(importData as never);

        toast({
          title: "Import Complete",
          description: `Successfully imported ${successCount} rows. ${failCount > 0 ? `${failCount} rows failed.` : ""}`,
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

      // Convert to CSV
      const headers = Object.keys(data[0]).filter(k => k !== "user_id");
      const csvContent = [
        headers.join(","),
        ...data.map(row => headers.map(h => `"${row[h as keyof typeof row] || ""}"`).join(","))
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
              Upload a CSV file and map columns to import data
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