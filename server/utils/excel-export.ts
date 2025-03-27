import Excel from 'exceljs';
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

// Define consistent Excel colors and styles
const excelStyles = {
  colors: {
    primary: '2563EB',     // Blue
    secondary: '059669',   // Green
    accent: '7C3AED',      // Purple
    orange: 'EA580C',      // Orange
    teal: '0D9488',        // Teal
    lightBlue: 'E0F2FE',   // Light blue
    gray: '6B7280',
    lightGray: 'F3F4F6',
    mediumGray: 'E5E7EB',
    darkGray: '374151',
    white: 'FFFFFF',
    headerBg: '2563EB',
    dayHeaderBg: '3B82F6',
  },
  fonts: {
    header: { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFF' } },
    subheader: { name: 'Arial', size: 14, bold: true, color: { argb: '2563EB' } },
    sectionHeader: { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFF' } },
    label: { name: 'Arial', size: 11, bold: true },
    normal: { name: 'Arial', size: 11 },
    small: { name: 'Arial', size: 10 }
  },
  borders: {
    thin: { style: 'thin', color: { argb: 'D1D5DB' } },
    medium: { style: 'medium', color: { argb: '9CA3AF' } }
  }
};

export async function generateExcelWorkbook(
  weeklyPlanData: WeeklyPlanComplete,
  teacherName: string,
  gradeName: string,
  subjectName: string,
  weekNumber: number,
  weekYear: number,
  startDate: string
): Promise<Buffer> {
  try {
    // Create a new workbook with enhanced metadata
    const workbook = new Excel.Workbook();
    
    // Set detailed workbook properties
    workbook.creator = 'Weekly Planner System';
    workbook.lastModifiedBy = teacherName;
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.properties.date1904 = false;
    workbook.title = `Weekly Lesson Plan - ${gradeName} - ${subjectName}`;
    workbook.subject = 'Weekly Lesson Plan';
    workbook.keywords = 'education, planning, school, lessons';
    workbook.category = 'Education';
    workbook.company = 'School Education System';
    
    // ===== OVERVIEW WORKSHEET =====
    const overviewSheet = workbook.addWorksheet('Overview', {
      properties: { tabColor: { argb: excelStyles.colors.primary } }
    });
    
    // Set column widths for better layout
    overviewSheet.columns = [
      { header: '', key: 'field', width: 22 },
      { header: '', key: 'value', width: 45 }
    ];
    
    // Add decorative header with logo-like element and title
    overviewSheet.mergeCells('A1:B2');
    const titleCell = overviewSheet.getCell('A1');
    titleCell.value = `Weekly Lesson Plan`;
    titleCell.font = {
      name: 'Arial',
      size: 24,
      bold: true,
      color: { argb: excelStyles.colors.white }
    };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: excelStyles.colors.primary }
    };
    titleCell.alignment = { 
      horizontal: 'center', 
      vertical: 'middle' 
    };
    
    // Add subtitle with class and subject
    overviewSheet.mergeCells('A3:B3');
    const subtitleCell = overviewSheet.getCell('A3');
    subtitleCell.value = `${gradeName} - ${subjectName}`;
    subtitleCell.font = {
      name: 'Arial',
      size: 16,
      bold: true,
      color: { argb: excelStyles.colors.primary }
    };
    subtitleCell.alignment = { horizontal: 'center' };
    
    // Add week information
    overviewSheet.mergeCells('A4:B4');
    const weekInfoCell = overviewSheet.getCell('A4');
    weekInfoCell.value = `Week ${weekNumber} (${weekYear}) - ${formatDateRange(startDate)}`;
    weekInfoCell.font = {
      name: 'Arial',
      size: 14,
      color: { argb: excelStyles.colors.darkGray }
    };
    weekInfoCell.alignment = { horizontal: 'center' };
    
    // Add spacer row
    overviewSheet.addRow([]);
    
    // Add info section header
    overviewSheet.mergeCells('A6:B6');
    const infoHeaderCell = overviewSheet.getCell('A6');
    infoHeaderCell.value = 'Plan Information';
    infoHeaderCell.font = excelStyles.fonts.sectionHeader;
    infoHeaderCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: excelStyles.colors.secondary }
    };
    infoHeaderCell.alignment = { horizontal: 'center' };
    
    // Add field headers row
    const headerRow = overviewSheet.getRow(7);
    headerRow.getCell(1).value = 'Field';
    headerRow.getCell(2).value = 'Value';
    headerRow.eachCell(cell => {
      cell.font = {
        bold: true,
        size: 12,
        color: { argb: excelStyles.colors.darkGray }
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: excelStyles.colors.mediumGray }
      };
      cell.alignment = { horizontal: 'center' };
      // Add borders
      cell.border = {
        top: excelStyles.borders.thin,
        left: excelStyles.borders.thin,
        bottom: excelStyles.borders.thin,
        right: excelStyles.borders.thin
      };
    });
    
    // Add plan information data with enhanced formatting
    const infoData = [
      { field: 'Teacher', value: teacherName },
      { field: 'Grade Level', value: gradeName },
      { field: 'Subject', value: subjectName },
      { field: 'Week Number', value: `Week ${weekNumber}` },
      { field: 'Academic Year', value: weekYear.toString() },
      { field: 'Date Range', value: formatDateRange(startDate) },
      { field: 'Generated On', value: formatDate(new Date().toString()) }
    ];
    
    // Add rows and style them
    infoData.forEach((item, i) => {
      const row = overviewSheet.addRow([item.field, item.value]);
      const rowIndex = i + 8; // Starting from row 8
      
      // Style field cell
      const fieldCell = row.getCell(1);
      fieldCell.font = excelStyles.fonts.label;
      fieldCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: i % 2 === 0 ? excelStyles.colors.lightGray : excelStyles.colors.mediumGray }
      };
      
      // Style value cell
      const valueCell = row.getCell(2);
      valueCell.font = excelStyles.fonts.normal;
      valueCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: i % 2 === 0 ? excelStyles.colors.lightGray : excelStyles.colors.mediumGray }
      };
      
      // Add borders
      row.eachCell(cell => {
        cell.border = {
          top: excelStyles.borders.thin,
          left: excelStyles.borders.thin,
          bottom: excelStyles.borders.thin,
          right: excelStyles.borders.thin
        };
      });
    });
    
    // Add weekly notes if any
    if (weeklyPlanData.weeklyPlan.notes) {
      // Add spacer row
      overviewSheet.addRow([]);
      
      // Notes header
      const noteStartRow = infoData.length + 9;
      overviewSheet.mergeCells(`A${noteStartRow}:B${noteStartRow}`);
      const notesHeaderCell = overviewSheet.getCell(`A${noteStartRow}`);
      notesHeaderCell.value = 'Weekly Notes';
      notesHeaderCell.font = excelStyles.fonts.sectionHeader;
      notesHeaderCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: excelStyles.colors.accent }
      };
      notesHeaderCell.alignment = { horizontal: 'center' };
      
      // Add the notes content with border and background
      const notesContentRow = noteStartRow + 1;
      overviewSheet.mergeCells(`A${notesContentRow}:B${notesContentRow + 3}`);
      const notesCell = overviewSheet.getCell(`A${notesContentRow}`);
      notesCell.value = weeklyPlanData.weeklyPlan.notes;
      notesCell.font = excelStyles.fonts.normal;
      notesCell.alignment = { 
        wrapText: true, 
        vertical: 'top', 
        horizontal: 'left' 
      };
      notesCell.border = {
        top: excelStyles.borders.thin,
        left: excelStyles.borders.thin,
        bottom: excelStyles.borders.thin,
        right: excelStyles.borders.thin
      };
      notesCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F5F3FF' } // Very light purple
      };
      
      // Set row heights for the notes section
      overviewSheet.getRow(notesContentRow).height = 80;
    }
    
    // ===== DAILY PLANS WORKSHEET =====
    const dailyPlansSheet = workbook.addWorksheet('Daily Plans', {
      properties: { tabColor: { argb: excelStyles.colors.dayHeaderBg } }
    });
    
    // Add sheet title
    dailyPlansSheet.mergeCells('A1:G1');
    const dpTitleCell = dailyPlansSheet.getCell('A1');
    dpTitleCell.value = `${gradeName} - ${subjectName} - Week ${weekNumber} - Daily Plans`;
    dpTitleCell.font = {
      name: 'Arial',
      size: 16,
      bold: true,
      color: { argb: excelStyles.colors.white }
    };
    dpTitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: excelStyles.colors.primary }
    };
    dpTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Set column widths and headers
    dailyPlansSheet.columns = [
      { header: 'Day', key: 'day', width: 14 },
      { header: 'Topic', key: 'topic', width: 30 },
      { header: 'Books & Pages', key: 'booksAndPages', width: 25 },
      { header: 'Assignments', key: 'assignments', width: 25 },
      { header: 'Homework', key: 'homework', width: 25 },
      { header: 'Due Date', key: 'dueDate', width: 15 },
      { header: 'Notes', key: 'notes', width: 35 }
    ];
    
    // Style the header row
    const headerRowDP = dailyPlansSheet.getRow(2);
    headerRowDP.height = 30;
    
    const headerCellColors = {
      1: excelStyles.colors.primary,     // Day
      2: excelStyles.colors.primary,     // Topic
      3: excelStyles.colors.secondary,   // Books & Pages
      4: excelStyles.colors.dayHeaderBg, // Assignments
      5: excelStyles.colors.orange,      // Homework
      6: excelStyles.colors.teal,        // Due Date
      7: excelStyles.colors.accent       // Notes
    };
    
    headerRowDP.eachCell((cell, colNumber) => {
      cell.font = {
        name: 'Arial',
        size: 12,
        bold: true,
        color: { argb: excelStyles.colors.white }
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: headerCellColors[colNumber as keyof typeof headerCellColors] || excelStyles.colors.primary }
      };
      cell.alignment = { 
        horizontal: 'center', 
        vertical: 'middle' 
      };
      cell.border = {
        top: excelStyles.borders.medium,
        left: excelStyles.borders.thin,
        bottom: excelStyles.borders.medium,
        right: excelStyles.borders.thin
      };
    });
    
    // Custom styling for daily plans
    const dayColors = {
      1: 'D1D4FE', // Monday - light blue
      2: 'D1FADF', // Tuesday - light green
      3: 'FEF3C7', // Wednesday - light yellow
      4: 'FCE7F3', // Thursday - light pink
      5: 'DDD6FE'  // Friday - light purple
    };
    
    // Add daily plans data with enhanced formatting
    for (let dayNumber = 1; dayNumber <= 5; dayNumber++) {
      const dayName = getDayName(dayNumber);
      const dailyPlan = getDailyPlanByDayNumber(weeklyPlanData.dailyPlans, dayNumber);
      
      const rowData = {
        day: dayName,
        topic: dailyPlan?.topic || 'No topic specified',
        booksAndPages: dailyPlan?.booksAndPages || 'N/A',
        assignments: dailyPlan?.assignments || 'None',
        homework: dailyPlan?.homework || 'None',
        dueDate: dailyPlan?.homeworkDueDate ? formatDate(dailyPlan.homeworkDueDate) : 'N/A',
        notes: dailyPlan?.notes || ''
      };
      
      // Add the row and get its reference
      const rowIndex = dayNumber + 2; // Starting from row 3
      const dataRow = dailyPlansSheet.addRow(Object.values(rowData));
      dataRow.height = 40; // Taller rows for content
      
      // Apply cell styling for the row
      dataRow.eachCell((cell, colNumber) => {
        // Base styling for all cells in the row
        cell.font = excelStyles.fonts.normal;
        cell.alignment = { 
          wrapText: true, 
          vertical: 'middle' 
        };
        
        // Apply day-specific background color
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: dayColors[dayNumber as keyof typeof dayColors] || 'F3F4F6' }
        };
        
        // Add borders
        cell.border = {
          top: excelStyles.borders.thin,
          left: excelStyles.borders.thin,
          bottom: excelStyles.borders.thin,
          right: excelStyles.borders.thin
        };
        
        // Special styling for day column
        if (colNumber === 1) {
          cell.font = {
            name: 'Arial',
            size: 12,
            bold: true,
            color: { argb: excelStyles.colors.white }
          };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: excelStyles.colors.dayHeaderBg }
          };
          cell.alignment.horizontal = 'center';
        }
        
        // Special styling for topic
        if (colNumber === 2) {
          cell.font = {
            name: 'Arial',
            size: 11,
            bold: true,
            color: { argb: excelStyles.colors.darkGray }
          };
        }
        
        // Special styling for empty or N/A content
        const cellValue = cell.value as string;
        if (colNumber > 1 && (cellValue === 'N/A' || cellValue === 'None')) {
          cell.font.color = { argb: excelStyles.colors.gray };
          cell.font.italic = true;
        }
      });
    }
    
    // Add a summary/instructions row at the bottom
    dailyPlansSheet.addRow([]);
    const footerRowIndex = 8;
    dailyPlansSheet.mergeCells(`A${footerRowIndex}:G${footerRowIndex}`);
    const footerCell = dailyPlansSheet.getCell(`A${footerRowIndex}`);
    footerCell.value = 'Generated by Weekly Planner System on ' + formatDate(new Date().toString());
    footerCell.font = {
      name: 'Arial',
      size: 10,
      italic: true,
      color: { argb: excelStyles.colors.gray }
    };
    footerCell.alignment = { horizontal: 'center' };
    
    // ===== DETAILED VIEW WORKSHEET (additional worksheet with single-day focus) =====
    // Create a separate worksheet for each day with more detailed information
    for (let dayNumber = 1; dayNumber <= 5; dayNumber++) {
      const dayName = getDayName(dayNumber);
      const dailyPlan = getDailyPlanByDayNumber(weeklyPlanData.dailyPlans, dayNumber);
      
      // Skip days without plans
      if (!dailyPlan) continue;
      
      // Create a day-specific worksheet
      const daySheet = workbook.addWorksheet(dayName, {
        properties: { tabColor: { argb: dayNumber % 2 === 0 ? excelStyles.colors.secondary : excelStyles.colors.dayHeaderBg } }
      });
      
      // Set column widths
      daySheet.columns = [
        { header: '', key: 'label', width: 20 },
        { header: '', key: 'content', width: 60 }
      ];
      
      // Add title
      daySheet.mergeCells('A1:B1');
      const dayTitleCell = daySheet.getCell('A1');
      dayTitleCell.value = `${dayName} - ${gradeName} - ${subjectName}`;
      dayTitleCell.font = {
        name: 'Arial',
        size: 16,
        bold: true,
        color: { argb: excelStyles.colors.white }
      };
      dayTitleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: excelStyles.colors.primary }
      };
      dayTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      daySheet.getRow(1).height = 30;
      
      // Add date info
      daySheet.mergeCells('A2:B2');
      const dayDateCell = daySheet.getCell('A2');
      const dayDate = new Date(startDate);
      dayDate.setDate(dayDate.getDate() + (dayNumber - 1));
      dayDateCell.value = `Date: ${formatDate(dayDate)}`;
      dayDateCell.font = {
        name: 'Arial',
        size: 12,
        color: { argb: excelStyles.colors.darkGray }
      };
      dayDateCell.alignment = { horizontal: 'center' };
      
      // Add spacer
      daySheet.addRow([]);
      
      // Topic section
      daySheet.mergeCells('A4:B4');
      const topicHeaderCell = daySheet.getCell('A4');
      topicHeaderCell.value = 'TOPIC';
      topicHeaderCell.font = excelStyles.fonts.sectionHeader;
      topicHeaderCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: excelStyles.colors.primary }
      };
      topicHeaderCell.alignment = { horizontal: 'center' };
      
      // Topic content
      daySheet.mergeCells('A5:B6');
      const topicCell = daySheet.getCell('A5');
      topicCell.value = dailyPlan.topic || 'No topic specified';
      topicCell.font = excelStyles.fonts.normal;
      topicCell.alignment = { wrapText: true, vertical: 'top' };
      topicCell.border = {
        top: excelStyles.borders.thin,
        left: excelStyles.borders.thin,
        bottom: excelStyles.borders.thin,
        right: excelStyles.borders.thin
      };
      daySheet.getRow(5).height = 50;
      
      // Books & Pages section
      daySheet.mergeCells('A7:B7');
      const booksHeaderCell = daySheet.getCell('A7');
      booksHeaderCell.value = 'BOOKS & PAGES';
      booksHeaderCell.font = excelStyles.fonts.sectionHeader;
      booksHeaderCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: excelStyles.colors.secondary }
      };
      booksHeaderCell.alignment = { horizontal: 'center' };
      
      // Books content
      daySheet.mergeCells('A8:B9');
      const booksCell = daySheet.getCell('A8');
      booksCell.value = dailyPlan.booksAndPages || 'No books or pages specified';
      booksCell.font = excelStyles.fonts.normal;
      booksCell.alignment = { wrapText: true, vertical: 'top' };
      booksCell.border = {
        top: excelStyles.borders.thin,
        left: excelStyles.borders.thin,
        bottom: excelStyles.borders.thin,
        right: excelStyles.borders.thin
      };
      daySheet.getRow(8).height = 40;
      
      // Assignments section
      daySheet.mergeCells('A10:B10');
      const assignmentsHeaderCell = daySheet.getCell('A10');
      assignmentsHeaderCell.value = 'ASSIGNMENTS';
      assignmentsHeaderCell.font = excelStyles.fonts.sectionHeader;
      assignmentsHeaderCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: excelStyles.colors.dayHeaderBg }
      };
      assignmentsHeaderCell.alignment = { horizontal: 'center' };
      
      // Assignments content
      daySheet.mergeCells('A11:B12');
      const assignmentsCell = daySheet.getCell('A11');
      assignmentsCell.value = dailyPlan.assignments || 'No assignments for this day';
      assignmentsCell.font = excelStyles.fonts.normal;
      assignmentsCell.alignment = { wrapText: true, vertical: 'top' };
      assignmentsCell.border = {
        top: excelStyles.borders.thin,
        left: excelStyles.borders.thin,
        bottom: excelStyles.borders.thin,
        right: excelStyles.borders.thin
      };
      daySheet.getRow(11).height = 40;
      
      // Homework section
      daySheet.mergeCells('A13:B13');
      const homeworkHeaderCell = daySheet.getCell('A13');
      homeworkHeaderCell.value = 'HOMEWORK';
      homeworkHeaderCell.font = excelStyles.fonts.sectionHeader;
      homeworkHeaderCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: excelStyles.colors.orange }
      };
      homeworkHeaderCell.alignment = { horizontal: 'center' };
      
      // Homework content and due date
      daySheet.mergeCells('A14:B14');
      const homeworkCell = daySheet.getCell('A14');
      homeworkCell.value = dailyPlan.homework || 'No homework assigned';
      homeworkCell.font = excelStyles.fonts.normal;
      homeworkCell.alignment = { wrapText: true, vertical: 'top' };
      homeworkCell.border = {
        top: excelStyles.borders.thin,
        left: excelStyles.borders.thin,
        bottom: excelStyles.borders.thin,
        right: excelStyles.borders.thin
      };
      
      // Due date row (if applicable)
      if (dailyPlan.homeworkDueDate) {
        daySheet.mergeCells('A15:B15');
        const dueDateCell = daySheet.getCell('A15');
        dueDateCell.value = `Due Date: ${formatDate(dailyPlan.homeworkDueDate)}`;
        dueDateCell.font = {
          name: 'Arial',
          size: 11,
          bold: true,
          color: { argb: excelStyles.colors.teal }
        };
        dueDateCell.alignment = { horizontal: 'right' };
        dueDateCell.border = {
          bottom: excelStyles.borders.thin,
          left: excelStyles.borders.thin,
          right: excelStyles.borders.thin
        };
      }
      
      // Notes section (if available)
      if (dailyPlan.notes) {
        const notesStartRow = dailyPlan.homeworkDueDate ? 16 : 15;
        
        daySheet.mergeCells(`A${notesStartRow}:B${notesStartRow}`);
        const notesHeaderCell = daySheet.getCell(`A${notesStartRow}`);
        notesHeaderCell.value = 'NOTES';
        notesHeaderCell.font = excelStyles.fonts.sectionHeader;
        notesHeaderCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: excelStyles.colors.accent }
        };
        notesHeaderCell.alignment = { horizontal: 'center' };
        
        // Notes content
        daySheet.mergeCells(`A${notesStartRow + 1}:B${notesStartRow + 3}`);
        const notesCell = daySheet.getCell(`A${notesStartRow + 1}`);
        notesCell.value = dailyPlan.notes;
        notesCell.font = excelStyles.fonts.normal;
        notesCell.alignment = { wrapText: true, vertical: 'top' };
        notesCell.border = {
          top: excelStyles.borders.thin,
          left: excelStyles.borders.thin,
          bottom: excelStyles.borders.thin,
          right: excelStyles.borders.thin
        };
        notesCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F5F3FF' } // Very light purple
        };
        daySheet.getRow(notesStartRow + 1).height = 60;
      }
    }
    
    // Create a buffer for the workbook
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as Buffer;
    
  } catch (error) {
    console.error('Error generating Excel workbook:', error);
    throw error;
  }
}