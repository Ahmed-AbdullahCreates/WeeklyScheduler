import Excel from 'exceljs';
import { WeeklyPlanComplete, DailyPlan, DailyPlanData } from '@shared/schema';
import { mapDayNumberToName } from '../../client/src/lib/utils';

// Function to generate an Excel file for a weekly plan
export async function generateWeeklyPlanExcel(
  weeklyPlanData: WeeklyPlanComplete,
  teacherName: string,
  gradeName: string,
  subjectName: string,
  weekNumber: number,
  weekYear: number,
  startDate: string
): Promise<any> {
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
    
    // Create a new Excel workbook
    const workbook = new Excel.Workbook();

    // Workbook properties
    workbook.creator = safeTeacherName;
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.lastModifiedBy = 'Weekly Planner System';
    workbook.properties.date1904 = false;
    
    // Set some properties that are supported
    workbook.creator = safeTeacherName;
    workbook.lastModifiedBy = 'Weekly Planner System';
    
    // Create a worksheet
    const worksheet = workbook.addWorksheet('Weekly Plan');

    // Set default column widths
    worksheet.columns = [
      { header: '', key: 'section', width: 15 },
      { header: 'Monday', key: 'monday', width: 25 },
      { header: 'Tuesday', key: 'tuesday', width: 25 },
      { header: 'Wednesday', key: 'wednesday', width: 25 },
      { header: 'Thursday', key: 'thursday', width: 25 },
      { header: 'Friday', key: 'friday', width: 25 }
    ];

    // Add title row
    worksheet.mergeCells('A1:F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'Weekly Lesson Plan';
    titleCell.font = {
      name: 'Arial',
      size: 16,
      bold: true,
      color: { argb: '1E3A8A' } // Dark blue
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F0F9FF' } // Light blue
    };
    worksheet.getRow(1).height = 30;
    
    // Add metadata rows
    worksheet.mergeCells('A2:B2');
    worksheet.getCell('A2').value = 'Teacher:';
    worksheet.getCell('A2').font = { bold: true };
    
    worksheet.mergeCells('C2:F2');
    worksheet.getCell('C2').value = safeTeacherName;
    
    worksheet.mergeCells('A3:B3');
    worksheet.getCell('A3').value = 'Grade:';
    worksheet.getCell('A3').font = { bold: true };
    
    worksheet.mergeCells('C3:D3');
    worksheet.getCell('C3').value = safeGradeName;
    
    worksheet.mergeCells('E3:F3');
    worksheet.getCell('E3').value = `Subject: ${safeSubjectName}`;
    worksheet.getCell('E3').font = { bold: true };
    
    worksheet.mergeCells('A4:B4');
    worksheet.getCell('A4').value = 'Week:';
    worksheet.getCell('A4').font = { bold: true };
    
    worksheet.mergeCells('C4:D4');
    worksheet.getCell('C4').value = `${safeWeekNumber} (${safeWeekYear})`;
    
    worksheet.mergeCells('E4:F4');
    worksheet.getCell('E4').value = `Start Date: ${new Date(safeStartDate).toLocaleDateString()}`;
    worksheet.getCell('E4').font = { bold: true };
    
    // Add headers
    const headerRow = worksheet.getRow(5);
    headerRow.values = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.height = 25;
    
    // Style header row
    ['A5', 'B5', 'C5', 'D5', 'E5', 'F5'].forEach(cell => {
      worksheet.getCell(cell).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '3B82F6' } // Blue
      };
      worksheet.getCell(cell).alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Define section rows
    const sections = [
      { name: 'Topic', row: 6 },
      { name: 'Books & Pages', row: 7 },
      { name: 'Homework', row: 8 },
      { name: 'Due Date', row: 9 },
      { name: 'Assignments', row: 10 },
      { name: 'Notes', row: 11 }
    ];

    // Add section rows
    sections.forEach(section => {
      const row = worksheet.getRow(section.row);
      row.getCell(1).value = section.name;
      row.getCell(1).font = { bold: true };
      row.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F0F9FF' } // Light blue
      };
      row.height = 30;
    });

    // Define weekdays
    const weekdays = [1, 2, 3, 4, 5]; // Monday to Friday

    // Add plan for each day
    weekdays.forEach((dayNumber, index) => {
      const dayName = mapDayNumberToName(dayNumber);
      const dailyPlan = getDailyPlanByDayNumber(weeklyPlanData.dailyPlans, dayNumber);
      const colIndex = index + 2; // Starting from column B (index 2)
      
      if (dailyPlan) {
        // Topic
        worksheet.getCell(6, colIndex).value = dailyPlan.topic || '';
        
        // Books & Pages
        worksheet.getCell(7, colIndex).value = dailyPlan.booksAndPages || '';
        
        // Homework
        worksheet.getCell(8, colIndex).value = dailyPlan.homework || '';
        
        // Due Date - format date if exists
        worksheet.getCell(9, colIndex).value = dailyPlan.homeworkDueDate 
          ? new Date(dailyPlan.homeworkDueDate).toLocaleDateString() 
          : '';
        
        // Assignments
        worksheet.getCell(10, colIndex).value = dailyPlan.assignments || '';
        
        // Notes
        worksheet.getCell(11, colIndex).value = dailyPlan.notes || '';
      } else {
        // No plan for this day
        worksheet.getCell(6, colIndex).value = 'No plan';
        worksheet.getCell(6, colIndex).font = { italic: true, color: { argb: '9CA3AF' } };
      }
    });

    // Apply borders to all data cells
    for (let row = 5; row <= 11; row++) {
      for (let col = 1; col <= 6; col++) {
        const cell = worksheet.getCell(row, col);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        // Set alignment for all content cells
        if (col > 1) {
          cell.alignment = { vertical: 'middle', wrapText: true };
        } else {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
      }
    }

    // Add footer
    const footerRowIndex = 13;
    worksheet.mergeCells(`A${footerRowIndex}:F${footerRowIndex}`);
    const footerCell = worksheet.getCell(`A${footerRowIndex}`);
    footerCell.value = `Generated on ${new Date().toLocaleString()} - Weekly Planner System for Schools`;
    footerCell.font = {
      name: 'Arial',
      size: 10,
      italic: true,
      color: { argb: '6B7280' } // Gray
    };
    footerCell.alignment = { horizontal: 'center' };

    // Write to buffer and return as any to avoid type issues
    return await workbook.xlsx.writeBuffer() as any;
  } catch (error) {
    console.error('Excel generation error:', error);
    throw new Error(`Failed to generate Excel file: ${(error as Error).message}`);
  }
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