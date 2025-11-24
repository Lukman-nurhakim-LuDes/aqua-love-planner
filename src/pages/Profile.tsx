import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, LogOut, Calendar, Save } from "lucide-react";
import underwaterDecoration from "@/assets/underwater-decoration.png";
import { toast } from "sonner";

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [wedding, setWedding] = useState<any>(null);
  const [weddingDate, setWeddingDate] = useState("");
  const [venue, setVenue] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(profileData);

    const { data: weddingData } = await supabase
      .from("weddings")
      .select("*")
      .or(`partner_one_id.eq.${user.id},partner_two_id.eq.${user.id}`)
      .single();

    if (weddingData) {
      setWedding(weddingData);
      setWeddingDate(weddingData.wedding_date || "");
      setVenue(weddingData.venue || "");
    } else {
      // Create a wedding if it doesn't exist
      const { data: newWedding } = await supabase
        .from("weddings")
        .insert({
          partner_one_id: user.id,
        })
        .select()
        .single();
      
      setWedding(newWedding);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleSaveWedding = async () => {
    if (!wedding) return;

    await supabase
      .from("weddings")
      .update({
        wedding_date: weddingDate,
        venue: venue,
      })
      .eq("id", wedding.id);

    toast.success("Wedding details saved! 💕");
  };

  return (
    <div className="min-h-screen bg-gradient-underwater p-6 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <Avatar className="w-24 h-24 mx-auto">
            <AvatarFallback className="bg-primary/20 text-primary text-2xl">
              {profile?.full_name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-teal-green">{profile?.full_name}</h1>
            <p className="text-sm text-muted-foreground">Wedding Planner</p>
          </div>
        </div>

        <Card className="bg-card shadow-card rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Heart className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Wedding Details</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="wedding-date">Wedding Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="wedding-date"
                  type="date"
                  value={weddingDate}
                  onChange={(e) => setWeddingDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Enter your wedding venue"
              />
            </div>

            <Button onClick={handleSaveWedding} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Save Wedding Details
            </Button>
          </div>
        </Card>

        <Card className="bg-card shadow-soft rounded-2xl p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Account Settings</h3>
              <Button 
                variant="outline" 
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </Card>

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

export default Profile;