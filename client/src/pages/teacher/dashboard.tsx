import { PageWrapper } from "@/components/layout/page-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  GraduationCap, 
  Book, 
  ArrowRight, 
  Calendar, 
  Edit, 
  Eye, 
  Check, 
  Clock, 
  Download,
  PieChart,
  BarChart,
  Users,
  Activity 
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlanningWeek, TeacherWithAssignments } from "@shared/schema";

export default function TeacherDashboard() {
  const { user } = useAuth();
  
  // Fetch teacher's assignments (grades and subjects)
  const { data: teacherData, isLoading: isLoadingTeacherData } = useQuery<TeacherWithAssignments>({
    queryKey: ["/api/teachers", user?.id, "full"],
    queryFn: async () => {
      const res = await fetch(`/api/teachers/${user?.id}/full`);
      return res.json();
    },
    enabled: !!user,
  });
  
  // Fetch active planning weeks
  const { data: activeWeeks = [] } = useQuery<PlanningWeek[]>({
    queryKey: ["/api/planning-weeks/active"],
  });
  
  // Fetch teacher's weekly plans
  const { data: weeklyPlans = [] } = useQuery<any[]>({
    queryKey: ["/api/weekly-plans/teacher", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/weekly-plans/teacher/${user?.id}`);
      return res.json();
    },
    enabled: !!user,
  });
  
  // Calculate statistics
  const totalGrades = teacherData?.grades.length || 0;
  const totalSubjects = Object.values(teacherData?.subjects || {}).flat().length || 0;
  const totalPlans = weeklyPlans.length || 0;
  const completionRate = totalPlans > 0 
    ? Math.round((weeklyPlans.filter(plan => 
        plan.dailyPlans && plan.dailyPlans.length >= 5).length / totalPlans) * 100) 
    : 0;

  return (
    <PageWrapper title="Dashboard">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-500">Assigned Grades</p>
                <h3 className="text-2xl font-bold mt-1">{totalGrades}</h3>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
            </div>
            <Progress value={totalGrades > 0 ? 100 : 0} className="h-1 mt-3" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-500">Assigned Subjects</p>
                <h3 className="text-2xl font-bold mt-1">{totalSubjects}</h3>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <Book className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <Progress value={totalSubjects > 0 ? 100 : 0} className="h-1 mt-3 bg-green-100" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-500">Weekly Plans</p>
                <h3 className="text-2xl font-bold mt-1">{totalPlans}</h3>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <Progress value={totalPlans > 0 ? 100 : 0} className="h-1 mt-3 bg-purple-100" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-500">Completion Rate</p>
                <h3 className="text-2xl font-bold mt-1">{completionRate}%</h3>
              </div>
              <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Activity className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <Progress value={completionRate} className="h-1 mt-3 bg-amber-100" />
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-medium text-neutral-800 mb-4">My Assigned Grades</h2>
        {isLoadingTeacherData ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : teacherData?.grades.length === 0 ? (
          <Alert>
            <AlertTitle>No grades assigned</AlertTitle>
            <AlertDescription>
              You don't have any grades assigned yet. Please contact an administrator.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teacherData?.grades.map(grade => {
              const subjectsForGrade = teacherData.subjects[grade.id] || [];
              return (
                <Card key={grade.id} className="hover:shadow-md transition-shadow border-2 border-transparent hover:border-primary-light cursor-pointer">
                  <Link href={`/mygrades?gradeId=${grade.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-3 rounded-lg mr-4">
                          <GraduationCap className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-neutral-800">{grade.name}</h3>
                          <p className="text-neutral-500 text-sm">{subjectsForGrade.length} subjects assigned</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-neutral-200">
                        {subjectsForGrade.map(subject => (
                          <Badge key={subject.id} className="bg-blue-100 text-primary text-xs px-2 py-1 rounded mr-2 mb-2">
                            {subject.name}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Active Planning Weeks */}
      <div className="mb-8">
        <h2 className="text-xl font-medium text-neutral-800 mb-4">Current Active Weeks</h2>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            {activeWeeks.length === 0 ? (
              <Alert>
                <AlertTitle>No active weeks</AlertTitle>
                <AlertDescription>
                  There are no active planning weeks at the moment. Please check back later.
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
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeWeeks.map(week => (
                      <TableRow key={week.id}>
                        <TableCell>Week {week.weekNumber}, {week.year}</TableCell>
                        <TableCell>
                          {formatDate(new Date(week.startDate))} - {formatDate(new Date(week.endDate))}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Active</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="link" className="text-primary" asChild>
                            <Link href={`/weeklyplans?weekId=${week.id}`}>
                              Create Plans <ArrowRight className="ml-1 h-4 w-4" />
                            </Link>
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
      </div>
      
      {/* Recent Weekly Plans */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium text-neutral-800">My Recent Plans</h2>
          <Button variant="link" className="text-primary" asChild>
            <Link href="/weeklyplans">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            {weeklyPlans.length === 0 ? (
              <Alert>
                <AlertTitle>No plans created</AlertTitle>
                <AlertDescription>
                  You haven't created any weekly plans yet. Click the "Create Plan" button to get started.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grade</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Week</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weeklyPlans.slice(0, 5).map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell>{teacherData?.grades.find(g => g.id === plan.gradeId)?.name || "Unknown"}</TableCell>
                        <TableCell>{teacherData?.subjects[plan.gradeId]?.find(s => s.id === plan.subjectId)?.name || "Unknown"}</TableCell>
                        <TableCell>Week {activeWeeks.find(w => w.id === plan.weekId)?.weekNumber || "Unknown"}</TableCell>
                        <TableCell>{formatDate(new Date(plan.createdAt))}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(`/api/weekly-plans/${plan.id}/export-pdf`, '_blank')}
                            >
                              <Download className="h-4 w-4 mr-1" />
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/plan-editor/${plan.id}`}>
                                <Edit className="h-4 w-4 mr-1" /> Edit
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/weeklyplans?planId=${plan.id}`}>
                                <Eye className="h-4 w-4 mr-1" /> View
                              </Link>
                            </Button>
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
      </div>
      
      {/* Create Weekly Plan Card */}
      <div className="mb-8">
        <h2 className="text-xl font-medium text-neutral-800 mb-4">Create Weekly Plan</h2>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <Link href="/plan-editor">
              <Button className="w-full">
                <Calendar className="mr-2 h-4 w-4" />
                Create New Weekly Plan
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
