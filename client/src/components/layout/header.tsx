import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Menu } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface HeaderProps {
  title: string;
  toggleSidebar: () => void;
}

export function Header({ title, toggleSidebar }: HeaderProps) {
  const { user } = useAuth();
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <header className="bg-white shadow-sm border-b border-neutral-200 py-3 px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="md:hidden mr-4 rounded-full hover:bg-neutral-100" onClick={toggleSidebar}>
          <Menu className="h-5 w-5 text-neutral-700" />
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <div className="mr-1 text-neutral-700 text-sm font-medium hidden sm:flex items-center">
          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary mr-2">
            {user?.isAdmin ? "Admin" : "Teacher"}
          </span>
          {user?.fullName}
        </div>
        <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
          <AvatarFallback className="bg-gradient-to-br from-primary/90 to-indigo-600 text-white font-medium">
            {user?.fullName ? getInitials(user.fullName) : "U"}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
