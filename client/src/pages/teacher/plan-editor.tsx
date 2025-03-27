import { PageWrapper } from "@/components/layout/page-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation, useRoute } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, getDateForWeekDay, mapDayNumberToName } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  DailyPlan, 
  Grade, 
  PlanningWeek, 
  Subject, 
  TeacherWithAssignments, 
  WeeklyPlanComplete,
  insertDailyPlanSchema,
  insertWeeklyPlanSchema 
} from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, CalendarIcon, Check, Save } from "lucide-react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";

export default function TeacherPlanEditor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute<{ planId: string }>("/plan-editor/:planId");
  
  const urlParams = new URLSearchParams(window.location.search);
  const gradeIdParam = urlParams.get('gradeId');
  const subjectIdParam = urlParams.get('subjectId');
  
  const [selectedGrade, setSelectedGrade] = useState<string>(gradeIdParam || "");
  const [selectedSubject, setSelectedSubject] = useState<string>(subjectIdParam || "");
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("monday");
  const [weeklyPlanId, setWeeklyPlanId] = useState<number | null>(match ? parseInt(params.planId) : null);
  
  // Fetch teacher's assignments (grades and subjects)
  const { data: teacherData } = useQuery<TeacherWithAssignments>({
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
  
  // Fetch weekly plan if editing
  const { data: weeklyPlanData, isLoading: isLoadingWeeklyPlan } = useQuery<WeeklyPlanComplete>({
    queryKey: ["/api/weekly-plans", weeklyPlanId, "complete"],
    queryFn: async () => {
      const res = await fetch(`/api/weekly-plans/${weeklyPlanId}/complete`);
      return res.json();
    },
    enabled: !!weeklyPlanId,
  });
  
  // Set form values based on URL params
  useEffect(() => {
    if (gradeIdParam) setSelectedGrade(gradeIdParam);
    if (subjectIdParam) setSelectedSubject(subjectIdParam);
  }, [gradeIdParam, subjectIdParam]);
  
  // Set form values based on loaded weekly plan data
  useEffect(() => {
    if (weeklyPlanData) {
      setSelectedGrade(weeklyPlanData.weeklyPlan.gradeId.toString());
      setSelectedSubject(weeklyPlanData.weeklyPlan.subjectId.toString());
      setSelectedWeek(weeklyPlanData.weeklyPlan.weekId.toString());
    }
  }, [weeklyPlanData]);
  
  // Create weekly plan
  const createWeeklyPlan = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/weekly-plans", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Weekly plan created successfully",
      });
      setWeeklyPlanId(data.id);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Create or update daily plan
  const saveDailyPlan = useMutation({
    mutationFn: async ({ id, data }: { id?: number; data: any }) => {
      if (id) {
        // Update existing plan
        const res = await apiRequest("PUT", `/api/daily-plans/${id}`, data);
        return await res.json();
      } else {
        // Create new plan
        const res = await apiRequest("POST", "/api/daily-plans", data);
        return await res.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Daily plan saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-plans", weeklyPlanId, "complete"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle creating initial weekly plan
  const handleCreateWeeklyPlan = () => {
    if (!selectedGrade || !selectedSubject || !selectedWeek) {
      toast({
        title: "Error",
        description: "Please select grade, subject, and week",
        variant: "destructive",
      });
      return;
    }
    
    createWeeklyPlan.mutate({
      teacherId: user?.id,
      gradeId: parseInt(selectedGrade),
      subjectId: parseInt(selectedSubject),
      weekId: parseInt(selectedWeek)
    });
  };
  
  // Daily plan schema
  const dailyPlanSchema = z.object({
    topic: z.string().min(1, "Topic is required"),
    booksAndPages: z.string().optional(),
    homework: z.string().optional(),
    homeworkDueDate: z.string().optional(),
    assignments: z.string().optional(),
    notes: z.string().optional(),
  });
  
  // Form for daily plan
  const form = useForm<z.infer<typeof dailyPlanSchema>>({
    resolver: zodResolver(dailyPlanSchema),
    defaultValues: {
      topic: "",
      booksAndPages: "",
      homework: "",
      homeworkDueDate: "",
      assignments: "",
      notes: "",
    },
  });
  
  // Update form values when tab changes or when plan data loads
  useEffect(() => {
    if (weeklyPlanData) {
      const dayOfWeek = activeTab === "monday" ? 1 : 
                        activeTab === "tuesday" ? 2 : 
                        activeTab === "wednesday" ? 3 : 
                        activeTab === "thursday" ? 4 : 5;
      
      const dailyPlan = weeklyPlanData.dailyPlans[activeTab as keyof typeof weeklyPlanData.dailyPlans];
      
      if (dailyPlan) {
        form.reset({
          topic: dailyPlan.topic,
          booksAndPages: dailyPlan.booksAndPages || "",
          homework: dailyPlan.homework || "",
          homeworkDueDate: dailyPlan.homeworkDueDate ? new Date(dailyPlan.homeworkDueDate).toISOString().split('T')[0] : "",
          assignments: dailyPlan.assignments || "",
          notes: dailyPlan.notes || "",
        });
      } else {
        form.reset({
          topic: "",
          booksAndPages: "",
          homework: "",
          homeworkDueDate: "",
          assignments: "",
          notes: "",
        });
      }
    }
  }, [activeTab, weeklyPlanData, form]);
  
  // Handle daily plan save
  const onSubmit = (data: z.infer<typeof dailyPlanSchema>) => {
    if (!weeklyPlanId) {
      toast({
        title: "Error",
        description: "Weekly plan must be created first",
        variant: "destructive",
      });
      return;
    }
    
    const dayOfWeek = activeTab === "monday" ? 1 : 
                      activeTab === "tuesday" ? 2 : 
                      activeTab === "wednesday" ? 3 : 
                      activeTab === "thursday" ? 4 : 5;
    
    const dailyPlan = weeklyPlanData?.dailyPlans[activeTab as keyof typeof weeklyPlanData.dailyPlans];
    
    const planData = {
      weeklyPlanId,
      dayOfWeek,
      ...data,
    };
    
    saveDailyPlan.mutate({ 
      id: dailyPlan?.id, 
      data: planData 
    });
  };
  
  // Get selected week details
  const selectedWeekData = activeWeeks.find(week => week.id.toString() === selectedWeek);
  
  return (
    <PageWrapper title="Weekly Plan Editor">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">Weekly Plan Editor</h1>
          <p className="text-neutral-500 mt-1">Create or edit weekly lesson plans</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/weeklyplans">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Weekly Plans
          </Link>
        </Button>
      </div>
      
      {!weeklyPlanId ? (
        <Card>
          <CardHeader>
            <CardTitle>Create New Weekly Plan</CardTitle>
          </CardHeader>
          <CardContent>
            {(!teacherData || teacherData.grades.length === 0) ? (
              <Alert>
                <AlertTitle>No assignments found</AlertTitle>
                <AlertDescription>
                  You need to be assigned to grades and subjects before creating a weekly plan.
                </AlertDescription>
              </Alert>
            ) : activeWeeks.length === 0 ? (
              <Alert>
                <AlertTitle>No active weeks</AlertTitle>
                <AlertDescription>
                  There are no active planning weeks at the moment. Please contact an administrator.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
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
                    <Label htmlFor="subject-select">Subject</Label>
                    <Select 
                      value={selectedSubject} 
                      onValueChange={setSelectedSubject} 
                      disabled={!selectedGrade}
                    >
                      <SelectTrigger id="subject-select" className="mt-1">
                        <SelectValue placeholder={selectedGrade ? "Select Subject" : "Select Grade First"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Select Subject</SelectItem>
                        {selectedGrade && teacherData?.subjects[parseInt(selectedGrade)]?.map(subject => (
                          <SelectItem key={subject.id} value={subject.id.toString()}>{subject.name}</SelectItem>
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
                        {activeWeeks.map(week => (
                          <SelectItem key={week.id} value={week.id.toString()}>
                            Week {week.weekNumber} ({formatDate(new Date(week.startDate))} - {formatDate(new Date(week.endDate))})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  onClick={handleCreateWeeklyPlan} 
                  disabled={!selectedGrade || !selectedSubject || !selectedWeek || createWeeklyPlan.isPending}
                  className="w-full sm:w-auto"
                >
                  {createWeeklyPlan.isPending ? "Creating..." : "Create Weekly Plan"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {isLoadingWeeklyPlan ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-medium">
                        {teacherData?.grades.find(g => g.id === parseInt(selectedGrade))?.name} - {" "}
                        {teacherData?.subjects[parseInt(selectedGrade)]?.find(s => s.id === parseInt(selectedSubject))?.name}
                      </h2>
                      <p className="text-sm text-neutral-500 mt-1">
                        Created: {formatDate(new Date(weeklyPlanData?.weeklyPlan.createdAt || ""))}
                      </p>
                    </div>
                    <Badge className="bg-blue-100 text-primary flex items-center">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      Week {selectedWeekData?.weekNumber} ({formatDate(new Date(selectedWeekData?.startDate || ""))} - {formatDate(new Date(selectedWeekData?.endDate || ""))})
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="border-b">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="w-full grid grid-cols-5">
                      <TabsTrigger value="monday">Monday</TabsTrigger>
                      <TabsTrigger value="tuesday">Tuesday</TabsTrigger>
                      <TabsTrigger value="wednesday">Wednesday</TabsTrigger>
                      <TabsTrigger value="thursday">Thursday</TabsTrigger>
                      <TabsTrigger value="friday">Friday</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardHeader>
                
                <CardContent className="p-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="topic"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Topic <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Enter main topic for this day" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="booksAndPages"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Books & Pages</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Math Textbook pp. 45-48" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="homework"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Homework</FormLabel>
                              <FormControl>
                                <Input placeholder="Assigned homework" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="homeworkDueDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Homework Due Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="assignments"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Assignments</FormLabel>
                              <FormControl>
                                <Input placeholder="Additional assignments or projects" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Additional notes or instructions" 
                                className="min-h-[100px]" 
                                {...field} 
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end space-x-3">
                        <Button 
                          type="submit" 
                          disabled={saveDailyPlan.isPending}
                          className="flex items-center"
                        >
                          {saveDailyPlan.isPending ? (
                            <div className="animate-spin h-4 w-4 mr-2 border-2 border-background border-t-transparent rounded-full"></div>
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Save Daily Plan
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </PageWrapper>
  );
}
