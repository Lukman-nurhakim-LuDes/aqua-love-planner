import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MapPin, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import underwaterDecoration from "@/assets/underwater-decoration.png";

const Invitation = () => {
  const { weddingId } = useParams(); // Mengambil Wedding ID dari link URL
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [weddingData, setWeddingData] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    pax: "1",
    status: "attending",
    message: ""
  });

  // Ambil detail pernikahan (Tanggal & Lokasi) saat halaman dibuka
  useEffect(() => {
    if (weddingId) fetchWeddingDetails();
  }, [weddingId]);

  const fetchWeddingDetails = async () => {
    const { data } = await supabase
      .from("weddings")
      .select("venue, wedding_date") 
      .eq("id", weddingId)
      .single();
    
    if (data) setWeddingData(data);
  };

  const handleSubmit = async () => {
    if (!formData.name || !weddingId) {
        toast.error("Mohon isi nama Anda");
        return;
    }
    setLoading(true);

    try {
      // Insert data tamu baru ke database
      const { error } = await supabase.from("guests").insert({
        wedding_id: weddingId,
        name: formData.name,
        category: "Friend", // Default kategori untuk tamu link
        pax: parseInt(formData.pax),
        status: formData.status,
        message: formData.message
      } as any);

      if (error) throw error;
      
      setSubmitted(true);
      toast.success("Konfirmasi berhasil terkirim!");
    } catch (e: any) {
      console.error(e);
      toast.error("Gagal mengirim RSVP. Pastikan link benar.");
    } finally {
      setLoading(false);
    }
  };

  // Tampilan setelah tamu berhasil submit
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-teal-green rounded-full flex items-center justify-center mb-6 animate-bounce shadow-lg">
           <Heart className="w-12 h-12 text-white fill-current" />
        </div>
        <h1 className="text-3xl font-serif text-teal-green mb-4">Terima Kasih!</h1>
        <p className="text-gray-600 text-lg">Konfirmasi kehadiran Anda telah kami terima.</p>
        <p className="text-sm text-muted-foreground mt-8">Sampai jumpa di hari bahagia kami.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] relative overflow-hidden font-sans">
      {/* Hiasan Background */}
      <img src={underwaterDecoration} className="absolute top-0 left-0 w-full opacity-10 pointer-events-none object-cover h-64" />
      
      <div className="relative z-10 max-w-md mx-auto p-6 pt-16 pb-24">
        
        {/* Header Undangan */}
        <div className="text-center mb-12 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-1000">
           <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">The Wedding Of</p>
           <h1 className="text-5xl font-serif text-teal-green py-2">Romeo & Juliet</h1>
           
           {weddingData ? (
               <div className="flex flex-col items-center gap-2 mt-4 text-sm text-gray-600">
                  <p className="flex items-center gap-2 bg-white/50 px-4 py-1 rounded-full backdrop-blur-sm">
                    <Calendar className="w-4 h-4 text-primary" /> 
                    {weddingData.wedding_date || "Tanggal Menyusul"}
                  </p>
                  <p className="flex items-center gap-2 bg-white/50 px-4 py-1 rounded-full backdrop-blur-sm">
                    <MapPin className="w-4 h-4 text-primary" /> 
                    {weddingData.venue || "Lokasi Menyusul"}
                  </p>
               </div>
           ) : (
             <div className="h-12"></div> // Spacer jika loading
           )}
        </div>

        {/* Kartu Form RSVP */}
        <Card className="p-8 shadow-xl border-none bg-white/80 backdrop-blur-md rounded-[2rem] animate-in zoom-in-95 duration-500">
           <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-800">RSVP</h2>
              <p className="text-muted-foreground text-sm mt-1">Mohon konfirmasi kehadiran Anda</p>
           </div>
           
           <div className="space-y-5">
              <div className="space-y-2">
                 <Label className="text-gray-600">Nama Lengkap</Label>
                 <Input 
                    placeholder="Nama Anda" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="bg-white border-gray-200 focus:border-primary h-12"
                 />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label className="text-gray-600">Jumlah Hadir</Label>
                    <Input 
                       type="number" 
                       min="1" 
                       max="10"
                       value={formData.pax} 
                       onChange={e => setFormData({...formData, pax: e.target.value})}
                       className="bg-white border-gray-200 focus:border-primary h-12"
                    />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-gray-600">Konfirmasi</Label>
                    <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                       <SelectTrigger className="bg-white border-gray-200 h-12"><SelectValue /></SelectTrigger>
                       <SelectContent>
                          <SelectItem value="attending">Hadir</SelectItem>
                          <SelectItem value="declined">Berhalangan</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
              </div>

              <div className="space-y-2">
                 <Label className="text-gray-600">Ucapan & Doa (Opsional)</Label>
                 <Textarea 
                    placeholder="Tulis ucapan selamat..." 
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                    className="bg-white border-gray-200 focus:border-primary min-h-[100px]"
                 />
              </div>

              <Button 
                onClick={handleSubmit} 
                disabled={loading} 
                className="w-full h-14 text-lg bg-teal-green hover:bg-teal-green/90 rounded-xl shadow-lg shadow-teal-green/20 transition-all hover:scale-[1.02]"
              >
                 {loading ? <Loader2 className="animate-spin" /> : "Kirim Konfirmasi"}
              </Button>
           </div>
        </Card>

        <p className="text-center text-xs text-muted-foreground/60 mt-8">
           &copy; 2025 Wedding Planner Couple
        </p>
      </div>
    </div>
  );
};

export default Invitation;