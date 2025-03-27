import PDFDocument from 'pdfkit';
import { WeeklyPlanComplete, WeeklyPlanWithDetails, Grade, Subject, User, PlanningWeek, DailyPlan, DailyPlanData } from '@shared/schema';
import { mapDayNumberToName } from '../../client/src/lib/utils';

// Function to generate a PDF for a weekly plan
export function generateWeeklyPlanPDF(
  weeklyPlanData: WeeklyPlanComplete,
  teacherName: string,
  gradeName: string,
  subjectName: string,
  weekNumber: number,
  weekYear: number,
  startDate: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Create a PDF document with improved settings
      const doc = new PDFDocument({ 
        margin: 40,
        size: 'A4',
        info: {
          Title: `Weekly Plan - ${subjectName} - ${gradeName} - Week ${weekNumber}`,
          Author: teacherName,
          Subject: `Weekly Lesson Plan for ${subjectName}`,
          Keywords: 'weekly plan, lesson plan, school, education, curriculum',
          CreationDate: new Date(),
        }
      });

      // Create a buffer to store the PDF
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Colors
      const primaryColor = '#3b82f6'; // Blue
      const secondaryColor = '#10b981'; // Green
      const accentColor = '#8b5cf6'; // Purple
      const gray = '#6b7280';

      // Add a professional header with logo and title
      // Header background
      doc.rect(0, 0, doc.page.width, 100)
         .fill('#f3f4f6');

      // Color bar at top of document
      doc.rect(0, 0, doc.page.width, 10)
         .fill(primaryColor);

      // Title and subtitle
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .fillColor(primaryColor)
         .text('Weekly Lesson Plan', 40, 30, { align: 'center' })
         .fontSize(14)
         .fillColor(secondaryColor)
         .text(`${subjectName} - ${gradeName}`, { align: 'center' })
         .moveDown(0.5);

      // Document ID and meta section
      doc.roundedRect(40, 110, doc.page.width - 80, 80, 5)
         .fillAndStroke('#f9fafb', '#e5e7eb');

      // Meta information in table-like format
      const metaStartY = 120;
      const metaLeftCol = 60;
      const metaRightCol = doc.page.width / 2 + 20;
      
      // Left column metadata
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#374151')
         .text('Teacher:', metaLeftCol, metaStartY, { continued: true, width: 150 })
         .font('Helvetica')
         .fillColor('#6b7280')
         .text(` ${teacherName}`, { continued: false })
         .moveDown(0.5);
         
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#374151')
         .text('Subject:', metaLeftCol, doc.y, { continued: true, width: 150 })
         .font('Helvetica')
         .fillColor('#6b7280')
         .text(` ${subjectName}`, { continued: false })
         .moveDown(0.5);
         
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#374151')
         .text('Document ID:', metaLeftCol, doc.y, { continued: true, width: 150 })
         .font('Helvetica')
         .fillColor('#6b7280')
         .text(` WP-${weeklyPlanData.weeklyPlan.id}-${weekNumber}`, { continued: false });
         
      // Right column metadata 
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#374151')
         .text('Grade:', metaRightCol, metaStartY, { continued: true, width: 150 })
         .font('Helvetica')
         .fillColor('#6b7280')
         .text(` ${gradeName}`, { continued: false })
         .moveDown(0.5);
         
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#374151')
         .text('Week:', metaRightCol, doc.y - 14, { continued: true, width: 150 })
         .font('Helvetica')
         .fillColor('#6b7280')
         .text(` ${weekNumber} (${weekYear})`, { continued: false })
         .moveDown(0.5);
         
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#374151')
         .text('Date Range:', metaRightCol, doc.y - 14, { continued: true, width: 150 })
         .font('Helvetica')
         .fillColor('#6b7280')
         .text(` ${formatDateRange(startDate)}`, { continued: false });

      // Start of content
      doc.y = 210;

      // Define weekdays and plan tracker (for completeness visualization)
      const weekdays = [1, 2, 3, 4, 5]; // Monday to Friday
      const planCompletion: Record<number, boolean> = {};

      // Add completeness tracker
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#374151')
         .text('Weekly Overview', { align: 'left' })
         .moveDown(0.5);

      // Draw plan completion tracker
      const trackerY = doc.y;
      const dayWidth = (doc.page.width - 80) / 5;
      
      weekdays.forEach((day, index) => {
        const dayName = mapDayNumberToName(day).substring(0, 3);
        const dailyPlan = getDailyPlanByDayNumber(weeklyPlanData.dailyPlans, day);
        const hasContent = dailyPlan && dailyPlan.topic;
        planCompletion[day] = !!hasContent;
        
        // Day label
        doc.fontSize(8)
           .font('Helvetica')
           .fillColor('#6b7280')
           .text(dayName, 40 + (index * dayWidth), trackerY, { width: dayWidth, align: 'center' });
        
        // Status indicator
        const circleX = 40 + (index * dayWidth) + (dayWidth / 2);
        const circleY = trackerY + 20;
        
        doc.circle(circleX, circleY, 8)
           .fillAndStroke(hasContent ? secondaryColor : '#e5e7eb', hasContent ? secondaryColor : '#d1d5db');
        
        if (hasContent) {
          doc.fontSize(10)
             .font('Helvetica-Bold')
             .fillColor('white')
             .text('✓', circleX - 3, circleY - 4, { align: 'center' });
        }
      });

      // Add a horizontal line
      doc.y = trackerY + 40;
      doc.moveTo(40, doc.y)
         .lineTo(doc.page.width - 40, doc.y)
         .strokeColor('#e5e7eb')
         .stroke()
         .moveDown(1);

      // Add plan for each day
      weekdays.forEach((dayNumber, index) => {
        const dayName = mapDayNumberToName(dayNumber);
        const dailyPlan = getDailyPlanByDayNumber(weeklyPlanData.dailyPlans, dayNumber);
        const hasContent = !!dailyPlan;

        // Day header with background
        const dayHeaderY = doc.y;
        doc.rect(40, dayHeaderY - 5, doc.page.width - 80, 30)
           .fillColor(hasContent ? primaryColor : gray)
           .fill();
        
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor('white')
           .text(dayName, 50, dayHeaderY, { continued: false })
           .moveDown(0.5);

        if (dailyPlan) {
          // Section with light background for content
          const contentStartY = doc.y;
          doc.rect(40, contentStartY - 5, doc.page.width - 80, 
                  getPlanContentHeight(dailyPlan))
             .fillColor('#f9fafb')
             .fill();
          
          // Reset position for content
          doc.y = contentStartY;

          // Topic section with colored bar
          doc.rect(40, doc.y - 5, 5, 24)
             .fill(primaryColor);
          
          doc.fontSize(12)
             .font('Helvetica-Bold')
             .fillColor('#111827')
             .text('Topic:', 55, doc.y, { continued: true })
             .font('Helvetica')
             .fillColor('#374151')
             .text(` ${dailyPlan.topic}`, { continued: false })
             .moveDown(0.5);

          // Two column layout for details
          const colWidth = (doc.page.width - 90) / 2;
          const leftColX = 55;
          const rightColX = leftColX + colWidth + 10;
          let currY = doc.y;
          let rightColY = doc.y;

          // Books & Pages (left column)
          if (dailyPlan.booksAndPages) {
            doc.rect(40, doc.y - 5, 5, 24)
               .fill(secondaryColor);
            
            doc.fontSize(11)
               .font('Helvetica-Bold')
               .fillColor('#111827')
               .text('Books & Pages:', leftColX, currY, { continued: true, width: colWidth })
               .font('Helvetica')
               .fillColor('#374151')
               .text(` ${dailyPlan.booksAndPages}`, { continued: false, width: colWidth });
            
            currY = doc.y + 5;
          }

          // Homework (right column)
          if (dailyPlan.homework) {
            doc.rect(rightColX - 15, doc.y - 5, 5, 24)
               .fill(accentColor);
            
            doc.fontSize(11)
               .font('Helvetica-Bold')
               .fillColor('#111827')
               .text('Homework:', rightColX, rightColY, { continued: true, width: colWidth })
               .font('Helvetica')
               .fillColor('#374151')
               .text(` ${dailyPlan.homework}`, { continued: false, width: colWidth });
            
            rightColY = doc.y + 5;
          }

          // Continue with staggered layout
          // Use the lower of the two y-positions
          doc.y = Math.max(currY, rightColY);
          currY = doc.y;
          rightColY = doc.y;

          // Assignments (left column)
          if (dailyPlan.assignments) {
            doc.rect(40, doc.y - 5, 5, 24)
               .fill('#f97316'); // Orange
            
            doc.fontSize(11)
               .font('Helvetica-Bold')
               .fillColor('#111827')
               .text('Assignments:', leftColX, currY, { continued: true, width: colWidth })
               .font('Helvetica')
               .fillColor('#374151')
               .text(` ${dailyPlan.assignments}`, { continued: false, width: colWidth });
            
            currY = doc.y + 5;
          }

          // Due Date (right column)
          if (dailyPlan.homeworkDueDate) {
            doc.rect(rightColX - 15, doc.y - 5, 5, 24)
               .fill('#ef4444'); // Red
            
            doc.fontSize(11)
               .font('Helvetica-Bold')
               .fillColor('#111827')
               .text('Due Date:', rightColX, rightColY, { continued: true, width: colWidth })
               .font('Helvetica')
               .fillColor('#374151')
               .text(` ${formatDate(dailyPlan.homeworkDueDate)}`, { continued: false, width: colWidth });
            
            rightColY = doc.y + 5;
          }

          // Notes (full width if present)
          doc.y = Math.max(currY, rightColY);
          if (dailyPlan.notes) {
            doc.rect(40, doc.y - 5, 5, 24)
               .fill('#8b5cf6'); // Purple
            
            doc.fontSize(11)
               .font('Helvetica-Bold')
               .fillColor('#111827')
               .text('Notes:', 55, doc.y, { continued: true })
               .font('Helvetica')
               .fillColor('#374151')
               .text(` ${dailyPlan.notes}`, { continued: false });
          }
        } else {
          // Empty day styling
          doc.rect(40, doc.y - 5, doc.page.width - 80, 40)
             .fillColor('#f9fafb')
             .fill();
          
          doc.fontSize(11)
             .font('Helvetica-Oblique')
             .fillColor('#6b7280')
             .text('No plan created for this day.', 55, doc.y + 10, { continued: false })
             .moveDown(0.2);
        }

        // Add space between days
        doc.moveDown(1);
        
        // Add a page break if needed (except for the last day)
        if (doc.y > doc.page.height - 150 && index < weekdays.length - 1) {
          doc.addPage();
          
          // Add mini header to new page
          doc.rect(0, 0, doc.page.width, 40)
             .fill('#f3f4f6');
          
          doc.rect(0, 0, doc.page.width, 5)
             .fill(primaryColor);
             
          doc.fontSize(12)
             .font('Helvetica-Bold')
             .fillColor(primaryColor)
             .text(`Weekly Plan - ${gradeName} - ${subjectName} - Week ${weekNumber}`, 40, 15, { align: 'center' })
             .moveDown(1);
        }
      });

      // Add footer to every page
      const addFooter = (pageNumber: number) => {
        const totalPages = doc.bufferedPageRange().count;
        
        doc.switchToPage(pageNumber);
        
        // Footer line
        doc.moveTo(40, doc.page.height - 50)
           .lineTo(doc.page.width - 40, doc.page.height - 50)
           .strokeColor('#e5e7eb')
           .stroke();
        
        // Footer text
        doc.fontSize(8)
           .font('Helvetica')
           .fillColor('#9ca3af')
           .text(
              `Generated on ${new Date().toLocaleString()}`,
              40,
              doc.page.height - 40,
              { align: 'left', width: 200 }
           )
           .text(
              'Weekly Planner System for Schools',
              doc.page.width / 2 - 100,
              doc.page.height - 40,
              { align: 'center', width: 200 }
           )
           .text(
              `Page ${pageNumber + 1} of ${totalPages}`,
              doc.page.width - 40 - 100,
              doc.page.height - 40,
              { align: 'right', width: 100 }
           );
      };

      // Finalize the PDF
      doc.end();
      
      // Add footers to all pages
      doc.on('pageAdded', () => {
        addFooter(doc.bufferedPageRange().count - 1);
      });
      
    } catch (error) {
      reject(error);
    }
  });
}

// Helper functions

// Format a date range by adding 4 days to the start date
function formatDateRange(startDate: string): string {
  try {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 4); // Assuming 5 days (end date is 4 days after start)
    
    return `${formatDate(start)} - ${formatDate(end)}`;
  } catch (e) {
    return 'Invalid date range';
  }
}

// Format a date in a consistent way
function formatDate(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (e) {
    return 'Invalid date';
  }
}

// Calculate approximate content height based on plan fields
function getPlanContentHeight(plan: DailyPlan): number {
  let height = 30; // Base height for topic
  
  if (plan.booksAndPages) height += 25;
  if (plan.homework) height += 25;
  if (plan.assignments) height += 25;
  if (plan.homeworkDueDate) height += 25;
  
  // Notes can be longer so allocate more space
  if (plan.notes) {
    const estimatedLines = Math.ceil(plan.notes.length / 50); // Rough estimate: 50 chars per line
    height += 20 + (estimatedLines * 15);
  }
  
  return height + 20; // Add padding
}

// Helper function to get the daily plan for a specific day number
function getDailyPlanByDayNumber(dailyPlans: DailyPlanData, dayNumber: number): DailyPlan | undefined {
  switch (dayNumber) {
    case 1: return dailyPlans.monday;
    case 2: return dailyPlans.tuesday;
    case 3: return dailyPlans.wednesday;
    case 4: return dailyPlans.thursday;
    case 5: return dailyPlans.friday;
    default: return undefined;
  }
}