import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, FileInput, Loader2, Upload } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function UserImportCard() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.type !== "text/csv") {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }
    setSelectedFile(file);
  };
  
  const handleImport = () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import",
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
        <CardTitle>Import Users</CardTitle>
        <CardDescription>
          Import multiple users from a CSV file
        </CardDescription>
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
              <li>fullName</li>
              <li>email</li>
              <li>role (use "admin" for admin users)</li>
            </ul>
          </AlertDescription>
        </Alert>
        
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-2">
            <label htmlFor="file" className="text-sm font-medium">
              CSV File
            </label>
            <div className="flex">
              <input
                ref={fileInputRef}
                id="file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full rounded-md border border-input bg-background p-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1 file:text-primary-foreground"
              />
            </div>
            {selectedFile && (
              <p className="text-xs text-muted-foreground">
                {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              </p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleImport}
          disabled={!selectedFile || importMutation.isPending}
          className="w-full"
        >
          {importMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
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