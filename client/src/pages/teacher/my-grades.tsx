import { PageWrapper } from "@/components/layout/page-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Book, Calendar, GraduationCap, Pencil } from "lucide-react";
import { TeacherWithAssignments, PlanningWeek } from "@shared/schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";

export default function TeacherMyGrades() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const initialGradeId = urlParams.get('gradeId');
  
  const [selectedGrade, setSelectedGrade] = useState<string>(initialGradeId || "");
  
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
  
  // Update URL when selected grade changes
  useEffect(() => {
    if (selectedGrade) {
      setLocation(`/mygrades?gradeId=${selectedGrade}`, { replace: true });
    }
  }, [selectedGrade, setLocation]);
  
  // Set selected grade when teacher data loads
  useEffect(() => {
    if (!selectedGrade && teacherData?.grades.length) {
      setSelectedGrade(teacherData.grades[0].id.toString());
    }
  }, [teacherData, selectedGrade]);
  
  // Filter subjects for selected grade
  const subjectsForGrade = selectedGrade 
    ? (teacherData?.subjects[parseInt(selectedGrade)] || [])
    : [];
  
  return (
    <PageWrapper title="My Grades">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Assigned Grades</h1>
      </div>
      
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
        <>
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="grade-select">Select Grade</Label>
                  <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                    <SelectTrigger id="grade-select" className="mt-1">
                      <SelectValue placeholder="Select Grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {teacherData?.grades.map(grade => (
                        <SelectItem key={grade.id} value={grade.id.toString()}>
                          {grade.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {selectedGrade && (
            <>
              <h2 className="text-xl font-medium mb-4 flex items-center">
                <GraduationCap className="mr-2 h-5 w-5 text-primary" />
                {teacherData?.grades.find(g => g.id.toString() === selectedGrade)?.name} - Assigned Subjects
              </h2>
              
              {subjectsForGrade.length === 0 ? (
                <Alert>
                  <AlertTitle>No subjects assigned</AlertTitle>
                  <AlertDescription>
                    You don't have any subjects assigned for this grade. Please contact an administrator.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {subjectsForGrade.map(subject => (
                    <Card key={subject.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Book className="mr-2 h-5 w-5 text-primary" />
                          {subject.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-neutral-500 mb-4">Create and manage weekly plans for this subject.</p>
                        
                        {activeWeeks.length > 0 ? (
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium mb-2">Active Planning Weeks:</h4>
                              <div className="flex flex-wrap gap-2">
                                {activeWeeks.slice(0, 2).map(week => (
                                  <Badge key={week.id} variant="outline" className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Week {week.weekNumber} ({formatDate(new Date(week.startDate))})
                                  </Badge>
                                ))}
                                {activeWeeks.length > 2 && <Badge variant="outline">+{activeWeeks.length - 2} more</Badge>}
                              </div>
                            </div>
                            
                            <Button asChild className="w-full">
                              <Link href={`/plan-editor?gradeId=${selectedGrade}&subjectId=${subject.id}`}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Create Weekly Plan
                              </Link>
                            </Button>
                          </div>
                        ) : (
                          <Alert>
                            <AlertDescription>No active planning weeks available.</AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </PageWrapper>
  );
}
