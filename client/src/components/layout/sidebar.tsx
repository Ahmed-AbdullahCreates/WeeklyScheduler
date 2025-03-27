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
        {
          href: "/calendar",
          icon: CalendarIcon,
          title: "Calendar View",
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
        {
          href: "/calendar",
          icon: CalendarIcon,
          title: "Calendar View",
        },
      ];

  const closeMobile = () => {
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <div className={cn("flex flex-col bg-white border-r border-neutral-200 h-full shadow-md", className)} {...props}>
      <div className="px-6 py-6 border-b border-neutral-200 bg-gradient-to-r from-primary/5 to-indigo-100/30">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary/90 to-indigo-600 mr-3 shadow-md">
            <School className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">Weekly Planner</h1>
        </div>
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="px-4 space-y-1">
          <div className="text-xs font-semibold text-neutral-500 mb-3 mt-2 px-3 uppercase">
            Main Menu
          </div>
          {links.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              onClick={closeMobile}
              className="block"
            >
              <div
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-lg transition-all duration-200",
                  location === link.href
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-neutral-600 hover:bg-slate-50 hover:text-primary"
                )}
              >
                {location === link.href && (
                  <div className="absolute left-0 w-1 h-6 bg-primary rounded-full"></div>
                )}
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full mr-3",
                  location === link.href 
                    ? "bg-primary/20 text-primary" 
                    : "bg-slate-100 text-neutral-500"
                )}>
                  <link.icon className="h-4 w-4" />
                </div>
                <span className="text-sm">{link.title}</span>
              </div>
            </Link>
          ))}
          
          <div className="text-xs font-semibold text-neutral-500 mb-3 mt-6 px-3 uppercase">
            Account
          </div>
          <Link href="/profile" onClick={closeMobile} className="block">
            <div
              className={cn(
                "flex items-center px-3 py-2.5 rounded-lg transition-all duration-200",
                location === "/profile"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-neutral-600 hover:bg-slate-50 hover:text-primary"
              )}
            >
              {location === "/profile" && (
                <div className="absolute left-0 w-1 h-6 bg-primary rounded-full"></div>
              )}
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full mr-3",
                location === "/profile"
                  ? "bg-primary/20 text-primary"
                  : "bg-slate-100 text-neutral-500"
              )}>
                <User className="h-4 w-4" />
              </div>
              <span className="text-sm">Profile</span>
            </div>
          </Link>
          <div 
            className="flex items-center px-3 py-2.5 rounded-lg cursor-pointer text-neutral-600 hover:bg-slate-50 hover:text-primary transition-all duration-200 mt-1"
            onClick={handleLogout}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full mr-3 bg-slate-100 text-neutral-500">
              <LogOut className="h-4 w-4" />
            </div>
            <span className="text-sm">Logout</span>
          </div>
        </nav>
      </ScrollArea>
      <div className="p-4 border-t border-neutral-200 bg-slate-50/50">
        <div className="flex items-center px-2">
          <div className="flex-shrink-0 mr-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/90 to-indigo-600 flex items-center justify-center text-white text-xs font-medium">
              {user?.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U'}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">{user?.fullName}</p>
            <p className="text-xs text-gray-500 truncate">{user?.isAdmin ? "Administrator" : "Teacher"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
