import { Link, useLocation } from "react-router-dom";
import { Home, Calculator, Users, Calendar, User, Plus, Store, Palette } from "lucide-react"; 
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const BottomNav = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navItemClass = (path: string) => `
    flex flex-col items-center justify-center w-full h-full space-y-1
    transition-all duration-300 ease-in-out
    ${isActive(path) ? "text-primary -translate-y-1" : "text-muted-foreground hover:text-primary/70"}
  `;

  return (
    <>
      <div className="h-24" />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] pb-safe rounded-t-3xl">
        <div className="flex items-center justify-between px-6 h-20 max-w-md mx-auto relative">
          
          {/* Menu Home */}
          <Link to="/" className={navItemClass("/")}>
            <Home className="w-6 h-6" strokeWidth={isActive("/") ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Home</span>
          </Link>

          {/* Menu Calendar */}
          <Link to="/calendar" className={navItemClass("/calendar")}>
            <Calendar className="w-6 h-6" strokeWidth={isActive("/calendar") ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Calendar</span>
          </Link>

          {/* DIAMOND CTA (TOMBOL TENGAH) */}
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
                    <Plus className={`w-8 h-8 transition-transform duration-500 ${isOpen ? "-rotate-[135deg]" : "-rotate-45"}`} />
                  </button>
                </DialogTrigger>
                
                <DialogContent className="sm:max-w-md top-[60%] translate-y-[-50%] bg-white border border-gray-100 shadow-xl rounded-3xl p-0 overflow-hidden">
                   <div className="bg-primary/5 p-4 border-b border-primary/10">
                      <DialogHeader>
                        <DialogTitle className="text-center text-teal-green font-serif text-xl">Quick Menu</DialogTitle>
                      </DialogHeader>
                   </div>
                   
                   {/* GRID MENU: 3 KOLOM AGAR MUAT SEMUA */}
                   <div className="grid grid-cols-3 gap-3 p-5">
                      
                      {/* 1. Budget */}
                      <Link to="/budget" onClick={() => setIsOpen(false)} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 transition-colors border border-green-100 active:scale-95">
                         <Calculator size={24} className="mb-1"/>
                         <span className="text-xs font-medium">Budget</span>
                      </Link>

                      {/* 2. Guests */}
                      <Link to="/guests" onClick={() => setIsOpen(false)} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors border border-blue-100 active:scale-95">
                         <Users size={24} className="mb-1"/>
                         <span className="text-xs font-medium">Guests</span>
                      </Link>

                      {/* 3. Tasks */}
                      <Link to="/tasks" onClick={() => setIsOpen(false)} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors border border-purple-100 active:scale-95">
                         <Calendar size={24} className="mb-1"/>
                         <span className="text-xs font-medium">Tasks</span>
                      </Link>

                      {/* 4. Vendors (BARU) */}
                      <Link to="/vendors" onClick={() => setIsOpen(false)} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 transition-colors border border-orange-100 active:scale-95">
                         <Store size={24} className="mb-1"/>
                         <span className="text-xs font-medium">Vendors</span>
                      </Link>
                      
                      {/* 5. Mood Board (BARU) */}
                      <Link to="/moodboard" onClick={() => setIsOpen(false)} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 transition-colors border border-pink-100 active:scale-95">
                         <Palette size={24} className="mb-1"/>
                         <span className="text-xs font-medium">Mood Board</span>
                      </Link>

                   </div>
                </DialogContent>
             </Dialog>
          </div>

          {/* Menu Guests */}
          <Link to="/guests" className={navItemClass("/guests")}>
            <Users className="w-6 h-6" strokeWidth={isActive("/guests") ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Guests</span>
          </Link>

          {/* Menu Profile */}
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