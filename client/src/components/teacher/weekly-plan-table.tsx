import { 
  DailyPlan, 
  DailyPlanData, 
  Grade, 
  PlanningWeek, 
  Subject, 
  WeeklyPlanComplete 
} from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

function getDayName(dayNumber: number): string {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  return days[dayNumber - 1] || '';
}

type WeeklyPlanTableProps = {
  weeklyPlanData: WeeklyPlanComplete;
  grade: Grade;
  subject: Subject;
  week: PlanningWeek;
  isEditable?: boolean;
  onSaved?: () => void;
};

export default function WeeklyPlanTable({ 
  weeklyPlanData, 
  grade, 
  subject, 
  week, 
  isEditable = false,
  onSaved
}: WeeklyPlanTableProps) {
  const { toast } = useToast();
  const [editingPlan, setEditingPlan] = useState<{
    weeklyPlanId: number;
    dayOfWeek: number;
    field: string;
    value: string;
  } | null>(null);

  // Create or update daily plan
  const saveDailyPlan = useMutation({
    mutationFn: async ({ id, data }: { id?: number; data: any }) => {
      if (id) {
        // Update existing plan
        const res = await apiRequest("PUT", `/api/daily-plans/${id}`, data);
        return await res.json();
      } else {
        // Create new plan
        const res = await apiRequest("POST", "/api/daily-plans", data);
        return await res.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Plan saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-plans", weeklyPlanData.weeklyPlan.id, "complete"] });
      if (onSaved) onSaved();
      setEditingPlan(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCellEdit = (dayOfWeek: number, field: string, value: string) => {
    if (!isEditable) return;

    setEditingPlan({
      weeklyPlanId: weeklyPlanData.weeklyPlan.id,
      dayOfWeek,
      field,
      value
    });
  };

  const handleSave = () => {
    if (!editingPlan) return;

    const dailyPlan = getDailyPlanByDayNumber(weeklyPlanData.dailyPlans, editingPlan.dayOfWeek);
    
    // Prepare data with all fields from existing daily plan
    const planData: any = {
      weeklyPlanId: weeklyPlanData.weeklyPlan.id,
      dayOfWeek: editingPlan.dayOfWeek,
      topic: dailyPlan?.topic || "",
      booksAndPages: dailyPlan?.booksAndPages || "",
      homework: dailyPlan?.homework || "",
      homeworkDueDate: dailyPlan?.homeworkDueDate || "",
      assignments: dailyPlan?.assignments || "",
      notes: dailyPlan?.notes || ""
    };
    
    // Update the specific field being edited
    planData[editingPlan.field] = editingPlan.value;
    
    saveDailyPlan.mutate({ 
      id: dailyPlan?.id, 
      data: planData 
    });
  };

  const handleCancel = () => {
    setEditingPlan(null);
  };

  // Fields to display in the table
  const fields = [
    { id: 'topic', label: 'Topic', required: true },
    { id: 'booksAndPages', label: 'Books & Pages' },
    { id: 'homework', label: 'Homework' },
    { id: 'assignments', label: 'Assignments' },
    { id: 'notes', label: 'Notes' }
  ];

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <CardTitle className="text-lg">
            {grade.name} - {subject.name}
          </CardTitle>
          <Badge className="bg-blue-100 text-primary flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            Week {week.weekNumber} ({formatDate(new Date(week.startDate))} - {formatDate(new Date(week.endDate))})
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/40">
              <TableHead className="font-semibold w-[180px]">Fields</TableHead>
              <TableHead className="font-semibold">Monday</TableHead>
              <TableHead className="font-semibold">Tuesday</TableHead>
              <TableHead className="font-semibold">Wednesday</TableHead>
              <TableHead className="font-semibold">Thursday</TableHead>
              <TableHead className="font-semibold">Friday</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field) => (
              <TableRow key={field.id}>
                <TableCell className="font-medium bg-muted/10">
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </TableCell>
                {[1, 2, 3, 4, 5].map((dayNumber) => {
                  const dailyPlan = getDailyPlanByDayNumber(weeklyPlanData.dailyPlans, dayNumber);
                  const value = dailyPlan ? dailyPlan[field.id as keyof DailyPlan] as string : '';
                  const isEditing = editingPlan?.dayOfWeek === dayNumber && editingPlan?.field === field.id;
                  
                  return (
                    <TableCell 
                      key={`day-${dayNumber}`}
                      className={`border p-3 ${isEditable ? 'cursor-pointer hover:bg-muted/20' : ''} 
                                ${isEditing ? 'bg-blue-50' : ''}`}
                      onClick={isEditing ? undefined : () => handleCellEdit(dayNumber, field.id, value || '')}
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editingPlan.value}
                            onChange={(e) => setEditingPlan({
                              ...editingPlan,
                              value: e.target.value
                            })}
                            className="min-h-[100px] text-sm"
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                          />
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              onClick={handleSave}
                              disabled={saveDailyPlan.isPending}
                              className="bg-primary text-white hover:bg-primary/90"
                            >
                              {saveDailyPlan.isPending ? 'Saving...' : 'Save'}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={handleCancel}
                              disabled={saveDailyPlan.isPending}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="min-h-[40px] whitespace-pre-wrap">
                          {value || <span className="text-muted-foreground italic">Not set</span>}
                        </div>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="font-medium bg-muted/10">
                Homework Due Date
              </TableCell>
              {[1, 2, 3, 4, 5].map((dayNumber) => {
                const dailyPlan = getDailyPlanByDayNumber(weeklyPlanData.dailyPlans, dayNumber);
                const value = dailyPlan?.homeworkDueDate 
                  ? formatDate(new Date(dailyPlan.homeworkDueDate)) 
                  : '';
                const isEditing = editingPlan?.dayOfWeek === dayNumber && editingPlan?.field === 'homeworkDueDate';
                
                return (
                  <TableCell 
                    key={`day-${dayNumber}`}
                    className={`border p-3 ${isEditable ? 'cursor-pointer hover:bg-muted/20' : ''} 
                              ${isEditing ? 'bg-blue-50' : ''}`}
                    onClick={isEditing ? undefined : () => handleCellEdit(dayNumber, 'homeworkDueDate', dailyPlan?.homeworkDueDate || '')}
                  >
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="date"
                          value={editingPlan.value}
                          onChange={(e) => setEditingPlan({
                            ...editingPlan,
                            value: e.target.value
                          })}
                          className="w-full p-2 border rounded text-sm"
                        />
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            onClick={handleSave}
                            disabled={saveDailyPlan.isPending}
                            className="bg-primary text-white hover:bg-primary/90"
                          >
                            {saveDailyPlan.isPending ? 'Saving...' : 'Save'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={handleCancel}
                            disabled={saveDailyPlan.isPending}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="min-h-[40px]">
                        {value || <span className="text-muted-foreground italic">Not set</span>}
                      </div>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}