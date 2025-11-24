import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Store, Plus, Pencil, Trash2, Phone, Instagram, ExternalLink, Search 
} from "lucide-react";
import { toast } from "sonner";

const Vendors = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [wedding, setWedding] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    category: "Venue",
    contact_phone: "",
    instagram: "",
    status: "contacted",
    notes: ""
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
      const { data } = await supabase
        .from("vendors")
        .select("*")
        .eq("wedding_id", weddingData.id)
        .order("created_at", { ascending: false });
      setVendors(data || []);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !wedding) return;

    try {
      const payload = {
        wedding_id: wedding.id,
        name: formData.name,
        category: formData.category,
        contact_phone: formData.contact_phone,
        instagram: formData.instagram,
        status: formData.status,
        notes: formData.notes
      };

      if (isEditing && editId) {
         // Update (pakai as any biar aman)
         await supabase.from("vendors").update(payload as any).eq("id", editId);
         toast.success("Vendor updated");
      } else {
         // Insert
         await supabase.from("vendors").insert(payload as any);
         toast.success("Vendor added");
      }
      resetForm();
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this vendor?")) {
      await supabase.from("vendors").delete().eq("id", id);
      toast.success("Vendor deleted");
      fetchData();
    }
  };

  const handleEdit = (item: any) => {
    setFormData({
      name: item.name,
      category: item.category,
      contact_phone: item.contact_phone || "",
      instagram: item.instagram || "",
      status: item.status,
      notes: item.notes || ""
    });
    setEditId(item.id);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ 
      name: "", category: "Venue", contact_phone: "", instagram: "", status: "contacted", notes: "" 
    });
    setIsDialogOpen(false);
    setIsEditing(false);
    setEditId(null);
  };

  // Helper Functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-700 border-green-200";
      case "booked": return "bg-blue-100 text-blue-700 border-blue-200";
      case "negotiating": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const openWhatsApp = (phone: string) => {
    if (!phone) return;
    // Format nomor HP (ganti 0 di depan jadi 62)
    let formatted = phone.replace(/\D/g, '');
    if (formatted.startsWith('0')) formatted = '62' + formatted.substring(1);
    window.open(`https://wa.me/${formatted}`, '_blank');
  };

  const openInstagram = (username: string) => {
    if (!username) return;
    const cleanUser = username.replace('@', '');
    window.open(`https://instagram.com/${cleanUser}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-underwater p-6 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
           <div>
              <h1 className="text-3xl font-bold text-teal-green">Vendors</h1>
              <p className="text-sm text-muted-foreground">Manage your dream team</p>
           </div>
           
           <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
              <DialogTrigger asChild>
                 <Button className="rounded-full shadow-floating bg-primary hover:scale-105 transition-transform">
                    <Plus className="w-5 h-5 mr-2" /> Add Vendor
                 </Button>
              </DialogTrigger>
              <DialogContent className="bg-white max-h-[80vh] overflow-y-auto">
                 <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Vendor" : "Add New Vendor"}</DialogTitle>
                 </DialogHeader>
                 <div className="space-y-4 py-4">
                    <div className="space-y-2">
                       <Label>Vendor Name</Label>
                       <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. ABC Catering" />
                    </div>
                    
                    <div className="space-y-2">
                       <Label>Category</Label>
                       <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                             <SelectItem value="Venue">Venue</SelectItem>
                             <SelectItem value="Catering">Catering</SelectItem>
                             <SelectItem value="Photography">Photography</SelectItem>
                             <SelectItem value="MUA">Make Up Artist</SelectItem>
                             <SelectItem value="Attire">Attire / Busana</SelectItem>
                             <SelectItem value="Decor">Decoration</SelectItem>
                             <SelectItem value="Music">Entertainment</SelectItem>
                             <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                       </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <Label>WhatsApp</Label>
                          <Input value={formData.contact_phone} onChange={e => setFormData({...formData, contact_phone: e.target.value})} placeholder="0812..." />
                       </div>
                       <div className="space-y-2">
                          <Label>Instagram (Username)</Label>
                          <Input value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})} placeholder="@username" />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <Label>Status</Label>
                       <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                             <SelectItem value="contacted">Baru Tanya (Contacted)</SelectItem>
                             <SelectItem value="negotiating">Nego Harga (Negotiating)</SelectItem>
                             <SelectItem value="booked">Sudah DP (Booked)</SelectItem>
                             <SelectItem value="paid">Lunas (Paid)</SelectItem>
                          </SelectContent>
                       </Select>
                    </div>

                    <div className="space-y-2">
                       <Label>Notes</Label>
                       <Input value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Catatan paket, harga, dll" />
                    </div>

                    <Button onClick={handleSave} className="w-full">{isEditing ? "Update Vendor" : "Add Vendor"}</Button>
                 </div>
              </DialogContent>
           </Dialog>
        </div>

        {/* Vendor List */}
        <div className="grid gap-4">
           {vendors.map((vendor) => (
              <Card key={vendor.id} className="p-5 shadow-soft border-none rounded-2xl group bg-white hover:shadow-md transition-all">
                 <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Store className="w-5 h-5" />
                       </div>
                       <div>
                          <h3 className="font-bold text-gray-800">{vendor.name}</h3>
                          <p className="text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full inline-block mt-1">
                             {vendor.category}
                          </p>
                       </div>
                    </div>
                    <Badge variant="outline" className={`capitalize ${getStatusColor(vendor.status)}`}>
                       {vendor.status.replace('_', ' ')}
                    </Badge>
                 </div>

                 {vendor.notes && (
                    <div className="bg-gray-50 p-3 rounded-xl text-sm text-gray-600 mb-4 border border-gray-100">
                       📝 {vendor.notes}
                    </div>
                 )}

                 <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div className="flex gap-2">
                       {vendor.contact_phone && (
                          <Button size="sm" variant="outline" className="h-8 px-3 text-green-600 border-green-200 hover:bg-green-50" onClick={() => openWhatsApp(vendor.contact_phone)}>
                             <Phone className="w-3 h-3 mr-1" /> WA
                          </Button>
                       )}
                       {vendor.instagram && (
                          <Button size="sm" variant="outline" className="h-8 px-3 text-pink-600 border-pink-200 hover:bg-pink-50" onClick={() => openInstagram(vendor.instagram)}>
                             <Instagram className="w-3 h-3 mr-1" /> IG
                          </Button>
                       )}
                    </div>

                    <div className="flex gap-1">
                       <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-primary" onClick={() => handleEdit(vendor)}>
                          <Pencil className="w-4 h-4" />
                       </Button>
                       <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={() => handleDelete(vendor.id)}>
                          <Trash2 className="w-4 h-4" />
                       </Button>
                    </div>
                 </div>
              </Card>
           ))}

           {vendors.length === 0 && (
              <div className="text-center py-12 text-muted-foreground bg-white/50 rounded-3xl border border-dashed">
                 <Store className="w-12 h-12 mx-auto mb-3 opacity-20" />
                 <p>No vendors yet.</p>
              </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default Vendors;