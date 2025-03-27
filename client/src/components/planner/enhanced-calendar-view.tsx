import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
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
import { formatDate, getDateForWeekDay, mapDayNumberToName, getCurrentWeekNumber, getWeekDates } from "@/lib/utils";
import { 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Calendar as CalendarIcon,
  Clock,
  BookOpen,
  Pencil,
  Download,
  Search,
  Layers,
  Filter,
  Users,
  FileDown,
  Sheet,
  ArrowUpDown,
  School,
  BookText,
  AlertTriangle,
  ArrowRight,
  X,
  CheckCircle2,
  Plus
} from "lucide-react";
import { Link } from "wouter";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

interface EnhancedCalendarViewProps {
  isAdmin?: boolean;
}

export default function EnhancedCalendarView({ isAdmin = false }: EnhancedCalendarViewProps) {
  const [selectedGrade, setSelectedGrade] = useState<string>('placeholder');
  const [selectedWeek, setSelectedWeek] = useState<string>('placeholder');
  const [currentViewDate, setCurrentViewDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showCalendarPicker, setShowCalendarPicker] = useState<boolean>(false);
  const [timelineView, setTimelineView] = useState<boolean>(false);
  const [viewType, setViewType] = useState<'calendar' | 'list'>('calendar');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [isExportDialogOpen, setIsExportDialogOpen] = useState<boolean>(false);
  const [viewScale, setViewScale] = useState<'day' | 'week'>('week');

  // Fetch planning weeks
  const { data: planningWeeks = [] } = useQuery<PlanningWeek[]>({
    queryKey: ['/api/planning-weeks'],
  });

  // Fetch grades
  const { data: grades = [] } = useQuery<any[]>({
    queryKey: ['/api/grades'],
  });

  // Fetch subjects for filtering
  const { data: subjects = [] } = useQuery<any[]>({
    queryKey: ['/api/subjects'],
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

  // Filter by search term and subject
  const filteredPlans = weeklyPlans.filter(plan => {
    // Subject filter
    if (selectedSubject !== 'all' && plan.subjectId.toString() !== selectedSubject) {
      return false;
    }
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const hasTopic = plan.dailyPlans.some(dp => 
        dp.topic?.toLowerCase().includes(searchLower) || 
        dp.booksAndPages?.toLowerCase().includes(searchLower) ||
        dp.homework?.toLowerCase().includes(searchLower) || 
        dp.notes?.toLowerCase().includes(searchLower)
      );
      const hasTeacherName = plan.teacher.fullName.toLowerCase().includes(searchLower);
      const hasSubjectName = plan.subject.name.toLowerCase().includes(searchLower);
      
      return hasTopic || hasTeacherName || hasSubjectName;
    }
    
    return true;
  });

  // Group plans by day of week
  const plansByDay: Record<number, WeeklyPlanWithDetails[]> = {};
  
  filteredPlans.forEach(plan => {
    plan.dailyPlans.forEach(dailyPlan => {
      if (!plansByDay[dailyPlan.dayOfWeek]) {
        plansByDay[dailyPlan.dayOfWeek] = [];
      }
      plansByDay[dailyPlan.dayOfWeek].push(plan);
    });
  });
  
  // Helper function to get a plan's color based on subject
  const getPlanColor = (plan: WeeklyPlanWithDetails, index: number) => {
    // Map subject IDs to color indexes to maintain consistency
    const subjectColorMap: Record<number, number> = {};
    subjects.forEach((subject, idx) => {
      subjectColorMap[subject.id] = idx % 4;
    });
    
    // Use mapped color if available, otherwise fallback to index
    const colorIndex = subjectColorMap[plan.subjectId] !== undefined ? 
      subjectColorMap[plan.subjectId] : index % 4;
      
    return colorIndex;
  };
  
  // Timeline markers for a day
  const timeMarkers = [
    "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"
  ];

  return (
    <Card className="min-h-[600px] shadow-md">
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
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <div className="relative flex-grow max-w-md">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search plans..."
                    className="pl-8 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map((subject: any) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setTimelineView(!timelineView)}
                >
                  <Layers className="h-4 w-4" />
                  <span className="hidden sm:inline">{timelineView ? "Standard View" : "Timeline View"}</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setIsExportDialogOpen(true)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </div>
            </div>
            
            {(searchTerm || selectedSubject !== 'all') && (
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Filtered by:</span>
                  {searchTerm && (
                    <Badge variant="outline">
                      Search: "{searchTerm}"
                    </Badge>
                  )}
                  
                  {selectedSubject !== 'all' && (
                    <Badge variant="outline">
                      Subject: {subjects.find((s: any) => s.id.toString() === selectedSubject)?.name || 'Subject'}
                    </Badge>
                  )}
                </div>
                
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedSubject('all');
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
            
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
                    <FileDown className="h-4 w-4 mr-2" />
                    PDF Format
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.open(`/api/weekly-plans/${selectedGrade}/${selectedWeek}/export-all-excel`, '_blank');
                      setIsExportDialogOpen(false);
                    }}
                  >
                    <Sheet className="h-4 w-4 mr-2" />
                    Excel Format
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            {timelineView ? (
              // Timeline view with hour markers
              <div className="grid grid-cols-5 gap-3 overflow-x-auto min-h-[600px] border rounded-lg">
                {weekDays.map((day, index) => {
                  const date = weekDates[index];
                  const dayOfWeek = index + 1;
                  const dayPlans = plansByDay[dayOfWeek] || [];
                  const isToday = new Date().toDateString() === date.toDateString();
                  
                  return (
                    <div 
                      key={day} 
                      className={cn(
                        "relative border-r last:border-r-0 h-full min-h-[600px]",
                        isToday ? "bg-amber-50" : ""
                      )}
                    >
                      <div className="sticky top-0 p-3 flex flex-col items-center border-b bg-gray-50 z-10">
                        <h3 className="font-bold text-center text-lg">{day}</h3>
                        <div className="text-sm text-center font-medium text-gray-500">
                          {formatDate(date)}
                          {isToday && <Badge className="ml-2 bg-amber-500 text-white hover:bg-amber-600 border-0">Today</Badge>}
                        </div>
                      </div>
                      
                      <div className="relative">
                        {/* Time markers */}
                        {timeMarkers.map((time, idx) => (
                          <div 
                            key={time} 
                            className="absolute w-full border-t border-gray-200 text-xs text-gray-500"
                            style={{ top: `${(idx * 70) + 10}px` }}
                          >
                            <span className="bg-gray-50 px-1 rounded absolute -top-2 -left-1">{time}</span>
                          </div>
                        ))}
                        
                        {/* Plans positioned by time */}
                        <div className="relative pt-2 px-2">
                          {dayPlans.map((plan, planIndex) => {
                            const dailyPlan = plan.dailyPlans.find(dp => dp.dayOfWeek === dayOfWeek);
                            if (!dailyPlan) return null;
                            
                            // Position based on pseudo-random height for demo
                            // In real app, would parse time from booksAndPages or other field
                            const colorIndex = getPlanColor(plan, planIndex);
                            const topPosition = ((planIndex % 9) * 70) + 15;
                            
                            return (
                              <Popover key={`${plan.id}-${planIndex}`}>
                                <PopoverTrigger asChild>
                                  <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 * planIndex }}
                                    className={cn(
                                      "absolute left-2 right-2 p-2 rounded-md text-sm border shadow-sm cursor-pointer hover:shadow-md transition-all",
                                      colorIndex === 0 && "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200",
                                      colorIndex === 1 && "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200", 
                                      colorIndex === 2 && "bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200",
                                      colorIndex === 3 && "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200"
                                    )}
                                    style={{ top: `${topPosition}px` }}
                                  >
                                    <div className={cn(
                                      "font-bold line-clamp-1",
                                      colorIndex === 0 && "text-blue-700",
                                      colorIndex === 1 && "text-green-700",
                                      colorIndex === 2 && "text-purple-700",
                                      colorIndex === 3 && "text-amber-700"
                                    )}>
                                      {dailyPlan.topic}
                                    </div>
                                    <div className="text-xs font-medium mt-1">
                                      {plan.subject.name}
                                    </div>
                                  </motion.div>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-0 border-2 shadow-lg">
                                  <div className={cn(
                                    "p-4",
                                    colorIndex === 0 && "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200",
                                    colorIndex === 1 && "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200", 
                                    colorIndex === 2 && "bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200",
                                    colorIndex === 3 && "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200"
                                  )}>
                                    <div className="flex items-center justify-between mb-2">
                                      <Badge className={cn(
                                        "text-white border-0",
                                        colorIndex === 0 && "bg-blue-600 hover:bg-blue-700",
                                        colorIndex === 1 && "bg-green-600 hover:bg-green-700",
                                        colorIndex === 2 && "bg-purple-600 hover:bg-purple-700",
                                        colorIndex === 3 && "bg-amber-600 hover:bg-amber-700"
                                      )}>
                                        {plan.subject.name}
                                      </Badge>
                                      <Badge className="bg-white">{plan.grade.name}</Badge>
                                    </div>
                                    <h4 className={cn(
                                      "font-bold text-lg",
                                      colorIndex === 0 && "text-blue-700",
                                      colorIndex === 1 && "text-green-700",
                                      colorIndex === 2 && "text-purple-700",
                                      colorIndex === 3 && "text-amber-700"
                                    )}>{dailyPlan.topic}</h4>
                                    <p className="text-sm font-medium mt-1">
                                      Teacher: {plan.teacher.fullName}
                                    </p>
                                    <Separator className={cn(
                                      "my-3", 
                                      colorIndex === 0 && "bg-blue-200",
                                      colorIndex === 1 && "bg-green-200",
                                      colorIndex === 2 && "bg-purple-200",
                                      colorIndex === 3 && "bg-amber-200"
                                    )} />
                                    
                                    {dailyPlan.booksAndPages && (
                                      <div className={cn(
                                        "flex items-start gap-3 mb-3 p-3 rounded-lg",
                                        colorIndex === 0 && "bg-blue-100",
                                        colorIndex === 1 && "bg-green-100",
                                        colorIndex === 2 && "bg-purple-100",
                                        colorIndex === 3 && "bg-amber-100"
                                      )}>
                                        <BookOpen className={cn(
                                          "h-5 w-5 mt-0.5",
                                          colorIndex === 0 && "text-blue-700",
                                          colorIndex === 1 && "text-green-700",
                                          colorIndex === 2 && "text-purple-700",
                                          colorIndex === 3 && "text-amber-700"
                                        )} />
                                        <div>
                                          <p className={cn(
                                            "text-sm font-bold",
                                            colorIndex === 0 && "text-blue-800",
                                            colorIndex === 1 && "text-green-800",
                                            colorIndex === 2 && "text-purple-800",
                                            colorIndex === 3 && "text-amber-800"
                                          )}>Books & Pages</p>
                                          <p className="text-sm font-medium mt-1">{dailyPlan.booksAndPages}</p>
                                        </div>
                                      </div>
                                    )}
                                    
                                    <div className="flex justify-end gap-2 mt-4">
                                      <Button 
                                        size="sm" 
                                        asChild
                                      >
                                        <a 
                                          href={`/api/weekly-plans/${plan.id}/export-pdf`} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                        >
                                          <Download className="h-3 w-3 mr-1" /> PDF
                                        </a>
                                      </Button>
                                      
                                      <Button 
                                        variant="outline"
                                        size="sm" 
                                        asChild
                                      >
                                        <a 
                                          href={`/api/weekly-plans/${plan.id}/export-excel`} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                        >
                                          <Download className="h-3 w-3 mr-1" /> Excel
                                        </a>
                                      </Button>
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Standard calendar view (cards per day)
              <div className="grid grid-cols-5 gap-3 overflow-x-auto min-h-[500px]">
                {weekDays.map((day, index) => {
                  const date = weekDates[index];
                  const dayOfWeek = index + 1; // 1-indexed for Monday-Friday
                  const dayPlans = plansByDay[dayOfWeek] || [];
                  const isToday = new Date().toDateString() === date.toDateString();
                  
                  return (
                    <motion.div 
                      key={day}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * index }}
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
                            {isAdmin && (
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="mt-2"
                                asChild
                              >
                                <Link to={`/create-plan?day=${dayOfWeek}&week=${selectedWeek}&grade=${selectedGrade}`}>
                                  <Plus className="h-3 w-3 mr-1" /> Add Plan
                                </Link>
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3 p-1">
                            <AnimatePresence>
                              {dayPlans.map((plan, planIndex) => {
                                const dailyPlan = plan.dailyPlans.find(dp => dp.dayOfWeek === dayOfWeek);
                                if (!dailyPlan) return null;
                                
                                const colorIndex = getPlanColor(plan, planIndex);
                                
                                return (
                                  <motion.div 
                                    key={`${plan.id}-${planIndex}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: 0.02 * planIndex }}
                                  >
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <div 
                                          className={cn(
                                            "p-3 rounded-md text-sm border shadow-sm cursor-pointer hover:shadow-md transition-all",
                                            colorIndex === 0 && "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200",
                                            colorIndex === 1 && "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200", 
                                            colorIndex === 2 && "bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200",
                                            colorIndex === 3 && "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200"
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
                                          <div className={cn(
                                            "flex items-center mt-2 text-xs px-2 py-1 rounded-full w-fit",
                                            colorIndex === 0 && "bg-blue-100 text-blue-700",
                                            colorIndex === 1 && "bg-green-100 text-green-700",
                                            colorIndex === 2 && "bg-purple-100 text-purple-700",
                                            colorIndex === 3 && "bg-amber-100 text-amber-700"
                                          )}>
                                            <Clock className="h-3 w-3 mr-1" />
                                            {dailyPlan.booksAndPages || 'No time specified'}
                                          </div>
                                        </div>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-80 p-0 border-2 shadow-lg">
                                        <div className={cn(
                                          "p-4",
                                          colorIndex === 0 && "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200",
                                          colorIndex === 1 && "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200", 
                                          colorIndex === 2 && "bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200",
                                          colorIndex === 3 && "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200"
                                        )}>
                                          <div className="flex items-center justify-between mb-2">
                                            <Badge className={cn(
                                              "text-white border-0",
                                              colorIndex === 0 && "bg-blue-600 hover:bg-blue-700",
                                              colorIndex === 1 && "bg-green-600 hover:bg-green-700",
                                              colorIndex === 2 && "bg-purple-600 hover:bg-purple-700",
                                              colorIndex === 3 && "bg-amber-600 hover:bg-amber-700"
                                            )}>
                                              {plan.subject.name}
                                            </Badge>
                                            <Badge className="bg-white">{plan.grade.name}</Badge>
                                          </div>
                                          <h4 className={cn(
                                            "font-bold text-lg",
                                            colorIndex === 0 && "text-blue-700",
                                            colorIndex === 1 && "text-green-700",
                                            colorIndex === 2 && "text-purple-700",
                                            colorIndex === 3 && "text-amber-700"
                                          )}>{dailyPlan.topic}</h4>
                                          <p className="text-sm font-medium mt-1">
                                            Teacher: {plan.teacher.fullName}
                                          </p>
                                          <Separator className={cn(
                                            "my-3", 
                                            colorIndex === 0 && "bg-blue-200",
                                            colorIndex === 1 && "bg-green-200",
                                            colorIndex === 2 && "bg-purple-200",
                                            colorIndex === 3 && "bg-amber-200"
                                          )} />
                                          
                                          {dailyPlan.booksAndPages && (
                                            <div className={cn(
                                              "flex items-start gap-3 mb-3 p-3 rounded-lg",
                                              colorIndex === 0 && "bg-blue-100",
                                              colorIndex === 1 && "bg-green-100",
                                              colorIndex === 2 && "bg-purple-100",
                                              colorIndex === 3 && "bg-amber-100"
                                            )}>
                                              <BookOpen className={cn(
                                                "h-5 w-5 mt-0.5",
                                                colorIndex === 0 && "text-blue-700",
                                                colorIndex === 1 && "text-green-700",
                                                colorIndex === 2 && "text-purple-700",
                                                colorIndex === 3 && "text-amber-700"
                                              )} />
                                              <div>
                                                <p className={cn(
                                                  "text-sm font-bold",
                                                  colorIndex === 0 && "text-blue-800",
                                                  colorIndex === 1 && "text-green-800",
                                                  colorIndex === 2 && "text-purple-800",
                                                  colorIndex === 3 && "text-amber-800"
                                                )}>Books & Pages</p>
                                                <p className="text-sm font-medium mt-1">{dailyPlan.booksAndPages}</p>
                                              </div>
                                            </div>
                                          )}
                                          
                                          {dailyPlan.homework && (
                                            <div className={cn(
                                              "flex items-start gap-3 mb-3 p-3 rounded-lg",
                                              colorIndex === 0 && "bg-blue-100",
                                              colorIndex === 1 && "bg-green-100",
                                              colorIndex === 2 && "bg-purple-100",
                                              colorIndex === 3 && "bg-amber-100"
                                            )}>
                                              <FileText className={cn(
                                                "h-5 w-5 mt-0.5",
                                                colorIndex === 0 && "text-blue-700",
                                                colorIndex === 1 && "text-green-700",
                                                colorIndex === 2 && "text-purple-700",
                                                colorIndex === 3 && "text-amber-700"
                                              )} />
                                              <div>
                                                <p className={cn(
                                                  "text-sm font-bold",
                                                  colorIndex === 0 && "text-blue-800",
                                                  colorIndex === 1 && "text-green-800",
                                                  colorIndex === 2 && "text-purple-800",
                                                  colorIndex === 3 && "text-amber-800"
                                                )}>Homework</p>
                                                <p className="text-sm font-medium mt-1">{dailyPlan.homework}</p>
                                                {dailyPlan.homeworkDueDate && (
                                                  <p className={cn(
                                                    "text-xs mt-1 font-bold px-2 py-1 rounded-full inline-block",
                                                    colorIndex === 0 && "bg-blue-200 text-blue-800",
                                                    colorIndex === 1 && "bg-green-200 text-green-800",
                                                    colorIndex === 2 && "bg-purple-200 text-purple-800",
                                                    colorIndex === 3 && "bg-amber-200 text-amber-800"
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
                                                <Download className="h-3 w-3 mr-1" /> PDF
                                              </a>
                                            </Button>
                                            
                                            <Button 
                                              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0"
                                              size="sm" 
                                              asChild
                                            >
                                              <a 
                                                href={`/api/weekly-plans/${plan.id}/export-excel`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                              >
                                                <Download className="h-3 w-3 mr-1" /> Excel
                                              </a>
                                            </Button>
                                          </div>
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                  </motion.div>
                                );
                              })}
                            </AnimatePresence>
                          </div>
                        )}
                      </ScrollArea>
                    </motion.div>
                  );
                })}
              </div>
            )}
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
          
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>Mathematics</span>
            </div>
            <div className="flex items-center space-x-1 ml-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Science</span>
            </div>
            <div className="flex items-center space-x-1 ml-2">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <span>Languages</span>
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}