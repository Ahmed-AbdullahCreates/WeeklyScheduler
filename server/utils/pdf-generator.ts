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

      // Create a buffer to store the PDF
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Add the header/title
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text(`Weekly Lesson Plan`, { align: 'center' })
         .moveDown(0.5);

      // Add metadata
      doc.fontSize(12)
         .font('Helvetica')
         .text(`Teacher: ${teacherName}`, { continued: false })
         .text(`Grade: ${gradeName}`, { continued: false })
         .text(`Subject: ${subjectName}`, { continued: false })
         .text(`Week: ${weekNumber} (${weekYear})`, { continued: false })
         .text(`Start Date: ${new Date(startDate).toLocaleDateString()}`, { continued: false })
         .moveDown(1);

      // Add a horizontal line
      doc.moveTo(50, doc.y)
         .lineTo(doc.page.width - 50, doc.y)
         .stroke()
         .moveDown(1);

      // Define weekdays
      const weekdays = [1, 2, 3, 4, 5]; // Monday to Friday

      // Add plan for each day
      weekdays.forEach(dayNumber => {
        const dayName = mapDayNumberToName(dayNumber);
        const dailyPlan = getDailyPlanByDayNumber(weeklyPlanData.dailyPlans, dayNumber);

        // Add day heading
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text(`${dayName}`, { continued: false })
           .moveDown(0.5);

        if (dailyPlan) {
          // Add plan details
          doc.fontSize(12)
             .font('Helvetica-Bold')
             .text('Topic:', { continued: true })
             .font('Helvetica')
             .text(` ${dailyPlan.topic}`, { continued: false })
             .moveDown(0.2);

          if (dailyPlan.booksAndPages) {
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .text('Books & Pages:', { continued: true })
               .font('Helvetica')
               .text(` ${dailyPlan.booksAndPages}`, { continued: false })
               .moveDown(0.2);
          }

          if (dailyPlan.homework) {
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .text('Homework:', { continued: true })
               .font('Helvetica')
               .text(` ${dailyPlan.homework}`, { continued: false })
               .moveDown(0.2);
          }

          if (dailyPlan.homeworkDueDate) {
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .text('Homework Due Date:', { continued: true })
               .font('Helvetica')
               .text(` ${new Date(dailyPlan.homeworkDueDate).toLocaleDateString()}`, { continued: false })
               .moveDown(0.2);
          }

          if (dailyPlan.assignments) {
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .text('Assignments:', { continued: true })
               .font('Helvetica')
               .text(` ${dailyPlan.assignments}`, { continued: false })
               .moveDown(0.2);
          }

          if (dailyPlan.notes) {
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .text('Notes:', { continued: true })
               .font('Helvetica')
               .text(` ${dailyPlan.notes}`, { continued: false })
               .moveDown(0.2);
          }
        } else {
          doc.fontSize(12)
             .font('Helvetica')
             .text('No plan created for this day.', { continued: false })
             .moveDown(0.2);
        }

        doc.moveDown(1);
      });

      // Add footer
      doc.fontSize(10)
         .font('Helvetica')
         .text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' })
         .text('Weekly Planner System for Schools', { align: 'center' });

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