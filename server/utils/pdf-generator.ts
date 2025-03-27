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
      // Validate input data to prevent unexpected errors
      if (!weeklyPlanData || !weeklyPlanData.weeklyPlan) {
        throw new Error('Invalid weekly plan data provided');
      }
      
      // Use safe values in case any parameters are undefined or null
      const safeTeacherName = teacherName || 'Not specified';
      const safeGradeName = gradeName || 'Not specified';
      const safeSubjectName = subjectName || 'Not specified';
      const safeWeekNumber = weekNumber || 0;
      const safeWeekYear = weekYear || new Date().getFullYear();
      const safeStartDate = startDate || new Date().toISOString().split('T')[0];
      
      // Create a PDF document
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4',
        info: {
          Title: `Weekly Plan - ${safeSubjectName} - ${safeGradeName} - Week ${safeWeekNumber}`,
          Author: safeTeacherName,
          Subject: `Weekly Lesson Plan for ${safeSubjectName}`,
          Keywords: 'weekly plan, lesson plan, school',
          CreationDate: new Date(),
        }
      });
      
      // Track page number
      let pageNumber = 1;
      
      // Add event listener for new pages - simplified to prevent stack overflow
      doc.on('pageAdded', () => {
        pageNumber++;
        
        // Add a simple header and footer to avoid recursion issues
        // Blue line at the top
        doc.strokeColor('#3b82f6')
           .lineWidth(3)
           .moveTo(0, 10)
           .lineTo(doc.page.width, 10)
           .stroke();
        
        // Simple page information
        doc.font('Helvetica')
           .fontSize(8)
           .fillColor('#475569')
           .text(`Page ${pageNumber} - ${safeGradeName} - ${safeSubjectName}`, 50, 20);
        
        // Blue line at the bottom
        doc.strokeColor('#3b82f6')
           .lineWidth(3)
           .moveTo(0, doc.page.height - 20)
           .lineTo(doc.page.width, doc.page.height - 20)
           .stroke();
      });

      // Create a buffer to store the PDF
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Add header with background color
      doc.rect(0, 0, doc.page.width, 140)
         .fill('#f8fafc'); // Light gray background

      // Add a colored line at the top
      doc.rect(0, 0, doc.page.width, 10)
         .fill('#3b82f6'); // Blue accent

      // Add the header/title
      doc.fontSize(28)
         .font('Helvetica-Bold')
         .fillColor('#1e40af') // Dark blue text
         .text(`Weekly Lesson Plan`, 50, 40, { align: 'center' })
         .moveDown(0.5);

      // Add metadata with styling - using safe values to prevent errors
      doc.fillColor('#334155') // Slate gray text
         .fontSize(14)
         .font('Helvetica-Bold')
         .text(`Teacher:`, 50, 90, { continued: true })
         .font('Helvetica')
         .text(` ${safeTeacherName}`, { continued: false })
         
         .font('Helvetica-Bold')
         .text(`Grade:`, 50, doc.y, { continued: true })
         .font('Helvetica')
         .text(` ${safeGradeName}`, { continued: false })
         
         .font('Helvetica-Bold')
         .text(`Subject:`, 50, doc.y, { continued: true })
         .font('Helvetica')
         .text(` ${safeSubjectName}`, { continued: false })
         
         .font('Helvetica-Bold')
         .text(`Week:`, 50, doc.y, { continued: true })
         .font('Helvetica')
         .text(` ${safeWeekNumber} (${safeWeekYear})`, { continued: false })
         
         .font('Helvetica-Bold')
         .text(`Start Date:`, 50, doc.y, { continued: true })
         .font('Helvetica')
         .text(` ${new Date(safeStartDate).toLocaleDateString()}`, { continued: false })
         .moveDown(1);

      // Add a horizontal line
      doc.moveTo(50, doc.y)
         .lineTo(doc.page.width - 50, doc.y)
         .stroke()
         .moveDown(1);

      // Define weekdays
      const weekdays = [1, 2, 3, 4, 5]; // Monday to Friday

      // Add plan for each day
      weekdays.forEach((dayNumber, index) => {
        const dayName = mapDayNumberToName(dayNumber);
        const dailyPlan = getDailyPlanByDayNumber(weeklyPlanData.dailyPlans, dayNumber);
        const startY = doc.y;

        // Day background colors alternating for better readability
        const isEvenDay = index % 2 === 0;
        if (isEvenDay) {
          doc.rect(40, startY, doc.page.width - 80, 25).fill('#f1f5f9'); // Light blue/gray background
        }

        // Add day heading with consistent styling
        doc.fillColor(isEvenDay ? '#1e40af' : '#374151') // Blue for even days, dark gray for odd
           .fontSize(16)
           .font('Helvetica-Bold')
           .text(`${dayName}`, 50, startY + 5, { continued: false });

        // Add horizontal line under day heading
        doc.moveTo(50, startY + 25)
           .lineTo(doc.page.width - 50, startY + 25)
           .lineWidth(0.5)
           .stroke(isEvenDay ? '#93c5fd' : '#e5e7eb') // Blue for even days, light gray for odd
           .moveDown(0.5);

        if (dailyPlan) {
          // Add colored rectangle for topic
          const topicY = doc.y;
          doc.rect(50, topicY, doc.page.width - 100, 25)
             .fill('#e0f2fe'); // Light blue background for topic
          
          // Add topic with better formatting - check for valid topic content
          const safeTopic = dailyPlan.topic && !dailyPlan.topic.includes('[plugin:runtime-error-plugin]') 
            ? dailyPlan.topic 
            : 'No topic specified';
            
          doc.fillColor('#0f172a') // Dark text for contrast
             .fontSize(14)
             .font('Helvetica-Bold')
             .text('Topic:', 60, topicY + 5, { continued: true })
             .font('Helvetica')
             .text(` ${safeTopic}`, { 
               continued: false,
               width: doc.page.width - 120 // Constrain width to prevent overflow
             })
             .moveDown(0.7);

          // Add other details with better spacing and formatting
          // Check for valid content (not error messages)
          const isValidContent = (content: string | null | undefined) => {
            if (!content) return false;
            // Skip content that contains error messages
            if (content.includes('[plugin:runtime-error-plugin]')) return false;
            return true;
          };
          
          if (isValidContent(dailyPlan.booksAndPages)) {
            const bgY = doc.y;
            doc.rect(70, bgY, doc.page.width - 140, 20).fill('#f8fafc'); // Very light gray background
            
            doc.fillColor('#334155') // Darker text
               .fontSize(12)
               .font('Helvetica-Bold')
               .text('Books & Pages:', 80, bgY + 4, { continued: true })
               .font('Helvetica')
               .text(` ${dailyPlan.booksAndPages}`, { 
                 continued: false,
                 width: doc.page.width - 160 // Constrain width to prevent overflow
               })
               .moveDown(0.5);
          }

          if (isValidContent(dailyPlan.homework)) {
            const bgY = doc.y;
            doc.rect(70, bgY, doc.page.width - 140, 20).fill('#f0fdf4'); // Very light green background
            
            doc.fillColor('#166534') // Dark green text
               .fontSize(12)
               .font('Helvetica-Bold')
               .text('Homework:', 80, bgY + 4, { continued: true })
               .font('Helvetica')
               .text(` ${dailyPlan.homework}`, { 
                 continued: false,
                 width: doc.page.width - 160 // Constrain width to prevent overflow
               })
               .moveDown(0.3);

            if (dailyPlan.homeworkDueDate) {
              doc.fontSize(10)
                 .font('Helvetica-Bold')
                 .fillColor('#166534') // Match homework text color
                 .text('Due:', 100, doc.y, { continued: true })
                 .font('Helvetica')
                 .text(` ${new Date(dailyPlan.homeworkDueDate).toLocaleDateString()}`, { 
                   continued: false,
                   width: doc.page.width - 200 // Constrain width to prevent overflow
                 })
                 .moveDown(0.5);
            } else {
              doc.moveDown(0.2);
            }
          }

          if (isValidContent(dailyPlan.assignments)) {
            const bgY = doc.y;
            doc.rect(70, bgY, doc.page.width - 140, 20).fill('#f9fafb'); // Light gray background
            
            doc.fillColor('#374151') // Dark gray text
               .fontSize(12)
               .font('Helvetica-Bold')
               .text('Assignments:', 80, bgY + 4, { continued: true })
               .font('Helvetica')
               .text(` ${dailyPlan.assignments}`, { 
                 continued: false,
                 width: doc.page.width - 160 // Constrain width to prevent overflow
               })
               .moveDown(0.5);
          }

          if (isValidContent(dailyPlan.notes)) {
            const bgY = doc.y;
            doc.rect(70, bgY, doc.page.width - 140, 20).fill('#fff7ed'); // Light orange background
            
            doc.fillColor('#9a3412') // Dark orange/brown text
               .fontSize(12)
               .font('Helvetica-Bold')
               .text('Notes:', 80, bgY + 4, { continued: true })
               .font('Helvetica')
               .text(` ${dailyPlan.notes}`, { 
                 continued: false,
                 width: doc.page.width - 160 // Constrain width to prevent overflow
               })
               .moveDown(0.5);
          }
        } else {
          // No plan - add a subtle note with italics
          doc.fillColor('#94a3b8') // Muted gray text
             .fontSize(12)
             .font('Helvetica-Oblique')
             .text('No plan created for this day.', 70, doc.y, { continued: false })
             .moveDown(0.5);
        }

        doc.moveDown(1);
      });

      // Add footer with styled background
      const footerY = doc.page.height - 50;
      
      // Footer background
      doc.rect(0, footerY - 10, doc.page.width, 60)
         .fill('#f8fafc');
      
      // Blue line at the bottom of the footer
      doc.rect(0, doc.page.height - 10, doc.page.width, 10)
         .fill('#3b82f6');
      
      // Footer text with width constraints to prevent errors
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#334155')
         .text(`Generated on ${new Date().toLocaleString()}`, 50, footerY, { 
           align: 'center',
           width: doc.page.width - 100 // Constrain width
         })
         .font('Helvetica-Bold')
         .fillColor('#1e40af')
         .text('Weekly Planner System for Schools', 50, footerY + 15, { 
           align: 'center',
           width: doc.page.width - 100 // Constrain width
         });
      
      // Add page number with width constraint
      doc.font('Helvetica')
         .fillColor('#475569')
         .fontSize(9)
         .text(`Page ${pageNumber}`, doc.page.width - 150, footerY + 15, { 
           align: 'right',
           width: 80 // Constrain width for page number
         });

      // Finalize the PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
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