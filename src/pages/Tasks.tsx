import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Circle, Plus, Pencil, Trash2, ListTodo } from "lucide-react";
import { toast } from "sonner";

const Tasks = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [wedding, setWedding] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    category: "General",
    due_date: "",
    is_completed: false
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
        .from("tasks")
        .select("*")
        .eq("wedding_id", weddingData.id)
        .order("is_completed", { ascending: true }) 
        .order("due_date", { ascending: true });
      setTasks(data || []);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !wedding) return;

    try {
       const payload = {
          wedding_id: wedding.id,
          title: formData.title,
          category: formData.category,
          due_date: formData.due_date ? formData.due_date : null,
          is_completed: formData.is_completed
       };

      if (isEditing && editId) {
         // Tambahkan 'as any'
         await supabase.from("tasks").update(payload as any).eq("id", editId);
         toast.success("Task updated");
      } else {
         // Tambahkan 'as any'
         await supabase.from("tasks").insert(payload as any);
         toast.success("Task added");
      }
      resetForm();
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const toggleComplete = async (task: any) => {
     // Tambahkan 'as any'
     await supabase.from("tasks").update({ is_completed: !task.is_completed } as any).eq("id", task.id);
     fetchData();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this task?")) {
      await supabase.from("tasks").delete().eq("id", id);
      toast.success("Task deleted");
      fetchData();
    }
  };

  const handleEdit = (item: any) => {
    setFormData({
      title: item.title,
      category: item.category || "General",
      due_date: item.due_date || "",
      is_completed: item.is_completed
    });
    setEditId(item.id);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ title: "", category: "General", due_date: "", is_completed: false });
    setIsDialogOpen(false);
    setIsEditing(false);
    setEditId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-underwater p-6 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
           <div>
              <h1 className="text-3xl font-bold text-teal-green">To-Do List</h1>
              <p className="text-sm text-muted-foreground">Keep track of your preparations</p>
           </div>
           
           <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
              <DialogTrigger asChild>
                 <Button className="rounded-full shadow-floating bg-primary hover:scale-105 transition-transform">
                    <Plus className="w-5 h-5 mr-2" /> Add Task
                 </Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                 <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Task" : "Add New Task"}</DialogTitle>
                 </DialogHeader>
                 <div className="space-y-4 py-4">
                    <div className="space-y-2">
                       <Label>Task Title</Label>
                       <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Book Venue" />
                    </div>
                    <div className="space-y-2">
                       <Label>Category</Label>
                       <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                             <SelectItem value="General">General</SelectItem>
                             <SelectItem value="Vendor">Vendor</SelectItem>
                             <SelectItem value="Attire">Attire</SelectItem>
                             <SelectItem value="Admin">Administration</SelectItem>
                          </SelectContent>
                       </Select>
                    </div>
                    <div className="space-y-2">
                       <Label>Due Date</Label>
                       <Input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
                    </div>
                    <Button onClick={handleSave} className="w-full">{isEditing ? "Update Task" : "Add Task"}</Button>
                 </div>
              </DialogContent>
           </Dialog>
        </div>

        <div className="space-y-3">
           {tasks.map((task) => (
              <Card key={task.id} className={`p-4 flex items-center justify-between shadow-soft border-none rounded-2xl group transition-all ${task.is_completed ? 'bg-gray-50 opacity-75' : 'bg-white'}`}>
                 <div className="flex items-center gap-4 flex-1">
                    <button onClick={() => toggleComplete(task)}>
                       {task.is_completed 
                          ? <CheckCircle2 className="w-6 h-6 text-green-500" /> 
                          : <Circle className="w-6 h-6 text-gray-300 hover:text-primary" />
                       }
                    </button>
                    <div>
                       <h3 className={`font-semibold text-gray-800 ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>{task.title}</h3>
                       <div className="flex gap-2 text-xs mt-1">
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">{task.category}</span>
                          {task.due_date && <span className="text-muted-foreground">• Due: {task.due_date}</span>}
                       </div>
                    </div>
                 </div>
                 
                 <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-primary" onClick={() => handleEdit(task)}>
                       <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={() => handleDelete(task.id)}>
                       <Trash2 className="w-4 h-4" />
                    </Button>
                 </div>
              </Card>
           ))}

           {tasks.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                 <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-20" />
                 <p>All caught up! No tasks yet.</p>
              </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default Tasks;