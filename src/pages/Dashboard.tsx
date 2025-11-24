import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  CalendarDays, 
  CheckCircle2, 
  Users, 
  Wallet, 
  ArrowRight,
  Loader2 
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  
  // STATE DEFINITIONS (Dengan tipe 'any' untuk mencegah error TypeScript)
  const [profile, setProfile] = useState<any>(null);
  const [wedding, setWedding] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Stats State
  const [daysLeft, setDaysLeft] = useState(0);
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0, today: 0 });
  const [guestStats, setGuestStats] = useState({ total: 0, attending: 0 });
  const [budgetStats, setBudgetStats] = useState({ estimated: 0, paid: 0 });
  
  // Next Priority Task
  const [nextTask, setNextTask] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // 1. Fetch Profile (Nama User)
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      setProfile(profileData);

      // 2. Fetch Wedding Data
      const { data: weddingData } = await supabase
        .from("weddings")
        .select("*")
        .or(`partner_one_id.eq.${user.id},partner_two_id.eq.${user.id}`)
        .single();

      if (weddingData) {
        setWedding(weddingData);
        
        // Hitung Countdown Hari
        if (weddingData.wedding_date) {
          const today = new Date();
          const wDate = new Date(weddingData.wedding_date);
          const diff = differenceInDays(wDate, today);
          setDaysLeft(diff > 0 ? diff : 0);
        }

        // 3. Fetch Tasks & Hitung Statistik
        const { data: tasks } = await supabase
          .from("tasks")
          .select("*")
          .eq("wedding_id", weddingData.id);
        
        if (tasks) {
          const total = tasks.length;
          // Pakai 'any' di filter untuk aman dari strict type checking sementara
          const completed = tasks.filter((t: any) => t.is_completed).length;
          
          // Cari tugas hari ini
          const todayStr = format(new Date(), 'yyyy-MM-dd');
          const todayTasks = tasks.filter((t: any) => t.due_date === todayStr && !t.is_completed).length;

          // Cari tugas terdekat yang belum selesai (Next Priority)
          const upcoming = tasks
            .filter((t: any) => !t.is_completed && t.due_date)
            .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];

          setTaskStats({ total, completed, today: todayTasks });
          setNextTask(upcoming);
        }

        // 4. Fetch Guest Stats
        const { data: guests } = await supabase
          .from("guests")
          .select("pax, status")
          .eq("wedding_id", weddingData.id);

        if (guests) {
          const totalInvited = guests.length;
          // Hitung total pax (orang) yang confirm hadir
          const totalPaxAttending = guests
            .filter((g: any) => g.status === 'attending')
            .reduce((sum: number, g: any) => sum + (g.pax || 1), 0);
            
          setGuestStats({ total: totalInvited, attending: totalPaxAttending });
        }

        // 5. Fetch Budget Stats
        const { data: budgets } = await supabase
          .from("budget_items")
          .select("estimated_cost, actual_cost, status")
          .eq("wedding_id", weddingData.id);

        if (budgets) {
          // Hitung total estimasi
          const totalEst = budgets.reduce((sum: number, b: any) => sum + Number(b.estimated_cost || 0), 0);
          // Hitung yang sudah dibayar (Paid)
          const totalPaid = budgets
            .filter((b: any) => b.status === 'paid')
            .reduce((sum: number, b: any) => sum + Number(b.estimated_cost || 0), 0);

          setBudgetStats({ estimated: totalEst, paid: totalPaid });
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Format Rupiah Singkat (1.5 Jt / 500 Rb)
  const formatRupiahShort = (amount: number) => {
    if (amount >= 1000000) {
      return `Rp ${(amount / 1000000).toFixed(1)} Jt`;
    }
    if (amount >= 1000) {
      return `Rp ${(amount / 1000).toFixed(0)} Rb`;
    }
    return `Rp ${amount}`;
  };

  // Kalkulasi Progress Bar (0-100)
  const taskProgress = taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-underwater">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-underwater p-6 pb-32">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* --- HEADER: GREETING & COUNTDOWN --- */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-teal-green">
              Hi, {profile?.full_name?.split(' ')[0] || 'Partner'}! 👋
            </h1>
            <p className="text-sm text-muted-foreground">
              {daysLeft > 0 
                ? `${daysLeft} hari menuju hari bahagia!` 
                : "Hari ini adalah hari bahagiamu! 💍"}
            </p>
          </div>
          {/* Circular Countdown Mini */}
          <div className="w-16 h-16 rounded-full bg-white shadow-soft flex flex-col items-center justify-center border-4 border-primary/10">
            <span className="text-xl font-bold text-primary leading-none">{daysLeft}</span>
            <span className="text-[10px] text-muted-foreground">Hari</span>
          </div>
        </div>

        {/* --- HERO CARD: NEXT TASK & PROGRESS --- */}
        <Card className="bg-primary text-white p-6 rounded-3xl shadow-floating relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          
          <div className="relative z-10">
            {/* Tanggal Pernikahan */}
            <div className="flex items-center gap-2 mb-2 opacity-90">
               <CalendarDays className="w-5 h-5" />
               <span className="text-sm font-medium">
                 {wedding?.wedding_date 
                   ? format(new Date(wedding.wedding_date), 'dd MMMM yyyy', { locale: idLocale }) 
                   : 'Belum set tanggal'}
               </span>
            </div>
            
            {/* Tugas Prioritas Berikutnya */}
            <div className="mt-4">
              <p className="text-primary-foreground/80 text-xs uppercase tracking-wider mb-1">
                Prioritas Selanjutnya
              </p>
              {nextTask ? (
                <div>
                  <h3 className="text-xl font-bold truncate">{nextTask.title}</h3>
                  <div className="text-sm opacity-90 mt-1 flex items-center gap-2 flex-wrap">
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                      {nextTask.category}
                    </span>
                    {nextTask.due_date && (
                      <span className="text-xs">
                         Tenggat: {format(new Date(nextTask.due_date), 'd MMM', { locale: idLocale })}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm opacity-90">Tidak ada tugas mendesak. Santai sejenak! ☕</p>
              )}
            </div>

            {/* Progress Bar Tugas */}
            <div className="mt-6">
               <div className="flex justify-between text-xs mb-1 opacity-80">
                  <span>Persiapan Tugas</span>
                  <span>{Math.round(taskProgress)}%</span>
               </div>
               <Progress value={taskProgress} className="h-2 bg-black/20" indicatorClassName="bg-white" />
            </div>
          </div>
        </Card>

        {/* --- STATS GRID (BUDGET & TAMU) --- */}
        <div className="grid grid-cols-2 gap-4">
           {/* Card 1: Budget */}
           <div 
             onClick={() => navigate('/budget')}
             className="bg-white p-4 rounded-3xl shadow-soft flex flex-col justify-between h-32 cursor-pointer hover:shadow-md transition-all active:scale-95 border border-transparent hover:border-green-100"
           >
              <div className="flex justify-between items-start">
                 <div className="p-2 bg-green-100 text-green-600 rounded-full">
                    <Wallet className="w-5 h-5" />
                 </div>
                 <ArrowRight className="w-4 h-4 text-gray-300" />
              </div>
              <div>
                 <p className="text-muted-foreground text-xs">Budget Terbayar</p>
                 <h3 className="text-lg font-bold text-gray-800">
                    {formatRupiahShort(budgetStats.paid)}
                 </h3>
                 <p className="text-[10px] text-muted-foreground mt-1">
                    dari total {formatRupiahShort(budgetStats.estimated)}
                 </p>
              </div>
           </div>

           {/* Card 2: Guests */}
           <div 
             onClick={() => navigate('/guests')}
             className="bg-white p-4 rounded-3xl shadow-soft flex flex-col justify-between h-32 cursor-pointer hover:shadow-md transition-all active:scale-95 border border-transparent hover:border-blue-100"
           >
              <div className="flex justify-between items-start">
                 <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                    <Users className="w-5 h-5" />
                 </div>
                 <ArrowRight className="w-4 h-4 text-gray-300" />
              </div>
              <div>
                 <p className="text-muted-foreground text-xs">Tamu Hadir</p>
                 <h3 className="text-lg font-bold text-gray-800">
                    {guestStats.attending} <span className="text-sm font-normal">Pax</span>
                 </h3>
                 <p className="text-[10px] text-muted-foreground mt-1">
                    dari {guestStats.total} undangan
                 </p>
              </div>
           </div>
        </div>

        {/* --- TODAY'S FOCUS SECTION --- */}
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-5 border border-white shadow-sm">
           <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-teal-green" />
              <h3 className="font-semibold text-gray-800">Progress Hari Ini</h3>
           </div>
           
           <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
                 <p className="text-3xl font-bold text-primary">{taskStats.today}</p>
                 <p className="text-xs text-muted-foreground">Tugas Hari Ini</p>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
                 <p className="text-3xl font-bold text-green-600">{taskStats.completed}</p>
                 <p className="text-xs text-muted-foreground">Total Selesai</p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;