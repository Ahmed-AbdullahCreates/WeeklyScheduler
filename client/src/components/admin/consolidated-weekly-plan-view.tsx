import React, { useMemo, useState } from "react";
import { DailyPlan, Grade, PlanningWeek, Subject, WeeklyPlanWithDetails } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText, AlertCircle, FileDown, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

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
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  
  // Memoize derived values for performance
  const subjects = useMemo(() => getUniqueSubjects(weeklyPlans), [weeklyPlans]);

  const weekdays = [
    { number: 1, name: 'Monday' },
    { number: 2, name: 'Tuesday' },
    { number: 3, name: 'Wednesday' },
    { number: 4, name: 'Thursday' },
    { number: 5, name: 'Friday' }
  ];
  
  const handleExportPDF = async () => {
    if (!grade || !week) return;
    
    try {
      setIsExporting(true);
      generatePDF();
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Error",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Function to reliably generate PDF using a new window with enhanced design
  const generatePDF = () => {
    // Get the table content
    const content = document.getElementById('print-content');
    if (!content) {
      toast({
        title: "Error",
        description: "Could not find content to print.",
        variant: "destructive",
      });
      return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Popup blocked. Please allow popups and try again.",
        variant: "destructive",
      });
      return;
    }

    // Format the date range for display
    const dateRangeText = week?.startDate && week?.endDate 
      ? `${formatDate(new Date(week.startDate))} - ${formatDate(new Date(week.endDate))}`
      : '';
    
    // Get today's date for the footer
    const today = new Date();
    const generatedDate = formatDate(today);

    // Choose a primary color for the PDF (using school's theme color - primary blue)
    const primaryColor = '#3b82f6'; // This is tailwind's blue-500
    
    // Write HTML content to the new window with enhanced styling
    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Consolidated Weekly Plan - ${grade?.name} - Week ${week?.weekNumber}</title>
        <meta charset="utf-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          :root {
            --primary: ${primaryColor};
            --primary-light: #dbeafe; /* blue-100 */
            --text-dark: #1f2937; /* gray-800 */
            --text-medium: #4b5563; /* gray-600 */
            --text-light: #6b7280; /* gray-500 */
            --background: #ffffff;
            --background-alt: #f9fafb; /* gray-50 */
            --border: #e5e7eb; /* gray-200 */
            --border-dark: #d1d5db; /* gray-300 */
            --success: #10b981; /* emerald-500 */
            --warning: #f59e0b; /* amber-500 */
          }
          
          * {
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.5;
            margin: 0;
            padding: 0;
            color: var(--text-dark);
            background-color: var(--background);
          }
          
          .container {
            max-width: 100%;
            margin: 0;
            padding: 15px 20px;
          }
          
          /* Header Section */
          .header {
            position: relative;
            padding-bottom: 15px;
            border-bottom: 2px solid var(--primary);
            margin-bottom: 25px;
          }
          
          .header-content {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          
          .logo-area {
            display: flex;
            align-items: center;
          }
          
          .logo-placeholder {
            width: 45px;
            height: 45px;
            border-radius: 50%;
            background-color: var(--primary);
            margin-right: 15px;
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
            font-weight: 700;
            font-size: 20px;
          }
          
          .title-group {
            flex: 1;
          }
          
          .document-type {
            color: var(--primary);
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 4px;
          }
          
          .title {
            font-size: 22px;
            font-weight: 700;
            margin: 0 0 5px;
            color: var(--text-dark);
          }
          
          .subtitle {
            font-size: 14px;
            color: var(--text-medium);
            margin: 0;
          }
          
          .meta-info {
            text-align: right;
            font-size: 13px;
          }
          
          .meta-label {
            font-weight: 600;
            margin-right: 5px;
            color: var(--text-medium);
          }
          
          .meta-value {
            font-weight: 400;
            color: var(--text-dark);
          }
          
          /* Table Styles */
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 13px;
          }
          
          th {
            background-color: var(--primary);
            color: white;
            font-weight: 600;
            text-align: left;
            padding: 10px 12px;
            border: 1px solid var(--primary);
          }
          
          td {
            border: 1px solid var(--border);
            padding: 10px 12px;
            vertical-align: top;
          }
          
          tr:nth-child(even) {
            background-color: var(--background-alt);
          }
          
          .subject-cell {
            background-color: var(--primary-light);
            font-weight: 600;
            border-left: 3px solid var(--primary);
          }
          
          /* Content Formatting */
          .topic {
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--text-dark);
            font-size: 14px;
          }
          
          .section {
            margin: 8px 0;
            padding-bottom: 6px;
            border-bottom: 1px dotted var(--border-dark);
          }
          
          .section:last-child {
            border-bottom: none;
          }
          
          .section-title {
            font-size: 11px;
            font-weight: 600;
            color: var(--primary);
            margin-bottom: 3px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 20px;
            background-color: var(--primary-light);
            color: var(--primary);
            font-weight: 500;
            font-size: 11px;
          }
          
          .badge.due-date {
            background-color: rgba(245, 158, 11, 0.1); /* amber-500 at 10% opacity */
            color: var(--warning);
          }
          
          .no-plan {
            color: var(--text-light);
            font-style: italic;
            font-size: 12px;
          }
          
          /* Footer */
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid var(--border);
            font-size: 11px;
            color: var(--text-light);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          @page {
            size: landscape;
            margin: 15mm 10mm;
          }
          
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header class="header">
            <div class="header-content">
              <div class="logo-area">
                <div class="logo-placeholder">WP</div>
                <div class="title-group">
                  <p class="document-type">Consolidated Weekly Plan</p>
                  <h1 class="title">${grade?.name} - Week ${week?.weekNumber}</h1>
                  <p class="subtitle">${dateRangeText}</p>
                </div>
              </div>
              <div class="meta-info">
                <div>
                  <span class="meta-label">Generated:</span>
                  <span class="meta-value">${generatedDate}</span>
                </div>
              </div>
            </div>
          </header>
    `);

    // Build an enhanced, more visually appealing version of the table
    const subjectsArray = subjects;
    const tableHtml = `
      <table>
        <thead>
          <tr>
            <th style="width: 15%;">Subject</th>
            ${weekdays.map(day => `<th style="width: 17%;">${day.name}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${subjectsArray.map((subject, index) => {
            const plan = findPlanBySubject(weeklyPlans, subject.id);
            const teacher = plan?.teacher;
            
            return `
              <tr>
                <td class="subject-cell">
                  <div style="font-size:14px; margin-bottom:3px;">${subject.name}</div>
                  ${teacher ? `<div style="font-size:11px; color:var(--text-light);">Teacher: ${teacher.fullName}</div>` : ''}
                </td>
                ${weekdays.map(day => {
                  const dailyPlan = getDailyPlanForDay(plan, day.number);
                  
                  if (!dailyPlan) {
                    return `<td class="no-plan">No plan</td>`;
                  }
                  
                  const sections = [];
                  if (dailyPlan.topic) {
                    sections.push(`<div class="topic">${dailyPlan.topic}</div>`);
                  }
                  
                  if (dailyPlan.booksAndPages) {
                    sections.push(`
                      <div class="section">
                        <div class="section-title">Books & Pages</div>
                        <div>${dailyPlan.booksAndPages}</div>
                      </div>
                    `);
                  }
                  
                  if (dailyPlan.homework) {
                    sections.push(`
                      <div class="section">
                        <div class="section-title">Homework</div>
                        <div>${dailyPlan.homework}</div>
                      </div>
                    `);
                  }
                  
                  if (dailyPlan.homeworkDueDate) {
                    sections.push(`
                      <div class="section">
                        <div class="section-title">Due Date</div>
                        <div><span class="badge due-date">${formatDate(new Date(dailyPlan.homeworkDueDate))}</span></div>
                      </div>
                    `);
                  }
                  
                  if (dailyPlan.assignments) {
                    sections.push(`
                      <div class="section">
                        <div class="section-title">Assignments</div>
                        <div>${dailyPlan.assignments}</div>
                      </div>
                    `);
                  }
                  
                  if (dailyPlan.notes) {
                    sections.push(`
                      <div class="section">
                        <div class="section-title">Notes</div>
                        <div>${dailyPlan.notes}</div>
                      </div>
                    `);
                  }
                  
                  return `<td>${sections.join('')}</td>`;
                }).join('')}
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      
      <footer class="footer">
        <div>Weekly Planner System • ${grade?.name} • Week ${week?.weekNumber}</div>
        <div>Generated on ${generatedDate}</div>
      </footer>
    </div>
    `;

    printWindow.document.write(tableHtml);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = function() {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  };

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
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <FileText className="h-5 w-5 mr-2 text-primary" />
            <span className="font-semibold">
              Consolidated Weekly Plan - {grade?.name} - Week {week?.weekNumber}
            </span>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <div className="text-sm font-normal text-muted-foreground mr-2">
              {week?.startDate && week?.endDate && (
                <span>{formatDate(new Date(week.startDate))} - {formatDate(new Date(week.endDate))}</span>
              )}
            </div>
            
            {/* Export to PDF button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="no-print border-primary text-primary hover:bg-primary/10"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <FileDown className="h-4 w-4 mr-2" />
                        Export to PDF
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Export this consolidated plan as a PDF document
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>

      {/* Mobile View - Tabs by Day - Add no-print class */}
      <div className="md:hidden no-print">
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

      {/* Desktop View - Table - Add print-content id */}
      <CardContent id="print-content" className="p-0 overflow-x-auto hidden md:block">
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
                  <div className="flex space-x-1 mt-1 no-print">
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
                                <AccordionTrigger className="py-1 text-sm font-medium text-left hover:no-underline accordion-trigger">
                                  {dailyPlan.topic || "No topic"}
                                </AccordionTrigger>
                                <AccordionContent className="accordion-content">
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