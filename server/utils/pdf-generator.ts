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
      // Create a PDF document
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4',
        info: {
          Title: `Weekly Plan - ${subjectName} - ${gradeName} - Week ${weekNumber}`,
          Author: teacherName,
          Subject: `Weekly Lesson Plan for ${subjectName}`,
          Keywords: 'weekly plan, lesson plan, school',
          CreationDate: new Date(),
        }
      });
      
      // Track page number
      let pageNumber = 1;
      
      // Add event listener for new pages
      doc.on('pageAdded', () => {
        pageNumber++;
        
        // Add header with background color to new pages
        doc.rect(0, 0, doc.page.width, 50)
           .fill('#f8fafc');
           
        // Add a colored line at the top of new pages
        doc.rect(0, 0, doc.page.width, 5)
           .fill('#3b82f6');
           
        // Add small title to new pages
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor('#1e40af')
           .text(`Weekly Plan - ${gradeName} - ${subjectName}`, 50, 20, { align: 'center' });
           
        // Add footer with styled background
        const footerY = doc.page.height - 50;
        
        // Footer background
        doc.rect(0, footerY - 10, doc.page.width, 60)
           .fill('#f8fafc');
        
        // Blue line at the bottom of the footer
        doc.rect(0, doc.page.height - 10, doc.page.width, 10)
           .fill('#3b82f6');
           
        // Add page number to new pages
        doc.font('Helvetica')
           .fillColor('#475569')
           .fontSize(9)
           .text(`Page ${pageNumber}`, doc.page.width - 70, footerY + 15, { align: 'right' });
           
        // Add footer text to continuation pages
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#334155')
           .text('Weekly Planner System for Schools', 50, footerY + 15, { align: 'center' });
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

      // Add metadata with styling
      doc.fillColor('#334155') // Slate gray text
         .fontSize(14)
         .font('Helvetica-Bold')
         .text(`Teacher:`, 50, 90, { continued: true })
         .font('Helvetica')
         .text(` ${teacherName}`, { continued: false })
         
         .font('Helvetica-Bold')
         .text(`Grade:`, 50, doc.y, { continued: true })
         .font('Helvetica')
         .text(` ${gradeName}`, { continued: false })
         
         .font('Helvetica-Bold')
         .text(`Subject:`, 50, doc.y, { continued: true })
         .font('Helvetica')
         .text(` ${subjectName}`, { continued: false })
         
         .font('Helvetica-Bold')
         .text(`Week:`, 50, doc.y, { continued: true })
         .font('Helvetica')
         .text(` ${weekNumber} (${weekYear})`, { continued: false })
         
         .font('Helvetica-Bold')
         .text(`Start Date:`, 50, doc.y, { continued: true })
         .font('Helvetica')
         .text(` ${new Date(startDate).toLocaleDateString()}`, { continued: false })
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
          
          // Add topic with better formatting
          doc.fillColor('#0f172a') // Dark text for contrast
             .fontSize(14)
             .font('Helvetica-Bold')
             .text('Topic:', 60, topicY + 5, { continued: true })
             .font('Helvetica')
             .text(` ${dailyPlan.topic}`, { continued: false })
             .moveDown(0.7);

          // Add other details with better spacing and formatting
          if (dailyPlan.booksAndPages) {
            const bgY = doc.y;
            doc.rect(70, bgY, doc.page.width - 140, 20).fill('#f8fafc'); // Very light gray background
            
            doc.fillColor('#334155') // Darker text
               .fontSize(12)
               .font('Helvetica-Bold')
               .text('Books & Pages:', 80, bgY + 4, { continued: true })
               .font('Helvetica')
               .text(` ${dailyPlan.booksAndPages}`, { continued: false })
               .moveDown(0.5);
          }

          if (dailyPlan.homework) {
            const bgY = doc.y;
            doc.rect(70, bgY, doc.page.width - 140, 20).fill('#f0fdf4'); // Very light green background
            
            doc.fillColor('#166534') // Dark green text
               .fontSize(12)
               .font('Helvetica-Bold')
               .text('Homework:', 80, bgY + 4, { continued: true })
               .font('Helvetica')
               .text(` ${dailyPlan.homework}`, { continued: false })
               .moveDown(0.3);

            if (dailyPlan.homeworkDueDate) {
              doc.fontSize(10)
                 .font('Helvetica-Bold')
                 .fillColor('#166534') // Match homework text color
                 .text('Due:', 100, doc.y, { continued: true })
                 .font('Helvetica')
                 .text(` ${new Date(dailyPlan.homeworkDueDate).toLocaleDateString()}`, { continued: false })
                 .moveDown(0.5);
            } else {
              doc.moveDown(0.2);
            }
          }

          if (dailyPlan.assignments) {
            const bgY = doc.y;
            doc.rect(70, bgY, doc.page.width - 140, 20).fill('#f9fafb'); // Light gray background
            
            doc.fillColor('#374151') // Dark gray text
               .fontSize(12)
               .font('Helvetica-Bold')
               .text('Assignments:', 80, bgY + 4, { continued: true })
               .font('Helvetica')
               .text(` ${dailyPlan.assignments}`, { continued: false })
               .moveDown(0.5);
          }

          if (dailyPlan.notes) {
            const bgY = doc.y;
            doc.rect(70, bgY, doc.page.width - 140, 20).fill('#fff7ed'); // Light orange background
            
            doc.fillColor('#9a3412') // Dark orange/brown text
               .fontSize(12)
               .font('Helvetica-Bold')
               .text('Notes:', 80, bgY + 4, { continued: true })
               .font('Helvetica')
               .text(` ${dailyPlan.notes}`, { continued: false })
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
      
      // Footer text
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#334155')
         .text(`Generated on ${new Date().toLocaleString()}`, 50, footerY, { align: 'center' })
         .font('Helvetica-Bold')
         .fillColor('#1e40af')
         .text('Weekly Planner System for Schools', 50, footerY + 15, { align: 'center' });
      
      // Add page number
      doc.font('Helvetica')
         .fillColor('#475569')
         .fontSize(9)
         .text(`Page ${pageNumber}`, doc.page.width - 70, footerY + 15, { align: 'right' });

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