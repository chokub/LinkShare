import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Edit2, Trash2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";

const Tags = () => {
  const { user } = useAuth();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const tagForm = useForm({ defaultValues: { name: "", color: "#6366f1" } });

  const fetchTags = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    setLoading(false);
    if (!error) setTags(data);
  };

  useEffect(() => { fetchTags(); }, [user]);

  const handleAddTag = async (values) => {
    if (!values.name) return;
    setLoading(true);
    if (editingTag) {
      await supabase.from("tags").update({ name: values.name, color: values.color }).eq("id", editingTag.id);
    } else {
      await supabase.from("tags").insert({ name: values.name, color: values.color, user_id: user.id });
    }
    setLoading(false);
    setEditingTag(null);
    tagForm.reset({ name: "", color: "#6366f1" });
    fetchTags();
  };

  const handleEditTag = (tag) => {
    setEditingTag(tag);
    tagForm.setValue("name", tag.name);
    tagForm.setValue("color", tag.color || "#6366f1");
  };

  const handleDeleteTag = async (tag) => {
    setLoading(true);
    await supabase.from("tags").delete().eq("id", tag.id);
    setLoading(false);
    fetchTags();
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    tagForm.reset({ name: "", color: "#6366f1" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>จัดการแท็กของคุณ</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={tagForm.handleSubmit(handleAddTag)} className="flex gap-2 mb-6 flex-wrap items-end">
              <div>
                <label className="block text-sm font-medium mb-1">ชื่อแท็ก</label>
                <Input {...tagForm.register("name", { required: true })} placeholder="เช่น ข่าว, AI, เทคโนโลยี" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">สี</label>
                <input type="color" {...tagForm.register("color")} className="w-10 h-10 p-0 border-none bg-transparent" />
              </div>
              <Button type="submit" disabled={loading} className="h-10">
                {editingTag ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {editingTag ? "แก้ไข" : "เพิ่ม"}
              </Button>
              {editingTag && (
                <Button type="button" variant="outline" className="h-10" onClick={handleCancelEdit}>
                  ยกเลิก
                </Button>
              )}
            </form>
            <div className="space-y-2">
              {loading ? (
                <div className="text-center text-sm text-muted-foreground">กำลังโหลด...</div>
              ) : tags.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground">ยังไม่มีแท็ก</div>
              ) : (
                tags.map(tag => (
                  <div key={tag.id} className="flex items-center gap-2 p-2 rounded hover:bg-accent">
                    <Badge style={{ background: tag.color || '#6366f1', color: '#fff' }}>{tag.name}</Badge>
                    <Button size="icon" variant="ghost" onClick={() => handleEditTag(tag)}><Edit2 className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDeleteTag(tag)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Tags; 