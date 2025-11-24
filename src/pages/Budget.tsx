import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Banknote, 
  TrendingUp, 
  Trash2, 
  Pencil, 
  CheckCircle2, 
  Clock, 
  Wallet 
} from "lucide-react"; 
import { Progress } from "@/components/ui/progress";
import underwaterDecoration from "@/assets/underwater-decoration.png";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Budget = () => {
  const [budgetItems, setBudgetItems] = useState<any[]>([]);
  const [wedding, setWedding] = useState<any>(null);
  
  // State untuk Form
  const [newItem, setNewItem] = useState({ 
    category: "", 
    item_name: "", 
    estimated_cost: "",
    status: "planned" 
  });
  
  // State untuk Dialog & Editing
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    fetchBudgetItems();
  }, []);

  const fetchBudgetItems = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: weddingData } = await supabase
      .from("weddings")
      .select("*")
      .or(`partner_one_id.eq.${user.id},partner_two_id.eq.${user.id}`)
      .single();

    if (weddingData) {
      setWedding(weddingData);
      const { data: budgetData } = await supabase
        .from("budget_items")
        .select("*")
        .eq("wedding_id", weddingData.id)
        .order("created_at", { ascending: false });
      setBudgetItems(budgetData || []);
    }
  };

  // --- FUNGSI SIMPAN (CREATE / UPDATE) ---
  const saveBudgetItem = async () => {
    if (!newItem.item_name || !newItem.estimated_cost || !wedding) return;

    try {
      const payload = {
        wedding_id: wedding.id,
        category: newItem.category,
        item_name: newItem.item_name,
        estimated_cost: parseFloat(newItem.estimated_cost),
        status: newItem.status,
      };

      if (isEditing && editId) {
        const { error } = await supabase
          .from("budget_items")
          .update(payload)
          .eq("id", editId);
          
        if (error) throw error;
        toast.success("Item updated successfully!");
      } else {
        const { error } = await supabase
          .from("budget_items")
          .insert(payload);

        if (error) throw error;
        toast.success("Budget item added!");
      }

      resetForm();
      fetchBudgetItems();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // --- FUNGSI UPDATE STATUS CEPAT ---
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("budget_items")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      // Feedback user
      if (newStatus === 'paid') toast.success("Marked as Paid! 💸");
      else if (newStatus === 'booked') toast.success("Marked as DP / Booked! 📝");
      else toast.info("Status updated to Pending");

      fetchBudgetItems();
    } catch (error: any) {
      toast.error("Failed to update status");
    }
  };

  // --- FUNGSI DELETE ---
  const deleteBudgetItem = async (id: string) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      const { error } = await supabase.from("budget_items").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete");
      } else {
        toast.success("Item deleted");
        fetchBudgetItems();
      }
    }
  };

  // --- FUNGSI PREPARE EDIT ---
  const handleEditClick = (item: any) => {
    setNewItem({
      category: item.category || "other",
      item_name: item.item_name,
      estimated_cost: item.estimated_cost.toString(),
      status: item.status
    });
    setEditId(item.id);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setNewItem({ category: "", item_name: "", estimated_cost: "", status: "planned" });
    setIsDialogOpen(false);
    setIsEditing(false);
    setEditId(null);
  };

  const totalEstimated = budgetItems.reduce((sum, item) => sum + (parseFloat(item.estimated_cost) || 0), 0);
  const totalPaid = budgetItems
    .filter(item => item.status === "paid")
    .reduce((sum, item) => sum + (parseFloat(item.actual_cost || item.estimated_cost) || 0), 0);

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Helper untuk Label Status UI
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid": return "Paid";
      case "booked": return "DP / Booked";
      default: return "Pending";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-700 hover:bg-green-200 border-green-200";
      case "booked": return "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200";
      default: return "bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid": return <CheckCircle2 className="w-3 h-3 mr-1" />;
      case "booked": return <Wallet className="w-3 h-3 mr-1" />;
      default: return <Clock className="w-3 h-3 mr-1" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-underwater p-6 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-teal-green">Budget</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track expenses together
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm(); 
          }}>
            <DialogTrigger asChild>
              {/* DIAMOND CTA BUTTON */}
              <Button 
                className="w-14 h-14 rounded-2xl rotate-45 bg-primary hover:bg-primary/90 shadow-floating transition-transform hover:scale-105 active:scale-95 flex items-center justify-center"
              >
                <Plus className="w-8 h-8 -rotate-45 text-white" />
              </Button>
            </DialogTrigger>
            
            <DialogContent className="bg-card">
              <DialogHeader>
                <DialogTitle>{isEditing ? "Edit Item" : "Add Budget Item"}</DialogTitle>
                <DialogDescription>
                  {isEditing ? "Update your expense details." : "Input your estimated expense here."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Category</Label>
                  <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="venue">Venue</SelectItem>
                      <SelectItem value="catering">Catering</SelectItem>
                      <SelectItem value="flowers">Flowers</SelectItem>
                      <SelectItem value="photography">Photography</SelectItem>
                      <SelectItem value="dress">Dress & Attire</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Item Name</Label>
                  <Input
                    value={newItem.item_name}
                    onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                    placeholder="e.g., Venue deposit"
                  />
                </div>
                <div>
                  <Label>Estimated Cost (Rp)</Label>
                  <Input
                    type="number"
                    value={newItem.estimated_cost}
                    onChange={(e) => setNewItem({ ...newItem, estimated_cost: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={newItem.status} onValueChange={(value) => setNewItem({ ...newItem, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Pending</SelectItem>
                      <SelectItem value="booked">DP / Booked</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={saveBudgetItem} className="w-full">
                  {isEditing ? "Save Changes" : "Add Item"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Budget Summary */}
        <Card className="bg-card shadow-card rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Overview</h2>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Total Budget</span>
                <span className="font-bold text-foreground">{formatRupiah(totalEstimated)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Paid So Far</span>
                <span className="font-bold text-primary">{formatRupiah(totalPaid)}</span>
              </div>
              <Progress value={totalEstimated > 0 ? (totalPaid / totalEstimated) * 100 : 0} className="h-2 mt-3" />
            </div>
          </div>
        </Card>

        {/* Budget Items List */}
        <div className="space-y-3">
          {budgetItems.map((item) => (
            <Card 
              key={item.id}
              className={`bg-white shadow-soft rounded-2xl p-4 transition-all border ${item.status === 'paid' ? 'border-green-200 bg-green-50/30' : 'border-gray-100'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Banknote className="w-4 h-4 text-primary" />
                    <h3 className={`font-medium ${item.status === 'paid' ? 'text-gray-600' : 'text-foreground'}`}>
                      {item.item_name}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground capitalize">{item.category}</p>
                  
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <span className={`text-lg font-bold ${item.status === 'paid' ? 'text-green-600' : 'text-primary'}`}>
                      {formatRupiah(parseFloat(item.estimated_cost || 0))}
                    </span>
                    
                    {/* DROPDOWN STATUS UPDATE */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Badge 
                          className={`cursor-pointer flex items-center px-2 py-1 ${getStatusColor(item.status)}`}
                        >
                          {getStatusIcon(item.status)}
                          {getStatusLabel(item.status)}
                        </Badge>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => updateStatus(item.id, 'planned')}>
                          <Clock className="w-4 h-4 mr-2 text-orange-500" /> Mark as Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(item.id, 'booked')}>
                          <Wallet className="w-4 h-4 mr-2 text-blue-500" /> Mark as DP / Booked
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(item.id, 'paid')}>
                          <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Mark as Paid
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* --- ACTION BUTTONS --- */}
                <div className="flex flex-col gap-2 ml-2">
                  
                  {/* TOMBOL KONFIRMASI CEPAT (Pending -> Paid) */}
                  {item.status !== 'paid' && (
                    <Button
                      size="icon"
                      className="h-8 w-8 bg-green-100 text-green-600 hover:bg-green-500 hover:text-white transition-colors"
                      title="Mark as Paid immediately"
                      onClick={() => updateStatus(item.id, 'paid')}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                  )}

                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    onClick={() => handleEditClick(item)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteBudgetItem(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {budgetItems.length === 0 && (
            <Card className="bg-card shadow-soft rounded-2xl p-12 text-center">
              <Banknote className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No expenses yet.</p>
            </Card>
          )}
        </div>

        <div className="relative -mx-6">
          <img 
            src={underwaterDecoration} 
            alt="Decoration" 
            className="w-full h-32 object-cover object-top opacity-60"
          />
        </div>
      </div>
    </div>
  );
};

export default Budget;