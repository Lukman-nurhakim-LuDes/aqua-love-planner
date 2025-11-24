import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, UserPlus } from "lucide-react";
import underwaterDecoration from "@/assets/underwater-decoration.png";
import { toast } from "sonner";

const Guests = () => {
  const [guests, setGuests] = useState<any[]>([]);
  const [wedding, setWedding] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [newGuest, setNewGuest] = useState({ name: "", email: "", phone: "", status: "pending" });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuests = async () => {
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

      const { data: guestsData } = await supabase
        .from("guests")
        .select("*")
        .eq("wedding_id", weddingData.id)
        .order("created_at", { ascending: false });

      setGuests(guestsData || []);
    }
  };

  const createGuest = async () => {
    if (!newGuest.name || !wedding) return;

    await supabase.from("guests").insert({
      wedding_id: wedding.id,
      name: newGuest.name,
      email: newGuest.email,
      phone: newGuest.phone,
      status: newGuest.status,
      added_by: currentUser.id,
    });

    setNewGuest({ name: "", email: "", phone: "", status: "pending" });
    setIsDialogOpen(false);
    fetchGuests();
    toast.success("Guest added!");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-primary/20 text-primary";
      case "declined": return "bg-destructive/20 text-destructive";
      case "invited": return "bg-champagne text-teal-green";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getAddedByLabel = (addedBy: string) => {
    return addedBy === currentUser?.id ? "Added by You" : "Added by Partner";
  };

  return (
    <div className="min-h-screen bg-gradient-underwater p-6 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-teal-green">Guest List</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {guests.length} {guests.length === 1 ? "guest" : "guests"} invited
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
                <DialogTitle>Add Guest</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Guest Name</Label>
                  <Input
                    value={newGuest.name}
                    onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label>Email (optional)</Label>
                  <Input
                    type="email"
                    value={newGuest.email}
                    onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <Label>Phone (optional)</Label>
                  <Input
                    type="tel"
                    value={newGuest.phone}
                    onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={newGuest.status} onValueChange={(value) => setNewGuest({ ...newGuest, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="invited">Invited</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createGuest} className="w-full">Add Guest</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {guests.map((guest) => (
            <Card 
              key={guest.id}
              className="bg-card shadow-soft rounded-2xl p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <UserPlus className="w-4 h-4 text-primary" />
                    <h3 className="font-medium text-foreground">{guest.name}</h3>
                  </div>
                  
                  {guest.email && (
                    <p className="text-sm text-muted-foreground">{guest.email}</p>
                  )}
                  {guest.phone && (
                    <p className="text-sm text-muted-foreground">{guest.phone}</p>
                  )}
                  
                  <div className="flex gap-2 mt-3">
                    <Badge className={getStatusColor(guest.status)}>
                      {guest.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground self-center">
                      {getAddedByLabel(guest.added_by)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {guests.length === 0 && (
            <Card className="bg-card shadow-soft rounded-2xl p-12 text-center">
              <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No guests yet. Start building your guest list!</p>
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

export default Guests;