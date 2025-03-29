import { PageWrapper } from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Subject, insertSubjectSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

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
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
          Manage Subjects
        </h1>
        <p className="text-neutral-600 mt-2">Add, edit, and delete academic subjects for your school</p>
      </div>
      
      <div className="mb-6 flex justify-end items-center">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Subject</DialogTitle>
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
                      <FormLabel>Subject Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Mathematics" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={addSubject.isPending}>
                    {addSubject.isPending ? "Adding..." : "Add Subject"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card className="shadow-md border-primary/10">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
          <CardTitle>Subject List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-6">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : subjects.length === 0 ? (
            <div className="text-center p-6">
              <p className="text-neutral-500">No subjects found. Click the "Add Subject" button to create your first subject.</p>
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
                {subjects.map((subject, index) => (
                  <TableRow key={subject.id} className={index % 2 === 0 ? "bg-white" : "bg-primary/5"}>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(subject)}
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
                                This action cannot be undone. This will permanently delete the subject
                                and remove all associated teacher assignments and weekly plans.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteSubject.mutate(subject.id)}
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
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>
              Update the subject name.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={updateSubject.isPending}>
                  {updateSubject.isPending ? "Updating..." : "Update Subject"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
