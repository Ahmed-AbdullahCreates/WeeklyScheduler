import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { memo, useEffect } from "react";

// Optimized LoadingIndicator component
const LoadingIndicator = memo(() => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
));
LoadingIndicator.displayName = "LoadingIndicator";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Smooth redirect handling with useEffect
  useEffect(() => {
    if (!isLoading && !user) {
      // Use a small timeout for a better user experience
      // This prevents flickering when quickly navigating between routes
      const redirectTimer = setTimeout(() => {
        setLocation("/auth");
      }, 100);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [user, isLoading, setLocation]);

  // Render the component only if user is authenticated
  // This provides a smoother user experience
  return (
    <Route path={path}>
      {isLoading ? (
        <LoadingIndicator />
      ) : !user ? (
        <LoadingIndicator /> // Show loading during redirect
      ) : (
        <Component />
      )}
    </Route>
  );
}
