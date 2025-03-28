import { DailyPlan, Grade, PlanningWeek, Subject, WeeklyPlanWithDetails } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ConsolidatedWeeklyPlanViewProps {
  weeklyPlans: WeeklyPlanWithDetails[];
  grade: Grade | undefined;
  week: PlanningWeek | undefined;
}

// Helper function to get all unique subjects from the plans
function getUniqueSubjects(plans: WeeklyPlanWithDetails[]): Subject[] {
  const uniqueSubjects = new Map<number, Subject>();
  
  plans.forEach(plan => {
    if (!uniqueSubjects.has(plan.subject.id)) {
      uniqueSubjects.set(plan.subject.id, plan.subject);
    }
  });
  
  return Array.from(uniqueSubjects.values());
}

// Helper function to find a plan for a specific subject
function findPlanBySubject(plans: WeeklyPlanWithDetails[], subjectId: number): WeeklyPlanWithDetails | undefined {
  return plans.find(plan => plan.subject.id === subjectId);
}

// Helper function to get daily plan for a specific day
function getDailyPlanForDay(plan: WeeklyPlanWithDetails | undefined, dayOfWeek: number): DailyPlan | undefined {
  if (!plan) return undefined;
  return plan.dailyPlans.find(dp => dp.dayOfWeek === dayOfWeek);
}

export function ConsolidatedWeeklyPlanView({ 
  weeklyPlans, 
  grade, 
  week 
}: ConsolidatedWeeklyPlanViewProps) {
  // Get all unique subjects from the plans
  const subjects = getUniqueSubjects(weeklyPlans);
  
  // Array of weekdays for rendering
  const weekdays = [
    { number: 1, name: 'Monday' },
    { number: 2, name: 'Tuesday' },
    { number: 3, name: 'Wednesday' },
    { number: 4, name: 'Thursday' },
    { number: 5, name: 'Friday' }
  ];
  
  return (
    <Card className="shadow-md mb-6">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
        <CardTitle className="text-lg flex items-center">
          <FileText className="h-5 w-5 mr-2 text-primary" />
          <span className="font-semibold">
            Consolidated Weekly Plan - {grade?.name} - Week {week?.weekNumber}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
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
                <TableRow key={subject.id}>
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
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 px-2 text-xs border-primary/50 text-primary hover:bg-primary/10"
                            onClick={() => window.open(`/api/weekly-plans/${plan.id}/export-pdf`, '_blank')}
                          >
                            <Download className="h-3 w-3 mr-1" /> PDF
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 px-2 text-xs border-blue-500/50 text-blue-500 hover:bg-blue-500/10"
                            onClick={() => window.open(`/api/weekly-plans/${plan.id}/export-excel`, '_blank')}
                          >
                            <Download className="h-3 w-3 mr-1" /> Excel
                          </Button>
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
                                          {formatDate(new Date(dailyPlan.homeworkDueDate))}
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