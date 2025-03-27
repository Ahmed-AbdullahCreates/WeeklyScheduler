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
    <Card className="min-h-[600px] shadow-lg border-t-4 border-t-indigo-500">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <CardTitle className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Calendar View</CardTitle>
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
                    "border rounded-md p-2 h-full min-h-[500px] flex flex-col shadow-sm transition-all hover:shadow-md",
                    isToday ? "bg-amber-50 border-amber-300 ring-1 ring-amber-300" : "bg-white"
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
                          
                          return (
                            <Popover key={`${plan.id}-${planIndex}`}>
                              <PopoverTrigger asChild>
                                <div 
                                  className={cn(
                                    "p-3 rounded-md text-sm border shadow-sm cursor-pointer hover:shadow-md transition-all",
                                    planIndex % 4 === 0 && "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200",
                                    planIndex % 4 === 1 && "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200", 
                                    planIndex % 4 === 2 && "bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200",
                                    planIndex % 4 === 3 && "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200"
                                  )}
                                >
                                  <div className={cn(
                                    "font-bold line-clamp-1 mb-1",
                                    planIndex % 4 === 0 && "text-blue-700",
                                    planIndex % 4 === 1 && "text-green-700",
                                    planIndex % 4 === 2 && "text-purple-700",
                                    planIndex % 4 === 3 && "text-amber-700"
                                  )}>
                                    {dailyPlan.topic}
                                  </div>
                                  <div className="text-xs font-medium line-clamp-1 mt-1">
                                    {plan.subject.name} • {plan.grade.name}
                                  </div>
                                  <div className={cn(
                                    "flex items-center mt-2 text-xs px-2 py-1 rounded-full w-fit",
                                    planIndex % 4 === 0 && "bg-blue-100 text-blue-700",
                                    planIndex % 4 === 1 && "bg-green-100 text-green-700",
                                    planIndex % 4 === 2 && "bg-purple-100 text-purple-700",
                                    planIndex % 4 === 3 && "bg-amber-100 text-amber-700"
                                  )}>
                                    <Clock className="h-3 w-3 mr-1" />
                                    {dailyPlan.booksAndPages || 'No time specified'}
                                  </div>
                                </div>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 p-0 border-2 shadow-lg">
                                <div className={cn(
                                  "p-4",
                                  planIndex % 4 === 0 && "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200",
                                  planIndex % 4 === 1 && "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200", 
                                  planIndex % 4 === 2 && "bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200",
                                  planIndex % 4 === 3 && "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200"
                                )}>
                                  <div className="flex items-center justify-between mb-2">
                                    <Badge className={cn(
                                      "text-white border-0",
                                      planIndex % 4 === 0 && "bg-blue-600 hover:bg-blue-700",
                                      planIndex % 4 === 1 && "bg-green-600 hover:bg-green-700",
                                      planIndex % 4 === 2 && "bg-purple-600 hover:bg-purple-700",
                                      planIndex % 4 === 3 && "bg-amber-600 hover:bg-amber-700"
                                    )}>
                                      {plan.subject.name}
                                    </Badge>
                                    <Badge className="bg-white">{plan.grade.name}</Badge>
                                  </div>
                                  <h4 className={cn(
                                    "font-bold text-lg",
                                    planIndex % 4 === 0 && "text-blue-700",
                                    planIndex % 4 === 1 && "text-green-700",
                                    planIndex % 4 === 2 && "text-purple-700",
                                    planIndex % 4 === 3 && "text-amber-700"
                                  )}>{dailyPlan.topic}</h4>
                                  <p className="text-sm font-medium mt-1">
                                    Teacher: {plan.teacher.fullName}
                                  </p>
                                  <Separator className={cn(
                                    "my-3", 
                                    planIndex % 4 === 0 && "bg-blue-200",
                                    planIndex % 4 === 1 && "bg-green-200",
                                    planIndex % 4 === 2 && "bg-purple-200",
                                    planIndex % 4 === 3 && "bg-amber-200"
                                  )} />
                                  
                                  {dailyPlan.booksAndPages && (
                                    <div className={cn(
                                      "flex items-start gap-3 mb-3 p-3 rounded-lg",
                                      planIndex % 4 === 0 && "bg-blue-100",
                                      planIndex % 4 === 1 && "bg-green-100",
                                      planIndex % 4 === 2 && "bg-purple-100",
                                      planIndex % 4 === 3 && "bg-amber-100"
                                    )}>
                                      <BookOpen className={cn(
                                        "h-5 w-5 mt-0.5",
                                        planIndex % 4 === 0 && "text-blue-700",
                                        planIndex % 4 === 1 && "text-green-700",
                                        planIndex % 4 === 2 && "text-purple-700",
                                        planIndex % 4 === 3 && "text-amber-700"
                                      )} />
                                      <div>
                                        <p className={cn(
                                          "text-sm font-bold",
                                          planIndex % 4 === 0 && "text-blue-800",
                                          planIndex % 4 === 1 && "text-green-800",
                                          planIndex % 4 === 2 && "text-purple-800",
                                          planIndex % 4 === 3 && "text-amber-800"
                                        )}>Books & Pages</p>
                                        <p className="text-sm font-medium mt-1">{dailyPlan.booksAndPages}</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {dailyPlan.homework && (
                                    <div className={cn(
                                      "flex items-start gap-3 mb-3 p-3 rounded-lg",
                                      planIndex % 4 === 0 && "bg-blue-100",
                                      planIndex % 4 === 1 && "bg-green-100",
                                      planIndex % 4 === 2 && "bg-purple-100",
                                      planIndex % 4 === 3 && "bg-amber-100"
                                    )}>
                                      <FileText className={cn(
                                        "h-5 w-5 mt-0.5",
                                        planIndex % 4 === 0 && "text-blue-700",
                                        planIndex % 4 === 1 && "text-green-700",
                                        planIndex % 4 === 2 && "text-purple-700",
                                        planIndex % 4 === 3 && "text-amber-700"
                                      )} />
                                      <div>
                                        <p className={cn(
                                          "text-sm font-bold",
                                          planIndex % 4 === 0 && "text-blue-800",
                                          planIndex % 4 === 1 && "text-green-800",
                                          planIndex % 4 === 2 && "text-purple-800",
                                          planIndex % 4 === 3 && "text-amber-800"
                                        )}>Homework</p>
                                        <p className="text-sm font-medium mt-1">{dailyPlan.homework}</p>
                                        {dailyPlan.homeworkDueDate && (
                                          <p className={cn(
                                            "text-xs mt-1 font-bold px-2 py-1 rounded-full inline-block",
                                            planIndex % 4 === 0 && "bg-blue-200 text-blue-800",
                                            planIndex % 4 === 1 && "bg-green-200 text-green-800",
                                            planIndex % 4 === 2 && "bg-purple-200 text-purple-800",
                                            planIndex % 4 === 3 && "bg-amber-200 text-amber-800"
                                          )}>
                                            Due: {formatDate(new Date(dailyPlan.homeworkDueDate))}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="flex justify-end gap-2 mt-4">
                                    <Button 
                                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0"
                                      size="sm" 
                                      asChild
                                    >
                                      <a 
                                        href={`/api/weekly-plans/${plan.id}/export-pdf`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                      >
                                        <Download className="h-3 w-3 mr-1" /> Export PDF
                                      </a>
                                    </Button>
                                    
                                    {plan.week.isActive && (
                                      <Button 
                                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0"
                                        size="sm" 
                                        asChild
                                      >
                                        <Link to={`/plan-editor/${plan.id}`}>
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