import PDFDocument from 'pdfkit';
import { WeeklyPlanComplete, DailyPlan, DailyPlanData } from '@shared/schema';

// Helper functions 
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

function formatDateRange(startDate: string): string {
  try {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 4); // Add 4 days to make it a 5-day week
    
    return `${formatDate(start)} - ${formatDate(end)}`;
  } catch (e) {
    return 'Invalid date range';
  }
}

function getDayName(dayNumber: number): string {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  return days[dayNumber - 1] || '';
}

// Generate a clean, structured PDF for a weekly plan
export function generateSimplePDF(
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
      // Create the PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `Weekly Lesson Plan - ${gradeName} - ${subjectName} - Week ${weekNumber}`,
          Author: teacherName,
          Subject: 'Weekly Lesson Plan',
          Creator: 'Weekly Planner System',
        }
      });

      // Create a buffer to collect PDF data
      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Basic colors
      const colors = {
        primary: '#2563eb',    // Blue
        secondary: '#059669',  // Green
        accent: '#7c3aed',     // Purple
        gray: '#6b7280',
        lightGray: '#f3f4f6',
        darkGray: '#1f2937',
        white: '#ffffff',
        borderColor: '#d1d5db'
      };

      // Helper for colored sections
      const drawColoredSection = (title: string, color: string, y: number) => {
        // Box background
        doc.rect(50, y, doc.page.width - 100, 30)
          .fillColor(color)
          .fill();
          
        // Title
        doc.fillColor(colors.white)
          .fontSize(14)
          .font('Helvetica-Bold')
          .text(title, 60, y + 8);
          
        return y + 30;
      };

      // Header
      doc.fontSize(24)
        .font('Helvetica-Bold')
        .fillColor(colors.primary)
        .text('Weekly Lesson Plan', { align: 'center' })
        .moveDown(0.5);

      doc.fontSize(16)
        .fillColor(colors.darkGray)
        .text(`${gradeName} - ${subjectName}`, { align: 'center' })
        .text(`Week ${weekNumber} (${weekYear})`, { align: 'center' })
        .moveDown(0.5);

      // Info section
      doc.rect(50, doc.y, doc.page.width - 100, 100)
        .fillColor(colors.lightGray)
        .fillOpacity(0.5)
        .fill()
        .fillOpacity(1);

      doc.fillColor(colors.darkGray);
      
      // Left column
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('Teacher:', 70, doc.y - 90)
        .font('Helvetica')
        .text(teacherName, 200, doc.y - 12)
        .moveDown(0.5);
        
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('Grade:', 70, doc.y - 12)
        .font('Helvetica')
        .text(gradeName, 200, doc.y - 12)
        .moveDown(0.5);
      
      // Right column
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('Week Period:', 70, doc.y - 12)
        .font('Helvetica')
        .text(formatDateRange(startDate), 200, doc.y - 12)
        .moveDown(0.5);
        
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('Subject:', 70, doc.y - 12)
        .font('Helvetica')
        .text(subjectName, 200, doc.y - 12)
        .moveDown(1.5);

      // Daily plans
      const weekdays = [1, 2, 3, 4, 5]; // Monday to Friday
      
      weekdays.forEach((dayNumber, index) => {
        const dayName = getDayName(dayNumber);
        const dailyPlan = getDailyPlanByDayNumber(weeklyPlanData.dailyPlans, dayNumber);
        
        // Day heading
        let yPos = drawColoredSection(dayName, colors.primary, doc.y);
        
        if (dailyPlan) {
          // Content background
          doc.rect(50, yPos, doc.page.width - 100, 160)
            .lineWidth(1)
            .fillColor(colors.white)
            .fillAndStroke(colors.white, colors.borderColor);
            
          // Topic
          doc.fillColor(colors.darkGray)
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('Topic:', 70, yPos + 10)
            .font('Helvetica')
            .fillColor(colors.darkGray)
            .text(dailyPlan.topic || 'No topic specified', 150, doc.y - 12)
            .moveDown(0.5);
          
          // Two columns for details
          const colWidth = (doc.page.width - 180) / 2;
          const leftCol = 70;
          const rightCol = leftCol + colWidth + 60;
          
          // Books and Pages
          doc.fontSize(11)
            .font('Helvetica-Bold')
            .text('Books & Pages:', leftCol, doc.y)
            .font('Helvetica')
            .text(dailyPlan.booksAndPages || 'N/A', leftCol, doc.y + 16, { width: colWidth })
            .moveDown(0.8);
            
          // Homework (right column)
          doc.fontSize(11)
            .font('Helvetica-Bold')
            .text('Homework:', rightCol, doc.y - 32)
            .font('Helvetica')
            .text(dailyPlan.homework || 'None', rightCol, doc.y - 16, { width: colWidth })
            .moveDown(0.5);
          
          // Position for the next row
          const nextRowY = doc.y;
          
          // Assignments (left column)
          doc.fontSize(11)
            .font('Helvetica-Bold')
            .text('Assignments:', leftCol, nextRowY)
            .font('Helvetica')
            .text(dailyPlan.assignments || 'None', leftCol, doc.y + 16, { width: colWidth })
            .moveDown(0.8);
            
          // Due Date (right column)
          doc.fontSize(11)
            .font('Helvetica-Bold')
            .text('Homework Due Date:', rightCol, nextRowY)
            .font('Helvetica')
            .text(dailyPlan.homeworkDueDate ? formatDate(dailyPlan.homeworkDueDate) : 'N/A', 
                  rightCol, doc.y - 16, { width: colWidth })
            .moveDown(0.5);
          
          // Notes (full width)
          doc.fontSize(11)
            .font('Helvetica-Bold')
            .text('Notes:', 70, doc.y + 10)
            .font('Helvetica')
            .text(dailyPlan.notes || 'No additional notes', 70, doc.y + 16, 
                  { width: doc.page.width - 140 })
            .moveDown(1);
            
          // Adjust y position for next day
          doc.y = yPos + 170; 
        } else {
          // Empty day message
          doc.rect(50, yPos, doc.page.width - 100, 40)
            .lineWidth(1)
            .fillColor(colors.white)
            .fillAndStroke(colors.white, colors.borderColor);
            
          doc.fillColor(colors.gray)
            .fontSize(12)
            .font('Helvetica-Italic')
            .text('No plan created for this day', 70, yPos + 15)
            .moveDown(0.5);
            
          // Adjust y position for next day
          doc.y = yPos + 50;
        }
        
        // Page break if needed (except for the last day)
        if (doc.y > doc.page.height - 180 && index < weekdays.length - 1) {
          doc.addPage();
        }
      });

      // Add Weekly Notes if present
      if (weeklyPlanData.weeklyPlan.notes) {
        // Check if we need a new page
        if (doc.y > doc.page.height - 150) {
          doc.addPage();
        }
        
        // Weekly notes section
        drawColoredSection('Weekly Notes', colors.accent, doc.y);
        
        // Notes content
        doc.rect(50, doc.y, doc.page.width - 100, 100)
          .lineWidth(1)
          .fillColor(colors.white)
          .fillAndStroke(colors.white, colors.borderColor);
        
        doc.fillColor(colors.darkGray)
          .fontSize(11)
          .font('Helvetica')
          .text(weeklyPlanData.weeklyPlan.notes, 70, doc.y + 15, { width: doc.page.width - 140 });
      }

      // Footer on each page
      const totalPages = doc.bufferedPageRange().count;
      let i = 0;
      while (i < totalPages) {
        doc.switchToPage(i);
        
        // Footer separator line
        doc.lineWidth(1)
          .moveTo(50, doc.page.height - 50)
          .lineTo(doc.page.width - 50, doc.page.height - 50)
          .stroke(colors.borderColor);
        
        // Footer text
        doc.fontSize(8)
          .font('Helvetica')
          .fillColor(colors.gray)
          .text(
            `Generated on ${new Date().toLocaleDateString()} | Weekly Planner System`,
            50, 
            doc.page.height - 30, 
            { align: 'left', width: 300 }
          )
          .text(
            `Page ${i + 1} of ${totalPages}`, 
            doc.page.width - 150, 
            doc.page.height - 30, 
            { align: 'right', width: 100 }
          );
        
        i++;
      }

      // Finalize document
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}