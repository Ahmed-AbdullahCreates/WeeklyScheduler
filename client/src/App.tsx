import { Switch, Route, useLocation } from "wouter";
import { queryClient, usePersistQueryCache } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile-page";
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
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import { Suspense, lazy, useEffect } from "react";
import { Loader2 } from "lucide-react";

// Loader component for route transitions
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Role-based routing with optimized rendering
function RoleBasedRoutes() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Redirect to dashboard if on root path
  useEffect(() => {
    if (location === "/" && user && !isLoading) {
      setLocation("/dashboard");
    }
  }, [location, user, isLoading, setLocation]);
  
  // Show loading state while determining user role
  if (isLoading) {
    return <LoadingFallback />;
  }
  
  // Return the appropriate routes based on user role
  if (user?.isAdmin) {
    return (
      <Switch>
        {/* Admin Routes */}
        <ProtectedRoute path="/dashboard" component={AdminDashboard} />
        <ProtectedRoute path="/teachers" component={AdminTeachers} />
        <ProtectedRoute path="/grades" component={AdminGrades} />
        <ProtectedRoute path="/subjects" component={AdminSubjects} />
        <ProtectedRoute path="/weeklyplans" component={AdminWeeklyPlans} />
        <ProtectedRoute path="/profile" component={ProfilePage} />
        <Route path="/" component={AdminDashboard} />
        <Route component={NotFound} />
      </Switch>
    );
  } else {
    return (
      <Switch>
        {/* Teacher Routes */}
        <ProtectedRoute path="/dashboard" component={TeacherDashboard} />
        <ProtectedRoute path="/mygrades" component={TeacherMyGrades} />
        <ProtectedRoute path="/weeklyplans" component={TeacherWeeklyPlans} />
        <ProtectedRoute path="/plan-editor/:planId" component={TeacherPlanEditor} />
        <ProtectedRoute path="/plan-editor" component={TeacherPlanEditor} />
        <ProtectedRoute path="/profile" component={ProfilePage} />
        <Route path="/" component={TeacherDashboard} />
        <Route component={NotFound} />
      </Switch>
    );
  }
}

// Main router component with optimized auth handling
function AppRouter() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Handle auth redirections
  useEffect(() => {
    // If user is authenticated and trying to access auth page, redirect to dashboard
    if (user && !isLoading && location === "/auth") {
      setLocation("/dashboard");
    }
  }, [user, isLoading, location, setLocation]);
  
  // Main routing logic
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        {/* Public routes */}
        <Route path="/auth" component={AuthPage} />
        
        {/* All other routes are protected and role-based */}
        <Route>
          <RoleBasedRoutes />
        </Route>
      </Switch>
    </Suspense>
  );
}

// Global cache persistence component
function QueryCachePersistor() {
  usePersistQueryCache();
  return null;
}

// Main App component
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <QueryCachePersistor />
        <AppRouter />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
