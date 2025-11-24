import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, CheckCircle2, Circle, Plus, Clock, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar"; 
import { format, differenceInDays } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";

const CalendarPage = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [weddingDate, setWeddingDate] = useState<Date | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [wedding, setWedding] = useState<any>(null);

  // State untuk Dialog Tambah Jadwal
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "General",
    time: "09:00",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch Wedding Data
    const { data: weddingData } = await supabase
      .from("weddings")
      .select("*")
      .or(`partner_one_id.eq.${user.id},partner_two_id.eq.${user.id}`)
      .single();

    if (weddingData) {
      setWedding(weddingData);
      if (weddingData.wedding_date) {
        setWeddingDate(new Date(weddingData.wedding_date));
      }

      // Fetch Tasks
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*")
        .eq("wedding_id", weddingData.id)
        .order("is_completed", { ascending: true }) // Yang belum selesai di atas
        .order("due_date", { ascending: true });
      setTasks(tasksData || []);
    }
  };

  const handleSaveSchedule = async () => {
    if (!formData.title || !wedding || !date) return;

    setLoading(true);
    try {
      const selectedDateStr = format(date, 'yyyy-MM-dd');
      const titleWithTime = `${formData.title} (${formData.time})`;

      // Tambahkan 'as any' untuk menghilangkan garis merah
      const { error } = await supabase.from("tasks").insert({
        wedding_id: wedding.id,
        title: titleWithTime,
        category: formData.category,
        due_date: selectedDateStr,
        is_completed: false
      } as any);

      if (error) throw error;

      toast.success("Jadwal berhasil ditambahkan!");
      setFormData({ title: "", category: "General", time: "09:00" });
      setIsDialogOpen(false);
      fetchData(); 
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- FUNGSI TOGGLE SELESAI (KONFIRMASI) ---
  const toggleComplete = async (task: any) => {
    // Optimistic Update
    const newStatus = !task.is_completed;
    const updatedTasks = tasks.map(t => 
        t.id === task.id ? { ...t, is_completed: newStatus } : t
    );
    setTasks(updatedTasks);

    try {
        // Tambahkan 'as any' disini juga
        const { error } = await supabase
            .from("tasks")
            .update({ is_completed: newStatus } as any)
            .eq("id", task.id);

        if (error) throw error;
        
        if (newStatus) {
            toast.success("Jadwal selesai! Kerja bagus! 🎉");
        }
        
        fetchData(); 
    } catch (error) {
        toast.error("Gagal mengupdate status");
        fetchData(); 
    }
  };

  const daysLeft = weddingDate ? differenceInDays(weddingDate, new Date()) : 0;
  const tasksForSelectedDate = tasks.filter(task => 
    task.due_date === format(date || new Date(), 'yyyy-MM-dd')
  );

  return (
    <div className="min-h-screen bg-gradient-underwater p-6 pb-24">
      <div className="max-w-md mx-auto space-y-6">
        
        <div className="text-center space-y-2 mb-8">
           <h1 className="text-2xl font-bold text-teal-green">Wedding Calendar</h1>
           {weddingDate ? (
             <div className="inline-block bg-white/80 backdrop-blur px-6 py-2 rounded-full shadow-sm text-primary font-medium border border-primary/20">
                ⏳ {daysLeft} Hari lagi menuju hari H!
             </div>
           ) : (
             <p className="text-sm text-muted-foreground">Atur tanggal pernikahan di Profil</p>
           )}
        </div>

        <Card className="p-4 rounded-3xl shadow-soft border-none bg-white/90">
           <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border-none w-full flex justify-center"
           />
        </Card>

        <div className="space-y-4">
           <div className="flex items-center justify-between">
             <h2 className="text-lg font-semibold flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary"/>
                {date ? format(date, 'd MMMM yyyy', { locale: idLocale }) : 'Hari ini'}
             </h2>
             
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                   <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-md">
                      <Plus className="w-4 h-4 mr-1" /> Add Schedule
                   </Button>
                </DialogTrigger>
                <DialogContent className="bg-white">
                   <DialogHeader>
                      <DialogTitle>Buat Jadwal Baru</DialogTitle>
                   </DialogHeader>
                   <div className="space-y-4 py-4">
                      <div className="p-3 bg-primary/10 rounded-lg text-sm text-primary flex items-center gap-2">
                         <CalendarIcon className="w-4 h-4" />
                         Tanggal: <span className="font-bold">{date ? format(date, 'dd MMMM yyyy', { locale: idLocale }) : '-'}</span>
                      </div>
                      <div className="space-y-2">
                         <Label>Nama Kegiatan</Label>
                         <Input 
                            value={formData.title} 
                            onChange={(e) => setFormData({...formData, title: e.target.value})} 
                            placeholder="Contoh: Technical Meeting Vendor" 
                         />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <Label>Kategori</Label>
                           <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="General">Umum</SelectItem>
                                 <SelectItem value="Vendor">Vendor</SelectItem>
                                 <SelectItem value="Attire">Busana</SelectItem>
                                 <SelectItem value="Admin">Admin</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                        <div className="space-y-2">
                           <Label>Jam</Label>
                           <Input 
                              type="time" 
                              value={formData.time} 
                              onChange={(e) => setFormData({...formData, time: e.target.value})} 
                           />
                        </div>
                      </div>
                      <Button onClick={handleSaveSchedule} disabled={loading} className="w-full">
                         {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Simpan Jadwal"}
                      </Button>
                   </div>
                </DialogContent>
             </Dialog>
           </div>
           
           {tasksForSelectedDate.length > 0 ? (
             tasksForSelectedDate.map(task => (
                <div 
                    key={task.id} 
                    className={`flex items-center gap-3 p-4 rounded-2xl shadow-sm border transition-all duration-300 ${task.is_completed ? 'bg-green-50/50 border-green-100 opacity-80' : 'bg-white border-gray-100'}`}
                >
                   <button 
                        onClick={() => toggleComplete(task)}
                        className="focus:outline-none transition-transform active:scale-90"
                   >
                       {task.is_completed 
                          ? <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" /> 
                          : <Circle className="w-6 h-6 text-gray-300 hover:text-primary shrink-0" />
                       }
                   </button>
                   
                   <div className="flex-1 cursor-pointer" onClick={() => toggleComplete(task)}>
                      <p className={`font-medium transition-all ${task.is_completed ? 'line-through text-muted-foreground' : 'text-gray-800'}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${task.is_completed ? 'bg-gray-200 text-gray-500' : 'bg-primary/10 text-primary'}`}>
                          {task.category}
                        </span>
                      </div>
                   </div>
                </div>
             ))
           ) : (
             <div className="text-center p-8 bg-white/50 rounded-2xl border border-dashed border-gray-300">
                <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-muted-foreground text-sm">Tidak ada jadwal di tanggal ini.</p>
             </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default CalendarPage;