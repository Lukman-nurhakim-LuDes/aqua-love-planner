import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, LogOut, Calendar, Save, User, Loader2, Camera } from "lucide-react";
import underwaterDecoration from "@/assets/underwater-decoration.png";
import { toast } from "sonner";
import PartnerInvitation from "@/components/PartnerInvitation";

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Data State
  const [myProfile, setMyProfile] = useState<any>(null);
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  const [wedding, setWedding] = useState<any>(null);
  
  // Form State
  const [fullName, setFullName] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [venue, setVenue] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Get User Auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setCurrentUser(user);

      // 2. Get My Profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setMyProfile(profileData);
        setFullName(profileData.full_name || "");
      }

      // 3. Get Wedding Data
      const { data: weddingData } = await supabase
        .from("weddings")
        .select("*")
        .or(`partner_one_id.eq.${user.id},partner_two_id.eq.${user.id}`)
        .maybeSingle();

      if (weddingData) {
        setWedding(weddingData);
        setWeddingDate(weddingData.wedding_date || "");
        setVenue(weddingData.venue || "");

        // 4. Get Partner Profile
        const partnerId = weddingData.partner_one_id === user.id 
          ? weddingData.partner_two_id 
          : weddingData.partner_one_id;

        if (partnerId) {
          const { data: partnerData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", partnerId)
            .single();
          
          if (partnerData) {
            setPartnerProfile(partnerData);
          }
        }
      } else {
        const { data: newWedding, error: createError } = await supabase
          .from("weddings")
          .insert({ partner_one_id: user.id })
          .select()
          .single();
        
        if (!createError) {
          setWedding(newWedding);
        }
      }

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${currentUser.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Upload ke Supabase Storage bucket 'avatars'
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // 2. Ambil Public URL
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // 3. Update profile user dengan URL baru
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("id", currentUser.id);

      if (updateError) {
        throw updateError;
      }

      setMyProfile({ ...myProfile, avatar_url: data.publicUrl });
      toast.success("Avatar updated successfully!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error uploading avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!currentUser) return;
    
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", currentUser.id);

    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated!");
      setMyProfile({ ...myProfile, full_name: fullName });
    }
  };

  const handleSaveWedding = async () => {
    if (!wedding) return;

    const { error } = await supabase
      .from("weddings")
      .update({
        wedding_date: weddingDate,
        venue: venue,
      })
      .eq("id", wedding.id);

    if (error) {
      toast.error("Failed to save wedding details");
    } else {
      toast.success("Wedding details saved! 💕");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-underwater">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-underwater p-6 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* --- COUPLE HEADER SECTION --- */}
        <div className="flex justify-center items-center gap-4 py-6">
          
          {/* My Avatar (Clickable for Upload) */}
          <div className="flex flex-col items-center gap-2 relative group">
            <label htmlFor="avatar-upload" className="cursor-pointer relative">
               <Avatar className="w-24 h-24 border-4 border-white shadow-lg ring-2 ring-primary/20 transition-transform group-hover:scale-105">
                <AvatarImage src={myProfile?.avatar_url} className="object-cover" />
                <AvatarFallback className="bg-primary/20 text-primary text-xl">
                  {uploading ? <Loader2 className="animate-spin" /> : (myProfile?.full_name?.charAt(0) || "Me")}
                </AvatarFallback>
              </Avatar>
              
              {/* Camera Icon Overlay */}
              <div className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full shadow-md border-2 border-white">
                <Camera className="w-4 h-4" />
              </div>
            </label>
            <input 
              type="file" 
              id="avatar-upload" 
              accept="image/*" 
              className="hidden" 
              onChange={uploadAvatar}
              disabled={uploading}
            />

            <span className="text-sm font-semibold text-teal-green max-w-[100px] text-center truncate">
              {myProfile?.full_name || "You"}
            </span>
          </div>

          {/* Connection Heart */}
          <div className="flex flex-col items-center justify-center -mt-6">
            <div className={`p-2 rounded-full ${partnerProfile ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-400'}`}>
              <Heart className={`w-6 h-6 ${partnerProfile ? 'fill-current animate-pulse' : ''}`} />
            </div>
          </div>

          {/* Partner Avatar */}
          <div className="flex flex-col items-center gap-2">
            {partnerProfile ? (
              <>
                <Avatar className="w-24 h-24 border-4 border-white shadow-lg ring-2 ring-pink-500/20">
                   <AvatarImage src={partnerProfile?.avatar_url} className="object-cover" />
                   <AvatarFallback className="bg-pink-100 text-pink-500 text-xl">
                    {partnerProfile?.full_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-semibold text-teal-green max-w-[100px] text-center truncate">
                  {partnerProfile.full_name}
                </span>
              </>
            ) : (
              <>
                 <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-white/50">
                    <User className="w-8 h-8 text-gray-300" />
                 </div>
                 <span className="text-sm text-muted-foreground">Waiting...</span>
              </>
            )}
          </div>
        </div>

        {/* --- PARTNER INVITATION --- */}
        {!partnerProfile && (
           <PartnerInvitation />
        )}

        {/* --- MY PROFILE EDIT --- */}
        <Card className="bg-card shadow-soft rounded-2xl p-6">
           <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">My Profile</h2>
          </div>
          <div className="flex gap-3">
             <Input 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
             />
             <Button onClick={handleUpdateProfile} variant="outline">Save</Button>
          </div>
        </Card>

        {/* --- WEDDING DETAILS --- */}
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

        {/* --- LOGOUT --- */}
        <Card className="bg-card shadow-soft rounded-2xl p-6">
          <Button 
            variant="outline" 
            className="w-full justify-start text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/5"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
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