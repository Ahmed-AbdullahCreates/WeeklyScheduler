import { PageWrapper } from "@/components/layout/page-wrapper";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { 
  CalendarIcon, 
  School, 
  Book, 
  Users,
  Plus,
  Check,
  CalendarCheck,
  Trash2,
  TrendingUp,
  PieChart,
  BarChart,
  Activity,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Eye,
  Download,
  ChevronRight
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PlanningWeek, User, Grade } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminDashboard() {
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [newWeekDialogOpen, setNewWeekDialogOpen] = useState(false);
  const [weekToDelete, setWeekToDelete] = useState<number | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch teachers
  const { data: teachers = [] } = useQuery<User[]>({
    queryKey: ["/api/teachers"],
  });
  
  // Fetch grades
  const { data: grades = [] } = useQuery<Grade[]>({
    queryKey: ["/api/grades"],
  });
  
  // Fetch subjects
  const { data: subjectCount = 0 } = useQuery<number>({
    queryKey: ["/api/subjects/count"],
    queryFn: async () => {
      const res = await fetch("/api/subjects");
      const data = await res.json();
      return data.length;
    }
  });
  
  // Fetch active planning weeks
  const { data: planningWeeks = [] } = useQuery<PlanningWeek[]>({
    queryKey: ["/api/planning-weeks"],
  });
  
  // Toggle planning week status
  const toggleWeekStatus = useMutation({
    mutationFn: async (weekId: number) => {
      const res = await apiRequest("PUT", `/api/planning-weeks/${weekId}/toggle`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planning-weeks"] });
    },
  });
  
  // Delete planning week
  const deletePlanningWeek = useMutation({
    mutationFn: async (weekId: number) => {
      const res = await apiRequest("DELETE", `/api/planning-weeks/${weekId}`, {});
      if (res.status === 400) {
        const error = await res.json();
        throw new Error(error.message);
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planning-weeks"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Create new planning week
  const createPlanningWeek = useMutation({
    mutationFn: async (weekData: any) => {
      const res = await apiRequest("POST", "/api/planning-weeks", weekData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planning-weeks"] });
      setNewWeekDialogOpen(false);
    },
  });
  
  // Get recent teacher assignments
  const { data: recentAssignments = [] } = useQuery<any[]>({
    queryKey: ["/api/recent-assignments"]
  });
  
  return (
    <PageWrapper title="Dashboard">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden group">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-indigo-600 group-hover:scale-x-[12] transform origin-left transition-transform duration-300 opacity-0 group-hover:opacity-10"></div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-500">Teachers</p>
                <h3 className="text-2xl font-bold mt-1 bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent flex items-center">
                  {teachers.length} 
                  <span className="text-green-500 text-xs ml-2 flex items-center font-medium">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Active
                  </span>
                </h3>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center shadow-sm group-hover:from-blue-200 group-hover:to-indigo-200 transition-colors duration-300">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            <Progress value={teachers.length > 0 ? 100 : 0} className="h-1 mt-3" />
            <div className="mt-4 pt-2">
              <Button variant="link" className="p-0 h-auto text-xs text-indigo-600 font-medium flex items-center" asChild>
                <Link to="/teachers">
                  View all teachers <ChevronRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden group">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-green-500 to-emerald-600 group-hover:scale-x-[12] transform origin-left transition-transform duration-300 opacity-0 group-hover:opacity-10"></div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-500">Grades</p>
                <h3 className="text-2xl font-bold mt-1 bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent flex items-center">
                  {grades.length}
                  <span className="text-green-500 text-xs ml-2 flex items-center font-medium">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Managed
                  </span>
                </h3>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center shadow-sm group-hover:from-green-200 group-hover:to-emerald-200 transition-colors duration-300">
                <School className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <Progress value={grades.length > 0 ? 100 : 0} className="h-1 mt-3" />
            <div className="mt-4 pt-2">
              <Button variant="link" className="p-0 h-auto text-xs text-emerald-600 font-medium flex items-center" asChild>
                <Link to="/grades">
                  Manage grades <ChevronRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden group">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-violet-600 group-hover:scale-x-[12] transform origin-left transition-transform duration-300 opacity-0 group-hover:opacity-10"></div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-500">Subjects</p>
                <h3 className="text-2xl font-bold mt-1 bg-gradient-to-r from-purple-500 to-violet-600 bg-clip-text text-transparent flex items-center">
                  {subjectCount}
                  <span className="text-purple-500 text-xs ml-2 flex items-center font-medium">
                    <Book className="h-3 w-3 mr-1" />
                    Available
                  </span>
                </h3>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-purple-100 to-violet-100 rounded-full flex items-center justify-center shadow-sm group-hover:from-purple-200 group-hover:to-violet-200 transition-colors duration-300">
                <PieChart className="h-6 w-6 text-violet-600" />
              </div>
            </div>
            <Progress value={subjectCount > 0 ? 100 : 0} className="h-1 mt-3" />
            <div className="mt-4 pt-2">
              <Button variant="link" className="p-0 h-auto text-xs text-violet-600 font-medium flex items-center" asChild>
                <Link to="/subjects">
                  Manage subjects <ChevronRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden group">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 to-orange-600 group-hover:scale-x-[12] transform origin-left transition-transform duration-300 opacity-0 group-hover:opacity-10"></div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-500">Active Weeks</p>
                <h3 className="text-2xl font-bold mt-1 bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent flex items-center">
                  {planningWeeks.filter(w => w.isActive).length}
                  <span className="text-amber-500 text-xs ml-2 flex items-center font-medium">
                    <Clock className="h-3 w-3 mr-1" />
                    Current
                  </span>
                </h3>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center shadow-sm group-hover:from-amber-200 group-hover:to-orange-200 transition-colors duration-300">
                <CalendarCheck className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <Progress value={planningWeeks.filter(w => w.isActive).length > 0 ? 100 : 0} className="h-1 mt-3" />
            <div className="mt-4 pt-2">
              <Button variant="link" className="p-0 h-auto text-xs text-orange-600 font-medium flex items-center" onClick={() => setNewWeekDialogOpen(true)}>
                Activate new week <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Dashboard Content Tabs */}
      <Card className="mb-8">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold text-neutral-800 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            School Planning Dashboard
          </CardTitle>
          <CardDescription>
            Manage weekly plans, view assigned teachers, and track school activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="weekly-plans" className="space-y-4">
            <TabsList className="grid grid-cols-3 h-auto">
              <TabsTrigger value="weekly-plans" className="py-2 relative group">
                <span className="inline-flex items-center">
                  <CalendarCheck className="h-4 w-4 mr-2 group-data-[state=active]:text-indigo-600" />
                  Weekly Plans
                </span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="py-2 relative group">
                <span className="inline-flex items-center">
                  <BarChart className="h-4 w-4 mr-2 group-data-[state=active]:text-indigo-600" />
                  Analytics
                </span>
              </TabsTrigger>
              <TabsTrigger value="assignments" className="py-2 relative group">
                <span className="inline-flex items-center">
                  <Users className="h-4 w-4 mr-2 group-data-[state=active]:text-indigo-600" />
                  Teacher Assignments
                </span>
              </TabsTrigger>
            </TabsList>
            
            {/* Weekly Plans Tab Content */}
            <TabsContent value="weekly-plans" className="space-y-4 pt-2">
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                <h3 className="text-md font-medium text-indigo-800 mb-2">View Weekly Plans</h3>
                <p className="text-sm text-indigo-600 mb-4">Select a grade and week to view all associated lesson plans</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="grade-select" className="text-indigo-700">Grade</Label>
                    <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                      <SelectTrigger id="grade-select" className="mt-1 border-indigo-200">
                        <SelectValue placeholder="Select Grade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="placeholder">Select Grade</SelectItem>
                        {grades.map(grade => (
                          <SelectItem key={grade.id} value={grade.id.toString()}>{grade.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="week-select" className="text-indigo-700">Planning Week</Label>
                    <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                      <SelectTrigger id="week-select" className="mt-1 border-indigo-200">
                        <SelectValue placeholder="Select Week" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="placeholder">Select Week</SelectItem>
                        {planningWeeks.map(week => (
                          <SelectItem key={week.id} value={week.id.toString()}>
                            Week {week.weekNumber} ({formatDate(new Date(week.startDate))} - {formatDate(new Date(week.endDate))})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0"
                      disabled={!selectedGrade || !selectedWeek || selectedGrade === "placeholder" || selectedWeek === "placeholder"}
                      onClick={() => {
                        window.location.href = `/weekly-plans/${selectedGrade}/${selectedWeek}`;
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" /> View Plans
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                  <h3 className="text-md font-medium text-green-800 mb-1">Calendar View</h3>
                  <p className="text-sm text-green-600 mb-3">View your school's planning calendar</p>
                  <Button 
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0"
                    asChild
                  >
                    <Link to="/calendar">
                      <CalendarIcon className="h-4 w-4 mr-2" /> Open Calendar
                    </Link>
                  </Button>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-100">
                  <h3 className="text-md font-medium text-amber-800 mb-1">Download Plans</h3>
                  <p className="text-sm text-amber-600 mb-3">Export weekly plans as PDFs</p>
                  <Button 
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white border-0"
                    disabled={!selectedGrade || !selectedWeek || selectedGrade === "placeholder" || selectedWeek === "placeholder"}
                    onClick={() => {
                      if (selectedGrade && selectedWeek) {
                        window.open(`/api/weekly-plans/${selectedGrade}/${selectedWeek}/export-all-pdf`, '_blank');
                      }
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" /> Export Plans
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            {/* Analytics Tab Content */}
            <TabsContent value="analytics" className="space-y-4 pt-2">
              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                  <BarChart className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-blue-800 mb-2">School Analytics</h3>
                <p className="text-sm text-blue-600 mb-4">Track performance and activity across your school</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Teacher Participation</h4>
                    <div className="flex justify-between items-center">
                      <p className="text-2xl font-bold text-blue-600">{Math.round((teachers.length > 0 ? recentAssignments.length / teachers.length : 0) * 100)}%</p>
                      <ArrowUpRight className="h-5 w-5 text-green-500" />
                    </div>
                    <Progress value={(teachers.length > 0 ? recentAssignments.length / teachers.length : 0) * 100} className="h-2 mt-2" />
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Active Planning Weeks</h4>
                    <div className="flex justify-between items-center">
                      <p className="text-2xl font-bold text-purple-600">{planningWeeks.filter(w => w.isActive).length}</p>
                      <Activity className="h-5 w-5 text-purple-500" />
                    </div>
                    <Progress value={planningWeeks.filter(w => w.isActive).length > 0 ? 100 : 0} className="h-2 mt-2 bg-purple-100" />
                  </div>
                </div>
                
                <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50" asChild>
                  <Link to="/analytics">
                    View Detailed Analytics
                  </Link>
                </Button>
              </div>
            </TabsContent>
            
            {/* Teacher Assignments Tab Content */}
            <TabsContent value="assignments" className="space-y-4 pt-2">
              <div className="p-6 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg border border-violet-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-medium text-violet-800">Recent Teacher Assignments</h3>
                  <Button variant="outline" size="sm" className="border-violet-200 text-violet-600 hover:bg-violet-50" asChild>
                    <Link to="/teachers">
                      Manage Teachers
                    </Link>
                  </Button>
                </div>
                
                {recentAssignments.length === 0 ? (
                  <div className="text-center py-6 px-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center mb-3">
                      <Users className="h-6 w-6 text-violet-500" />
                    </div>
                    <h4 className="text-sm font-medium text-violet-800 mb-2">No Recent Assignments</h4>
                    <p className="text-sm text-violet-600 mb-4">Assign teachers to grades and subjects to get started</p>
                    <Button variant="outline" className="border-violet-200 text-violet-600 hover:bg-violet-50" asChild>
                      <Link to="/teachers">
                        Assign Teachers
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-violet-50">
                          <TableHead>Teacher</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Date Assigned</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentAssignments.slice(0, 5).map((assignment, index) => (
                          <TableRow key={index} className="hover:bg-violet-50">
                            <TableCell className="font-medium">{assignment.teacherName}</TableCell>
                            <TableCell>{assignment.gradeName}</TableCell>
                            <TableCell>
                              {assignment.type === 'subject' ? (
                                <Badge className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white border-0 px-3 py-1 text-xs font-medium">
                                  {assignment.subjectName}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-600 px-3 py-1 text-xs font-medium">
                                  Grade Assignment
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{assignment.assignedDate}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Planning Weeks Management */}
      <Card className="mb-8">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold text-neutral-800 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            Planning Weeks Management
          </CardTitle>
          <CardDescription>
            Manage active and inactive planning weeks for your school
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Active weeks summary */}
            <div className="md:w-1/4 p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
              <div className="flex items-center mb-3">
                <div className="bg-white rounded-full p-3 shadow-sm mr-3">
                  <CalendarCheck className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-green-800">Active Weeks</h4>
                  <p className="text-3xl font-bold text-green-700">{planningWeeks.filter(w => w.isActive).length}</p>
                </div>
              </div>
              <Separator className="my-3 bg-green-100" />
              <Button 
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 mt-2" 
                onClick={() => setNewWeekDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" /> Activate New Week
              </Button>
              
              <Dialog open={newWeekDialogOpen} onOpenChange={setNewWeekDialogOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-green-800">Activate New Planning Week</DialogTitle>
                    <DialogDescription>
                      Enter the details for the new planning week
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="week-number" className="text-green-700">Week Number</Label>
                        <Input id="week-number" type="number" min="1" max="52" placeholder="e.g., 36" className="border-green-200 focus-visible:ring-green-500" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="year" className="text-green-700">Year</Label>
                        <Input id="year" type="number" placeholder="e.g., 2023" defaultValue={new Date().getFullYear()} className="border-green-200 focus-visible:ring-green-500" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-date" className="text-green-700">Start Date</Label>
                        <Input id="start-date" type="date" className="border-green-200 focus-visible:ring-green-500" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-date" className="text-green-700">End Date</Label>
                        <Input id="end-date" type="date" className="border-green-200 focus-visible:ring-green-500" />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50" onClick={() => setNewWeekDialogOpen(false)}>Cancel</Button>
                    <Button 
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      onClick={() => {
                        const weekNumber = parseInt((document.getElementById('week-number') as HTMLInputElement).value);
                        const year = parseInt((document.getElementById('year') as HTMLInputElement).value);
                        const startDate = (document.getElementById('start-date') as HTMLInputElement).value;
                        const endDate = (document.getElementById('end-date') as HTMLInputElement).value;
                        
                        createPlanningWeek.mutate({
                          weekNumber,
                          year,
                          startDate,
                          endDate,
                          isActive: true
                        });
                      }}
                    >
                      <Check className="h-4 w-4 mr-2" /> Activate Week
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Weeks table */}
            <div className="md:w-3/4">
              {planningWeeks.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-100 text-center">
                  <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                    <CalendarIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No Planning Weeks Available</h3>
                  <p className="text-gray-500 mb-4 max-w-sm">Create your first planning week to start organizing lesson plans for your school.</p>
                  <Button 
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0"
                    onClick={() => setNewWeekDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Create First Week
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-100">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold">Week Number</TableHead>
                        <TableHead className="font-semibold">Date Range</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {planningWeeks.map(week => (
                        <TableRow key={week.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            Week {week.weekNumber}, {week.year}
                            {week.isActive && (
                              <Badge className="ml-2 bg-green-100 text-green-800 border-0 px-2 py-0.5 text-xs">Current</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 text-gray-400 mr-1.5" />
                              {formatDate(new Date(week.startDate))} - {formatDate(new Date(week.endDate))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {week.isActive ? (
                              <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                                <span className="text-green-700 font-medium">Active</span>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full bg-gray-300 mr-2"></div>
                                <span className="text-gray-500">Inactive</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button 
                                variant={week.isActive ? "outline" : "default"} 
                                size="sm"
                                className={week.isActive 
                                  ? "text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300" 
                                  : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0"
                                }
                                onClick={() => toggleWeekStatus.mutate(week.id)}
                              >
                                {week.isActive ? "Deactivate" : "Activate"}
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-gray-600 hover:bg-gray-50 border-gray-200"
                                onClick={() => {
                                  setWeekToDelete(week.id);
                                  setConfirmDeleteOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Teacher Assignment Activity */}
      <Card className="mb-8">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold text-neutral-800 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Recent Teacher Activity
          </CardTitle>
          <CardDescription>
            View recent teacher assignments and classroom activity
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {recentAssignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 bg-amber-50 rounded-lg border border-amber-100 text-center">
              <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                <Users className="h-8 w-8 text-amber-400" />
              </div>
              <h3 className="text-lg font-medium text-amber-800 mb-2">No Recent Assignments</h3>
              <p className="text-amber-600 mb-4 max-w-md">
                Assign teachers to grades and subjects to begin tracking classroom activity.
              </p>
              <Button 
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
                asChild
              >
                <Link to="/teachers">
                  <Users className="h-4 w-4 mr-2" /> Manage Teachers
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Activity Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-100">
                  <h4 className="text-sm font-medium text-amber-800 mb-1">Total Assignments</h4>
                  <div className="flex justify-between items-center">
                    <p className="text-2xl font-bold text-amber-700">{recentAssignments.length}</p>
                    <div className="bg-white p-2 rounded-full shadow-sm">
                      <Users className="h-5 w-5 text-amber-500" />
                    </div>
                  </div>
                  <Progress value={100} className="h-1 mt-2 bg-amber-100" />
                </div>
                
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                  <h4 className="text-sm font-medium text-blue-800 mb-1">Grade Assignments</h4>
                  <div className="flex justify-between items-center">
                    <p className="text-2xl font-bold text-blue-700">
                      {recentAssignments.filter(a => a.type === 'grade').length}
                    </p>
                    <div className="bg-white p-2 rounded-full shadow-sm">
                      <School className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                  <Progress 
                    value={(recentAssignments.filter(a => a.type === 'grade').length / recentAssignments.length) * 100} 
                    className="h-1 mt-2 bg-blue-100" 
                  />
                </div>
                
                <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-100">
                  <h4 className="text-sm font-medium text-purple-800 mb-1">Subject Assignments</h4>
                  <div className="flex justify-between items-center">
                    <p className="text-2xl font-bold text-purple-700">
                      {recentAssignments.filter(a => a.type === 'subject').length}
                    </p>
                    <div className="bg-white p-2 rounded-full shadow-sm">
                      <Book className="h-5 w-5 text-purple-500" />
                    </div>
                  </div>
                  <Progress 
                    value={(recentAssignments.filter(a => a.type === 'subject').length / recentAssignments.length) * 100} 
                    className="h-1 mt-2 bg-purple-100" 
                  />
                </div>
              </div>
              
              {/* Recent Assignments Table */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-medium text-neutral-800">Assignment History</h3>
                  <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 hover:bg-amber-50" asChild>
                    <Link to="/teachers">
                      View All Teachers
                    </Link>
                  </Button>
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-100">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold">Teacher</TableHead>
                        <TableHead className="font-semibold">Assignment</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentAssignments.slice(0, 5).map((assignment, index) => (
                        <TableRow key={index} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center">
                              <div className="bg-gray-100 h-8 w-8 rounded-full flex items-center justify-center mr-2 text-gray-600">
                                {assignment.teacherName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium">{assignment.teacherName}</p>
                                <p className="text-xs text-gray-500">Teacher</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p>{assignment.gradeName}</p>
                              {assignment.type === 'subject' && (
                                <Badge className="mt-1 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white border-0 px-2 py-0.5 text-xs">
                                  {assignment.subjectName}
                                </Badge>
                              )}
                              {assignment.type === 'grade' && (
                                <Badge variant="outline" className="mt-1 bg-blue-50 border-blue-200 text-blue-600 px-2 py-0.5 text-xs">
                                  Grade Assignment
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <CalendarIcon className="h-3.5 w-3.5 text-gray-400 mr-1.5" />
                              <span className="text-sm">{assignment.assignedDate}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-indigo-600 hover:bg-indigo-50 border-indigo-200"
                              asChild
                            >
                              <Link to={`/teachers?id=${assignment.teacherId}`}>
                                View Teacher
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog for deleting planning week */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this planning week?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Any plans associated with this week will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setWeekToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (weekToDelete) {
                  deletePlanningWeek.mutate(weekToDelete);
                  setWeekToDelete(null);
                  toast({
                    title: "Success",
                    description: "Planning week deleted successfully",
                  });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  );
}
