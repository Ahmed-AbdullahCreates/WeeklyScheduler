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
    <header className="bg-white shadow-sm border-b border-neutral-200 py-4 px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="md:hidden mr-4" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-medium text-neutral-800">{title}</h2>
      </div>
      <div className="flex items-center">
        <div className="mr-4 text-neutral-700 text-sm font-medium hidden sm:block">
          {user?.fullName}
        </div>
        <Avatar className="h-8 w-8 bg-neutral-300">
          <AvatarFallback className="text-neutral-700 text-sm">
            {user?.fullName ? getInitials(user.fullName) : "U"}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
