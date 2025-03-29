import { PageWrapper } from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Grade, insertGradeSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function AdminGrades() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  
  const form = useForm({
    resolver: zodResolver(insertGradeSchema),
    defaultValues: {
      name: "",
    },
  });
  
  const editForm = useForm({
    resolver: zodResolver(insertGradeSchema),
    defaultValues: {
      name: "",
    },
  });
  
  // Fetch grades
  const { data: grades = [], isLoading } = useQuery<Grade[]>({
    queryKey: ["/api/grades"],
  });
  
  // Add grade
  const addGrade = useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await apiRequest("POST", "/api/grades", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Grade added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update grade
  const updateGrade = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: { name: string } }) => {
      const res = await apiRequest("PUT", `/api/grades/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Grade updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      setIsEditDialogOpen(false);
      editForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete grade
  const deleteGrade = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/grades/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Grade deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: { name: string }) => {
    addGrade.mutate(data);
  };
  
  const onEditSubmit = (data: { name: string }) => {
    if (selectedGrade) {
      updateGrade.mutate({ id: selectedGrade.id, data });
    }
  };
  
  const handleEdit = (grade: Grade) => {
    setSelectedGrade(grade);
    editForm.reset({ name: grade.name });
    setIsEditDialogOpen(true);
  };
  
  return (
    <PageWrapper title="Grades">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
          Manage Grades
        </h1>
        <p className="text-neutral-600 mt-2">Add, edit, and delete grade levels in your school</p>
      </div>
      
      <div className="mb-6 flex justify-end items-center">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Add Grade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Grade</DialogTitle>
              <DialogDescription>
                Create a new grade for your school.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Grade 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={addGrade.isPending}>
                    {addGrade.isPending ? "Adding..." : "Add Grade"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card className="shadow-md border-primary/10">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
          <CardTitle>Grade List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-6">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : grades.length === 0 ? (
            <div className="text-center p-6">
              <p className="text-neutral-500">No grades found. Click the "Add Grade" button to create your first grade.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/40">
                  <TableHead>Name</TableHead>
                  <TableHead className="w-[200px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grades.map((grade, index) => (
                  <TableRow key={grade.id} className={index % 2 === 0 ? "bg-white" : "bg-primary/5"}>
                    <TableCell className="font-medium">{grade.name}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(grade)}
                          className="border-primary text-primary hover:bg-primary/10"
                        >
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-destructive text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4 mr-1" /> Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the grade
                                and remove all associated teacher assignments and weekly plans.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteGrade.mutate(grade.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Grade</DialogTitle>
            <DialogDescription>
              Update the grade name.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={updateGrade.isPending}>
                  {updateGrade.isPending ? "Updating..." : "Update Grade"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
