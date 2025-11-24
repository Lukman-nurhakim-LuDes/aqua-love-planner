import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Bell, CheckCircle2, Info, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const Notifications = () => {
  const [notifs, setNotifs] = useState<any[]>([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // FIX: Tambahkan 'as any' agar TypeScript tidak protes nama tabel
    const { data } = await supabase
      .from("notifications" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    setNotifs(data || []);
    
    // Mark all as read when opening page
    if (data && data.some((n: any) => !n.is_read)) {
      await supabase
        .from("notifications" as any) // FIX: Tambahkan 'as any'
        .update({ is_read: true } as any)
        .eq("user_id", user.id)
        .eq("is_read", false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-underwater p-6 pb-24">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
           <Bell className="w-6 h-6 text-teal-green" />
           <h1 className="text-2xl font-bold text-teal-green">Notifications</h1>
        </div>

        <div className="space-y-3">
           {notifs.map((item) => (
              <Card key={item.id} className={`p-4 flex gap-4 shadow-soft border-none rounded-2xl ${!item.is_read ? 'bg-white border-l-4 border-l-primary' : 'bg-white/60'}`}>
                 <div className={`p-2 rounded-full h-fit ${!item.is_read ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                    <Info size={20} />
                 </div>
                 <div className="flex-1">
                    <h3 className={`font-semibold text-sm ${!item.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                       {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                       {item.message}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                       <Clock size={10} />
                       {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: idLocale })}
                    </p>
                 </div>
                 {!item.is_read && <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>}
              </Card>
           ))}

           {notifs.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                 <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                 <p>Belum ada notifikasi.</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;