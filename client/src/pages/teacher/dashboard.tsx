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
        <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-indigo-600"></div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-500">Assigned Grades</p>
                <h3 className="text-2xl font-bold mt-1 bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">{totalGrades}</h3>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center shadow-sm">
                <GraduationCap className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            <Progress value={totalGrades > 0 ? 100 : 0} className="h-1 mt-3" />
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-green-500 to-emerald-600"></div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-500">Assigned Subjects</p>
                <h3 className="text-2xl font-bold mt-1 bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">{totalSubjects}</h3>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center shadow-sm">
                <Book className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <Progress value={totalSubjects > 0 ? 100 : 0} className="h-1 mt-3" />
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-violet-600"></div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-500">Weekly Plans</p>
                <h3 className="text-2xl font-bold mt-1 bg-gradient-to-r from-purple-500 to-violet-600 bg-clip-text text-transparent">{totalPlans}</h3>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-purple-100 to-violet-100 rounded-full flex items-center justify-center shadow-sm">
                <Calendar className="h-6 w-6 text-violet-600" />
              </div>
            </div>
            <Progress value={totalPlans > 0 ? 100 : 0} className="h-1 mt-3" />
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 to-orange-600"></div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-500">Completion Rate</p>
                <h3 className="text-2xl font-bold mt-1 bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">{completionRate}%</h3>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center shadow-sm">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <Progress value={completionRate} className="h-1 mt-3" />
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-bold text-neutral-800 mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">My Assigned Grades</h2>
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
                <Card key={grade.id} className="hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer">
                  <Link href={`/mygrades?gradeId=${grade.id}`}>
                    <CardContent className="p-6 relative">
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-indigo-600 transform origin-left group-hover:scale-x-[12] transition-transform duration-300 z-0 opacity-0 group-hover:opacity-10"></div>
                      <div className="flex items-center relative z-10">
                        <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-3 rounded-lg mr-4 group-hover:from-blue-200 group-hover:to-indigo-200 transition-colors duration-300 shadow-sm">
                          <GraduationCap className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-neutral-800 group-hover:text-indigo-700 transition-colors duration-300">{grade.name}</h3>
                          <p className="text-neutral-500 text-sm">{subjectsForGrade.length} subjects assigned</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-neutral-200 relative z-10">
                        {subjectsForGrade.map(subject => (
                          <Badge key={subject.id} className="bg-gradient-to-r from-blue-100 to-indigo-100 text-indigo-700 hover:from-blue-200 hover:to-indigo-200 text-xs px-2 py-1 rounded mr-2 mb-2 border-0">
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
        <h2 className="text-xl font-bold text-neutral-800 mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Current Active Weeks</h2>
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 overflow-hidden">
          <CardContent className="p-6 relative">
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
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 px-3 py-1 text-xs font-medium">
                            Active
                          </Badge>
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
          <h2 className="text-xl font-bold text-neutral-800 bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">My Recent Plans</h2>
          <Button variant="link" className="text-primary" asChild>
            <Link to="/weeklyplans">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500 overflow-hidden">
          <CardContent className="p-6 relative">
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
                              <Link to={`/plan-editor/${plan.id}`}>
                                <Edit className="h-4 w-4 mr-1" /> Edit
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/weeklyplans?planId=${plan.id}`}>
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
        <h2 className="text-xl font-bold text-neutral-800 mb-4 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Create Weekly Plan</h2>
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-amber-500 overflow-hidden">
          <CardContent className="p-6 relative">
            <Link to="/plan-editor">
              <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0">
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
