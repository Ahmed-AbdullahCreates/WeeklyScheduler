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
    if (!date) return 'N/A';
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

// Generate a professional, well-structured PDF for a weekly plan
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
      // Create the PDF document with better default settings
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 60, bottom: 60, left: 60, right: 60 },
        bufferPages: true, // Enable page buffering for footer
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

      // Define consistent colors
      const colors = {
        primary: '#2563eb',    // Blue
        secondary: '#059669',  // Green
        accent: '#7c3aed',     // Purple
        gray: '#6b7280',
        lightGray: '#f3f4f6',
        darkGray: '#1f2937',
        white: '#ffffff',
        borderColor: '#d1d5db',
        headerBg: '#e0f2fe'    // Light blue background
      };

      // Constants for layout
      const pageWidth = doc.page.width - 120; // Full content width
      const leftMargin = 60;                 // Left margin
      const rightMargin = doc.page.width - 60; // Right margin
      
      // Helper for drawing section headers
      const drawSectionHeader = (title: string, color: string, y: number) => {
        // Background
        doc.rect(leftMargin, y, pageWidth, 30)
          .fillColor(color)
          .fill();
          
        // Title text
        doc.fillColor(colors.white)
          .fontSize(14)
          .font('Helvetica-Bold')
          .text(title, leftMargin + 10, y + 8, { width: pageWidth - 20 });
          
        return y + 30;
      };

      // Helper to draw a field with label and value
      const drawField = (label: string, value: string, x: number, y: number, width: number) => {
        doc.fontSize(11)
          .font('Helvetica-Bold')
          .fillColor(colors.darkGray)
          .text(label, x, y);
          
        doc.font('Helvetica')
          .text(value || 'N/A', x, doc.y + 2, { width: width });
          
        return doc.y;
      };

      // ===== DOCUMENT HEADER =====
      doc.rect(leftMargin, 60, pageWidth, 50)
        .fillColor(colors.headerBg)
        .fill();
        
      doc.fontSize(22)
        .font('Helvetica-Bold')
        .fillColor(colors.primary)
        .text('Weekly Lesson Plan', leftMargin + (pageWidth/2), 70, {
          width: pageWidth,
          align: 'center'
        });
        
      doc.fontSize(14)
        .fillColor(colors.darkGray)
        .text(`${gradeName} - ${subjectName} - Week ${weekNumber} (${weekYear})`, 
              leftMargin + (pageWidth/2), 95, {
          width: pageWidth,
          align: 'center'
        });
      
      // ===== INFO SECTION =====
      // Info box background
      const infoBoxY = 130;
      const infoBoxHeight = 100;
      
      doc.rect(leftMargin, infoBoxY, pageWidth, infoBoxHeight)
        .fillColor(colors.lightGray)
        .fillOpacity(0.5)
        .fill()
        .fillOpacity(1) // Reset opacity
        .lineWidth(1)
        .strokeColor(colors.borderColor)
        .stroke();

      // Left column
      const colWidth = pageWidth / 2 - 10;
      drawField('Teacher:', teacherName, leftMargin + 15, infoBoxY + 15, colWidth - 15);
      drawField('Grade:', gradeName, leftMargin + 15, infoBoxY + 40, colWidth - 15);
      drawField('Subject:', subjectName, leftMargin + 15, infoBoxY + 65, colWidth - 15);
      
      // Right column
      drawField('Week Number:', `Week ${weekNumber} (${weekYear})`, leftMargin + colWidth + 25, infoBoxY + 15, colWidth - 25);
      drawField('Date Range:', formatDateRange(startDate), leftMargin + colWidth + 25, infoBoxY + 40, colWidth - 25);
      drawField('Generated:', formatDate(new Date().toString()), leftMargin + colWidth + 25, infoBoxY + 65, colWidth - 25);
      
      // Starting Y position for daily plans
      let currentY = infoBoxY + infoBoxHeight + 20;

      // ===== DAILY PLANS =====
      const weekdays = [1, 2, 3, 4, 5]; // Monday to Friday
      
      weekdays.forEach((dayNumber, index) => {
        const dayName = getDayName(dayNumber);
        const dailyPlan = getDailyPlanByDayNumber(weeklyPlanData.dailyPlans, dayNumber);
        
        // Check if we need to add a page break
        if (currentY > doc.page.height - 250) {
          doc.addPage();
          currentY = 60; // Reset Y position on new page
        }
        
        // Day header
        currentY = drawSectionHeader(dayName, colors.primary, currentY);
        
        if (dailyPlan) {
          // Content box height depends on content
          const contentBoxHeight = dailyPlan.notes ? 200 : 160;
          
          // Content background with border
          doc.rect(leftMargin, currentY, pageWidth, contentBoxHeight)
            .fillColor(colors.white)
            .fill()
            .lineWidth(1)
            .strokeColor(colors.borderColor)
            .stroke();
          
          // Topic (full width)
          const topicY = currentY + 10;
          doc.fontSize(12)
            .font('Helvetica-Bold')
            .fillColor(colors.primary)
            .text('Topic:', leftMargin + 15, topicY);
            
          doc.font('Helvetica')
            .fillColor(colors.darkGray)
            .text(dailyPlan.topic || 'No topic specified', leftMargin + 70, topicY, { 
              width: pageWidth - 85 
            });
          
          // Divider line after topic
          const dividerY = topicY + 25;
          doc.moveTo(leftMargin + 15, dividerY)
            .lineTo(rightMargin - 15, dividerY)
            .strokeColor(colors.lightGray)
            .stroke();
            
          // Starting position for the details grid
          const gridY = dividerY + 15;
          
          // Two columns for details
          const colWidth = (pageWidth - 30) / 2;
          const leftColX = leftMargin + 15;
          const rightColX = leftMargin + colWidth + 25;
          
          // Books and Pages (left column)
          doc.rect(leftColX, gridY, colWidth, 45)
            .fillColor(colors.white)
            .fillOpacity(0.5)
            .fill()
            .fillOpacity(1);
            
          doc.fontSize(11)
            .font('Helvetica-Bold')
            .fillColor(colors.secondary)
            .text('Books & Pages:', leftColX + 10, gridY + 10);
            
          doc.fontSize(10)
            .font('Helvetica')
            .fillColor(colors.darkGray)
            .text(dailyPlan.booksAndPages || 'N/A', leftColX + 10, gridY + 25, { 
              width: colWidth - 20,
              height: 20,
              ellipsis: true
            });
          
          // Homework (right column)
          doc.rect(rightColX, gridY, colWidth, 45)
            .fillColor(colors.white)
            .fillOpacity(0.5)
            .fill()
            .fillOpacity(1);
            
          doc.fontSize(11)
            .font('Helvetica-Bold')
            .fillColor('#ea580c') // Orange
            .text('Homework:', rightColX + 10, gridY + 10);
            
          doc.fontSize(10)
            .font('Helvetica')
            .fillColor(colors.darkGray)
            .text(dailyPlan.homework || 'None', rightColX + 10, gridY + 25, { 
              width: colWidth - 20,
              height: 20,
              ellipsis: true
            });
          
          // Second row - starts 55px below first row
          const row2Y = gridY + 55;
          
          // Assignments (left column)
          doc.rect(leftColX, row2Y, colWidth, 45)
            .fillColor(colors.white)
            .fillOpacity(0.5)
            .fill()
            .fillOpacity(1);
            
          doc.fontSize(11)
            .font('Helvetica-Bold')
            .fillColor('#3b82f6') // Blue
            .text('Assignments:', leftColX + 10, row2Y + 10);
            
          doc.fontSize(10)
            .font('Helvetica')
            .fillColor(colors.darkGray)
            .text(dailyPlan.assignments || 'None', leftColX + 10, row2Y + 25, { 
              width: colWidth - 20,
              height: 20,
              ellipsis: true
            });
          
          // Due Date (right column)
          doc.rect(rightColX, row2Y, colWidth, 45)
            .fillColor(colors.white)
            .fillOpacity(0.5)
            .fill()
            .fillOpacity(1);
            
          doc.fontSize(11)
            .font('Helvetica-Bold')
            .fillColor('#10b981') // Green
            .text('Homework Due Date:', rightColX + 10, row2Y + 10);
            
          doc.fontSize(10)
            .font('Helvetica')
            .fillColor(colors.darkGray)
            .text(
              dailyPlan.homeworkDueDate ? formatDate(dailyPlan.homeworkDueDate) : 'N/A', 
              rightColX + 10, row2Y + 25, { 
                width: colWidth - 20,
                height: 20,
                ellipsis: true
              }
            );
          
          // Notes (full width) - only if notes exist
          if (dailyPlan.notes) {
            const notesY = row2Y + 55;
            
            doc.rect(leftColX, notesY, pageWidth - 30, 45)
              .fillColor(colors.white)
              .fillOpacity(0.5)
              .fill()
              .fillOpacity(1);
              
            doc.fontSize(11)
              .font('Helvetica-Bold')
              .fillColor('#8b5cf6') // Purple
              .text('Notes:', leftColX + 10, notesY + 10);
              
            doc.fontSize(10)
              .font('Helvetica')
              .fillColor(colors.darkGray)
              .text(dailyPlan.notes, leftColX + 10, notesY + 25, { 
                width: pageWidth - 50,
                height: 20,
                ellipsis: true
              });
          }
          
          // Update Y position for next day
          currentY += contentBoxHeight + 20;
        } else {
          // Simple box for days without plans
          doc.rect(leftMargin, currentY, pageWidth, 50)
            .fillColor(colors.white)
            .fill()
            .lineWidth(1)
            .strokeColor(colors.borderColor)
            .stroke();
            
          doc.fontSize(12)
            .font('Helvetica-Italic')
            .fillColor(colors.gray)
            .text('No plan created for this day', leftMargin + (pageWidth/2), currentY + 18, {
              width: pageWidth,
              align: 'center'
            });
          
          // Update Y position for next day
          currentY += 70;
        }
      });

      // ===== WEEKLY NOTES =====
      // Only add if weekly notes exist
      if (weeklyPlanData.weeklyPlan.notes) {
        // Check if we need a new page
        if (currentY > doc.page.height - 200) {
          doc.addPage();
          currentY = 60;
        }
        
        // Notes header
        currentY = drawSectionHeader('Weekly Notes', colors.accent, currentY);
        
        // Notes background
        const notesHeight = Math.min(
          150, // Default height
          20 + doc.heightOfString(weeklyPlanData.weeklyPlan.notes, { width: pageWidth - 40 })
        );
        
        doc.rect(leftMargin, currentY, pageWidth, notesHeight)
          .fillColor(colors.white)
          .fill()
          .lineWidth(1)
          .strokeColor(colors.borderColor)
          .stroke();
        
        doc.fontSize(11)
          .font('Helvetica')
          .fillColor(colors.darkGray)
          .text(weeklyPlanData.weeklyPlan.notes, leftMargin + 20, currentY + 15, { 
            width: pageWidth - 40,
            align: 'left'
          });
      }

      // ===== FOOTER ON EACH PAGE =====
      const totalPages = doc.bufferedPageRange().count;
      
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        
        // Footer separator line
        doc.lineWidth(1)
          .moveTo(leftMargin, doc.page.height - 50)
          .lineTo(rightMargin, doc.page.height - 50)
          .stroke(colors.borderColor);
        
        // Footer text
        doc.fontSize(9)
          .font('Helvetica')
          .fillColor(colors.gray)
          .text(
            `Generated on ${formatDate(new Date())} | Weekly Planner System`,
            leftMargin, 
            doc.page.height - 35, 
            { align: 'left', width: pageWidth - 100 }
          );
          
        doc.text(
          `Page ${i + 1} of ${totalPages}`, 
          rightMargin - 100, 
          doc.page.height - 35, 
          { align: 'right', width: 100 }
        );
      }

      // Finalize the document
      doc.end();
    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(error);
    }
  });
}