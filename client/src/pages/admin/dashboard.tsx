import { PageWrapper } from "@/components/layout/page-wrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { 
  CalendarIcon, 
  School, 
  Book, 
  Users,
  Plus,
  Check,
  CalendarCheck
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

export default function AdminDashboard() {
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [newWeekDialogOpen, setNewWeekDialogOpen] = useState(false);
  
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg mr-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-neutral-500 text-sm font-medium">Total Teachers</h3>
                <p className="text-2xl font-semibold text-neutral-800">{teachers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg mr-4">
                <School className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="text-neutral-500 text-sm font-medium">Total Grades</h3>
                <p className="text-2xl font-semibold text-neutral-800">{grades.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-amber-100 p-3 rounded-lg mr-4">
                <Book className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-neutral-500 text-sm font-medium">Total Subjects</h3>
                <p className="text-2xl font-semibold text-neutral-800">{subjectCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* View Weekly Plans */}
      <Card className="mb-8 hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-neutral-800 mb-4">View Weekly Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="grade-select">Grade</Label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger id="grade-select" className="mt-1">
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
              <Label htmlFor="week-select">Week</Label>
              <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                <SelectTrigger id="week-select" className="mt-1">
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
                className="w-full" 
                disabled={!selectedGrade || !selectedWeek}
              >
                View Plans
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Active Planning Weeks */}
      <Card className="mb-8 hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-neutral-800">Active Planning Weeks</h3>
            <Dialog open={newWeekDialogOpen} onOpenChange={setNewWeekDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center">
                  <Plus className="h-4 w-4 mr-1" /> Activate Week
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Activate New Planning Week</DialogTitle>
                  <DialogDescription>
                    Enter the details for the new planning week
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="week-number">Week Number</Label>
                      <Input id="week-number" type="number" min="1" max="52" placeholder="e.g., 36" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year">Year</Label>
                      <Input id="year" type="number" placeholder="e.g., 2023" defaultValue={new Date().getFullYear()} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input id="start-date" type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <Input id="end-date" type="date" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewWeekDialogOpen(false)}>Cancel</Button>
                  <Button onClick={() => {
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
                  }}>Activate Week</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {planningWeeks.length === 0 ? (
            <Alert>
              <AlertTitle>No planning weeks available</AlertTitle>
              <AlertDescription>
                Click the "Activate Week" button to create a new planning week.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Week</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planningWeeks.map(week => (
                    <TableRow key={week.id}>
                      <TableCell>Week {week.weekNumber}, {week.year}</TableCell>
                      <TableCell>
                        {formatDate(new Date(week.startDate))} - {formatDate(new Date(week.endDate))}
                      </TableCell>
                      <TableCell>
                        <Badge variant={week.isActive ? "default" : "outline"} className={week.isActive ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}>
                          {week.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          className={week.isActive ? "text-destructive hover:text-destructive/90" : "text-primary hover:text-primary/90"}
                          onClick={() => toggleWeekStatus.mutate(week.id)}
                        >
                          {week.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Recent Teacher Assignments */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-neutral-800">Recent Teacher Assignments</h3>
            <Button variant="link" size="sm" className="text-primary">
              View All
            </Button>
          </div>
          
          {recentAssignments.length === 0 ? (
            <Alert>
              <AlertTitle>No recent assignments</AlertTitle>
              <AlertDescription>
                No teacher assignments have been made recently.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Date Assigned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAssignments.map((assignment, index) => (
                    <TableRow key={index}>
                      <TableCell>{assignment.teacherName}</TableCell>
                      <TableCell>{assignment.gradeName}</TableCell>
                      <TableCell>
                        {assignment.type === 'subject' ? assignment.subjectName : 
                          <Badge variant="outline" className="bg-blue-50 text-blue-800">
                            Grade Assignment
                          </Badge>
                        }
                      </TableCell>
                      <TableCell>{assignment.assignedDate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
