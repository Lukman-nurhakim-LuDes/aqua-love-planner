import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Pencil, Trash2, Search, Link2, Copy } from "lucide-react"; // Tambah Copy/Link2
import { toast } from "sonner";

const Guests = () => {
  const [guests, setGuests] = useState<any[]>([]);
  const [wedding, setWedding] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // State Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    category: "Friend",
    status: "pending",
    pax: "1"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: weddingData } = await supabase
      .from("weddings")
      .select("*")
      .or(`partner_one_id.eq.${user.id},partner_two_id.eq.${user.id}`)
      .single();

    if (weddingData) {
      setWedding(weddingData);
      const { data: guestsData } = await supabase
        .from("guests")
        .select("*")
        .eq("wedding_id", weddingData.id)
        .order("name", { ascending: true });
      setGuests(guestsData || []);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !wedding) return;

    try {
      if (isEditing && editId) {
         // UPDATE
         const { error } = await supabase.from("guests").update({
            name: formData.name,
            category: formData.category,
            status: formData.status,
            pax: parseInt(formData.pax)
         } as any).eq("id", editId);
         if (error) throw error;
         toast.success("Guest updated");
      } else {
         // INSERT
         const { error } = await supabase.from("guests").insert({
            wedding_id: wedding.id,
            name: formData.name,
            category: formData.category,
            status: formData.status,
            pax: parseInt(formData.pax)
         } as any);
         if (error) throw error;
         toast.success("Guest added");
      }
      
      resetForm();
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this guest?")) {
      await supabase.from("guests").delete().eq("id", id);
      toast.success("Guest deleted");
      fetchData();
    }
  };

  const handleEdit = (item: any) => {
    setFormData({
      name: item.name,
      category: item.category,
      status: item.status,
      pax: item.pax.toString()
    });
    setEditId(item.id);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: "", category: "Friend", status: "pending", pax: "1" });
    setIsDialogOpen(false);
    setIsEditing(false);
    setEditId(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "attending": return "bg-green-100 text-green-700 hover:bg-green-200";
      case "declined": return "bg-red-100 text-red-700 hover:bg-red-200";
      default: return "bg-gray-100 text-gray-700 hover:bg-gray-200";
    }
  };

  const totalPax = guests.reduce((sum, g) => sum + (g.status === 'attending' ? g.pax : 0), 0);

  // Fungsi Copy Link
  const copyInviteLink = () => {
    if (!wedding) return;
    const url = `${window.location.origin}/invite/${wedding.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link undangan disalin! Siap disebar.");
  };

  return (
    <div className="min-h-screen bg-gradient-underwater p-6 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header Update */}
        <div className="flex items-center justify-between">
           <div>
              <h1 className="text-3xl font-bold text-teal-green">Guest List</h1>
              <p className="text-sm text-muted-foreground">{guests.length} Invitations • {totalPax} Attending</p>
           </div>
           
           <div className="flex gap-2">
              {/* TOMBOL BARU: SHARE LINK */}
              <Button 
                size="icon" 
                variant="outline" 
                className="rounded-full border-primary/30 text-primary hover:bg-primary/10 bg-white"
                onClick={copyInviteLink}
                title="Salin Link Undangan"
              >
                <Link2 className="w-5 h-5" />
              </Button>

              <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
                  <DialogTrigger asChild>
                     <Button className="rounded-full shadow-floating bg-primary hover:scale-105 transition-transform">
                        <Plus className="w-5 h-5" /> <span className="hidden sm:inline ml-2">Add Guest</span>
                     </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white">
                     <DialogHeader>
                        <DialogTitle>{isEditing ? "Edit Guest" : "Add New Guest"}</DialogTitle>
                     </DialogHeader>
                     <div className="space-y-4 py-4">
                        <div className="space-y-2">
                           <Label>Full Name</Label>
                           <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <Label>Category</Label>
                              <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                                 <SelectTrigger><SelectValue /></SelectTrigger>
                                 <SelectContent>
                                    <SelectItem value="Family">Family</SelectItem>
                                    <SelectItem value="Friend">Friend</SelectItem>
                                    <SelectItem value="Colleague">Colleague</SelectItem>
                                    <SelectItem value="VIP">VIP</SelectItem>
                                 </SelectContent>
                              </Select>
                           </div>
                           <div className="space-y-2">
                              <Label>Pax (Orang)</Label>
                              <Input type="number" value={formData.pax} onChange={e => setFormData({...formData, pax: e.target.value})} />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <Label>RSVP Status</Label>
                           <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="pending">Pending (Belum Jawab)</SelectItem>
                                 <SelectItem value="attending">Attending (Hadir)</SelectItem>
                                 <SelectItem value="declined">Declined (Tidak Hadir)</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                        <Button onClick={handleSave} className="w-full">{isEditing ? "Update Guest" : "Add Guest"}</Button>
                     </div>
                  </DialogContent>
              </Dialog>
           </div>
        </div>

        {/* Guest List */}
        <div className="space-y-3">
           {guests.map((guest) => (
              <Card key={guest.id} className="p-4 flex items-center justify-between shadow-soft border-none rounded-2xl group bg-white">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                       {guest.name.charAt(0)}
                    </div>
                    <div>
                       <h3 className="font-semibold text-gray-800">{guest.name}</h3>
                       <div className="flex gap-2 text-xs mt-1">
                          <span className="text-muted-foreground">{guest.category}</span>
                          <span className="text-muted-foreground">• {guest.pax} pax</span>
                       </div>
                       {/* Tampilkan pesan jika ada */}
                       {guest.message && (
                          <p className="text-xs text-gray-500 mt-1 italic">"{guest.message}"</p>
                       )}
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-3">
                    <Badge className={`capitalize ${getStatusColor(guest.status)}`}>
                       {guest.status}
                    </Badge>
                    
                    <div className="flex gap-1">
                       <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-primary" onClick={() => handleEdit(guest)}>
                          <Pencil className="w-4 h-4" />
                       </Button>
                       <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={() => handleDelete(guest.id)}>
                          <Trash2 className="w-4 h-4" />
                       </Button>
                    </div>
                 </div>
              </Card>
           ))}
           
           {guests.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                 <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                 <p>No guests yet. Start inviting!</p>
              </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default Guests;