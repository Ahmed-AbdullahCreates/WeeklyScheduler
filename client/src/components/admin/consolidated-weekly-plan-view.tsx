import React, { useMemo } from "react";
import { DailyPlan, Grade, PlanningWeek, Subject, WeeklyPlanWithDetails } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText, Info, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ConsolidatedWeeklyPlanViewProps {
  weeklyPlans: WeeklyPlanWithDetails[];
  grade: Grade | undefined;
  week: PlanningWeek | undefined;
  isLoading?: boolean;
}

// Helper functions
const getUniqueSubjects = (weeklyPlans: WeeklyPlanWithDetails[]): Subject[] => {
  const uniqueSubjects: Record<string, Subject> = {};

  weeklyPlans.forEach(plan => {
    if (plan.subject) {
      uniqueSubjects[plan.subject.id] = plan.subject;
    }
  });

  return Object.values(uniqueSubjects).sort((a, b) => a.name.localeCompare(b.name));
};

const findPlanBySubject = (weeklyPlans: WeeklyPlanWithDetails[], subjectId: string): WeeklyPlanWithDetails | undefined => {
  return weeklyPlans.find(plan => plan.subject?.id === subjectId);
};

const getDailyPlanForDay = (plan: WeeklyPlanWithDetails | undefined, dayNumber: number): DailyPlan | undefined => {
  if (!plan || !plan.dailyPlans) return undefined;
  return plan.dailyPlans.find(dp => dp.dayOfWeek === dayNumber);
};

export function ConsolidatedWeeklyPlanView({ 
  weeklyPlans, 
  grade, 
  week,
  isLoading = false
}: ConsolidatedWeeklyPlanViewProps) {
  // Memoize derived values for performance
  const subjects = useMemo(() => getUniqueSubjects(weeklyPlans), [weeklyPlans]);

  const weekdays = [
    { number: 1, name: 'Monday' },
    { number: 2, name: 'Tuesday' },
    { number: 3, name: 'Wednesday' },
    { number: 4, name: 'Thursday' },
    { number: 5, name: 'Friday' }
  ];

  // Handle loading state
  if (isLoading) {
    return (
      <Card className="shadow-md mb-6">
        <CardContent className="p-6 flex justify-center">
          <div className="flex items-center gap-2">
            <div className="animate-spin h-5 w-5 border-2 border-primary rounded-full border-t-transparent"></div>
            <span>Loading weekly plans...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle empty state
  if (weeklyPlans.length === 0) {
    return (
      <Card className="shadow-md mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center p-6">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
            <h3 className="font-semibold text-lg">No Weekly Plans Available</h3>
            <p className="text-muted-foreground mt-1">
              There are no weekly plans for this grade and week.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md mb-6">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-primary" />
            <span className="font-semibold">
              Consolidated Weekly Plan - {grade?.name} - Week {week?.weekNumber}
            </span>
          </div>
          <div className="text-sm font-normal text-muted-foreground">
            {week?.startDate && week?.endDate && (
              <span>{formatDate(new Date(week.startDate))} - {formatDate(new Date(week.endDate))}</span>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      {/* Mobile View - Tabs by Day */}
      <div className="md:hidden">
        <Tabs defaultValue={weekdays[0].name.toLowerCase()}>
          <TabsList className="w-full justify-start overflow-auto py-3 px-3">
            {weekdays.map((day) => (
              <TabsTrigger key={day.number} value={day.name.toLowerCase()}>
                {day.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {weekdays.map((day) => (
            <TabsContent key={day.number} value={day.name.toLowerCase()} className="p-2">
              {subjects.map((subject) => {
                const plan = findPlanBySubject(weeklyPlans, subject.id);
                const dailyPlan = getDailyPlanForDay(plan, day.number);

                return (
                  <Card key={subject.id} className="mb-3 overflow-hidden">
                    <CardHeader className="py-3 px-4 bg-muted/20">
                      <CardTitle className="text-sm font-medium flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-primary">{subject.name}</span>
                          {plan?.teacher && (
                            <span className="text-xs text-muted-foreground">
                              Teacher: {plan.teacher.fullName}
                            </span>
                          )}
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="flex space-x-1">
                                {plan && (
                                  <>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="h-7 w-7 p-0"
                                      onClick={() => window.open(`/api/weekly-plans/${plan.id}/export-pdf`, '_blank')}
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>Download Plan</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-3 px-4">
                      {dailyPlan ? (
                        <div className="space-y-2 text-sm">
                          <div className="font-medium">{dailyPlan.topic || "No topic"}</div>

                          {dailyPlan.booksAndPages && (
                            <div className="mt-2">
                              <div className="font-medium text-xs text-primary">Books & Pages</div>
                              <div className="text-neutral-700">{dailyPlan.booksAndPages}</div>
                            </div>
                          )}

                          {dailyPlan.homework && (
                            <div className="mt-2">
                              <div className="font-medium text-xs text-primary">Homework</div>
                              <div className="text-neutral-700">{dailyPlan.homework}</div>
                            </div>
                          )}

                          {dailyPlan.homeworkDueDate && (
                            <div className="mt-1">
                              <Badge variant="outline" className="text-xs">
                                Due: {formatDate(new Date(dailyPlan.homeworkDueDate))}
                              </Badge>
                            </div>
                          )}

                          {dailyPlan.notes && (
                            <div className="mt-2">
                              <div className="font-medium text-xs text-primary">Notes</div>
                              <div className="text-neutral-700">{dailyPlan.notes}</div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-muted-foreground italic text-sm">No plan for this day</div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Desktop View - Table */}
      <CardContent className="p-0 overflow-x-auto hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-semibold w-[150px]">Subject</TableHead>
              {weekdays.map((day) => (
                <TableHead key={day.number} className="font-semibold">
                  {day.name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.map((subject) => {
              const plan = findPlanBySubject(weeklyPlans, subject.id);
              const teacher = plan?.teacher;

              return (
                <TableRow key={subject.id} className="hover:bg-muted/5">
                  <TableCell className="font-medium bg-muted/10">
                    <div className="space-y-1">
                      <div className="font-semibold text-primary">{subject.name}</div>
                      {teacher && (
                        <div className="text-xs text-muted-foreground">
                          Teacher: {teacher.fullName}
                        </div>
                      )}
                      {plan && (
                  <div className="flex space-x-1 mt-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 px-2 text-xs border-primary/50 text-primary hover:bg-primary/10"
                            onClick={() => window.open(`/api/weekly-plans/${plan.id}/export-pdf`, '_blank')}
                          >
                            <Download className="h-3 w-3 mr-1" /> PDF
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Download PDF version</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 px-2 text-xs border-blue-500/50 text-blue-500 hover:bg-blue-500/10"
                            onClick={() => window.open(`/api/weekly-plans/${plan.id}/export-excel`, '_blank')}
                          >
                            <Download className="h-3 w-3 mr-1" /> Excel
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Download Excel version</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  )}

                    </div>
                  </TableCell>

                  {weekdays.map((day) => {
                    const dailyPlan = getDailyPlanForDay(plan, day.number);

                    return (
                      <TableCell key={day.number} className="border p-2">
                        {dailyPlan ? (
                          <div className="space-y-2 text-sm">
                            <Accordion type="single" collapsible className="w-full">
                              <AccordionItem value="details" className="border-0">
                                <AccordionTrigger className="py-1 text-sm font-medium text-left hover:no-underline">
                                  {dailyPlan.topic || "No topic"}
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="space-y-3 pt-1 text-sm">
                                    {dailyPlan.booksAndPages && (
                                      <div>
                                        <div className="font-medium text-xs text-primary">Books & Pages</div>
                                        <div className="text-neutral-700">{dailyPlan.booksAndPages}</div>
                                      </div>
                                    )}

                                    {dailyPlan.homework && (
                                      <div>
                                        <div className="font-medium text-xs text-primary">Homework</div>
                                        <div className="text-neutral-700">{dailyPlan.homework}</div>
                                      </div>
                                    )}

                                    {dailyPlan.homeworkDueDate && (
                                      <div>
                                        <div className="font-medium text-xs text-primary">Due Date</div>
                                        <div className="text-neutral-700">
                                          <Badge variant="outline" className="font-normal">
                                            {formatDate(new Date(dailyPlan.homeworkDueDate))}
                                          </Badge>
                                        </div>
                                      </div>
                                    )}

                                    {dailyPlan.assignments && (
                                      <div>
                                        <div className="font-medium text-xs text-primary">Assignments</div>
                                        <div className="text-neutral-700">{dailyPlan.assignments}</div>
                                      </div>
                                    )}

                                    {dailyPlan.notes && (
                                      <div>
                                        <div className="font-medium text-xs text-primary">Notes</div>
                                        <div className="text-neutral-700">{dailyPlan.notes}</div>
                                      </div>
                                    )}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          </div>
                        ) : (
                          <div className="text-muted-foreground italic text-sm">No plan</div>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}