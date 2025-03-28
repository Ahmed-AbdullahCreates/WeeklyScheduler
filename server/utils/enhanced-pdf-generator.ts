import PDFDocument from 'pdfkit';
import { WeeklyPlanComplete, WeeklyPlanWithDetails, Grade, Subject, User, PlanningWeek, DailyPlan, DailyPlanData } from '@shared/schema';
import { mapDayNumberToName } from '../../client/src/lib/utils';

// Helper functions for PDF generation
// Get daily plan by day number
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
  
  if (plan.booksAndPages) height += 30;
  if (plan.homework) height += 30;
  if (plan.assignments) height += 30;
  if (plan.homeworkDueDate) height += 30;
  
  // Notes can be longer so allocate more space
  if (plan.notes) {
    const estimatedLines = Math.ceil(plan.notes.length / 50); // Rough estimate: 50 chars per line
    height += 25 + (estimatedLines * 15);
  }
  
  return height + 30; // Add padding
}

// Generate PDF for a weekly plan with enhanced formatting
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
        size: 'A4',  // You can change to 'letter' for US Letter size
        bufferPages: true, // Enable page buffering for footer/header control
        autoFirstPage: true,
        info: {
          Title: `Weekly Plan - ${subjectName} - ${gradeName} - Week ${weekNumber}`,
          Author: teacherName,
          Subject: `Weekly Lesson Plan for ${subjectName}`,
          Keywords: 'weekly plan, lesson plan, school, education, curriculum, teaching, learning objectives',
          CreationDate: new Date(),
        }
      });

      // Array to store PDF data chunks
      const chunks: Buffer[] = [];
      
      // Setup document event handlers
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Define color theme (customizable for different subjects)
      const getSubjectColor = (subject: string): string => {
        const subjectColors: Record<string, string> = {
          'mathematics': '#3b82f6', // Blue
          'science': '#10b981',     // Green
          'english': '#8b5cf6',     // Purple
          'history': '#f97316',     // Orange
          'geography': '#0ea5e9',   // Sky blue
          'art': '#ec4899',         // Pink
          'music': '#f43f5e',       // Rose
          'physical education': '#84cc16', // Lime
          'computer science': '#06b6d4', // Cyan - Added
          'social studies': '#ea580c', // Orange red - Added
        }; Find the closest matching subject or default to blue
        const normalizedSubject = subject.toLowerCase();
        // Find the closest matching subject or default to blue)) {
        const normalizedSubject = subject.toLowerCase();ludes(normalizedSubject)) {
            return color;color] of Object.entries(subjectColors)) {
          }f (normalizedSubject.includes(key) || key.includes(normalizedSubject)) {
        }   return color;
        return '#3b82f6'; // Default blue
      };}
        return '#3b82f6'; // Default blue
      // Dynamic color theme based on subject
      const primaryColor = getSubjectColor(subjectName);
      const secondaryColor = '#10b981'; // Green
      const accentColor = '#8b5cf6';    // PurpletName);
      const gray = '#6b7280';'#10b981'; // Green
      const lightGray = '#f3f4f6';';    // Purple
      const darkGray = '#374151';
      const lightGray = '#f3f4f6';
      // Create a helper function to add footers
      const addFooter = (doc: PDFKit.PDFDocument, pageNumber: number) => {
        const totalPages = doc.bufferedPageRange().count; outside the block to avoid TypeScript block-scoped errors)
        nst addFooter = (doc: PDFKit.PDFDocument, pageNumber: number) => {
        doc.switchToPage(pageNumber);edPageRange().count;
        
        // Skip footer on cover page;
        if (pageNumber === 0) return;
        // Skip footer on cover page
        // Footer line === 0) return;
        doc.moveTo(40, doc.page.height - 50)
           .lineTo(doc.page.width - 40, doc.page.height - 50)
           .strokeColor('#e5e7eb')ight - 50)
           .stroke();c.page.width - 40, doc.page.height - 50)
           .strokeColor('#e5e7eb')
        // Footer text - Customize with your school/organization name
        doc.fontSize(8)
           .font('Helvetica')
           .fillColor('#9ca3af')
           .text('Helvetica')
              `${gradeName} - ${subjectName} - Week ${weekNumber}`,
              40,
              doc.page.height - 40,jectName} - Week ${weekNumber}`,
              { align: 'left', width: 200 }
           )  doc.page.height - 40,
           .text(lign: 'left', width: 200 }
              'Your School Name - Weekly Planner System', // Customize this text
              doc.page.width / 2 - 100,
              doc.page.height - 40,m for Schools',
              { align: 'center', width: 200 }
           )  doc.page.height - 40,
           .text(lign: 'center', width: 200 }
              `Page ${pageNumber + 1} of ${totalPages}`,
              doc.page.width - 40 - 100,
              doc.page.height - 40,1} of ${totalPages}`,
              { align: 'right', width: 100 }
           ); doc.page.height - 40,
      };      { align: 'right', width: 100 }
           );
      // Create a helper for checklist items
      const addChecklistItem = (label: string, isIncluded: boolean) => {
        const checkChar = isIncluded ? '✓' : '✗';
        const color = isIncluded ? secondaryColor : '#d1d5db';lean) => {
        const checkChar = isIncluded ? '✓' : '✗';
        doc.fontSize(10)Included ? secondaryColor : '#d1d5db';
           .font('Helvetica-Bold')
           .fillColor(color)
           .text(checkChar, 50, doc.y, { continued: true, width: 15 })
           .font('Helvetica')
           .fillColor(darkGray) doc.y, { continued: true, width: 15 })
           .text(`  ${label}`, { continued: false })
           .moveDown(0.3);Gray)
      };   .text(`  ${label}`, { continued: false })
           .moveDown(0.3);
      // Add a cover page
      // Cover page background
      doc.rect(0, 0, doc.page.width, doc.page.height)
         .fillColor(lightGray)
         .fill(); 0, doc.page.width, doc.page.height)
         .fillColor(lightGray)
      // Gradient top bar
      const gradientHeight = 200;
      doc.rect(0, 0, doc.page.width, gradientHeight)
         .fillColor(primaryColor)
         .fill(); 0, doc.page.width, gradientHeight)
         .fillColor(primaryColor)
      // School logo placeholder (white circle with border)
      const logoX = doc.page.width / 2;
      const logoY = 140;ceholder (white circle with border)
      const logoSize = 80;ge.width / 2;
      const logoY = 140;
      doc.circle(logoX, logoY, logoSize/2)
         .fillAndStroke('white', primaryColor);
      doc.circle(logoX, logoY, logoSize/2)
      // School nameoke('white', primaryColor);
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor('white')
         .text('WEEKLY PLANNER SYSTEM', 0, 80, { align: 'center' });
         .fillColor('white')
      // Title with large font SYSTEM', 0, 80, { align: 'center' });
      doc.fontSize(36)
         .font('Helvetica-Bold')
         .fillColor('white')
         .text('WEEKLY LESSON PLAN', 0, 250, { align: 'center' })
         .moveDown(0.5);te')
         .text('WEEKLY LESSON PLAN', 0, 250, { align: 'center' })
      // Subject and grade with medium font
      doc.fontSize(24)
         .font('Helvetica')with medium font
         .fillColor(darkGray)
         .text(`${subjectName}`, 0, 320, { align: 'center' });
         .fillColor(darkGray)
      doc.fontSize(20)ectName}`, 0, 320, { align: 'center' });
         .fillColor(darkGray)
         .text(`${gradeName}`, { align: 'center' })
         .moveDown(0.3);Gray)
         .text(`${gradeName}`, { align: 'center' })
      // Week information
      doc.fontSize(18)
         .font('Helvetica-Bold')
         .fillColor(primaryColor)
         .text(`Week ${weekNumber} - ${weekYear}`, { align: 'center' })
         .moveDown(0.2);aryColor)
         .text(`Week ${weekNumber} - ${weekYear}`, { align: 'center' })
      doc.fontSize(14));
         .font('Helvetica')
         .fillColor(darkGray)
         .text(`${formatDateRange(startDate)}`, { align: 'center' })
         .moveDown(2);rkGray)
         .text(`${formatDateRange(startDate)}`, { align: 'center' })
      // Teacher information box
      const boxWidth = 300;
      const boxX = (doc.page.width - boxWidth) / 2;
      const boxY = 480;300;
      const boxX = (doc.page.width - boxWidth) / 2;
      doc.roundedRect(boxX, boxY, boxWidth, 60, 5)
         .fillAndStroke('#f9fafb', '#e5e7eb');
         .roundedRect(boxX, boxY, boxWidth, 60, 5)
      doc.fontSize(12)e('#f9fafb', '#e5e7eb');
         .font('Helvetica-Bold')
         .fillColor(darkGray)
         .text('Teacher:', boxX + 20, boxY + 15, { continued: true })
         .font('Helvetica')y)
         .fillColor(gray), boxX + 20, boxY + 15, { continued: true })
         .text(` ${teacherName}`, { continued: false });
         .fillColor(gray)
      doc.fontSize(12)cherName}`, { continued: false });
         .font('Helvetica-Bold')
         .fillColor(darkGray)
         .text('Document ID:', boxX + 20, boxY + 35, { continued: true })
         .font('Helvetica')y)
         .fillColor(gray)ID:', boxX + 20, boxY + 35, { continued: true })
         .text(` WP-${weeklyPlanData.weeklyPlan.id}-${weekNumber}-${weekYear}`, { continued: false });
         .fillColor(gray)
      // Legal footer{weeklyPlanData.weeklyPlan.id}-${weekNumber}-${weekYear}`, { continued: false });
      doc.fontSize(8)
         .font('Helvetica')
         .fillColor(gray)
         .text('This document contains confidential information and is intended for educational purposes only.', 0, 700, { align: 'center' })
         .text('© Weekly Planner System for Schools', { align: 'center' });
         .text('This document contains confidential information and is intended for educational purposes only.', 0, 700, { align: 'center' })
      // Add table of contents pagestem for Schools', { align: 'center' });
      doc.addPage();
      // Add table of contents page
      // Header for TOC page
      doc.rect(0, 0, doc.page.width, 60)
         .fill(lightGray);ge
         .rect(0, 0, doc.page.width, 60)
      doc.rect(0, 0, doc.page.width, 8)
         .fill(primaryColor);
      doc.rect(0, 0, doc.page.width, 8)
      doc.fontSize(18)Color);
         .font('Helvetica-Bold')
         .fillColor(primaryColor)
         .text('TABLE OF CONTENTS', 40, 25, { align: 'left' });
         .fillColor(primaryColor)
      doc.fontSize(10)OF CONTENTS', 40, 25, { align: 'left' });
         .font('Helvetica')
         .fillColor(gray)
         .text(`${gradeName} - ${subjectName} - Week ${weekNumber} (${weekYear})`, doc.page.width - 40, 25, { align: 'right' });
         .fillColor(gray)
      // TOC contentadeName} - ${subjectName} - Week ${weekNumber} (${weekYear})`, doc.page.width - 40, 25, { align: 'right' });
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor(darkGray)
         .text('Weekly Overview', 40, 80);
         .fillColor(darkGray)
      doc.fontSize(11) Overview', 40, 80);
         .font('Helvetica')
         .fillColor(gray)
         .text('At-a-glance view of the weekly plan', 60, doc.y)
         .moveDown(0.5);)
         .text('At-a-glance view of the weekly plan', 60, doc.y)
      // Define weekdays for TOC and add entries for each day
      const weekdays = [1, 2, 3, 4, 5]; // Monday to Friday
      const planCompletion: Record<number, boolean> = {}; day
      const weekdays = [1, 2, 3, 4, 5]; // Monday to Friday
      // Prep data for progress overviewr, boolean> = {};
      weekdays.forEach((day) => {
        const dailyPlan = getDailyPlanByDayNumber(weeklyPlanData.dailyPlans, day);
        planCompletion[day] = !!(dailyPlan && dailyPlan.topic);
        const dailyPlan = getDailyPlanByDayNumber(weeklyPlanData.dailyPlans, day);
        const dayName = mapDayNumberToName(day);ilyPlan.topic);
        const hasContent = !!dailyPlan;
        const topicPreview = hasContent && dailyPlan.topic ? 
          (dailyPlan.topic.length > 40 ? dailyPlan.topic.substring(0, 37) + '...' : dailyPlan.topic) : 
          'No plan for this day';ontent && dailyPlan.topic ? 
          (dailyPlan.topic.length > 40 ? dailyPlan.topic.substring(0, 37) + '...' : dailyPlan.topic) : 
        doc.fontSize(12)his day';
           .font('Helvetica-Bold')
           .fillColor(darkGray)
           .text(dayName, 40, doc.y)
           .moveUp();(darkGray)
           .text(dayName, 40, doc.y)
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(hasContent ? gray : '#d1d5db')
           .text(topicPreview, 150, doc.y)
           .moveDown(0.3);ontent ? gray : '#d1d5db')
           .text(topicPreview, 150, doc.y)
        // Draw a dot for completion status
        doc.circle(130, doc.y - 10, 4)
           .fillColor(hasContent ? secondaryColor : '#e5e7eb')
           .fill();130, doc.y - 10, 4)
      });  .fillColor(hasContent ? secondaryColor : '#e5e7eb')
           .fill();
      doc.moveDown(1);
      
      // Add checklist of included elements
      doc.fontSize(14)
         .font('Helvetica-Bold')ed elements
         .fillColor(darkGray)
         .text('Plan Elements Included', 40, doc.y)
         .moveDown(0.5);Gray)
         .text('Plan Elements Included', 40, doc.y)
      // Track which elements are present in any of the daily plans
      const hasBooks = Object.values(weeklyPlanData.dailyPlans).some(plan => !!plan && !!plan.booksAndPages);
      const hasHomework = Object.values(weeklyPlanData.dailyPlans).some(plan => !!plan && !!plan.homework);
      const hasAssignments = Object.values(weeklyPlanData.dailyPlans).some(plan => !!plan && !!plan.assignments);
      const hasDueDates = Object.values(weeklyPlanData.dailyPlans).some(plan => !!plan && !!plan.homeworkDueDate);
      const hasNotes = Object.values(weeklyPlanData.dailyPlans).some(plan => !!plan && !!plan.notes);ssignments);
      const hasDueDates = Object.values(weeklyPlanData.dailyPlans).some(plan => !!plan && !!plan.homeworkDueDate);
      addChecklistItem('Daily Topics', true); // Always includedsome(plan => !!plan && !!plan.notes);
      addChecklistItem('Books & Pages References', hasBooks);
      addChecklistItem('Homework Assignments', hasHomework);uded
      addChecklistItem('Class Assignments', hasAssignments);;
      addChecklistItem('Due Dates', hasDueDates);sHomework);
      addChecklistItem('Teaching Notes', hasNotes);gnments);
      addChecklistItem('Due Dates', hasDueDates);
      doc.moveDown(1);('Teaching Notes', hasNotes);
      
      // Special instructions or notes section
      if (weeklyPlanData.weeklyPlan.notes && weeklyPlanData.weeklyPlan.notes.trim() !== '') {
        doc.fontSize(14)tions or notes section
           .font('Helvetica-Bold')n.notes && weeklyPlanData.weeklyPlan.notes.trim() !== '') {
           .fillColor(darkGray)
           .text('Special Instructions', 40, doc.y)
           .moveDown(0.5);Gray)
           .text('Special Instructions', 40, doc.y)
        doc.fontSize(10));
           .font('Helvetica-Italic')
           .fillColor(gray)
           .text(weeklyPlanData.weeklyPlan.notes, 50, doc.y, { width: doc.page.width - 100 })
           .moveDown(1);ay)
      }    .text(weeklyPlanData.weeklyPlan.notes, 50, doc.y, { width: doc.page.width - 100 })
           .moveDown(1);
      // Add footer to TOC page
      addFooter(doc, 1);
      // Add footer to TOC page
      // Start the daily plan pages
      doc.addPage();
      // Start the daily plan pages
      // Add a professional header
      // Header background
      doc.rect(0, 0, doc.page.width, 60)
         .fill(lightGray);
      doc.rect(0, 0, doc.page.width, 60)
      // Color bar at top of document
      doc.rect(0, 0, doc.page.width, 8)
         .fill(primaryColor);document
      doc.rect(0, 0, doc.page.width, 8)
      // Title in headerlor);
      doc.fontSize(18)
         .font('Helvetica-Bold')
         .fillColor(primaryColor)
         .text('WEEKLY LESSON PLAN', 40, 25, { align: 'left' })
         .moveDown(0.5);aryColor)
         .text('WEEKLY LESSON PLAN', 40, 25, { align: 'left' })
      // Right aligned mini info
      doc.fontSize(10)
         .font('Helvetica') info
         .fillColor(gray)
         .text(`${gradeName} - ${subjectName} - Week ${weekNumber}`, doc.page.width - 40, 25, { align: 'right' });
         .fillColor(gray)
      // Document ID and meta sectionectName} - Week ${weekNumber}`, doc.page.width - 40, 25, { align: 'right' });
      doc.roundedRect(40, 80, doc.page.width - 80, 80, 5)
         .fillAndStroke('#fafafa', '#e5e7eb');
      doc.roundedRect(40, 80, doc.page.width - 80, 80, 5)
      // Meta information in table-like format
      const metaStartY = 90;
      const metaLeftCol = 60;table-like format
      const metaRightCol = doc.page.width / 2 + 20;
      const metaLeftCol = 60;
      // Left column metadatac.page.width / 2 + 20;
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor(darkGray)
         .text('Teacher:', metaLeftCol, metaStartY, { continued: true, width: 150 })
         .font('Helvetica')y)
         .fillColor(gray), metaLeftCol, metaStartY, { continued: true, width: 150 })
         .text(` ${teacherName}`, { continued: false })
         .moveDown(0.5);)
         .text(` ${teacherName}`, { continued: false })
      doc.fontSize(10));
         .font('Helvetica-Bold')
         .fillColor(darkGray)
         .text('Subject:', metaLeftCol, doc.y, { continued: true, width: 150 })
         .font('Helvetica')y)
         .fillColor(gray), metaLeftCol, doc.y, { continued: true, width: 150 })
         .text(` ${subjectName}`, { continued: false })
         .moveDown(0.5);)
         .text(` ${subjectName}`, { continued: false })
      doc.fontSize(10));
         .font('Helvetica-Bold')
         .fillColor(darkGray)
         .text('Document Generated:', metaLeftCol, doc.y, { continued: true, width: 150 })
         .font('Helvetica')y)
         .fillColor(gray)Generated:', metaLeftCol, doc.y, { continued: true, width: 150 })
         .text(` ${new Date().toLocaleString()}`, { continued: false });
         .fillColor(gray)
      // Right column metadata oLocaleString()}`, { continued: false });
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor(darkGray)
         .text('Grade:', metaRightCol, metaStartY, { continued: true, width: 150 })
         .font('Helvetica')y)
         .fillColor(gray)metaRightCol, metaStartY, { continued: true, width: 150 })
         .text(` ${gradeName}`, { continued: false })
         .moveDown(0.5);)
         .text(` ${gradeName}`, { continued: false })
      doc.fontSize(10));
         .font('Helvetica-Bold')
         .fillColor(darkGray)
         .text('Week:', metaRightCol, doc.y - 14, { continued: true, width: 150 })
         .font('Helvetica')y)
         .fillColor(gray)etaRightCol, doc.y - 14, { continued: true, width: 150 })
         .text(` ${weekNumber} (${weekYear})`, { continued: false })
         .moveDown(0.5);)
         .text(` ${weekNumber} (${weekYear})`, { continued: false })
      doc.fontSize(10));
         .font('Helvetica-Bold')
         .fillColor(darkGray)
         .text('Date Range:', metaRightCol, doc.y - 14, { continued: true, width: 150 })
         .font('Helvetica')y)
         .fillColor(gray)e:', metaRightCol, doc.y - 14, { continued: true, width: 150 })
         .text(` ${formatDateRange(startDate)}`, { continued: false });
         .fillColor(gray)
      // Start of contentDateRange(startDate)}`, { continued: false });
      doc.y = 180;
      // Start of content
      // Add completeness tracker with enhanced visualization
      doc.fontSize(14)
         .font('Helvetica-Bold')r with enhanced visualization
         .fillColor(darkGray)
         .text('Weekly Overview', { align: 'left' })
         .moveDown(0.5);Gray)
         .text('Weekly Overview', { align: 'left' })
      // Draw visual progress bar
      const barWidth = doc.page.width - 80;
      const barHeight = 25;ss bar
      const barY = doc.y;c.page.width - 80;
      const barHeight = 25;
      // Background bary;
      doc.roundedRect(40, barY, barWidth, barHeight, 3)
         .fillColor('#f3f4f6')
         .fill();Rect(40, barY, barWidth, barHeight, 3)
         .fillColor('#f3f4f6')
      // Count completed days
      const completedDays = Object.values(planCompletion).filter(Boolean).length;
      const completionPercentage = completedDays / weekdays.length;
      const completedDays = Object.values(planCompletion).filter(Boolean).length;
      // Progress fillPercentage = completedDays / weekdays.length;
      if (completedDays > 0) {
        doc.roundedRect(40, barY, barWidth * completionPercentage, barHeight, 3)
           .fillColor(secondaryColor)
           .fill();Rect(40, barY, barWidth * completionPercentage, barHeight, 3)
      }    .fillColor(secondaryColor)
           .fill();
      // Completion text
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('white')
         .text('Helvetica-Bold')
            `${completedDays} of ${weekdays.length} days planned (${Math.round(completionPercentage * 100)}%)`,
            40, barY + 5, 
            { width: barWidth, align: 'center' }th} days planned (${Math.round(completionPercentage * 100)}%)`,
         ); 40, barY + 5, 
            { width: barWidth, align: 'center' }
      // Draw day indicators beneath progress bar
      const trackerY = barY + barHeight + 15;
      const dayWidth = barWidth / 5; progress bar
      const trackerY = barY + barHeight + 15;
      weekdays.forEach((day, index) => {
        const dayName = mapDayNumberToName(day).substring(0, 3);
        const hasContent = planCompletion[day];
        const dayName = mapDayNumberToName(day).substring(0, 3);
        // Day labeltent = planCompletion[day];
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor(darkGray)
           .text(dayName, 40 + (index * dayWidth), trackerY, { width: dayWidth, align: 'center' });
           .fillColor(darkGray)
        // Status indicator0 + (index * dayWidth), trackerY, { width: dayWidth, align: 'center' });
        const circleX = 40 + (index * dayWidth) + (dayWidth / 2);
        const circleY = trackerY + 20;
        const circleX = 40 + (index * dayWidth) + (dayWidth / 2);
        doc.circle(circleX, circleY, 8)
           .fillAndStroke(hasContent ? secondaryColor : '#e5e7eb', hasContent ? secondaryColor : '#d1d5db');
        doc.circle(circleX, circleY, 8)
        if (hasContent) {(hasContent ? secondaryColor : '#e5e7eb', hasContent ? secondaryColor : '#d1d5db');
          doc.fontSize(10)
             .font('Helvetica-Bold')
             .fillColor('white')
             .text('✓', circleX - 3, circleY - 4, { align: 'center' });
        }    .fillColor('white')
      });    .text('✓', circleX - 3, circleY - 4, { align: 'center' });
        }
      // Add a horizontal line
      doc.y = trackerY + 40;
      doc.moveTo(40, doc.y)ine
         .lineTo(doc.page.width - 40, doc.y)
         .strokeColor('#e5e7eb')
         .stroke()oc.page.width - 40, doc.y)
         .moveDown(1);'#e5e7eb')
         .stroke()
      // Add plan for each day
      weekdays.forEach((dayNumber, index) => {
        const dayName = mapDayNumberToName(dayNumber);
        const dailyPlan = getDailyPlanByDayNumber(weeklyPlanData.dailyPlans, dayNumber);
        const hasContent = !!dailyPlan && !!dailyPlan.topic;
        const dailyPlan = getDailyPlanByDayNumber(weeklyPlanData.dailyPlans, dayNumber);
        // Day header with gradient backgroundilyPlan.topic;
        const dayHeaderY = doc.y;
        // Day header with gradient background
        // Add gradient-like effect
        if (hasContent) {
          // Main headerlike effect - Customize the header style here
          doc.rect(40, dayHeaderY - 5, doc.page.width - 80, 30)
             .fillColor(primaryColor)
             .fill();, dayHeaderY - 5, doc.page.width - 80, 30)
             .fillColor(primaryColor)
          // Light accent bar - Add a visual accent to the header
          doc.rect(40, dayHeaderY - 5, 8, 30)
             .fillColor(accentColor)
             .fill();, dayHeaderY - 5, 8, 30)
        } else {llColor(accentColor)
          // Gray for empty days - Customize empty day appearance here
          doc.rect(40, dayHeaderY - 5, doc.page.width - 80, 30)
             .fillColor(gray)ays
             .fill();, dayHeaderY - 5, doc.page.width - 80, 30)
        }    .fillColor(gray)
             .fill();
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor('white')
           .text(dayName, 55, dayHeaderY, { continued: false })
           .moveDown(0.5);te')
           .text(dayName, 55, dayHeaderY, { continued: false })
        if (dailyPlan && dailyPlan.topic) {
          // Section with light background for content
          const contentStartY = doc.y;ic) {
          const contentHeight = getPlanContentHeight(dailyPlan);
          const contentStartY = doc.y;
          // Content background with slight shadow effectyPlan);
          doc.rect(40, contentStartY - 5, doc.page.width - 80, contentHeight)
             .fillColor('#ffffff')th slight shadow effect
             .fill();, contentStartY - 5, doc.page.width - 80, contentHeight)
             .fillColor('#ffffff')
          // Border for content area
          doc.lineWidth(0.5)
             .rect(40, contentStartY - 5, doc.page.width - 80, contentHeight)
             .stroke('#e5e7eb');
             .rect(40, contentStartY - 5, doc.page.width - 80, contentHeight)
          // Reset position for content
          doc.y = contentStartY;
          // Reset position for content
          // Topic section with colored bar
          doc.rect(40, doc.y - 5, 8, 24)
             .fill(primaryColor);olored bar
          doc.rect(40, doc.y - 5, 8, 24)
          doc.fontSize(12)Color);
             .font('Helvetica-Bold')
             .fillColor('#111827')
             .text('Topic:', 60, doc.y, { continued: true })
             .font('Helvetica')7')
             .fillColor('#374151')oc.y, { continued: true })
             .text(` ${dailyPlan.topic}`, { continued: false })
             .moveDown(0.5);4151')
             .text(` ${dailyPlan.topic}`, { continued: false })
          // Two column layout for details
          const colWidth = (doc.page.width - 110) / 2;
          const leftColX = 60; for details
          const rightColX = leftColX + colWidth + 20;;
          let currY = doc.y;0;
          let rightColY = doc.y;ColX + colWidth + 20;
          let currY = doc.y;
          // Books & Pages (left column)
          if (dailyPlan.booksAndPages) {
            doc.rect(40, doc.y - 5, 8, 24)
               .fill(secondaryColor);) {
            doc.rect(40, doc.y - 5, 8, 24)
            doc.fontSize(11)ryColor);
               .font('Helvetica-Bold')
               .fillColor('#111827')
               .text('Books & Pages:', leftColX, currY, { continued: true, width: colWidth })
               .font('Helvetica')7')
               .fillColor('#374151')', leftColX, currY, { continued: true, width: colWidth })
               .text(` ${dailyPlan.booksAndPages}`, { continued: false, width: colWidth });
               .fillColor('#374151')
            currY = doc.y + 8;Plan.booksAndPages}`, { continued: false, width: colWidth });
          } 
            currY = doc.y + 8;
          // Homework (right column)
          if (dailyPlan.homework) {
            doc.rect(rightColX - 20, doc.y - 5, 8, 24)
               .fill(accentColor);{
            doc.rect(rightColX - 20, doc.y - 5, 8, 24)
            doc.fontSize(11)olor);
               .font('Helvetica-Bold')
               .fillColor('#111827')
               .text('Homework:', rightColX, rightColY, { continued: true, width: colWidth })
               .font('Helvetica')7')
               .fillColor('#374151')ghtColX, rightColY, { continued: true, width: colWidth })
               .text(` ${dailyPlan.homework}`, { continued: false, width: colWidth });
               .fillColor('#374151')
            rightColY = doc.y + 8;.homework}`, { continued: false, width: colWidth });
          } 
            rightColY = doc.y + 8;
          // Continue with staggered layout
          // Use the lower of the two y-positions
          doc.y = Math.max(currY, rightColY);
          currY = doc.y;er of the two y-positions
          rightColY = doc.y;urrY, rightColY);
          currY = doc.y;
          // Assignments (left column)
          if (dailyPlan.assignments) {
            doc.rect(40, doc.y - 5, 8, 24)
               .fill('#f97316'); // Orange
            doc.rect(40, doc.y - 5, 8, 24)
            doc.fontSize(11)6'); // Orange
               .font('Helvetica-Bold')
               .fillColor('#111827')
               .text('Assignments:', leftColX, currY, { continued: true, width: colWidth })
               .font('Helvetica')7')
               .fillColor('#374151') leftColX, currY, { continued: true, width: colWidth })
               .text(` ${dailyPlan.assignments}`, { continued: false, width: colWidth });
               .fillColor('#374151')
            currY = doc.y + 8;Plan.assignments}`, { continued: false, width: colWidth });
          } 
            currY = doc.y + 8;
          // Due Date (right column)
          if (dailyPlan.homeworkDueDate) {
            doc.rect(rightColX - 20, doc.y - 5, 8, 24)
               .fill('#ef4444'); // Red) {
            doc.rect(rightColX - 20, doc.y - 5, 8, 24)
            doc.fontSize(11)4'); // Red
               .font('Helvetica-Bold')
               .fillColor('#111827')
               .text('Due Date:', rightColX, rightColY, { continued: true, width: colWidth })
               .font('Helvetica')7')
               .fillColor('#374151')ghtColX, rightColY, { continued: true, width: colWidth })
               .text(` ${formatDate(dailyPlan.homeworkDueDate)}`, { continued: false, width: colWidth });
               .fillColor('#374151')
            rightColY = doc.y + 8;e(dailyPlan.homeworkDueDate)}`, { continued: false, width: colWidth });
          } 
            rightColY = doc.y + 8;
          // Notes (full width if present)
          doc.y = Math.max(currY, rightColY);
          if (dailyPlan.notes) {f present)
            doc.rect(40, doc.y - 5, 8, 24)Y);
               .fill('#8b5cf6'); // Purple
            doc.rect(40, doc.y - 5, 8, 24)
            doc.fontSize(11)6'); // Purple
               .font('Helvetica-Bold')
               .fillColor('#111827')
               .text('Notes:', 60, doc.y, { continued: true })
               .font('Helvetica')7')
               .fillColor('#374151')oc.y, { continued: true })
               .text(` ${dailyPlan.notes}`, { continued: false });
          }    .fillColor('#374151')
        } else {text(` ${dailyPlan.notes}`, { continued: false });
          // Enhanced empty day styling
          doc.rect(40, doc.y - 5, doc.page.width - 80, 50)
             .fillColor('#fafafa')yling
             .fill();, doc.y - 5, doc.page.width - 80, 50)
             .fillColor('#fafafa')
          // Border for empty content area
          doc.lineWidth(0.5)
             .rect(40, doc.y - 5, doc.page.width - 80, 50)
             .stroke('#e5e7eb');
             .rect(40, doc.y - 5, doc.page.width - 80, 50)
          // More informative message
          doc.fontSize(11)
             .font('Helvetica-Oblique')
             .fillColor('#6b7280')
             .text('No plan created for this day.', 60, doc.y + 10, { continued: false })
             .moveDown(0.2);7280')
             .text('No plan created for this day.', 60, doc.y + 10, { continued: false })
          // Suggestion text
          doc.fontSize(9)
             .fillColor('#9ca3af')
             .text('Add a plan for this day to complete your weekly planning.', 60, doc.y, { continued: false })
             .moveDown(0.2);a3af')
        }    .text('Add a plan for this day to complete your weekly planning.', 60, doc.y, { continued: false })
             .moveDown(0.2);
        // Add space between days
        doc.moveDown(1);
        // Add space between days
        // Add a page break if needed (except for the last day)
        if (doc.y > doc.page.height - 150 && index < weekdays.length - 1) {
          doc.addPage();eak if needed (except for the last day)
           (doc.y > doc.page.height - 150 && index < weekdays.length - 1) {
          // Add header to new page
          doc.rect(0, 0, doc.page.width, 60)
             .fill(lightGray); page
          doc.rect(0, 0, doc.page.width, 60)
          doc.rect(0, 0, doc.page.width, 8)
             .fill(primaryColor);
          doc.rect(0, 0, doc.page.width, 8)
          doc.fontSize(16)Color);
             .font('Helvetica-Bold')
             .fillColor(primaryColor)
             .text(`Weekly Plan - ${gradeName} - ${subjectName} - Week ${weekNumber}`, 40, 25, { align: 'left' })
             .moveDown(1);imaryColor)
        }    .text(`Weekly Plan - ${gradeName} - ${subjectName} - Week ${weekNumber}`, 40, 25, { align: 'left' })
      });    .moveDown(1);
        }
      // If there's additional notes attached to the weekly plan, add them
      if (weeklyPlanData.weeklyPlan.notes && weeklyPlanData.weeklyPlan.notes.trim() !== '') {
        // Check if we need a new pagettached to the weekly plan, add them
        if (doc.y > doc.page.height - 200) { weeklyPlanData.weeklyPlan.notes.trim() !== '') {
          doc.addPage();eed a new page
           (doc.y > doc.page.height - 200) {
          // Add header to new page
          doc.rect(0, 0, doc.page.width, 60)
             .fill(lightGray); page
          doc.rect(0, 0, doc.page.width, 60)
          doc.rect(0, 0, doc.page.width, 8)
             .fill(primaryColor);
          doc.rect(0, 0, doc.page.width, 8)
          doc.fontSize(16)Color);
             .font('Helvetica-Bold')
             .fillColor(primaryColor)
             .text(`Weekly Plan - ${gradeName} - ${subjectName} - Week ${weekNumber}`, 40, 25, { align: 'left' })
             .moveDown(1);imaryColor)
        }    .text(`Weekly Plan - ${gradeName} - ${subjectName} - Week ${weekNumber}`, 40, 25, { align: 'left' })
             .moveDown(1);
        // Section title
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .fillColor(darkGray)
           .text('Additional Planning Notes', 40, doc.y + 20)
           .moveDown(0.5);Gray)
           .text('Additional Planning Notes', 40, doc.y + 20)
        // Notes content);
        doc.rect(40, doc.y - 5, doc.page.width - 80, 5)
           .fill(primaryColor);
           .rect(40, doc.y - 5, doc.page.width - 80, 5)
        doc.fontSize(11)Color);
           .font('Helvetica')
           .fillColor(darkGray)
           .text(weeklyPlanData.weeklyPlan.notes, 40, doc.y + 15, { width: doc.page.width - 80 });
      }    .fillColor(darkGray)
           .text(weeklyPlanData.weeklyPlan.notes, 40, doc.y + 15, { width: doc.page.width - 80 });
      // Add footers to all pages
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        addFooter(doc, i);c.bufferedPageRange().count;
      }or (let i = 0; i < pageCount; i++) {
        addFooter(doc, i);
      // Finalize the PDF
      doc.end();
      // Finalize the PDF
    } catch (error) {
      reject(error);
    } catch (error) {
  }); reject(error);
}   }
  });
}