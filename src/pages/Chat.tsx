import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Chat = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const [wedding, setWedding] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      const { data: weddingData } = await supabase
        .from("weddings")
        .select("*")
        .or(`partner_one_id.eq.${user.id},partner_two_id.eq.${user.id}`)
        .single();

      if (weddingData) {
        setWedding(weddingData);
        fetchMessages(weddingData.id);
        subscribeToMessages(weddingData.id);
      }
      setLoading(false);
    };

    initChat();
  }, []);

  // Auto scroll ke bawah saat ada pesan baru
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const fetchMessages = async (weddingId: string) => {
    // FIX: Tambahkan 'as any'
    const { data } = await supabase
      .from("messages" as any)
      .select("*, profiles:sender_id(full_name, avatar_url)") // Join ke tabel profiles
      .eq("wedding_id", weddingId)
      .order("created_at", { ascending: true });
    
    if (data) setMessages(data);
  };

  const subscribeToMessages = (weddingId: string) => {
    supabase
      .channel("chat-room")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `wedding_id=eq.${weddingId}` },
        (payload) => {
          // Fetch ulang untuk dapat data profile pengirim
          fetchMessages(weddingId);
        }
      )
      .subscribe();
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !wedding) return;

    const msg = newMessage;
    setNewMessage(""); // Clear input biar cepat

    // FIX: Tambahkan 'as any'
    await supabase.from("messages" as any).insert({
      wedding_id: wedding.id,
      sender_id: user.id,
      content: msg
    });
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-primary"/></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-white border-b shadow-sm sticky top-0 z-10">
        <h1 className="text-lg font-bold text-teal-green text-center">Couple Chat 💬</h1>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground mt-10 text-sm">
            Belum ada pesan. Mulai obrolan dengan pasanganmu! 💕
          </div>
        )}
        
        {messages.map((msg) => {
          const isMe = msg.sender_id === user.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`flex gap-2 max-w-[80%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                
                {/* Avatar */}
                <Avatar className="w-8 h-8 mt-1 border border-gray-200">
                  <AvatarImage src={msg.profiles?.avatar_url} />
                  <AvatarFallback className="bg-gray-200 text-xs">{msg.profiles?.full_name?.charAt(0) || <User size={12}/>}</AvatarFallback>
                </Avatar>

                {/* Bubble */}
                <div 
                  className={`p-3 rounded-2xl text-sm shadow-sm ${
                    isMe 
                      ? "bg-primary text-white rounded-tr-none" 
                      : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                  }`}
                >
                  {msg.content}
                  <div className={`text-[9px] mt-1 text-right ${isMe ? "text-white/70" : "text-gray-400"}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ketik pesan..."
            className="rounded-full bg-gray-50 border-gray-200 focus-visible:ring-primary"
          />
          <Button type="submit" size="icon" className="rounded-full bg-primary hover:bg-primary/90 shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Chat;