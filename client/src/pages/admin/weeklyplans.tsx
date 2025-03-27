import { PageWrapper } from "@/components/layout/page-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PlanningWeek, Grade, WeeklyPlanWithDetails } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CalendarIcon, Download, FileText, Search } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function AdminWeeklyPlans() {
  const { toast } = useToast();
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  
  // Fetch grades
  const { data: grades = [] } = useQuery<Grade[]>({
    queryKey: ["/api/grades"],
  });
  
  // Fetch planning weeks
  const { data: planningWeeks = [] } = useQuery<PlanningWeek[]>({
    queryKey: ["/api/planning-weeks"],
  });
  
  // Fetch weekly plans for the selected grade and week
  const { data: weeklyPlans = [], isLoading: isLoadingPlans } = useQuery<WeeklyPlanWithDetails[]>({
    queryKey: ["/api/weekly-plans/grade", selectedGrade, "week", selectedWeek],
    queryFn: async () => {
      if (!selectedGrade || !selectedWeek) return [];
      
      const res = await fetch(`/api/weekly-plans/grade/${selectedGrade}/week/${selectedWeek}`);
      return res.json();
    },
    enabled: !!(selectedGrade && selectedWeek),
  });
  
  const handleViewPlans = () => {
    if (!selectedGrade || !selectedWeek) {
      toast({
        title: "Error",
        description: "Please select both a grade and a week",
        variant: "destructive",
      });
      return;
    }
  };
  
  return (
    <PageWrapper title="Weekly Plans">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Weekly Plans Management</h1>
        <p className="text-neutral-500 mt-1">View and manage weekly plans for all grades and subjects</p>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filter Weekly Plans</CardTitle>
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
                onClick={handleViewPlans}
              >
                <Search className="h-4 w-4 mr-2" />
                View Plans
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Weekly Plans View */}
      {selectedGrade && selectedWeek && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <CardTitle>
                Weekly Plans
                {grades.find(g => g.id.toString() === selectedGrade) && (
                  <span className="ml-2 text-primary">
                    {grades.find(g => g.id.toString() === selectedGrade)?.name}
                  </span>
                )}
              </CardTitle>
              {planningWeeks.find(w => w.id.toString() === selectedWeek) && (
                <Badge className="bg-blue-100 text-primary hover:bg-blue-200 hover:text-primary">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  Week {planningWeeks.find(w => w.id.toString() === selectedWeek)?.weekNumber}{" "}
                  ({formatDate(new Date(planningWeeks.find(w => w.id.toString() === selectedWeek)?.startDate || ""))} - {formatDate(new Date(planningWeeks.find(w => w.id.toString() === selectedWeek)?.endDate || ""))})
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingPlans ? (
              <div className="flex justify-center p-6">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : weeklyPlans.length === 0 ? (
              <Alert>
                <AlertTitle>No plans found</AlertTitle>
                <AlertDescription>
                  There are no weekly plans created for this grade and week combination.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                {weeklyPlans.map(plan => (
                  <Card key={plan.id} className="border-t-4 border-t-primary">
                    <CardHeader>
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                        <div>
                          <CardTitle className="text-lg flex items-center">
                            <FileText className="h-5 w-5 mr-2 text-primary" />
                            {plan.subject.name}
                          </CardTitle>
                          <p className="text-sm text-neutral-500 mt-1">
                            Teacher: {plan.teacher.fullName}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex gap-2">
                            <Button 
                              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0"
                              size="sm"
                              onClick={() => window.open(`/api/weekly-plans/${plan.id}/export-pdf`, '_blank')}
                            >
                              <Download className="h-4 w-4 mr-1" /> PDF
                            </Button>
                            <Button 
                              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0"
                              size="sm"
                              onClick={() => window.open(`/api/weekly-plans/${plan.id}/export-excel`, '_blank')}
                            >
                              <Download className="h-4 w-4 mr-1" /> Excel
                            </Button>
                          </div>
                          <Badge variant="outline">
                            Created: {formatDate(new Date(plan.createdAt))}
                          </Badge>
                        </div>
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
