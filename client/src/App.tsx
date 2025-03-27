import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "@/lib/protected-route";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminTeachers from "@/pages/admin/teachers";
import AdminGrades from "@/pages/admin/grades";
import AdminSubjects from "@/pages/admin/subjects";
import AdminWeeklyPlans from "@/pages/admin/weeklyplans";
import TeacherDashboard from "@/pages/teacher/dashboard";
import TeacherMyGrades from "@/pages/teacher/my-grades";
import TeacherWeeklyPlans from "@/pages/teacher/weeklyplans";
import TeacherPlanEditor from "@/pages/teacher/plan-editor";
import { useAuth } from "@/hooks/use-auth";

function Router() {
  const { user } = useAuth();
  
  return (
    <Switch>
      {/* Auth Page */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Routes based on user role */}
      {user?.isAdmin ? (
        <>
          {/* Admin Routes */}
          <ProtectedRoute path="/" component={AdminDashboard} />
          <ProtectedRoute path="/dashboard" component={AdminDashboard} />
          <ProtectedRoute path="/teachers" component={AdminTeachers} />
          <ProtectedRoute path="/grades" component={AdminGrades} />
          <ProtectedRoute path="/subjects" component={AdminSubjects} />
          <ProtectedRoute path="/weeklyplans" component={AdminWeeklyPlans} />
        </>
      ) : (
        <>
          {/* Teacher Routes */}
          <ProtectedRoute path="/" component={TeacherDashboard} />
          <ProtectedRoute path="/dashboard" component={TeacherDashboard} />
          <ProtectedRoute path="/mygrades" component={TeacherMyGrades} />
          <ProtectedRoute path="/weeklyplans" component={TeacherWeeklyPlans} />
          <ProtectedRoute path="/plan-editor/:planId" component={TeacherPlanEditor} />
          <ProtectedRoute path="/plan-editor" component={TeacherPlanEditor} />
        </>
      )}
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
