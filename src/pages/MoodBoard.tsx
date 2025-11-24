import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette, Plus, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

const MoodBoard = () => {
  const [items, setItems] = useState<any[]>([]);
  const [wedding, setWedding] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Form State
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: "General",
    note: ""
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
      
      // Menggunakan 'as any' untuk menghindari error TypeScript sementara
      const { data } = await supabase
        .from("inspirations" as any)
        .select("*")
        .eq("wedding_id", weddingData.id)
        .order("created_at", { ascending: false });
      
      setItems(data || []);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSave = async () => {
    if (!file || !wedding) {
      toast.error("Please select an image");
      return;
    }

    setUploading(true);
    try {
      // 1. Upload Image
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${wedding.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('moodboard')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: urlData } = supabase.storage
        .from('moodboard')
        .getPublicUrl(filePath);

      // 3. Save to Database
      const { error: dbError } = await supabase
        .from("inspirations" as any)
        .insert({
          wedding_id: wedding.id,
          image_url: urlData.publicUrl,
          category: formData.category,
          note: formData.note
        });

      if (dbError) throw dbError;

      toast.success("Inspiration added! 🎨");
      setFile(null);
      setPreview(null);
      setFormData({ category: "General", note: "" });
      setIsDialogOpen(false);
      fetchData();

    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this inspiration?")) {
      await supabase.from("inspirations" as any).delete().eq("id", id);
      toast.success("Deleted");
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-underwater p-6 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
           <div>
              <h1 className="text-3xl font-bold text-teal-green">Mood Board</h1>
              <p className="text-sm text-muted-foreground">Collect your wedding ideas</p>
           </div>
           
           <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open); 
              if(!open) { setFile(null); setPreview(null); }
           }}>
              <DialogTrigger asChild>
                 <Button className="rounded-full shadow-floating bg-primary hover:scale-105 transition-transform">
                    <Plus className="w-5 h-5 mr-2" /> Upload
                 </Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                 <DialogHeader>
                    <DialogTitle>Add Inspiration</DialogTitle>
                 </DialogHeader>
                 <div className="space-y-4 py-4">
                    {/* Image Preview */}
                    <div className="flex flex-col items-center gap-4">
                       <div className="w-full h-48 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative">
                          {preview ? (
                             <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                             <div className="text-center text-gray-400">
                                <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                                <span className="text-sm">Click to upload image</span>
                             </div>
                          )}
                          <input 
                             type="file" 
                             accept="image/*" 
                             onChange={handleFileChange} 
                             className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <Label>Category</Label>
                       <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                             <SelectItem value="General">General</SelectItem>
                             <SelectItem value="Attire">Attire / Baju</SelectItem>
                             <SelectItem value="Decor">Decoration</SelectItem>
                             <SelectItem value="Venue">Venue</SelectItem>
                             <SelectItem value="Photo">Photography</SelectItem>
                             <SelectItem value="Cake">Food & Cake</SelectItem>
                          </SelectContent>
                       </Select>
                    </div>

                    <div className="space-y-2">
                       <Label>Note (Optional)</Label>
                       <Input 
                          value={formData.note} 
                          onChange={e => setFormData({...formData, note: e.target.value})} 
                          placeholder="e.g. Love this color palette" 
                       />
                    </div>

                    <Button onClick={handleSave} disabled={uploading} className="w-full">
                       {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : "Save Inspiration"}
                    </Button>
                 </div>
              </DialogContent>
           </Dialog>
        </div>

        {/* Masonry-like Grid */}
        <div className="columns-2 gap-4 space-y-4">
           {items.map((item) => (
              <div key={item.id} className="break-inside-avoid group relative">
                 <div className="relative rounded-2xl overflow-hidden shadow-soft bg-white">
                    <img 
                       src={item.image_url} 
                       alt={item.category} 
                       className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                       <p className="text-white text-xs font-medium truncate">{item.note || item.category}</p>
                       <span className="text-white/80 text-[10px]">{item.category}</span>
                    </div>
                    
                    <Button 
                       size="icon" 
                       variant="destructive" 
                       className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity scale-90 hover:scale-100"
                       onClick={() => handleDelete(item.id)}
                    >
                       <Trash2 className="w-3 h-3" />
                    </Button>
                 </div>
              </div>
           ))}
        </div>

        {items.length === 0 && (
           <div className="text-center py-12 text-muted-foreground bg-white/50 rounded-3xl border border-dashed">
              <Palette className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No inspiration yet. Upload your ideas!</p>
           </div>
        )}

      </div>
    </div>
  );
};

export default MoodBoard;