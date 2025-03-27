import { useAuth } from "@/hooks/use-auth";
import { User, Home, GraduationCap, Calendar, School } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  const isAdmin = user?.isAdmin;
  
  const links = isAdmin
    ? [
        {
          href: "/dashboard",
          icon: Home,
          label: "Dashboard",
        },
        {
          href: "/grades",
          icon: GraduationCap,
          label: "Grades",
        },
        {
          href: "/weeklyplans",
          icon: Calendar,
          label: "Plans",
        },
        {
          href: "/profile",
          icon: User,
          label: "Profile",
        },
      ]
    : [
        {
          href: "/dashboard",
          icon: Home,
          label: "Dashboard",
        },
        {
          href: "/mygrades",
          icon: GraduationCap,
          label: "Grades",
        },
        {
          href: "/weeklyplans",
          icon: Calendar,
          label: "Plans",
        },
        {
          href: "/profile",
          icon: User,
          label: "Profile",
        },
      ];
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 flex justify-around items-center z-20">
      {links.map((link) => (
        <Link 
          key={link.href} 
          href={link.href}
          className="flex flex-col items-center py-2"
        >
          <link.icon className={cn(
            "h-5 w-5",
            location === link.href ? "text-primary" : "text-neutral-500"
          )} />
          <span className={cn(
            "text-xs mt-1",
            location === link.href ? "text-primary" : "text-neutral-500"
          )}>
            {link.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}
