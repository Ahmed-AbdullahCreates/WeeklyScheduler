import { PageWrapper } from "@/components/layout/page-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { PlanningWeek, TeacherWithAssignments, WeeklyPlanWithDetails } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar, Download, Edit, Eye, FileText, Search } from "lucide-react";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function TeacherWeeklyPlans() {
  const { user } = useAuth();
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  
  // Fetch teacher's assignments (grades and subjects)
  const { data: teacherData } = useQuery<TeacherWithAssignments>({
    queryKey: ["/api/teachers", user?.id, "full"],
    queryFn: async () => {
      const res = await fetch(`/api/teachers/${user?.id}/full`);
      return res.json();
    },
    enabled: !!user,
  });
  
  // Fetch planning weeks
  const { data: planningWeeks = [] } = useQuery<PlanningWeek[]>({
    queryKey: ["/api/planning-weeks"],
  });
  
  // Fetch teacher's weekly plans
  const { data: teacherPlans = [] } = useQuery<any[]>({
    queryKey: ["/api/weekly-plans/teacher", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/weekly-plans/teacher/${user?.id}`);
      return res.json();
    },
    enabled: !!user,
  });
  
  // Fetch weekly plans for selected grade and week
  const { data: filteredPlans = [], isLoading: isLoadingFilteredPlans } = useQuery<WeeklyPlanWithDetails[]>({
    queryKey: ["/api/weekly-plans/grade", selectedGrade, "week", selectedWeek],
    queryFn: async () => {
      if (!selectedGrade || !selectedWeek) return [];
      
      const res = await fetch(`/api/weekly-plans/grade/${selectedGrade}/week/${selectedWeek}`);
      return res.json();
    },
    enabled: !!(selectedGrade && selectedWeek),
  });
  
  const handleFilter = () => {
    if (!selectedGrade || !selectedWeek) {
      return;
    }
    // The query will be triggered automatically when both values are set
  };
  
  return (
    <PageWrapper title="Weekly Plans">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Weekly Plans</h1>
        <p className="text-neutral-500 mt-1">View and manage your weekly lesson plans</p>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Filter Weekly Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="grade-select">Grade</Label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger id="grade-select" className="mt-1">
                  <SelectValue placeholder="Select Grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder">Select Grade</SelectItem>
                  {teacherData?.grades.map(grade => (
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
                onClick={handleFilter}
              >
                <Search className="h-4 w-4 mr-2" />
                View Plans
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Weekly Plans Overview */}
      <Card className="mb-8 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
          <CardTitle className="text-lg flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-primary" />
            <span className="bg-gradient-to-r from-primary to-primary/80 text-transparent bg-clip-text font-semibold">
              Recent Weekly Plans
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {teacherPlans.length === 0 ? (
            <Alert className="bg-neutral-50 border-primary/20">
              <AlertTitle className="font-semibold">No plans yet</AlertTitle>
              <AlertDescription>
                You haven't created any weekly plans yet. Use the "Create Plan" button to get started.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/40">
                    <TableHead className="font-semibold">Grade</TableHead>
                    <TableHead className="font-semibold">Subject</TableHead>
                    <TableHead className="font-semibold">Week</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teacherPlans.slice(0, 10).map((plan, index) => {
                    const weekData = planningWeeks.find(w => w.id === plan.weekId);
                    const isActive = weekData?.isActive;
                    
                    return (
                      <TableRow 
                        key={plan.id} 
                        className={index % 2 === 0 ? "bg-white" : "bg-primary/5"}
                      >
                        <TableCell className="font-medium">
                          {teacherData?.grades.find(g => g.id === plan.gradeId)?.name || "Unknown"}
                        </TableCell>
                        <TableCell>
                          <span className={isActive ? "text-primary font-medium" : ""}>
                            {teacherData?.subjects[plan.gradeId]?.find(s => s.id === plan.subjectId)?.name || "Unknown"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className={`h-4 w-4 mr-1 ${isActive ? "text-primary" : "text-neutral-500"}`} />
                            <span>
                              Week {weekData?.weekNumber || "Unknown"}
                              {weekData && (
                                <span className="text-xs text-neutral-500 block">
                                  {formatDate(new Date(weekData.startDate))}
                                </span>
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={isActive ? "default" : "outline"} 
                            className={isActive 
                              ? "bg-green-100 text-green-800 hover:bg-green-200 font-medium" 
                              : "bg-neutral-100 text-neutral-800 hover:bg-neutral-200"}
                          >
                            {isActive ? "Active" : "Closed"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={() => window.open(`/api/weekly-plans/${plan.id}/export-pdf`, '_blank')}
                              className="bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90 text-white"
                            >
                              <Download className="h-4 w-4 mr-1" /> PDF
                            </Button>
                            <Button 
                              variant={isActive ? "outline" : "ghost"} 
                              size="sm" 
                              asChild 
                              disabled={!isActive}
                              className={isActive ? "border-primary text-primary hover:bg-primary/10" : "opacity-50"}
                            >
                              <Link href={`/plan-editor/${plan.id}`}>
                                <Edit className="h-4 w-4 mr-1" /> Edit
                              </Link>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              asChild
                              className="border-blue-500 text-blue-600 hover:bg-blue-50"
                            >
                              <Link href={`#plan-${plan.id}`}>
                                <Eye className="h-4 w-4 mr-1" /> View
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {teacherPlans.length > 10 && (
                <div className="mt-4 flex justify-center">
                  <Button variant="outline" size="sm" className="text-neutral-600">
                    View All Plans ({teacherPlans.length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Filtered Weekly Plans */}
      {selectedGrade && selectedWeek && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <CardTitle>
                Filtered Plans: 
                {teacherData?.grades.find(g => g.id.toString() === selectedGrade) && (
                  <span className="ml-2 text-primary">
                    {teacherData.grades.find(g => g.id.toString() === selectedGrade)?.name}
                  </span>
                )}
              </CardTitle>
              {planningWeeks.find(w => w.id.toString() === selectedWeek) && (
                <Badge className="bg-blue-100 text-primary hover:bg-blue-200 hover:text-primary">
                  <Calendar className="h-3 w-3 mr-1" />
                  Week {planningWeeks.find(w => w.id.toString() === selectedWeek)?.weekNumber}{" "}
                  ({formatDate(new Date(planningWeeks.find(w => w.id.toString() === selectedWeek)?.startDate || ""))})
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingFilteredPlans ? (
              <div className="flex justify-center p-6">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : filteredPlans.length === 0 ? (
              <Alert>
                <AlertTitle>No plans found</AlertTitle>
                <AlertDescription>
                  There are no weekly plans created for this grade and week combination.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                {filteredPlans.map(plan => (
                  <Card key={plan.id} className="border-t-4 border-t-primary shadow-md hover:shadow-lg transition-shadow" id={`plan-${plan.id}`}>
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                        <div>
                          <CardTitle className="text-lg flex items-center">
                            <FileText className="h-5 w-5 mr-2 text-primary" />
                            <span className="bg-gradient-to-r from-primary to-primary/80 text-transparent bg-clip-text font-semibold">
                              {plan.subject.name}
                            </span>
                          </CardTitle>
                          <div className="flex items-center mt-2 space-x-2">
                            <Badge variant="outline" className="bg-blue-50">
                              <span className="font-medium text-blue-700">Grade:</span> {plan.grade.name}
                            </Badge>
                            <Badge variant="outline">
                              Created: {formatDate(new Date(plan.createdAt))}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              onClick={() => window.open(`/api/weekly-plans/${plan.id}/export-pdf`, '_blank')}
                              className="bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90 text-white"
                            >
                              <Download className="h-4 w-4 mr-1" /> PDF
                            </Button>
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              onClick={() => window.open(`/api/weekly-plans/${plan.id}/export-excel`, '_blank')}
                              className="bg-gradient-to-r from-blue-500/90 to-blue-600 hover:from-blue-600 hover:to-blue-500/90 text-white"
                            >
                              <Download className="h-4 w-4 mr-1" /> Excel
                            </Button>
                          </div>
                          <Button 
                            variant={plan.week.isActive ? "outline" : "ghost"}
                            size="sm" 
                            asChild 
                            disabled={!plan.week.isActive}
                            className={plan.week.isActive ? "border-primary text-primary hover:bg-primary/10" : "opacity-50"}
                          >
                            <Link href={`/plan-editor/${plan.id}`}>
                              <Edit className="h-4 w-4 mr-1" /> Edit Plan
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <Tabs defaultValue="monday" className="w-full">
                        <TabsList className="w-full grid grid-cols-5 mb-4 bg-muted/30">
                          <TabsTrigger value="monday" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Monday</TabsTrigger>
                          <TabsTrigger value="tuesday" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Tuesday</TabsTrigger>
                          <TabsTrigger value="wednesday" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Wednesday</TabsTrigger>
                          <TabsTrigger value="thursday" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Thursday</TabsTrigger>
                          <TabsTrigger value="friday" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Friday</TabsTrigger>
                        </TabsList>
                        
                        {["monday", "tuesday", "wednesday", "thursday", "friday"].map((day, index) => {
                          const dailyPlan = plan.dailyPlans.find(dp => dp.dayOfWeek === index + 1);
                          const hasContent = dailyPlan?.topic || dailyPlan?.booksAndPages || dailyPlan?.homework || 
                                           dailyPlan?.homeworkDueDate || dailyPlan?.assignments || dailyPlan?.notes;
                          
                          return (
                            <TabsContent key={day} value={day} className="bg-white rounded-md p-4 border border-muted">
                              {dailyPlan && hasContent ? (
                                <div className="space-y-6">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-md shadow-sm p-4 border-l-4 border-l-primary hover:shadow-md transition-shadow">
                                      <h4 className="text-sm font-medium mb-1 text-primary">Topic</h4>
                                      <p className="text-neutral-800">{dailyPlan.topic || "N/A"}</p>
                                    </div>
                                    <div className="bg-white rounded-md shadow-sm p-4 border-l-4 border-l-secondary hover:shadow-md transition-shadow">
                                      <h4 className="text-sm font-medium mb-1 text-secondary">Books & Pages</h4>
                                      <p className="text-neutral-800">{dailyPlan.booksAndPages || "N/A"}</p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-md shadow-sm p-4 border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
                                      <h4 className="text-sm font-medium mb-1 text-orange-600">Homework</h4>
                                      <p className="text-neutral-800">{dailyPlan.homework || "N/A"}</p>
                                    </div>
                                    <div className="bg-white rounded-md shadow-sm p-4 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
                                      <h4 className="text-sm font-medium mb-1 text-emerald-600">Homework Due Date</h4>
                                      <p className="text-neutral-800">
                                        {dailyPlan.homeworkDueDate ? formatDate(new Date(dailyPlan.homeworkDueDate)) : "N/A"}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 gap-6">
                                    <div className="bg-white rounded-md shadow-sm p-4 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                                      <h4 className="text-sm font-medium mb-1 text-blue-600">Assignments</h4>
                                      <p className="text-neutral-800">{dailyPlan.assignments || "N/A"}</p>
                                    </div>
                                    <div className="bg-white rounded-md shadow-sm p-4 border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
                                      <h4 className="text-sm font-medium mb-1 text-purple-600">Notes</h4>
                                      <p className="text-neutral-800">{dailyPlan.notes || "N/A"}</p>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col justify-center items-center p-8 bg-neutral-50 rounded-md">
                                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <FileText className="h-8 w-8 text-muted-foreground" />
                                  </div>
                                  <p className="text-neutral-500 font-medium">No plan for {day}</p>
                                  {plan.week.isActive ? (
                                    <div className="mt-4">
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="border-primary text-primary hover:bg-primary/10"
                                        asChild
                                      >
                                        <Link href={`/plan-editor/${plan.id}`}>
                                          Create plan for {day}
                                        </Link>
                                      </Button>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-neutral-400 mt-2">This week is not active. Cannot edit.</p>
                                  )}
                                </div>
                              )}
                            </TabsContent>
                          );
                        })}
                      </Tabs>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Create New Plan Card */}
      <Card className="bg-gradient-to-r from-primary/20 to-primary/5 border-primary/20 mb-6 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
        <div className="relative">
          {/* Background Pattern */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10 transform translate-x-8 -translate-y-8">
            <div className="w-full h-full bg-primary rounded-full"></div>
          </div>
          <div className="absolute bottom-0 left-0 w-24 h-24 opacity-10 transform -translate-x-6 translate-y-6">
            <div className="w-full h-full bg-primary rounded-full"></div>
          </div>
          
          <CardContent className="p-8 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="max-w-lg">
                <h3 className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/80 text-transparent bg-clip-text">
                  Create a New Weekly Plan
                </h3>
                <p className="text-neutral-600 mt-2">
                  Start planning your lessons for the upcoming week. Organize topics, homework, 
                  and resources for your students in one place.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center text-sm text-neutral-700">
                    <div className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-2">✓</div>
                    Create detailed plans for each day of the week
                  </li>
                  <li className="flex items-center text-sm text-neutral-700">
                    <div className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-2">✓</div>
                    Specify homework assignments and due dates
                  </li>
                  <li className="flex items-center text-sm text-neutral-700">
                    <div className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-2">✓</div>
                    Export to PDF for easy sharing and reference
                  </li>
                </ul>
              </div>
              <div className="flex-shrink-0">
                <Button 
                  asChild 
                  size="lg"
                  className="relative group w-full md:w-auto bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md"
                >
                  <Link href="/plan-editor" className="flex items-center px-6">
                    <div className="mr-3 p-2 bg-white/20 rounded-full transition-all group-hover:bg-white/30">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <span className="font-medium">Create New Plan</span>
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </PageWrapper>
  );
}
