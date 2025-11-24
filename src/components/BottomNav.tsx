import { Link, useLocation } from "react-router-dom";
import { Home, Calculator, Users, Calendar, User, Plus, X } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const BottomNav = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Fungsi untuk mengecek apakah menu sedang aktif
  const isActive = (path: string) => location.pathname === path;

  // Style untuk tombol biasa
  const navItemClass = (path: string) => `
    flex flex-col items-center justify-center w-full h-full space-y-1
    transition-all duration-300 ease-in-out
    ${isActive(path) ? "text-primary -translate-y-1" : "text-muted-foreground hover:text-primary/70"}
  `;

  return (
    <>
      {/* Spacer agar konten tidak tertutup menu */}
      <div className="h-24" />

      {/* Container Menu */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] pb-safe rounded-t-3xl">
        <div className="flex items-center justify-between px-6 h-20 max-w-md mx-auto relative">
          
          {/* Menu Kiri */}
          <Link to="/" className={navItemClass("/")}>
            <Home className="w-6 h-6" strokeWidth={isActive("/") ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Home</span>
          </Link>

          <Link to="/calendar" className={navItemClass("/calendar")}>
            <Calendar className="w-6 h-6" strokeWidth={isActive("/calendar") ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Calendar</span>
          </Link>

          {/* --- DIAMOND CTA (TENGAH) --- */}
          <div className="relative -top-6">
             <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <button 
                    className={`
                      w-14 h-14 bg-primary text-white shadow-floating
                      flex items-center justify-center
                      transition-all duration-500 ease-spring
                      hover:scale-110 active:scale-95
                      ${isOpen ? "rotate-[135deg] rounded-full" : "rotate-45 rounded-2xl"}
                    `}
                  >
                    {/* Icon di-counter-rotate agar tetap tegak */}
                    <Plus className={`w-8 h-8 transition-transform duration-500 ${isOpen ? "-rotate-[135deg]" : "-rotate-45"}`} />
                  </button>
                </DialogTrigger>
                
                {/* Quick Action Menu */}
                <DialogContent className="sm:max-w-md top-[70%] translate-y-[-50%]">
                   <DialogHeader>
                      <DialogTitle className="text-center text-teal-green">Quick Add</DialogTitle>
                   </DialogHeader>
                   <div className="grid grid-cols-3 gap-4 py-4">
                      <Link to="/budget" onClick={() => setIsOpen(false)} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-primary/10 transition-colors">
                         <div className="p-3 bg-green-100 text-green-600 rounded-full"><Calculator size={20}/></div>
                         <span className="text-xs font-medium">Expense</span>
                      </Link>
                      <Link to="/guests" onClick={() => setIsOpen(false)} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-primary/10 transition-colors">
                         <div className="p-3 bg-blue-100 text-blue-600 rounded-full"><Users size={20}/></div>
                         <span className="text-xs font-medium">Guest</span>
                      </Link>
                      <Link to="/tasks" onClick={() => setIsOpen(false)} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-primary/10 transition-colors">
                         <div className="p-3 bg-purple-100 text-purple-600 rounded-full"><Calendar size={20}/></div>
                         <span className="text-xs font-medium">Task</span>
                      </Link>
                   </div>
                </DialogContent>
             </Dialog>
          </div>

          {/* Menu Kanan */}
          <Link to="/guests" className={navItemClass("/guests")}>
            <Users className="w-6 h-6" strokeWidth={isActive("/guests") ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Guests</span>
          </Link>

          <Link to="/profile" className={navItemClass("/profile")}>
            <User className="w-6 h-6" strokeWidth={isActive("/profile") ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Profile</span>
          </Link>

        </div>
      </div>
    </>
  );
};

export default BottomNav;