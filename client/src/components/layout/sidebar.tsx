import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  GraduationCapIcon,
  Home,
  LibraryIcon,
  LogOut,
  School,
  Settings,
  User,
  Users,
} from "lucide-react";
import { Link, useLocation } from "wouter";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  setMobileOpen?: (open: boolean) => void;
}

export function Sidebar({ className, setMobileOpen, ...props }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const isAdmin = user?.isAdmin;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const links = isAdmin
    ? [
        {
          href: "/dashboard",
          icon: Home,
          title: "Dashboard",
        },
        {
          href: "/teachers",
          icon: Users,
          title: "Teachers",
        },
        {
          href: "/grades",
          icon: GraduationCapIcon,
          title: "Grades",
        },
        {
          href: "/subjects",
          icon: LibraryIcon,
          title: "Subjects",
        },
        {
          href: "/weeklyplans",
          icon: CalendarIcon,
          title: "Weekly Plans",
        },
      ]
    : [
        {
          href: "/dashboard",
          icon: Home,
          title: "Dashboard",
        },
        {
          href: "/mygrades",
          icon: GraduationCapIcon,
          title: "My Grades",
        },
        {
          href: "/weeklyplans",
          icon: CalendarIcon,
          title: "Weekly Plans",
        },
      ];

  const closeMobile = () => {
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <div className={cn("flex flex-col bg-white border-r border-neutral-200 h-full", className)} {...props}>
      <div className="px-6 py-6 border-b border-neutral-200">
        <div className="flex items-center">
          <School className="h-6 w-6 text-primary-dark mr-2" />
          <h1 className="text-xl font-medium text-primary-dark">Weekly Planner</h1>
        </div>
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="px-4 space-y-2">
          <div className="text-sm font-medium text-neutral-400 mb-2 mt-2 px-4">MAIN MENU</div>
          {links.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              onClick={closeMobile}
              className="block"
            >
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start items-center",
                  location === link.href
                    ? "bg-blue-50 text-primary"
                    : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                )}
              >
                <link.icon className={cn("mr-3 h-5 w-5", location === link.href ? "text-primary" : "text-neutral-500")} />
                {link.title}
              </Button>
            </Link>
          ))}
          
          <div className="text-sm font-medium text-neutral-400 mb-2 mt-6 px-4">ACCOUNT</div>
          <Link href="/profile" onClick={closeMobile} className="block">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start items-center",
                location === "/profile"
                  ? "bg-blue-50 text-primary"
                  : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
              )}
            >
              <User className={cn("mr-3 h-5 w-5", location === "/profile" ? "text-primary" : "text-neutral-500")} />
              Profile
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start items-center text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-5 w-5 text-neutral-500" />
            Logout
          </Button>
        </nav>
      </ScrollArea>
    </div>
  );
}
