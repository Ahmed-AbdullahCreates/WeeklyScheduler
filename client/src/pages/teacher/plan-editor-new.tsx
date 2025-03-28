import { PageWrapper } from "@/components/layout/page-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation, useRoute } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Grade, 
  PlanningWeek, 
  Subject, 
  TeacherWithAssignments, 
  WeeklyPlanComplete
} from "@shared/schema";
import { ArrowLeft, CalendarIcon, Download, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import WeeklyPlanTable from "@/components/teacher/weekly-plan-table";
import { Textarea } from "@/components/ui/textarea";

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
  const [weeklyPlanId, setWeeklyPlanId] = useState<number | null>(match ? parseInt(params.planId) : null);
  const [weeklyNotes, setWeeklyNotes] = useState<string>("");
  const [isEditingNotes, setIsEditingNotes] = useState<boolean>(false);
  
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
  const { data: weeklyPlanData, isLoading: isLoadingWeeklyPlan, refetch } = useQuery<WeeklyPlanComplete>({
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
      setWeeklyNotes(weeklyPlanData.weeklyPlan.notes || "");
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
  
  // Update weekly plan notes
  const updateWeeklyPlanNotes = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      const res = await apiRequest("PUT", `/api/weekly-plans/${id}/notes`, { notes });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Weekly notes updated successfully",
      });
      setIsEditingNotes(false);
      refetch();
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
  
  const handleSaveNotes = () => {
    if (!weeklyPlanId) return;
    
    updateWeeklyPlanNotes.mutate({
      id: weeklyPlanId,
      notes: weeklyNotes
    });
  };
  
  // Get selected grade, subject, and week details
  const selectedGradeData = teacherData?.grades.find(g => g.id.toString() === selectedGrade);
  const selectedSubjectData = teacherData?.subjects[parseInt(selectedGrade)]?.find(s => s.id.toString() === selectedSubject);
  const selectedWeekData = activeWeeks.find(week => week.id.toString() === selectedWeek);
  
  return (
    <PageWrapper title="Weekly Plan Editor">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">Weekly Plan Editor</h1>
          <p className="text-neutral-500 mt-1">Create or edit weekly lesson plans</p>
        </div>
        <div className="flex gap-2">
          {weeklyPlanId && (
            <>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => window.open(`/api/weekly-plans/${weeklyPlanId}/export-pdf`, '_blank')}
                className="bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90 text-white"
              >
                <Download className="h-4 w-4 mr-1" /> PDF
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => window.open(`/api/weekly-plans/${weeklyPlanId}/export-excel`, '_blank')}
                className="bg-gradient-to-r from-blue-500/90 to-blue-600 hover:from-blue-600 hover:to-blue-500/90 text-white"
              >
                <Download className="h-4 w-4 mr-1" /> Excel
              </Button>
            </>
          )}
          <Button variant="outline" asChild>
            <Link href="/weeklyplans">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Plans
            </Link>
          </Button>
        </div>
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
              {/* Table-based Weekly Plan */}
              {weeklyPlanData && selectedGradeData && selectedSubjectData && selectedWeekData && (
                <div className="space-y-6">
                  <WeeklyPlanTable 
                    weeklyPlanData={weeklyPlanData}
                    grade={selectedGradeData}
                    subject={selectedSubjectData}
                    week={selectedWeekData}
                    isEditable={true}
                    onSaved={refetch}
                  />
                  
                  {/* Weekly Notes Section */}
                  <Card className="shadow-md">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">Weekly Notes</CardTitle>
                        {!isEditingNotes ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setIsEditingNotes(true)}
                            className="border-primary text-primary hover:bg-primary/10"
                          >
                            Edit Notes
                          </Button>
                        ) : (
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              onClick={handleSaveNotes}
                              disabled={updateWeeklyPlanNotes.isPending}
                              className="bg-primary text-white hover:bg-primary/90"
                            >
                              <Save className="h-4 w-4 mr-1" />
                              {updateWeeklyPlanNotes.isPending ? 'Saving...' : 'Save'}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                setIsEditingNotes(false);
                                setWeeklyNotes(weeklyPlanData.weeklyPlan.notes || "");
                              }}
                              disabled={updateWeeklyPlanNotes.isPending}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {isEditingNotes ? (
                        <Textarea 
                          value={weeklyNotes} 
                          onChange={(e) => setWeeklyNotes(e.target.value)}
                          placeholder="Add general notes for the entire week..."
                          className="min-h-[150px]"
                        />
                      ) : (
                        <div className="min-h-[80px] p-3 bg-muted/10 rounded-md whitespace-pre-wrap">
                          {weeklyPlanData.weeklyPlan.notes || (
                            <span className="text-muted-foreground italic">No weekly notes added yet. Click 'Edit Notes' to add some.</span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </>
      )}
    </PageWrapper>
  );
}