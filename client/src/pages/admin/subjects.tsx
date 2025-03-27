import { PageWrapper } from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Subject, insertSubjectSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Plus, Trash2, Book, BookOpen, PencilRuler, Bookmark, FileCheck, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function AdminSubjects() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  
  const form = useForm({
    resolver: zodResolver(insertSubjectSchema),
    defaultValues: {
      name: "",
    },
  });
  
  const editForm = useForm({
    resolver: zodResolver(insertSubjectSchema),
    defaultValues: {
      name: "",
    },
  });
  
  // Fetch subjects
  const { data: subjects = [], isLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });
  
  // Add subject
  const addSubject = useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await apiRequest("POST", "/api/subjects", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subject added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
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
  
  // Update subject
  const updateSubject = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: { name: string } }) => {
      const res = await apiRequest("PUT", `/api/subjects/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subject updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
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
  
  // Delete subject
  const deleteSubject = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/subjects/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subject deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
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
    addSubject.mutate(data);
  };
  
  const onEditSubmit = (data: { name: string }) => {
    if (selectedSubject) {
      updateSubject.mutate({ id: selectedSubject.id, data });
    }
  };
  
  const handleEdit = (subject: Subject) => {
    setSelectedSubject(subject);
    editForm.reset({ name: subject.name });
    setIsEditDialogOpen(true);
  };
  
  return (
    <PageWrapper title="Subjects">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Subject Management</h1>
          <p className="text-neutral-500 mt-1">Create and manage school subjects</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0">
              <Plus className="mr-2 h-4 w-4" /> Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-purple-800">Add New Subject</DialogTitle>
              <DialogDescription>
                Create a new subject for your school.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-purple-700">Subject Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Mathematics" {...field} className="border-purple-200 focus-visible:ring-purple-500" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={addSubject.isPending}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0"
                  >
                    {addSubject.isPending ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" /> Add Subject
                      </>
                    )}
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
              <div className="bg-gradient-to-br from-purple-100 to-indigo-100 p-3 rounded-lg mr-4 shadow-sm">
                <Book className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Total Subjects</p>
                <h3 className="text-2xl font-bold text-purple-700">{subjects.length}</h3>
              </div>
            </div>
            <Separator className="my-4 bg-neutral-100" />
            <div className="flex justify-between items-center">
              <p className="text-sm text-neutral-500">Subjects managed in the system</p>
              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1">
                {subjects.length ? 'Active' : 'None Added'}
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-all duration-300 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-3 rounded-lg mr-4 shadow-sm">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Latest Subject</p>
                <h3 className="text-2xl font-bold text-blue-700">
                  {subjects.length > 0 ? subjects[subjects.length - 1].name : 'None'}
                </h3>
              </div>
            </div>
            <Separator className="my-4 bg-neutral-100" />
            <div className="flex justify-between items-center">
              <p className="text-sm text-neutral-500">Most recently added subject</p>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1">
                {subjects.length > 0 ? 'Recently Added' : 'None Added'}
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-all duration-300 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-violet-100 to-fuchsia-100 p-3 rounded-lg mr-4 shadow-sm">
                <PencilRuler className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Management</p>
                <h3 className="text-2xl font-bold text-violet-700">Ready</h3>
              </div>
            </div>
            <Separator className="my-4 bg-neutral-100" />
            <div className="flex justify-between items-center">
              <p className="text-sm text-neutral-500">Subject management status</p>
              <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-200 px-3 py-1">
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content Card */}
      <Card className="mb-6 shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Subject List
          </CardTitle>
          <CardDescription>
            View and manage all subjects in your school
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full mb-3"></div>
              <p className="text-neutral-500">Loading subjects...</p>
            </div>
          ) : subjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-6 bg-neutral-50 rounded-lg border border-neutral-100">
              <div className="bg-neutral-100 p-3 rounded-full mb-3">
                <AlertCircle className="h-8 w-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-medium text-neutral-700 mb-1">No Subjects Found</h3>
              <p className="text-neutral-500 text-center mb-4 max-w-md">
                Your school does not have any subjects set up yet. Click the "Add Subject" button above to create your first subject.
              </p>
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Your First Subject
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-neutral-100">
              <Table>
                <TableHeader className="bg-neutral-50">
                  <TableRow>
                    <TableHead className="font-semibold">Subject Name</TableHead>
                    <TableHead className="font-semibold text-center">ID</TableHead>
                    <TableHead className="font-semibold w-[200px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map(subject => (
                    <TableRow key={subject.id} className="hover:bg-purple-50/30">
                      <TableCell className="font-medium text-neutral-800">
                        <div className="flex items-center">
                          <div className="bg-purple-100 p-2 rounded-full mr-3">
                            <Bookmark className="h-4 w-4 text-purple-600" />
                          </div>
                          {subject.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-neutral-50 border-neutral-200 text-neutral-600 px-2 py-0.5">
                          {subject.id}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                            onClick={() => handleEdit(subject)}
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
                                  This action cannot be undone. This will permanently delete the subject
                                  "{subject.name}" and remove all associated teacher assignments and weekly plans.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteSubject.mutate(subject.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Delete Subject
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
            <DialogTitle className="text-indigo-800">Edit Subject</DialogTitle>
            <DialogDescription>
              Update the subject name for your school.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-indigo-700">Subject Name</FormLabel>
                    <FormControl>
                      <Input {...field} className="border-indigo-200 focus-visible:ring-indigo-500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2">
                <Button 
                  variant="outline" 
                  className="border-indigo-200 text-indigo-700 hover:bg-indigo-50" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateSubject.isPending}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0"
                >
                  {updateSubject.isPending ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <FileCheck className="h-4 w-4 mr-2" /> Update Subject
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
