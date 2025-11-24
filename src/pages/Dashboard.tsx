import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, Heart, CheckCircle2 } from "lucide-react";
import underwaterDecoration from "@/assets/underwater-decoration.png";
import coupleAvatars from "@/assets/couple-avatars.png";

const Dashboard = () => {
  const [wedding, setWedding] = useState<any>(null);
  const [stats, setStats] = useState({ tasksCompleted: 0, totalTasks: 0, guestCount: 0 });
  const [daysUntilWedding, setDaysUntilWedding] = useState<number | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch wedding
    const { data: weddingData } = await supabase
      .from("weddings")
      .select("*")
      .or(`partner_one_id.eq.${user.id},partner_two_id.eq.${user.id}`)
      .single();

    if (weddingData) {
      setWedding(weddingData);
      
      // Calculate days until wedding
      if (weddingData.wedding_date) {
        const weddingDate = new Date(weddingData.wedding_date);
        const today = new Date();
        const diffTime = weddingDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysUntilWedding(diffDays);
      }

      // Fetch tasks stats
      const { data: tasks } = await supabase
        .from("tasks")
        .select("status")
        .eq("wedding_id", weddingData.id);

      const completed = tasks?.filter(t => t.status === "completed").length || 0;
      const total = tasks?.length || 0;

      // Fetch guests count
      const { count: guestCount } = await supabase
        .from("guests")
        .select("*", { count: "exact", head: true })
        .eq("wedding_id", weddingData.id);

      setStats({
        tasksCompleted: completed,
        totalTasks: total,
        guestCount: guestCount || 0,
      });
    }
  };

  const progressPercentage = stats.totalTasks > 0 
    ? (stats.tasksCompleted / stats.totalTasks) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-underwater p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header with couple avatars */}
        <div className="text-center space-y-4">
          <img 
            src={coupleAvatars} 
            alt="Couple" 
            className="w-32 h-32 mx-auto rounded-full shadow-floating"
          />
          <h1 className="text-3xl font-bold text-teal-green">Our Wedding Journey</h1>
          {wedding?.wedding_date && (
            <p className="text-muted-foreground">
              {new Date(wedding.wedding_date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          )}
        </div>

        {/* Countdown Circle */}
        <Card className="bg-card shadow-card rounded-3xl p-8 text-center">
          <div className="relative inline-flex items-center justify-center">
            <svg className="w-48 h-48">
              <circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="8"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="8"
                strokeDasharray={`${progressPercentage * 5.53}, 553`}
                strokeLinecap="round"
                transform="rotate(-90 96 96)"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-5xl font-bold text-primary">
                {daysUntilWedding !== null ? daysUntilWedding : "—"}
              </div>
              <div className="text-sm text-muted-foreground mt-2">days to go</div>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Today's goal: {stats.tasksCompleted} completed</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tomorrow's goal: {stats.totalTasks - stats.tasksCompleted} remaining</span>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-card shadow-soft rounded-2xl p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">{stats.tasksCompleted}</div>
            <div className="text-xs text-muted-foreground">Tasks Done</div>
          </Card>

          <Card className="bg-card shadow-soft rounded-2xl p-4 text-center">
            <Heart className="w-8 h-8 text-soft-blush mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">{stats.guestCount}</div>
            <div className="text-xs text-muted-foreground">Guests</div>
          </Card>

          <Card className="bg-card shadow-soft rounded-2xl p-4 text-center">
            <Calendar className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">{stats.totalTasks}</div>
            <div className="text-xs text-muted-foreground">Total Tasks</div>
          </Card>
        </div>

        {/* Progress Section */}
        <Card className="bg-card shadow-card rounded-3xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Overall Progress</h3>
          <Progress value={progressPercentage} className="h-3 mb-2" />
          <p className="text-sm text-muted-foreground text-right">
            {Math.round(progressPercentage)}% Complete
          </p>
        </Card>

        {/* Underwater Decoration */}
        <div className="relative -mx-6">
          <img 
            src={underwaterDecoration} 
            alt="Underwater decoration" 
            className="w-full h-32 object-cover object-top opacity-80"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;