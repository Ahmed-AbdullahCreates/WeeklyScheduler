import PDFDocument from 'pdfkit';
import { WeeklyPlanComplete, DailyPlan, DailyPlanData } from '@shared/schema';

// Helper functions
function getDailyPlanByDayNumber(dailyPlans: DailyPlanData, dayNumber: number): DailyPlan | undefined {
  return dailyPlans[dayNumber.toString()];
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function formatDateRange(startDate: string): string {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 4);
  
  return `${formatDate(start)} to ${formatDate(end)}`;
}

function mapDayNumberToName(dayNumber: number): string {
  const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[dayNumber] || '';
}

// Function to generate PDF with modern design
export function generateModernPDF(
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
      // Create PDF document
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4',
        bufferPages: true,
        autoFirstPage: true,
      });

      // Store PDF chunks
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Define theme colors
      const colors = {
        primary: '#0284c7',      // Sky blue
        secondary: '#14b8a6',    // Teal
        dark: '#1e293b',         // Slate dark
        medium: '#64748b',       // Slate medium
        light: '#f1f5f9',        // Slate light
        accent: '#f59e0b',       // Amber
      };

      // Add cover page
      doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.light);
      
      // Color banner at top
      doc.rect(0, 0, doc.page.width, 180).fill(colors.primary);
      
      // Title text
      doc.fontSize(28)
         .font('Helvetica-Bold')
         .fillColor('white')
         .text('WEEKLY LESSON PLAN', 0, 70, { align: 'center' })
         .fontSize(18)
         .text(`${subjectName} - ${gradeName}`, 0, 110, { align: 'center' })
         .fontSize(16)
         .text(`Week ${weekNumber} - ${weekYear}`, 0, 140, { align: 'center' });
      
      // White info box
      const infoBoxY = 220;
      doc.roundedRect(50, infoBoxY, doc.page.width - 100, 150, 8)
         .fill('white')
         .shadow('rgba(0, 0, 0, 0.2)', 5, 5, 10);
      
      // Info box content
      doc.fillColor(colors.dark)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('Teacher:', 70, infoBoxY + 25)
         .font('Helvetica')
         .text(teacherName, 160, infoBoxY + 25)
         
         .font('Helvetica-Bold')
         .text('Date Range:', 70, infoBoxY + 55)
         .font('Helvetica')
         .text(formatDateRange(startDate), 160, infoBoxY + 55)
         
         .font('Helvetica-Bold')
         .text('Week Number:', 70, infoBoxY + 85)
         .font('Helvetica')
         .text(`${weekNumber} (${weekYear})`, 160, infoBoxY + 85)
         
         .font('Helvetica-Bold')
         .text('Document ID:', 70, infoBoxY + 115)
         .font('Helvetica')
         .text(`WP-${weeklyPlanData.weeklyPlan.id}-${weekNumber}-${weekYear}`, 160, infoBoxY + 115);
      
      // Add additional pages with content
      // (Similar to enhanced-pdf-generator but with updated styling)
      
      // Add footer to all pages
      // ...
      
      // Finalize the document
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
