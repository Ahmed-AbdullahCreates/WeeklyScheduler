import { PageWrapper } from "@/components/layout/page-wrapper";
import CalendarView from "@/components/planner/calendar-view";

export default function AdminCalendar() {
  return (
    <PageWrapper title="Calendar View">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Calendar View</h1>
        <p className="text-neutral-500 mt-1">View all weekly plans in a calendar format</p>
      </div>
      
      <CalendarView isAdmin={true} />
    </PageWrapper>
  );
}