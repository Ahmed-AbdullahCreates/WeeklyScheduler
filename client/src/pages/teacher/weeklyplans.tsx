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
import { Calendar, Edit, Eye, FileText, Search } from "lucide-react";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
                  <SelectItem value="">Select Grade</SelectItem>
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
                  <SelectItem value="">Select Week</SelectItem>
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
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Recent Weekly Plans</CardTitle>
        </CardHeader>
        <CardContent>
          {teacherPlans.length === 0 ? (
            <Alert>
              <AlertTitle>No plans yet</AlertTitle>
              <AlertDescription>
                You haven't created any weekly plans yet. Use the "Create Plan" button to get started.
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
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teacherPlans.slice(0, 10).map(plan => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        {teacherData?.grades.find(g => g.id === plan.gradeId)?.name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        {teacherData?.subjects[plan.gradeId]?.find(s => s.id === plan.subjectId)?.name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-neutral-500" />
                          Week {planningWeeks.find(w => w.id === plan.weekId)?.weekNumber || "Unknown"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={planningWeeks.find(w => w.id === plan.weekId)?.isActive ? "success" : "outline"}>
                          {planningWeeks.find(w => w.id === plan.weekId)?.isActive ? "Active" : "Closed"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" asChild disabled={!planningWeeks.find(w => w.id === plan.weekId)?.isActive}>
                            <Link href={`/plan-editor/${plan.id}`}>
                              <Edit className="h-4 w-4 mr-1" /> Edit
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`#plan-${plan.id}`}>
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
                  <Card key={plan.id} className="border-t-4 border-t-primary" id={`plan-${plan.id}`}>
                    <CardHeader>
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                        <div>
                          <CardTitle className="text-lg flex items-center">
                            <FileText className="h-5 w-5 mr-2 text-primary" />
                            {plan.subject.name}
                          </CardTitle>
                          <p className="text-sm text-neutral-500 mt-1">
                            Created: {formatDate(new Date(plan.createdAt))}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" asChild disabled={!plan.week.isActive}>
                          <Link href={`/plan-editor/${plan.id}`}>
                            <Edit className="h-4 w-4 mr-1" /> Edit Plan
                          </Link>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="monday">
                        <TabsList className="w-full grid grid-cols-5">
                          <TabsTrigger value="monday">Monday</TabsTrigger>
                          <TabsTrigger value="tuesday">Tuesday</TabsTrigger>
                          <TabsTrigger value="wednesday">Wednesday</TabsTrigger>
                          <TabsTrigger value="thursday">Thursday</TabsTrigger>
                          <TabsTrigger value="friday">Friday</TabsTrigger>
                        </TabsList>
                        
                        {["monday", "tuesday", "wednesday", "thursday", "friday"].map((day, index) => {
                          const dailyPlan = plan.dailyPlans.find(dp => dp.dayOfWeek === index + 1);
                          return (
                            <TabsContent key={day} value={day}>
                              {dailyPlan ? (
                                <div className="space-y-4 mt-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="text-sm font-medium mb-1">Topic</h4>
                                      <p className="text-neutral-800 border p-2 rounded-md bg-neutral-50">{dailyPlan.topic}</p>
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-medium mb-1">Books & Pages</h4>
                                      <p className="text-neutral-800 border p-2 rounded-md bg-neutral-50">{dailyPlan.booksAndPages || "N/A"}</p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="text-sm font-medium mb-1">Homework</h4>
                                      <p className="text-neutral-800 border p-2 rounded-md bg-neutral-50">{dailyPlan.homework || "N/A"}</p>
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-medium mb-1">Homework Due Date</h4>
                                      <p className="text-neutral-800 border p-2 rounded-md bg-neutral-50">
                                        {dailyPlan.homeworkDueDate ? formatDate(new Date(dailyPlan.homeworkDueDate)) : "N/A"}
                                      </p>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-medium mb-1">Assignments</h4>
                                    <p className="text-neutral-800 border p-2 rounded-md bg-neutral-50">{dailyPlan.assignments || "N/A"}</p>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-medium mb-1">Notes</h4>
                                    <p className="text-neutral-800 border p-2 rounded-md bg-neutral-50">{dailyPlan.notes || "N/A"}</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-center items-center p-8">
                                  <p className="text-neutral-500">No plan created for this day.</p>
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
    </PageWrapper>
  );
}
