import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import underwaterDecoration from "@/assets/underwater-decoration.png";
import { toast } from "sonner";

const Budget = () => {
  const [budgetItems, setBudgetItems] = useState<any[]>([]);
  const [wedding, setWedding] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [newItem, setNewItem] = useState({ 
    category: "", 
    item_name: "", 
    estimated_cost: "",
    status: "planned" 
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchBudgetItems();
  }, []);

  const fetchBudgetItems = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUser(user);

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

  const createBudgetItem = async () => {
    if (!newItem.item_name || !newItem.estimated_cost || !wedding) return;

    await supabase.from("budget_items").insert({
      wedding_id: wedding.id,
      category: newItem.category,
      item_name: newItem.item_name,
      estimated_cost: parseFloat(newItem.estimated_cost),
      status: newItem.status,
    });

    setNewItem({ category: "", item_name: "", estimated_cost: "", status: "planned" });
    setIsDialogOpen(false);
    fetchBudgetItems();
    toast.success("Budget item added!");
  };

  const totalEstimated = budgetItems.reduce((sum, item) => sum + (parseFloat(item.estimated_cost) || 0), 0);
  const totalPaid = budgetItems
    .filter(item => item.status === "paid")
    .reduce((sum, item) => sum + (parseFloat(item.actual_cost || item.estimated_cost) || 0), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-primary/20 text-primary";
      case "booked": return "bg-champagne text-teal-green";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-underwater p-6 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-teal-green">Budget</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track your wedding expenses together
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="rounded-full shadow-floating">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card">
              <DialogHeader>
                <DialogTitle>Add Budget Item</DialogTitle>
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
                  <Label>Estimated Cost ($)</Label>
                  <Input
                    type="number"
                    value={newItem.estimated_cost}
                    onChange={(e) => setNewItem({ ...newItem, estimated_cost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={newItem.status} onValueChange={(value) => setNewItem({ ...newItem, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="booked">Booked</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createBudgetItem} className="w-full">Add Item</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Budget Summary */}
        <Card className="bg-card shadow-card rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Budget Overview</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Total Budget</span>
                <span className="font-bold text-foreground">${totalEstimated.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Paid So Far</span>
                <span className="font-bold text-primary">${totalPaid.toFixed(2)}</span>
              </div>
              <Progress value={(totalPaid / totalEstimated) * 100} className="h-2 mt-3" />
              <p className="text-xs text-muted-foreground mt-2 text-right">
                {totalEstimated > 0 ? Math.round((totalPaid / totalEstimated) * 100) : 0}% spent
              </p>
            </div>
          </div>
        </Card>

        {/* Budget Items List */}
        <div className="space-y-3">
          {budgetItems.map((item) => (
            <Card 
              key={item.id}
              className="bg-card shadow-soft rounded-2xl p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <h3 className="font-medium text-foreground">{item.item_name}</h3>
                  </div>
                  
                  <p className="text-sm text-muted-foreground capitalize">{item.category}</p>
                  
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-lg font-bold text-primary">
                      ${parseFloat(item.estimated_cost || 0).toFixed(2)}
                    </span>
                    <Badge className={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {budgetItems.length === 0 && (
            <Card className="bg-card shadow-soft rounded-2xl p-12 text-center">
              <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No budget items yet. Start tracking your expenses!</p>
            </Card>
          )}
        </div>

        <div className="relative -mx-6">
          <img 
            src={underwaterDecoration} 
            alt="Underwater decoration" 
            className="w-full h-32 object-cover object-top opacity-60"
          />
        </div>
      </div>
    </div>
  );
};

export default Budget;