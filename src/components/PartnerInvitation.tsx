import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, HeartHandshake, ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const PartnerInvitation = () => {
  const [wedding, setWedding] = useState<any>(null);
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    getWeddingData();
  }, []);

  const getWeddingData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUser(user);

    const { data } = await supabase
      .from("weddings")
      .select("*")
      .or(`partner_one_id.eq.${user.id},partner_two_id.eq.${user.id}`)
      .single();

    if (data) {
      setWedding(data);
    }
  };

  const copyWeddingID = () => {
    if (wedding?.id) {
      navigator.clipboard.writeText(wedding.id);
      toast.success("Wedding ID copied! Send this to your partner.");
    }
  };

  const joinWedding = async () => {
    if (!joinCode) {
      toast.error("Please enter a valid Wedding ID");
      return;
    }

    if (wedding?.id === joinCode) {
      toast.error("You cannot join your own wedding ID!");
      return;
    }

    setLoading(true);
    try {
      // 1. Cek validasi wedding target
      const { data: targetWedding, error: fetchError } = await supabase
        .from("weddings")
        .select("*")
        .eq("id", joinCode)
        .single();

      if (fetchError || !targetWedding) {
        toast.error("Wedding ID not found. Please check again.");
        setLoading(false);
        return;
      }

      if (targetWedding.partner_two_id) {
        toast.error("This wedding is already full (has 2 partners).");
        setLoading(false);
        return;
      }

      // 2. Hapus wedding "sementara" milik user saat ini (jika ada)
      //    karena Profile.tsx otomatis membuatkan wedding kosong saat login.
      //    Kita harus menghapusnya agar user tidak punya 2 wedding.
      if (wedding && wedding.partner_one_id === currentUser.id && !wedding.partner_two_id) {
         // Pastikan hanya menghapus jika belum ada data penting (opsional, tapi aman untuk akun baru)
         const { error: deleteError } = await supabase
           .from("weddings")
           .delete()
           .eq("id", wedding.id);
         
         if (deleteError) {
           console.error("Error deleting temp wedding:", deleteError);
           // Lanjut saja, mungkin tidak fatal tapi idealnya bersih
         }
      }

      // 3. Update wedding target: Masukkan user ini sebagai partner_two
      const { error: updateError } = await supabase
        .from("weddings")
        .update({ partner_two_id: currentUser.id })
        .eq("id", joinCode);

      if (updateError) throw updateError;

      toast.success("Success! You are now connected with your partner.");
      
      // Reload halaman agar semua data (Budget, Guests) ter-refresh ke data partner
      window.location.reload(); 
      
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to join wedding: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!wedding) return null;

  const isConnected = !!wedding.partner_two_id;

  return (
    <Card className="bg-card shadow-soft border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-teal-green">
           <HeartHandshake className="w-6 h-6" /> 
           Partner Connection
        </CardTitle>
        <CardDescription>
          {isConnected 
            ? "Collaboration is active! You manage this wedding together." 
            : "Connect with your partner to manage expenses and guests together."}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {isConnected ? (
           <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-center gap-2 text-primary font-medium">
              <span>✅ Connected to Wedding ID:</span>
              <span className="font-mono text-sm">{wedding.id.slice(0, 8)}...</span>
           </div>
        ) : (
          <>
            {/* Opsi 1: Bagikan Kode (User A) */}
            <div className="space-y-3">
              <Label className="text-foreground/80">Option 1: Invite Partner</Label>
              <div className="flex gap-2">
                <Input value={wedding.id} readOnly className="bg-muted font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={copyWeddingID} className="shrink-0">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Copy this ID and send it to your partner.
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            {/* Opsi 2: Join Kode (User B) */}
            <div className="space-y-3">
              <Label className="text-foreground/80">Option 2: Join Partner's Wedding</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Paste Partner's Wedding ID here" 
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="bg-white"
                />
                <Button onClick={joinWedding} disabled={loading} className="shrink-0">
                  {loading ? "..." : <ArrowRight className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the ID your partner gave you to sync data.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PartnerInvitation;