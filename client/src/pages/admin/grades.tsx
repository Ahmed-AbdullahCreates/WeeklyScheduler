import { PageWrapper } from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Grade, insertGradeSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Edit, Plus, Trash2, School, GraduationCap, SquarePen, Users, FileCheck, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

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
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Grade Management</h1>
          <p className="text-neutral-500 mt-1">Create and manage school grades</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0">
              <Plus className="mr-2 h-4 w-4" /> Add Grade
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-green-800">Add New Grade</DialogTitle>
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
                      <FormLabel className="text-green-700">Grade Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Grade 1" {...field} className="border-green-200 focus-visible:ring-green-500" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={addGrade.isPending}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0"
                  >
                    {addGrade.isPending ? "Adding..." : "Add Grade"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-md transition-all duration-300 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-3 rounded-lg mr-4 shadow-sm">
                <School className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Total Grades</p>
                <h3 className="text-2xl font-bold text-green-700">{grades.length}</h3>
              </div>
            </div>
            <Separator className="my-4 bg-neutral-100" />
            <div className="flex justify-between items-center">
              <p className="text-sm text-neutral-500">Grades managed in the system</p>
              <Badge className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1">
                {grades.length ? 'Active' : 'None Added'}
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-all duration-300 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-indigo-100 to-blue-100 p-3 rounded-lg mr-4 shadow-sm">
                <GraduationCap className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Latest Grade</p>
                <h3 className="text-2xl font-bold text-indigo-700">
                  {grades.length > 0 ? grades[grades.length - 1].name : 'None'}
                </h3>
              </div>
            </div>
            <Separator className="my-4 bg-neutral-100" />
            <div className="flex justify-between items-center">
              <p className="text-sm text-neutral-500">Most recently added grade</p>
              <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-3 py-1">
                {grades.length > 0 ? 'Recently Added' : 'None Added'}
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-all duration-300 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-purple-100 to-violet-100 p-3 rounded-lg mr-4 shadow-sm">
                <SquarePen className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Management</p>
                <h3 className="text-2xl font-bold text-purple-700">Ready</h3>
              </div>
            </div>
            <Separator className="my-4 bg-neutral-100" />
            <div className="flex justify-between items-center">
              <p className="text-sm text-neutral-500">Grade management status</p>
              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1">
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content Card */}
      <Card className="mb-6 shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Grade List
          </CardTitle>
          <CardDescription>
            View and manage all grades in your school
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin h-10 w-10 border-4 border-green-500 border-t-transparent rounded-full mb-3"></div>
              <p className="text-neutral-500">Loading grades...</p>
            </div>
          ) : grades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-6 bg-neutral-50 rounded-lg border border-neutral-100">
              <div className="bg-neutral-100 p-3 rounded-full mb-3">
                <AlertCircle className="h-8 w-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-medium text-neutral-700 mb-1">No Grades Found</h3>
              <p className="text-neutral-500 text-center mb-4 max-w-md">
                Your school does not have any grades set up yet. Click the "Add Grade" button above to create your first grade.
              </p>
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Your First Grade
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-neutral-100">
              <Table>
                <TableHeader className="bg-neutral-50">
                  <TableRow>
                    <TableHead className="font-semibold">Grade Name</TableHead>
                    <TableHead className="font-semibold text-center">ID</TableHead>
                    <TableHead className="font-semibold w-[200px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map(grade => (
                    <TableRow key={grade.id} className="hover:bg-green-50/30">
                      <TableCell className="font-medium text-neutral-800">
                        <div className="flex items-center">
                          <div className="bg-green-100 p-2 rounded-full mr-3">
                            <School className="h-4 w-4 text-green-600" />
                          </div>
                          {grade.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-neutral-50 border-neutral-200 text-neutral-600 px-2 py-0.5">
                          {grade.id}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                            onClick={() => handleEdit(grade)}
                          >
                            <Edit className="h-4 w-4 mr-1" /> Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4 mr-1" /> Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-red-600">Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the grade
                                  "{grade.name}" and remove all associated teacher assignments and weekly plans.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteGrade.mutate(grade.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Delete Grade
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
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-blue-800">Edit Grade</DialogTitle>
            <DialogDescription>
              Update the grade name for your school.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-blue-700">Grade Name</FormLabel>
                    <FormControl>
                      <Input {...field} className="border-blue-200 focus-visible:ring-blue-500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2">
                <Button 
                  variant="outline" 
                  className="border-blue-200 text-blue-700 hover:bg-blue-50" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateGrade.isPending}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0"
                >
                  {updateGrade.isPending ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <FileCheck className="h-4 w-4 mr-2" /> Update Grade
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
