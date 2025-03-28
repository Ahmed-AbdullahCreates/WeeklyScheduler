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
import { ConsolidatedWeeklyPlanView } from "@/components/admin/consolidated-weekly-plan-view";

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
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
          Weekly Plans Management
        </h1>
        <p className="text-neutral-600 mt-2">View and manage weekly plans for all grades and subjects</p>
      </div>
      
      <Card className="mb-8 shadow-md border-primary/10">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
          <CardTitle className="text-lg flex items-center">
            <Search className="h-5 w-5 mr-2 text-primary" />
            <span className="font-semibold">Filter Weekly Plans</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="grade-select" className="text-neutral-700 font-medium">Grade</Label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger id="grade-select" className="bg-white">
                  <SelectValue placeholder="Select Grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder" disabled>Select Grade</SelectItem>
                  {grades.map(grade => (
                    <SelectItem key={grade.id} value={grade.id.toString()}>{grade.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-neutral-500">Select a grade to view its weekly plans</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="week-select" className="text-neutral-700 font-medium">Week</Label>
              <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                <SelectTrigger id="week-select" className="bg-white">
                  <SelectValue placeholder="Select Week" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder" disabled>Select Week</SelectItem>
                  {planningWeeks.map(week => (
                    <SelectItem key={week.id} value={week.id.toString()}>
                      <div className="flex items-center">
                        <CalendarIcon className="h-3.5 w-3.5 mr-2 text-primary" />
                        <span>
                          Week {week.weekNumber}
                          <span className="text-muted-foreground"> ({formatDate(new Date(week.startDate))} - {formatDate(new Date(week.endDate))})</span>
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-neutral-500">Select a specific week to filter plans</p>
            </div>
            
            <div className="flex items-end">
              <Button 
                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-sm" 
                disabled={!selectedGrade || !selectedWeek}
                onClick={handleViewPlans}
                size="lg"
              >
                <Search className="h-4 w-4 mr-2" />
                View Plans
              </Button>
            </div>
          </div>
          
          {/* Quick Stats Section */}
          {selectedGrade && selectedWeek && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-8 border-t pt-6">
              <div className="bg-white shadow-sm rounded-lg p-4 border border-primary/10">
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Selected Grade</p>
                <p className="font-medium text-lg text-primary mt-1">
                  {grades.find(g => g.id.toString() === selectedGrade)?.name || "Unknown"}
                </p>
              </div>
              
              <div className="bg-white shadow-sm rounded-lg p-4 border border-primary/10">
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Selected Week</p>
                <p className="font-medium text-lg text-primary mt-1">
                  Week {planningWeeks.find(w => w.id.toString() === selectedWeek)?.weekNumber || "Unknown"}
                </p>
              </div>
              
              <div className="bg-white shadow-sm rounded-lg p-4 border border-primary/10">
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Week Status</p>
                <div className="flex items-center mt-1">
                  <Badge variant={planningWeeks.find(w => w.id.toString() === selectedWeek)?.isActive ? "default" : "outline"} 
                    className={`${planningWeeks.find(w => w.id.toString() === selectedWeek)?.isActive 
                      ? "bg-green-100 text-green-800" 
                      : "bg-neutral-100 text-neutral-800"} font-medium`}>
                    {planningWeeks.find(w => w.id.toString() === selectedWeek)?.isActive ? "Active" : "Closed"}
                  </Badge>
                </div>
              </div>
              
              <div className="bg-white shadow-sm rounded-lg p-4 border border-primary/10">
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Date Range</p>
                <p className="font-medium text-sm text-neutral-700 mt-1">
                  {planningWeeks.find(w => w.id.toString() === selectedWeek)?.startDate && 
                   planningWeeks.find(w => w.id.toString() === selectedWeek)?.endDate && (
                    <>
                      {formatDate(new Date(planningWeeks.find(w => w.id.toString() === selectedWeek)?.startDate || ""))} - {formatDate(new Date(planningWeeks.find(w => w.id.toString() === selectedWeek)?.endDate || ""))}
                    </>
                  )}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Weekly Plans View */}
      {selectedGrade && selectedWeek && (
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <CardTitle className="text-lg flex items-center">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                <span className="font-semibold">
                  Weekly Plans for {" "}
                  {grades.find(g => g.id.toString() === selectedGrade) && (
                    <span className="bg-gradient-to-r from-primary to-primary/80 text-transparent bg-clip-text">
                      {grades.find(g => g.id.toString() === selectedGrade)?.name}
                    </span>
                  )}
                </span>
              </CardTitle>
              {planningWeeks.find(w => w.id.toString() === selectedWeek) && (
                <Badge className="bg-blue-100 text-primary hover:bg-blue-200 hover:text-primary px-3 py-1">
                  <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                  <span className="font-medium">
                    Week {planningWeeks.find(w => w.id.toString() === selectedWeek)?.weekNumber}{" "}
                    ({formatDate(new Date(planningWeeks.find(w => w.id.toString() === selectedWeek)?.startDate || ""))} - {formatDate(new Date(planningWeeks.find(w => w.id.toString() === selectedWeek)?.endDate || ""))})
                  </span>
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoadingPlans ? (
              <div className="flex justify-center p-6">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : weeklyPlans.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="h-20 w-20 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-10 w-10 text-neutral-400" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-700 mb-2">No Weekly Plans Found</h3>
                <p className="text-neutral-500 text-center max-w-md mb-6">
                  There are no weekly plans created for this grade and week combination. Teachers can create plans from their dashboard.
                </p>
                <div className="flex items-center text-sm text-neutral-600 bg-white p-3 rounded-lg border border-neutral-200 shadow-sm">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Viewing: {grades.find(g => g.id.toString() === selectedGrade)?.name} - Week {planningWeeks.find(w => w.id.toString() === selectedWeek)?.weekNumber}</p>
                    <p className="text-neutral-500">Try selecting a different grade or week combination</p>
                  </div>
                </div>
              </div>
            ) : (
              <Tabs defaultValue="individual" className="w-full">
                <TabsList className="w-full mb-6 grid grid-cols-2">
                  <TabsTrigger value="individual" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Individual Plans</TabsTrigger>
                  <TabsTrigger value="consolidated" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Consolidated View</TabsTrigger>
                </TabsList>
                
                <TabsContent value="individual" className="space-y-8">
                  {weeklyPlans.map(plan => (
                    <Card key={plan.id} className="border-t-4 border-t-primary shadow-md hover:shadow-lg transition-shadow">
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
                                <span className="font-medium text-blue-700">Teacher:</span> {plan.teacher.fullName}
                              </Badge>
                              <Badge variant="outline">
                                Created: {formatDate(new Date(plan.createdAt))}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
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
                            return (
                              <TabsContent key={day} value={day} className="bg-white rounded-md p-4 border border-muted">
                                {dailyPlan ? (
                                  <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div className="bg-white rounded-md shadow-sm p-4 border-l-4 border-l-primary hover:shadow-md transition-shadow">
                                        <h4 className="text-sm font-medium mb-1 text-primary">Topic</h4>
                                        <p className="text-neutral-800">{dailyPlan.topic}</p>
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
                                    <p className="text-neutral-500 font-medium">No plan created for this day.</p>
                                    <p className="text-sm text-neutral-400">The teacher hasn't created a plan for {day}.</p>
                                  </div>
                                )}
                              </TabsContent>
                            );
                          })}
                        </Tabs>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
                
                <TabsContent value="consolidated">
                  <ConsolidatedWeeklyPlanView 
                    weeklyPlans={weeklyPlans} 
                    grade={grades.find(g => g.id.toString() === selectedGrade)} 
                    week={planningWeeks.find(w => w.id.toString() === selectedWeek)} 
                  />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}
    </PageWrapper>
  );
}