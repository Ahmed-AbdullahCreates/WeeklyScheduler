import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WeeklyPlanWithDetails, PlanningWeek } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatDate, getDateForWeekDay } from "@/lib/utils";
import { 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Calendar as CalendarIcon,
  Download
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CalendarViewProps {
  isAdmin?: boolean;
}

export default function CalendarView({ isAdmin = false }: CalendarViewProps) {
  const [selectedGrade, setSelectedGrade] = useState<string>('placeholder');
  const [selectedWeek, setSelectedWeek] = useState<string>('placeholder');
  const [isExportDialogOpen, setIsExportDialogOpen] = useState<boolean>(false);

  // Fetch planning weeks
  const { data: planningWeeks = [] } = useQuery<PlanningWeek[]>({
    queryKey: ['/api/planning-weeks'],
  });

  // Fetch grades
  const { data: grades = [] } = useQuery<any[]>({
    queryKey: ['/api/grades'],
  });

  // Fetch weekly plans based on selected grade and week
  const { data: weeklyPlans = [], isLoading: isLoadingPlans } = useQuery<WeeklyPlanWithDetails[]>({
    queryKey: [
      '/api/weekly-plans/grade', 
      selectedGrade !== 'placeholder' ? parseInt(selectedGrade) : null, 
      'week', 
      selectedWeek !== 'placeholder' ? parseInt(selectedWeek) : null
    ],
    queryFn: async () => {
      if (selectedGrade === 'placeholder' || selectedWeek === 'placeholder') {
        return [];
      }
      const gradeId = parseInt(selectedGrade);
      const weekId = parseInt(selectedWeek);
      const response = await fetch(`/api/weekly-plans/grade/${gradeId}/week/${weekId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch weekly plans');
      }
      return response.json();
    },
    enabled: selectedGrade !== 'placeholder' && selectedWeek !== 'placeholder',
  });

  // Set current planning week when data loads
  useEffect(() => {
    if (planningWeeks.length > 0 && selectedWeek === 'placeholder') {
      // Find active planning week
      const activeWeek = planningWeeks.find(week => week.isActive);
      if (activeWeek) {
        setSelectedWeek(activeWeek.id.toString());
      }
    }
  }, [planningWeeks, selectedWeek]);

  // Calculate days of the week
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  // Get the selected week data
  const selectedWeekData = planningWeeks.find(week => week.id.toString() === selectedWeek);
  
  // Generate dates for the week
  const weekDates = selectedWeekData 
    ? weekDays.map((_, index) => getDateForWeekDay(selectedWeekData.startDate, index))
    : weekDays.map(() => new Date());

  // Handle navigation between weeks
  const navigateWeek = (direction: 'prev' | 'next') => {
    const currentIndex = planningWeeks.findIndex(week => week.id.toString() === selectedWeek);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < planningWeeks.length) {
      const newWeek = planningWeeks[newIndex];
      setSelectedWeek(newWeek.id.toString());
    }
  };

  // Group plans by day of week
  const plansByDay: Record<number, WeeklyPlanWithDetails[]> = {};
  
  weeklyPlans.forEach(plan => {
    plan.dailyPlans.forEach(dailyPlan => {
      if (!plansByDay[dailyPlan.dayOfWeek]) {
        plansByDay[dailyPlan.dayOfWeek] = [];
      }
      plansByDay[dailyPlan.dayOfWeek].push(plan);
    });
  });
  
  // Helper function to get a plan's color based on subject
  const getPlanColor = (plan: WeeklyPlanWithDetails, index: number) => {
    return index % 4;
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <CardTitle>Calendar View</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4 sm:mt-0">
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="placeholder">Select Grade</SelectItem>
                {grades.map((grade: any) => (
                  <SelectItem key={grade.id} value={grade.id.toString()}>{grade.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => navigateWeek('prev')}
                disabled={!selectedWeekData || planningWeeks.findIndex(week => week.id.toString() === selectedWeek) === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                <SelectTrigger className="w-full sm:w-[250px]">
                  <SelectValue placeholder="Select Week" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder">Select Week</SelectItem>
                  {planningWeeks.map(week => (
                    <SelectItem key={week.id} value={week.id.toString()}>
                      Week {week.weekNumber} ({formatDate(new Date(week.startDate))} - {formatDate(new Date(week.endDate))})
                      {week.isActive && <span className="ml-2">•</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => navigateWeek('next')}
                disabled={!selectedWeekData || planningWeeks.findIndex(week => week.id.toString() === selectedWeek) === planningWeeks.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {selectedGrade === 'placeholder' || selectedWeek === 'placeholder' ? (
          <div className="flex items-center justify-center h-[400px] text-center">
            <div>
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium">Select a grade and week to view the calendar</h3>
              <p className="text-sm text-muted-foreground mt-2">
                The calendar view displays all weekly plans for the selected grade and week
              </p>
            </div>
          </div>
        ) : isLoadingPlans ? (
          <div className="flex justify-center items-center h-[400px]">
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            <div className="mb-6 flex justify-end">
              <Button 
                variant="outline"
                onClick={() => setIsExportDialogOpen(true)}
              >
                <Download className="h-4 w-4 mr-2" />
                <span>Export</span>
              </Button>
            </div>
          
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Export Calendar Data</DialogTitle>
                  <DialogDescription>
                    Choose a format to export your weekly plans
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <Button
                    onClick={() => {
                      window.open(`/api/weekly-plans/${selectedGrade}/${selectedWeek}/export-all-pdf`, '_blank');
                      setIsExportDialogOpen(false);
                    }}
                  >
                    PDF Format
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.open(`/api/weekly-plans/${selectedGrade}/${selectedWeek}/export-all-excel`, '_blank');
                      setIsExportDialogOpen(false);
                    }}
                  >
                    Excel Format
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <div className="grid grid-cols-5 gap-3 overflow-x-auto min-h-[500px]">
              {weekDays.map((day, index) => {
                const date = weekDates[index];
                const dayOfWeek = index + 1; // 1-indexed for Monday-Friday
                const dayPlans = plansByDay[dayOfWeek] || [];
                const isToday = new Date().toDateString() === date.toDateString();
                
                return (
                  <div 
                    key={day}
                    className={cn(
                      "border rounded-md p-2 h-full min-h-[500px] flex flex-col",
                      isToday ? "bg-amber-50 border-amber-300" : "bg-white"
                    )}
                  >
                    <div className={cn(
                      "sticky top-0 p-3 flex flex-col items-center border-b mb-3", 
                      isToday ? "bg-amber-50 border-amber-300" : "bg-gray-50"
                    )}>
                      <h3 className={cn(
                        "font-bold text-center text-lg",
                        isToday ? "text-amber-700" : "text-gray-700"
                      )}>{day}</h3>
                      <div className={cn(
                        "text-sm text-center font-medium",
                        isToday ? "text-amber-600" : "text-gray-500"
                      )}>
                        {formatDate(date)}
                        {isToday && <Badge className="ml-2 bg-amber-500 text-white hover:bg-amber-600 border-0">Today</Badge>}
                      </div>
                    </div>
                    
                    <ScrollArea className="flex-1">
                      {dayPlans.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
                          <FileText className="h-8 w-8 mb-2 opacity-40" />
                          <p className="text-sm">No plans for this day</p>
                        </div>
                      ) : (
                        <div className="space-y-3 p-1">
                          {dayPlans.map((plan, planIndex) => {
                            const dailyPlan = plan.dailyPlans.find(dp => dp.dayOfWeek === dayOfWeek);
                            if (!dailyPlan) return null;
                            
                            const colorIndex = getPlanColor(plan, planIndex);
                            
                            return (
                              <div 
                                key={`${plan.id}-${planIndex}`}
                                className={cn(
                                  "p-3 rounded-md text-sm border shadow-sm cursor-pointer hover:shadow-md transition-all",
                                  colorIndex === 0 && "bg-blue-50 border-blue-200",
                                  colorIndex === 1 && "bg-green-50 border-green-200", 
                                  colorIndex === 2 && "bg-purple-50 border-purple-200",
                                  colorIndex === 3 && "bg-amber-50 border-amber-200"
                                )}
                              >
                                <div className={cn(
                                  "font-bold line-clamp-1 mb-1",
                                  colorIndex === 0 && "text-blue-700",
                                  colorIndex === 1 && "text-green-700",
                                  colorIndex === 2 && "text-purple-700",
                                  colorIndex === 3 && "text-amber-700"
                                )}>
                                  {dailyPlan.topic}
                                </div>
                                <div className="text-xs font-medium line-clamp-1 mt-1">
                                  {plan.subject.name} • {plan.grade.name}
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                  <span className="text-xs text-gray-500">{plan.teacher.fullName}</span>
                                  <div className="flex gap-1">
                                    <a 
                                      href={`/api/weekly-plans/${plan.id}/export-pdf`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:underline"
                                    >
                                      PDF
                                    </a>
                                    <span className="text-xs text-gray-400">|</span>
                                    <a 
                                      href={`/api/weekly-plans/${plan.id}/export-excel`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-xs text-green-600 hover:underline"
                                    >
                                      Excel
                                    </a>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="border-t px-6 py-3">
        <div className="flex flex-wrap items-center justify-between w-full gap-2">
          <p className="text-sm text-gray-500">
            {selectedWeekData && (
              <>Week {selectedWeekData.weekNumber} • {formatDate(new Date(selectedWeekData.startDate))} - {formatDate(new Date(selectedWeekData.endDate))}</>
            )}
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}