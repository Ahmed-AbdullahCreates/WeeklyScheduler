import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatDate, getDateForWeekDay, mapDayNumberToName } from "@/lib/utils";
import { 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Calendar as CalendarIcon,
  Clock,
  BookOpen,
  Pencil,
  Download
} from "lucide-react";
import { Link } from "wouter";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CalendarViewProps {
  isAdmin?: boolean;
}

export default function CalendarView({ isAdmin = false }: CalendarViewProps) {
  const [selectedGrade, setSelectedGrade] = useState<string>('placeholder');
  const [selectedWeek, setSelectedWeek] = useState<string>('placeholder');
  const [currentViewDate, setCurrentViewDate] = useState<Date>(new Date());

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
    queryKey: ['/api/weekly-plans/grade', 
      selectedGrade !== 'placeholder' ? parseInt(selectedGrade) : null, 
      'week', 
      selectedWeek !== 'placeholder' ? parseInt(selectedWeek) : null
    ],
    enabled: selectedGrade !== 'placeholder' && selectedWeek !== 'placeholder',
  });

  // Set current planning week when data loads
  useEffect(() => {
    if (planningWeeks.length > 0 && selectedWeek === 'placeholder') {
      // Find active planning week
      const activeWeek = planningWeeks.find(week => week.isActive);
      if (activeWeek) {
        setSelectedWeek(activeWeek.id.toString());
        setCurrentViewDate(new Date(activeWeek.startDate));
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
      setCurrentViewDate(new Date(newWeek.startDate));
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

  return (
    <Card className="min-h-[600px]">
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
                    isToday && "bg-background ring-1 ring-primary"
                  )}
                >
                  <div className="sticky top-0 bg-background p-2 flex flex-col items-center border-b mb-2">
                    <h3 className="font-medium text-center">{day}</h3>
                    <div className={cn(
                      "text-sm text-center",
                      isToday && "text-primary font-medium"
                    )}>
                      {formatDate(date)}
                      {isToday && <Badge variant="outline" className="ml-2">Today</Badge>}
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
                          
                          return (
                            <Popover key={`${plan.id}-${planIndex}`}>
                              <PopoverTrigger asChild>
                                <div 
                                  className={cn(
                                    "p-2 rounded-md text-sm border cursor-pointer hover:bg-accent/50 transition-colors",
                                    planIndex % 3 === 0 && "bg-primary/10 border-primary/20",
                                    planIndex % 3 === 1 && "bg-secondary/10 border-secondary/20",
                                    planIndex % 3 === 2 && "bg-destructive/10 border-destructive/20"
                                  )}
                                >
                                  <div className="font-medium line-clamp-1">{dailyPlan.topic}</div>
                                  <div className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                    {plan.subject.name} • {plan.grade.name}
                                  </div>
                                  <div className="flex items-center mt-1 text-xs">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {dailyPlan.booksAndPages || 'No time specified'}
                                  </div>
                                </div>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 p-0">
                                <div className="p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <Badge variant={planIndex % 3 === 0 ? "default" : planIndex % 3 === 1 ? "secondary" : "destructive"}>
                                      {plan.subject.name}
                                    </Badge>
                                    <Badge variant="outline">{plan.grade.name}</Badge>
                                  </div>
                                  <h4 className="font-bold text-lg">{dailyPlan.topic}</h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Teacher: {plan.teacher.fullName}
                                  </p>
                                  <Separator className="my-3" />
                                  
                                  {dailyPlan.booksAndPages && (
                                    <div className="flex items-start gap-2 mb-2">
                                      <BookOpen className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                      <div>
                                        <p className="text-sm font-medium">Books & Pages</p>
                                        <p className="text-sm text-muted-foreground">{dailyPlan.booksAndPages}</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {dailyPlan.homework && (
                                    <div className="flex items-start gap-2 mb-2">
                                      <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                      <div>
                                        <p className="text-sm font-medium">Homework</p>
                                        <p className="text-sm text-muted-foreground">{dailyPlan.homework}</p>
                                        {dailyPlan.homeworkDueDate && (
                                          <p className="text-xs mt-1">Due: {formatDate(new Date(dailyPlan.homeworkDueDate))}</p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="flex justify-end gap-2 mt-4">
                                    <Button variant="outline" size="sm" asChild>
                                      <a 
                                        href={`/api/weekly-plans/${plan.id}/export-pdf`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                      >
                                        <Download className="h-3 w-3 mr-1" /> PDF
                                      </a>
                                    </Button>
                                    
                                    {plan.week.isActive && (
                                      <Button variant="default" size="sm" asChild>
                                        <Link href={`/plan-editor/${plan.id}`}>
                                          <Pencil className="h-3 w-3 mr-1" /> Edit
                                        </Link>
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}