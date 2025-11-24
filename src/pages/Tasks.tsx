import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import underwaterDecoration from "@/assets/underwater-decoration.png";
import { toast } from "sonner";

const Tasks = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [wedding, setWedding] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [newTask, setNewTask] = useState({ title: "", description: "", category: "", assigned_to: "unassigned" });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchTasks();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchTasks = async () => {
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

      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*")
        .eq("wedding_id", weddingData.id)
        .order("created_at", { ascending: false });

      setTasks(tasksData || []);
    }
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    
    await supabase
      .from("tasks")
      .update({ 
        status: newStatus,
        completed_at: newStatus === "completed" ? new Date().toISOString() : null
      })
      .eq("id", taskId);

    toast.success(newStatus === "completed" ? "Task completed! 🎉" : "Task reopened");
  };

  const createTask = async () => {
    if (!newTask.title || !wedding) return;

    await supabase.from("tasks").insert({
      wedding_id: wedding.id,
      title: newTask.title,
      description: newTask.description,
      category: newTask.category,
      assigned_to: newTask.assigned_to === "unassigned" ? null : newTask.assigned_to,
      created_by: currentUser.id,
      status: "pending"
    });

    setNewTask({ title: "", description: "", category: "", assigned_to: "unassigned" });
    setIsDialogOpen(false);
    toast.success("Task created!");
  };

  const getAssignedToInitials = (task: any) => {
    if (!task.assigned_to) return "UN";
    if (task.assigned_to === currentUser?.id) return "You";
    return "PT";
  };

  return (
    <div className="min-h-screen bg-gradient-underwater p-6 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-teal-green">Our Tasks</h1>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="rounded-full shadow-floating">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card">
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Task Title</Label>
                  <Input
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="e.g., Book venue"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Add details..."
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={newTask.category} onValueChange={(value) => setNewTask({ ...newTask, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="venue">Venue</SelectItem>
                      <SelectItem value="catering">Catering</SelectItem>
                      <SelectItem value="flowers">Flowers</SelectItem>
                      <SelectItem value="photography">Photography</SelectItem>
                      <SelectItem value="dress">Dress & Attire</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assign To</Label>
                  <Select value={newTask.assigned_to || "unassigned"} onValueChange={(value) => setNewTask({ ...newTask, assigned_to: value === "unassigned" ? "" : value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {currentUser && <SelectItem value={currentUser.id}>Me</SelectItem>}
                      {wedding?.partner_two_id && wedding.partner_two_id !== currentUser?.id && (
                        <SelectItem value={wedding.partner_two_id}>Partner</SelectItem>
                      )}
                      {wedding?.partner_one_id && wedding.partner_one_id !== currentUser?.id && (
                        <SelectItem value={wedding.partner_one_id}>Partner</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createTask} className="w-full">Create Task</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {tasks.map((task) => (
            <Card 
              key={task.id}
              className="bg-card shadow-soft rounded-2xl p-4 flex items-start gap-4"
            >
              <Checkbox
                checked={task.status === "completed"}
                onCheckedChange={() => toggleTaskStatus(task.id, task.status)}
                className="mt-1"
              />
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                    )}
                    {task.category && (
                      <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {task.category}
                      </span>
                    )}
                  </div>
                  
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {getAssignedToInitials(task)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </Card>
          ))}

          {tasks.length === 0 && (
            <Card className="bg-card shadow-soft rounded-2xl p-12 text-center">
              <p className="text-muted-foreground">No tasks yet. Add your first task to get started!</p>
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

export default Tasks;