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
        <title>Weekly Plan - ${grade?.name} - Week ${week?.weekNumber}</title>
        <meta charset="utf-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          :root {
            --primary: ${primaryColor};
            --primary-light: #dbeafe; /* blue-100 */
            --primary-dark: #2563eb; /* blue-600 */
            --secondary: #8b5cf6; /* violet-500 */
            --accent: #f59e0b; /* amber-500 */
            --text-dark: #1f2937; /* gray-800 */
            --text-medium: #4b5563; /* gray-600 */
            --text-light: #6b7280; /* gray-500 */
            --background: #ffffff;
            --background-alt: #f9fafb; /* gray-50 */
            --background-muted: #f3f4f6; /* gray-100 */
            --border: #e5e7eb; /* gray-200 */
            --border-dark: #d1d5db; /* gray-300 */
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
            position: relative;
          }
          
          .container {
            max-width: 100%;
            margin: 0;
            padding: 20px 30px;
          }
          
          /* Enhanced background pattern - subtle grid */
          .page-background {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            opacity: 0.02;
            pointer-events: none;
            background-image: 
              linear-gradient(var(--primary) 1px, transparent 1px),
              linear-gradient(90deg, var(--primary) 1px, transparent 1px);
            background-size: 40px 40px;
            background-position: -1px -1px;
          }
          
          /* Elegant Header Section */
          .header {
            position: relative;
            padding-bottom: 25px;
            margin-bottom: 30px;
            overflow: hidden;
          }
          
          .header::after {
            content: "";
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background: linear-gradient(to right, 
              var(--primary) 0%, 
              var(--primary-light) 50%,
              transparent 100%);
          }
          
          .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          /* Left column - Week info */
          .week-info {
            flex: 1;
            padding-right: 20px;
            position: relative;
          }
          
          .week-info::after {
            content: "";
            position: absolute;
            right: 0;
            top: 15%;
            height: 70%;
            width: 1px;
            background: linear-gradient(to bottom, transparent, var(--border-dark), transparent);
          }
          
          .week-number {
            font-size: 32px;
            font-weight: 700;
            color: var(--primary);
            margin: 0;
            line-height: 1.1;
            letter-spacing: -0.5px;
          }
          
          .date-range {
            font-size: 14px;
            color: var(--text-medium);
            margin-top: 5px;
            display: inline-block;
            padding: 3px 8px;
            background-color: var(--background-alt);
            border-radius: 4px;
            border: 1px solid var(--border);
          }
          
          /* Center column - Grade info */
          .grade-info {
            flex: 2;
            text-align: center;
            padding: 0 20px;
            position: relative;
          }
          
          .document-type {
            color: var(--primary);
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin: 0 0 8px;
          }
          
          .grade-name {
            font-size: 36px;
            font-weight: 800;
            margin: 0;
            color: var(--text-dark);
            position: relative;
            display: inline-block;
            text-shadow: 0 1px 2px rgba(0,0,0,0.05);
          }
          
          .grade-name::after {
            content: "";
            display: block;
            width: 120px;
            height: 4px;
            background: linear-gradient(to right, var(--primary-light), var(--primary), var(--primary-light));
            margin: 8px auto 0;
            border-radius: 2px;
          }
          
          /* Right column - Logos */
          .logo-area {
            flex: 1;
            display: flex;
            justify-content: flex-end;
            gap: 20px;
          }
          
          .logo-placeholder {
            width: 80px;
            height: 80px;
            border: 2px solid var(--border-dark);
            border-radius: 8px;
            display: flex;
            justify-content: center;
            align-items: center;
            color: var(--text-light);
            font-weight: 600;
            font-size: 12px;
            background-color: var(--background-alt);
            position: relative;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }
          
          .logo-placeholder::before {
            content: "LOGO";
            font-size: 10px;
          }
          
          /* Elegant Table Styles */
          .weekly-plan-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin: 30px 0;
            font-size: 13px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            border-radius: 10px;
            overflow: hidden;
          }
          
          .weekly-plan-table th {
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            color: white;
            font-weight: 600;
            text-align: left;
            padding: 16px 18px;
            border: none;
            position: relative;
            text-shadow: 0 1px 1px rgba(0,0,0,0.1);
          }
          
          .weekly-plan-table th:first-child {
            border-top-left-radius: 10px;
          }
          
          .weekly-plan-table th:last-child {
            border-top-right-radius: 10px;
          }
          
          .weekly-plan-table th:not(:last-child)::after {
            content: "";
            position: absolute;
            right: 0;
            top: 20%;
            height: 60%;
            width: 1px;
            background-color: rgba(255, 255, 255, 0.3);
          }
          
          .weekly-plan-table td {
            border: 1px solid var(--border);
            padding: 14px 18px;
            vertical-align: top;
            transition: background-color 0.2s ease;
          }
          
          /* Enhanced row styling */
          .weekly-plan-table tr:not(:last-child) td {
            border-bottom: 1px solid var(--border-dark);
          }
          
          .weekly-plan-table tr:nth-child(even) td:not(.subject-cell) {
            background-color: var(--background-alt);
          }
          
          /* Better subject cell styling */
          .subject-cell {
            background: linear-gradient(to right, var(--primary-light), rgba(219, 234, 254, 0.2));
            font-weight: 600;
            border-left: 5px solid var(--primary);
            position: relative;
            box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.1);
          }
          
          /* Add more separation between subjects */
          .weekly-plan-table tr:not(:first-child) .subject-cell {
            border-top: 4px solid white; /* Creates visual space between subjects */
          }
          
          /* Content Formatting */
          .topic {
            font-weight: 700;
            margin-bottom: 12px;
            color: var(--text-dark);
            font-size: 14px;
            padding-bottom: 10px;
            border-bottom: 1px dashed var(--border);
            position: relative;
            line-height: 1.4;
          }
          
          .section {
            margin: 14px 0;
            padding-bottom: 12px;
            border-bottom: 1px dotted var(--border-dark);
            position: relative;
          }
          
          .section:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }
          
          .section-title {
            font-size: 11px;
            font-weight: 600;
            color: var(--primary);
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.7px;
            display: flex;
            align-items: center;
          }
          
          .section-title::before {
            content: "";
            display: inline-block;
            width: 6px;
            height: 6px;
            background-color: var(--primary);
            border-radius: 50%;
            margin-right: 8px;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
          }
          
          .badge {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 20px;
            background-color: var(--primary-light);
            color: var(--primary-dark);
            font-weight: 500;
            font-size: 11px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          }
          
          .badge.due-date {
            background-color: rgba(245, 158, 11, 0.1);
            color: var (--accent);
            border: 1px solid rgba(245, 158, 11, 0.2);
          }
          
          .no-plan {
            color: var(--text-light);
            font-style: italic;
            font-size: 13px;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100px;
            background-color: rgba(243, 244, 246, 0.5);
            border-radius: 6px;
            border: 1px dashed var(--border);
          }
          
          /* Enhanced Notes Section */
          .notes-section {
            margin-top: 40px;
            padding: 25px;
            border: 1px dashed var(--border-dark);
            border-radius: 10px;
            background-color: var(--background-alt);
            position: relative;
          }
          
          .notes-section::before {
            content: "";
            position: absolute;
            top: -8px;
            left: 25px;
            width: 120px;
            height: 16px;
            background-color: var(--background);
            border-radius: 10px;
          }
          
          .notes-title {
            position: relative;
            font-size: 16px;
            font-weight: 600;
            color: var(--text-medium);
            margin: -5px 0 20px;
            display: flex;
            align-items: center;
          }
          
          .notes-title::before {
            content: "✎";
            margin-right: 10px;
            font-size: 20px;
            color: var(--primary);
          }
          
          .notes-lines {
            height: 160px;
            background-image: linear-gradient(var(--border-dark) 1px, transparent 1px);
            background-size: 100% 28px;
            position: relative;
            border-radius: 4px;
          }
          
          /* Footer with document information */
          .footer {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 2px solid var(--border);
            font-size: 11px;
            color: var(--text-light);
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
          }
          
          .footer::before {
            content: "";
            position: absolute;
            top: -6px;
            left: 0;
            right: 0;
            height: 1px;
            background-color: var(--border);
          }
          
          .footer-left {
            display: flex;
            align-items: center;
          }
          
          .footer-text {
            font-size: 10px;
            font-weight: 500;
            color: var(--text-medium);
          }
          
          .generation-info {
            font-size: 10px;
            color: var(--text-light);
            background-color: var(--background-alt);
            padding: 2px 8px;
            border-radius: 4px;
            border: 1px solid var(--border);
          }
          
          .page-number {
            font-size: 12px;
            font-weight: 500;
            color: var(--text-medium);
          }
          
          /* Page Settings */
          @page {
            size: landscape;
            margin: 15mm 10mm 20mm 10mm;
          }
          
          /* Print Optimizations */
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .no-print {
              display: none !important;
            }
            
            .page-break {
              page-break-before: always;
            }
            
            /* Ensure headers repeat on multi-page tables */
            thead {
              display: table-header-group;
            }
            
            tfoot {
              display: table-footer-group;
            }
          }
        </style>
      </head>
      <body>
        <div class="page-background"></div>
        <div class="container">
          <!-- Redesigned Three-Column Header -->
          <header class="header">
            <div class="header-content">
              <!-- Left Column - Week Info -->
              <div class="week-info">
                <h2 class="week-number">Week ${week?.weekNumber}</h2>
                <div class="date-range">${dateRangeText}</div>
              </div>
              
              <!-- Center Column - Grade Info -->
              <div class="grade-info">
                <p class="document-type">Weekly Planning Document</p>
                <h1 class="grade-name">${grade?.name}</h1>
              </div>
              
              <!-- Right Column - Logo Area -->
              <div class="logo-area">
                <div class="logo-placeholder"></div>
                <div class="logo-placeholder"></div>
              </div>
            </div>
          </header>
    `);

    // Build an enhanced, more visually appealing version of the table
    const subjectsArray = subjects;
    const tableHtml = `
      <table class="weekly-plan-table">
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
                  <div style="font-size:15px; margin-bottom:5px;">${subject.name}</div>
                  ${teacher ? `<div style="font-size:12px; color:var(--text-light);">Teacher: ${teacher.fullName}</div>` : ''}
                </td>
                ${weekdays.map(day => {
                  const dailyPlan = getDailyPlanForDay(plan, day.number);
                  
                  if (!dailyPlan) {
                    return `<td class="no-plan">No plan for this day</td>`;
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
      
      <!-- Notes Section -->
      <div class="notes-section">
        <div class="notes-title">Additional Notes</div>
        <div class="notes-lines"></div>
      </div>
      
      <footer class="footer">
        <div class="footer-left">
          <span class="footer-text">Weekly Planner System • ${grade?.name} • Week ${week?.weekNumber}</span>
        </div>
        <div class="generation-info">Generated on ${generatedDate}</div>
        <div class="page-number">Page 1</div>
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
                              {dailyPlan.homeworkDueDate && (
                                <div className="mt-1">
                                  <div className="font-medium text-xs text-primary">Due Date</div>
                                  <div className="text-neutral-700">
                                    <Badge variant="outline" className="font-normal">
                                      {formatDate(new Date(dailyPlan.homeworkDueDate))}
                                    </Badge>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          {dailyPlan.assignments && (
                            <div className="mt-2">
                              <div className="font-medium text-xs text-primary">Assignments</div>
                              <div className="text-neutral-700">{dailyPlan.assignments}</div>
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