import { PageWrapper } from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Grade, Subject, userRoleSchema } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, UserPlus, UserCheck, UserX, ShieldCheck, ShieldOff, Trash2, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { UserImportCard } from "@/components/admin/user-import";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
  isAdmin: z.boolean().default(false),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AdminTeachers() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);
  const [isAssignGradeOpen, setIsAssignGradeOpen] = useState(false);
  const [isAssignSubjectOpen, setIsAssignSubjectOpen] = useState(false);
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  // State for the subject assignment form
  const [selectedGradeId, setSelectedGradeId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  
  // State for tracking teacher grades in UI
  const [teacherGradesMap, setTeacherGradesMap] = useState<Record<number, Grade[]>>({});
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      isAdmin: false,
    },
  });
  
  // Fetch teachers
  const { data: teachers = [], isLoading: isLoadingTeachers } = useQuery<User[]>({
    queryKey: ["/api/teachers"],
  });
  
  // Fetch grades
  const { data: grades = [] } = useQuery<Grade[]>({
    queryKey: ["/api/grades"],
  });
  
  // Fetch subjects
  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });
  
  // Get teacher grades
  const { data: teacherGrades = [] } = useQuery<Grade[]>({
    queryKey: ["/api/teacher-grades", selectedTeacher?.id],
    enabled: !!selectedTeacher,
    queryFn: async () => {
      const res = await fetch(`/api/teacher-grades/${selectedTeacher!.id}`);
      return res.json();
    }
  });
  
  // Prefetch teacher grades when component loads
  useEffect(() => {
    if (teachers.length > 0) {
      // Create batched fetches for teacher grades
      const fetchTeacherGrades = async () => {
        for (const teacher of teachers) {
          if (!teacherGradesMap[teacher.id]) {
            try {
              const res = await fetch(`/api/teacher-grades/${teacher.id}`);
              const grades = await res.json();
              setTeacherGradesMap(prev => ({
                ...prev,
                [teacher.id]: grades
              }));
            } catch (error) {
              console.error(`Failed to fetch grades for teacher ${teacher.id}`, error);
            }
          }
        }
      };
      
      fetchTeacherGrades();
    }
  }, [teachers]);
  
  // Add teacher
  const addTeacher = useMutation({
    mutationFn: async (data: RegisterFormValues) => {
      const res = await apiRequest("POST", "/api/register", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Teacher added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      setIsAddTeacherOpen(false);
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
  
  // Assign teacher to grade
  const assignGrade = useMutation({
    mutationFn: async ({ teacherId, gradeId }: { teacherId: number, gradeId: number }) => {
      const res = await apiRequest("POST", "/api/teacher-grades", { teacherId, gradeId });
      return await res.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Success",
        description: "Grade assigned successfully",
      });
      
      // Get the latest teacher grades to update our UI
      if (selectedTeacher) {
        fetch(`/api/teacher-grades/${variables.teacherId}`)
          .then(res => res.json())
          .then(grades => {
            // Update the local map with fresh data
            setTeacherGradesMap(prev => ({
              ...prev,
              [variables.teacherId]: grades
            }));
          });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/teacher-grades", selectedTeacher?.id] });
      setIsAssignGradeOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Assign teacher to subject
  const assignSubject = useMutation({
    mutationFn: async ({ teacherId, gradeId, subjectId }: { teacherId: number, gradeId: number, subjectId: number }) => {
      const res = await apiRequest("POST", "/api/teacher-subjects", { teacherId, gradeId, subjectId });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subject assigned successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher-subjects", selectedTeacher?.id] });
      setIsAssignSubjectOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // User role mutation removed as requested
  
  // Delete user
  const deleteUser = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/users/${userId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete user");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      setIsDeleteConfirmOpen(false);
      setSelectedTeacher(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: RegisterFormValues) => {
    addTeacher.mutate(data);
  };
  
  return (
    <PageWrapper title="Teachers">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manage Teachers</h1>
        <div className="flex space-x-2">
          <Dialog open={isAddTeacherOpen} onOpenChange={setIsAddTeacherOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" /> Add Teacher
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Teacher</DialogTitle>
                <DialogDescription>
                  Create a new teacher account to give them access to the weekly planner system.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="johnsmith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isAdmin"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Admin Account
                          </FormLabel>
                          <p className="text-sm text-neutral-500">
                            Grant this user administrative privileges
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={addTeacher.isPending}>
                      {addTeacher.isPending ? "Adding..." : "Add Teacher"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" /> Import Users
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Import Users</DialogTitle>
                <DialogDescription>
                  Import multiple users at once using a CSV file.
                </DialogDescription>
              </DialogHeader>
              <UserImportCard />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Teacher List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned Grades</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map(teacher => (
                <TableRow key={teacher.id}>
                  <TableCell className="font-medium">{teacher.fullName}</TableCell>
                  <TableCell>{teacher.username}</TableCell>
                  <TableCell>
                    <Badge variant={teacher.isAdmin ? "default" : "outline"}>
                      {teacher.isAdmin ? "Admin" : "Teacher"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {/* Enhanced teacher grades display with prefetched data */}
                    <div className="flex flex-wrap gap-1">
                      {teacher.id === selectedTeacher?.id ? (
                        // This teacher is selected, show their grades from the query
                        teacherGrades.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {teacherGrades.map(grade => (
                              <Badge key={grade.id} variant="outline" className="mr-1">
                                {grade.name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No grades assigned</span>
                        )
                      ) : teacherGradesMap[teacher.id] ? (
                        // This teacher has prefetched grades, show them directly
                        teacherGradesMap[teacher.id].length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {teacherGradesMap[teacher.id].map(grade => (
                              <Badge key={grade.id} variant="outline" className="mr-1">
                                {grade.name}
                              </Badge>
                            ))}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 text-xs"
                              onClick={() => setSelectedTeacher(teacher)}
                              title="Manage assignments"
                            >
                              <Pencil className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground italic">None</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 text-xs"
                              onClick={() => setSelectedTeacher(teacher)}
                              title="Manage assignments"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Assign
                            </Button>
                          </div>
                        )
                      ) : (
                        // Data is being loaded or hasn't been prefetched yet
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 text-xs"
                          onClick={() => {
                            // Fetch teacher grades using the API
                            fetch(`/api/teacher-grades/${teacher.id}`)
                              .then(res => res.json())
                              .then(grades => {
                                // Store in the local map for quick access
                                setTeacherGradesMap(prev => ({
                                  ...prev,
                                  [teacher.id]: grades
                                }));
                                // Set the selected teacher
                                setSelectedTeacher(teacher);
                              })
                              .catch(error => {
                                toast({
                                  title: "Error",
                                  description: "Failed to fetch teacher grades",
                                  variant: "destructive",
                                });
                              });
                          }}
                        >
                          View Assignments
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedTeacher(teacher);
                          setIsAssignGradeOpen(true);
                        }}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Grade
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedTeacher(teacher);
                          setIsAssignSubjectOpen(true);
                        }}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Subject
                      </Button>
                      
                      {/* Delete User */}
                      {teacher.id !== currentUser?.id && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedTeacher(teacher);
                            setIsDeleteConfirmOpen(true);
                          }}
                          title="Delete user"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Assign Grade Dialog */}
      <Dialog open={isAssignGradeOpen} onOpenChange={(open) => {
        setIsAssignGradeOpen(open);
        if (!open) {
          // Clear any UI state when closing the dialog
          setSelectedTeacher(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Grade Assignments</DialogTitle>
            <DialogDescription>
              Add or remove grade assignments for {selectedTeacher?.fullName}.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[300px] overflow-y-auto">
            <div className="space-y-4 py-2">
              {grades.map(grade => {
                const isAssigned = teacherGrades.some(g => g.id === grade.id);
                return (
                  <div key={grade.id} className="flex items-center justify-between space-x-2 p-2 rounded-md border border-muted hover:bg-muted/30">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id={`grade-${grade.id}`} 
                        checked={isAssigned}
                        onCheckedChange={(checked) => {
                          if (selectedTeacher) {
                            if (checked) {
                              assignGrade.mutate({ 
                                teacherId: selectedTeacher.id, 
                                gradeId: grade.id 
                              });
                            } else {
                              // Unassign grade
                              const res = fetch(
                                `/api/teacher-grades/${selectedTeacher.id}/${grade.id}`, 
                                { method: 'DELETE' }
                              ).then(() => {
                                toast({
                                  title: "Success",
                                  description: `Removed ${grade.name} assignment`,
                                });
                                queryClient.invalidateQueries({ 
                                  queryKey: ["/api/teacher-grades", selectedTeacher.id] 
                                });
                              }).catch(error => {
                                toast({
                                  title: "Error",
                                  description: "Failed to remove grade assignment",
                                  variant: "destructive",
                                });
                              });
                            }
                          }
                        }}
                      />
                      <Label 
                        htmlFor={`grade-${grade.id}`}
                        className="font-medium cursor-pointer"
                      >
                        {grade.name}
                      </Label>
                    </div>
                    
                    {isAssigned && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (selectedTeacher) {
                            fetch(
                              `/api/teacher-grades/${selectedTeacher.id}/${grade.id}`, 
                              { method: 'DELETE' }
                            ).then(() => {
                              toast({
                                title: "Success",
                                description: `Removed ${grade.name} assignment`,
                              });
                              queryClient.invalidateQueries({ 
                                queryKey: ["/api/teacher-grades", selectedTeacher.id] 
                              });
                            }).catch(error => {
                              toast({
                                title: "Error",
                                description: "Failed to remove grade assignment",
                                variant: "destructive",
                              });
                            });
                          }
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button onClick={() => setIsAssignGradeOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Assign Subject Dialog */}
      <Dialog 
        open={isAssignSubjectOpen} 
        onOpenChange={(open) => {
          setIsAssignSubjectOpen(open);
          if (!open) {
            // Reset form state when dialog closes
            setSelectedGradeId("");
            setSelectedSubjectId("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Subject to Teacher</DialogTitle>
            <DialogDescription>
              Select a grade and subject to assign to {selectedTeacher?.fullName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="grade-select">Grade</Label>
              <Select 
                value={selectedGradeId} 
                onValueChange={setSelectedGradeId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a grade" />
                </SelectTrigger>
                <SelectContent>
                  {teacherGrades.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No grades assigned yet. Please assign a grade first.
                    </div>
                  ) : (
                    teacherGrades.map(grade => (
                      <SelectItem key={grade.id} value={grade.id.toString()}>
                        {grade.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {teacherGrades.length === 0 && (
                <p className="text-xs text-orange-500 mt-1">
                  You need to assign grades to this teacher first
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject-select">Subject</Label>
              <Select 
                value={selectedSubjectId} 
                onValueChange={setSelectedSubjectId}
                disabled={!selectedGradeId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignSubjectOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedTeacher && selectedGradeId && selectedSubjectId) {
                  assignSubject.mutate({
                    teacherId: selectedTeacher.id,
                    gradeId: parseInt(selectedGradeId),
                    subjectId: parseInt(selectedSubjectId)
                  });
                } else {
                  toast({
                    title: "Error",
                    description: "Please select both a grade and a subject",
                    variant: "destructive",
                  });
                }
              }}
              disabled={!selectedGradeId || !selectedSubjectId || assignSubject.isPending}
            >
              {assignSubject.isPending ? "Assigning..." : "Assign Subject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {selectedTeacher?.fullName}'s account
              and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (selectedTeacher) {
                  deleteUser.mutate(selectedTeacher.id);
                }
              }}
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  );
}
