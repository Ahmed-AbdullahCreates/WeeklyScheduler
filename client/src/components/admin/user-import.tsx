// Import necessary React hooks and UI components
import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, Upload, X, Download, FileText, Check } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export function UserImportCard() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest("POST", "/api/users/import", formData, { formData: true });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Users imported successfully",
        description: `${data.usersCreated} of ${data.totalProcessed} users were imported.`,
      });
      setSelectedFile(null);
      setValidationStatus('idle');
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const validateCsvFile = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const firstLine = content.split('\n')[0].trim();
        // Simple validation - check if headers contain username and password
        const isValid = firstLine.includes('username') && firstLine.includes('password');
        setValidationStatus(isValid ? 'valid' : 'invalid');
        resolve(isValid);
      };
      reader.readAsText(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    if (file.type !== "text/csv") {
      toast({
        title: "Invalid file type", 
        description: "Please select a CSV file",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    await validateCsvFile(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.type !== "text/csv") {
      toast({
        title: "Invalid file type", 
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    await validateCsvFile(file);

    if (fileInputRef.current) {
      // Create a DataTransfer object to set the file input value
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
    }
  }, [toast]);

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setValidationStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadSampleCsv = () => {
    const csvContent = "username,password\njohn_doe,password123\njane_smith,securePass456";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'sample_users.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!selectedFile || validationStatus !== 'valid') {
      toast({
        title: "Cannot import",
        description: validationStatus === 'invalid' 
          ? "The CSV file format is invalid. Please check the headers."
          : "Please select a valid CSV file to import",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    importMutation.mutate(formData);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Import Users</CardTitle>
            <CardDescription>
              Import multiple users from a CSV file
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={downloadSampleCsv}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            Sample
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>CSV Format</AlertTitle>
          <AlertDescription>
            The CSV file should have the following columns:
            <ul className="list-disc list-inside text-sm mt-2">
              <li>username (required)</li>
              <li>password (required)</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div 
          className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
          } ${selectedFile ? 'bg-muted/50' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {!selectedFile ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/70" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Drag & drop your CSV file here</p>
                <p className="text-xs text-muted-foreground">or</p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select File
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium truncate max-w-[180px]">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{Math.round(selectedFile.size / 1024)} KB</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {validationStatus === 'valid' && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Valid</Badge>}
                  {validationStatus === 'invalid' && <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Invalid Format</Badge>}
                  <Button variant="ghost" size="icon" onClick={clearSelectedFile} className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {importMutation.isPending && (
                <Progress value={45} className="h-1" />
              )}
            </div>
          )}
          <input
            ref={fileInputRef}
            id="file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleImport}
          disabled={!selectedFile || validationStatus !== 'valid' || importMutation.isPending}
          className="w-full"
        >
          {importMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : validationStatus === 'valid' ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Import Users
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Import Users
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
