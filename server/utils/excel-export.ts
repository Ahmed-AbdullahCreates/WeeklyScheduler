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

function getDayName(dayNumber: number): string {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  return days[dayNumber - 1] || '';
}

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
    // Create a new workbook
    const workbook = new Excel.Workbook();
    
    // Set workbook properties
    workbook.creator = 'Weekly Planner System';
    workbook.lastModifiedBy = teacherName;
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.properties.date1904 = false;
    
    // Set workbook metadata
    workbook.creator = 'Weekly Planner System';
    workbook.lastModifiedBy = teacherName;
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Create overview worksheet
    const overviewSheet = workbook.addWorksheet('Overview');
    
    // Set column widths
    overviewSheet.columns = [
      { header: 'Field', key: 'field', width: 20 },
      { header: 'Value', key: 'value', width: 40 }
    ];
    
    // Add header
    overviewSheet.mergeCells('A1:B1');
    const titleCell = overviewSheet.getCell('A1');
    titleCell.value = `Weekly Lesson Plan: ${gradeName} - ${subjectName}`;
    titleCell.font = {
      name: 'Arial',
      size: 16,
      bold: true,
      color: { argb: '4472C4' }
    };
    titleCell.alignment = { horizontal: 'center' };
    
    // Add styling to headers
    ['A2', 'B2'].forEach(cellRef => {
      const cell = overviewSheet.getCell(cellRef);
      cell.font = {
        bold: true,
        size: 12,
        color: { argb: 'FFFFFF' }
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4472C4' }
      };
      cell.alignment = { horizontal: 'center' };
    });
    
    // Add overview data
    const overviewData = [
      { field: 'Teacher', value: teacherName },
      { field: 'Grade', value: gradeName },
      { field: 'Subject', value: subjectName },
      { field: 'Week Number', value: `Week ${weekNumber} (${weekYear})` },
      { field: 'Start Date', value: formatDate(startDate) },
      { field: 'Created On', value: formatDate(new Date().toString()) }
    ];
    
    overviewSheet.addRows(overviewData);
    
    // Style the data cells
    overviewData.forEach((_, index) => {
      const rowIndex = index + 3;
      // Field column
      const fieldCell = overviewSheet.getCell(`A${rowIndex}`);
      fieldCell.font = { bold: true };
      fieldCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'E0E0E0' }
      };
      
      // Value column
      const valueCell = overviewSheet.getCell(`B${rowIndex}`);
      valueCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F5F5F5' }
      };
    });
    
    // Add weekly notes if any
    if (weeklyPlanData.weeklyPlan.notes) {
      overviewSheet.addRow([]);
      overviewSheet.mergeCells(`A${overviewData.length + 4}:B${overviewData.length + 4}`);
      const notesHeaderCell = overviewSheet.getCell(`A${overviewData.length + 4}`);
      notesHeaderCell.value = 'Weekly Notes';
      notesHeaderCell.font = {
        bold: true,
        size: 12,
        color: { argb: 'FFFFFF' }
      };
      notesHeaderCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '7030A0' } // Purple for notes
      };
      notesHeaderCell.alignment = { horizontal: 'center' };
      
      // Add the notes content
      overviewSheet.mergeCells(`A${overviewData.length + 5}:B${overviewData.length + 7}`);
      const notesCell = overviewSheet.getCell(`A${overviewData.length + 5}`);
      notesCell.value = weeklyPlanData.weeklyPlan.notes;
      notesCell.alignment = { wrapText: true, vertical: 'top' };
    }
    
    // Create daily plans worksheet
    const dailyPlansSheet = workbook.addWorksheet('Daily Plans');
    
    // Set columns for daily plans
    dailyPlansSheet.columns = [
      { header: 'Day', key: 'day', width: 12 },
      { header: 'Topic', key: 'topic', width: 25 },
      { header: 'Books & Pages', key: 'booksAndPages', width: 25 },
      { header: 'Assignments', key: 'assignments', width: 25 },
      { header: 'Homework', key: 'homework', width: 25 },
      { header: 'Due Date', key: 'dueDate', width: 15 },
      { header: 'Notes', key: 'notes', width: 30 }
    ];
    
    // Style the header row
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1'].forEach(cellRef => {
      const cell = dailyPlansSheet.getCell(cellRef);
      cell.font = {
        bold: true,
        size: 12,
        color: { argb: 'FFFFFF' }
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4472C4' }
      };
      cell.alignment = { horizontal: 'center' };
    });
    
    // Add daily plans data
    for (let dayNumber = 1; dayNumber <= 5; dayNumber++) {
      const dayName = getDayName(dayNumber);
      const dailyPlan = getDailyPlanByDayNumber(weeklyPlanData.dailyPlans, dayNumber);
      
      if (dailyPlan) {
        dailyPlansSheet.addRow({
          day: dayName,
          topic: dailyPlan.topic || 'No topic specified',
          booksAndPages: dailyPlan.booksAndPages || 'N/A',
          assignments: dailyPlan.assignments || 'None',
          homework: dailyPlan.homework || 'None',
          dueDate: dailyPlan.homeworkDueDate ? formatDate(dailyPlan.homeworkDueDate) : 'N/A',
          notes: dailyPlan.notes || ''
        });
      } else {
        dailyPlansSheet.addRow({
          day: dayName,
          topic: 'No plan created for this day',
          booksAndPages: '',
          assignments: '',
          homework: '',
          dueDate: '',
          notes: ''
        });
      }
    }
    
    // Apply alternating row colors and adjust row heights
    for (let i = 2; i <= 6; i++) {
      const row = dailyPlansSheet.getRow(i);
      row.height = 30;
      
      // Apply background color based on even/odd row
      const bgColor = i % 2 === 0 ? 'F5F5F5' : 'E6E6E6';
      
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor }
        };
        
        // Highlight the first column (day names)
        if (colNumber === 1) {
          cell.font = { bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '4472C4' }
          };
          cell.font = {
            color: { argb: 'FFFFFF' },
            bold: true
          };
        }
        
        cell.alignment = { wrapText: true, vertical: 'middle' };
      });
    }
    
    // Create a buffer for the workbook
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as Buffer;
    
  } catch (error) {
    console.error('Error generating Excel workbook:', error);
    throw error;
  }
}