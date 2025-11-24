import { NavLink } from "@/components/NavLink";
import { Home, CheckSquare, Users, DollarSign, User } from "lucide-react";

const BottomNav = () => {
  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/tasks", icon: CheckSquare, label: "Tasks" },
    { to: "/guests", icon: Users, label: "Guests" },
    { to: "/budget", icon: DollarSign, label: "Budget" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-floating z-50">
      <div className="max-w-2xl mx-auto flex items-center justify-around h-16 px-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors"
            activeClassName="text-primary"
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;