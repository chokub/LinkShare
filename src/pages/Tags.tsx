import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Edit2, Trash2, Plus, Check, Type } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// นำเข้าชุดสีจาก tag-input
const COLOR_PRESETS = [
  // สีหลัก
  { bg: "#2563eb", text: "#ffffff", name: "น้ำเงิน" },
  { bg: "#1d4ed8", text: "#ffffff", name: "น้ำเงินเข้ม" },
  { bg: "#3b82f6", text: "#ffffff", name: "น้ำเงินสว่าง" },
  { bg: "#60a5fa", text: "#000000", name: "ฟ้า" },
  { bg: "#93c5fd", text: "#000000", name: "ฟ้าอ่อน" },
  
  // สีเขียว
  { bg: "#16a34a", text: "#ffffff", name: "เขียว" },
  { bg: "#15803d", text: "#ffffff", name: "เขียวเข้ม" },
  { bg: "#22c55e", text: "#000000", name: "เขียวสด" },
  { bg: "#4ade80", text: "#000000", name: "เขียวอ่อน" },
  { bg: "#86efac", text: "#000000", name: "เขียวพาสเทล" },

  // สีแดง
  { bg: "#dc2626", text: "#ffffff", name: "แดง" },
  { bg: "#b91c1c", text: "#ffffff", name: "แดงเข้ม" },
  { bg: "#ef4444", text: "#ffffff", name: "แดงสด" },
  { bg: "#f87171", text: "#000000", name: "แดงอ่อน" },
  { bg: "#fca5a5", text: "#000000", name: "แดงพาสเทล" },

  // สีเหลือง
  { bg: "#ca8a04", text: "#000000", name: "เหลือง" },
  { bg: "#a16207", text: "#ffffff", name: "เหลืองเข้ม" },
  { bg: "#eab308", text: "#000000", name: "เหลืองสด" },
  { bg: "#facc15", text: "#000000", name: "เหลืองสว่าง" },
  { bg: "#fde047", text: "#000000", name: "เหลืองอ่อน" },

  // สีม่วง
  { bg: "#9333ea", text: "#ffffff", name: "ม่วง" },
  { bg: "#7e22ce", text: "#ffffff", name: "ม่วงเข้ม" },
  { bg: "#a855f7", text: "#ffffff", name: "ม่วงสด" },
  { bg: "#c084fc", text: "#000000", name: "ม่วงอ่อน" },
  { bg: "#d8b4fe", text: "#000000", name: "ม่วงพาสเทล" },

  // สีส้ม
  { bg: "#ea580c", text: "#ffffff", name: "ส้ม" },
  { bg: "#c2410c", text: "#ffffff", name: "ส้มเข้ม" },
  { bg: "#f97316", text: "#ffffff", name: "ส้มสด" },
  { bg: "#fb923c", text: "#000000", name: "ส้มอ่อน" },
  { bg: "#fdba74", text: "#000000", name: "ส้มพาสเทล" },

  // สีชมพู
  { bg: "#db2777", text: "#ffffff", name: "ชมพู" },
  { bg: "#be185d", text: "#ffffff", name: "ชมพูเข้ม" },
  { bg: "#ec4899", text: "#ffffff", name: "ชมพูสด" },
  { bg: "#f472b6", text: "#000000", name: "ชมพูอ่อน" },
  { bg: "#f9a8d4", text: "#000000", name: "ชมพูพาสเทล" },

  // สีเทา
  { bg: "#1e293b", text: "#ffffff", name: "กรมท่า" },
  { bg: "#334155", text: "#ffffff", name: "เทาเข้ม" },
  { bg: "#475569", text: "#ffffff", name: "เทา" },
  { bg: "#64748b", text: "#ffffff", name: "เทากลาง" },
  { bg: "#94a3b8", text: "#000000", name: "เทาอ่อน" }
];

// เพิ่มชุดสีตัวอักษร
const TEXT_COLORS = [
  { value: "#ffffff", name: "ขาว" },
  { value: "#000000", name: "ดำ" },
  { value: "#64748b", name: "เทา" },
  { value: "#2563eb", name: "น้ำเงิน" },
  { value: "#16a34a", name: "เขียว" },
  { value: "#dc2626", name: "แดง" },
  { value: "#ca8a04", name: "เหลือง" },
  { value: "#9333ea", name: "ม่วง" },
  { value: "#f97316", name: "ส้ม" },
  { value: "#ec4899", name: "ชมพู" },
];

const Tags = () => {
  const { user } = useAuth();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  const [selectedTextColor, setSelectedTextColor] = useState(TEXT_COLORS[0]);
  const tagForm = useForm({ defaultValues: { name: "" } });

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
    try {
      let result;
      if (editingTag) {
        result = await supabase
          .from("tags")
          .update({ 
            name: values.name, 
            color: selectedColor.bg,
            textColor: selectedTextColor.value 
          })
          .eq("id", editingTag.id);
      } else {
        result = await supabase
          .from("tags")
          .insert({ 
            name: values.name, 
            color: selectedColor.bg,
            textColor: selectedTextColor.value,
            user_id: user.id 
          });
      }
      if (result.error) {
        alert('เกิดข้อผิดพลาด: ' + result.error.message);
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
    setLoading(false);
    setEditingTag(null);
    tagForm.reset({ name: "" });
    setSelectedColor(COLOR_PRESETS[0]);
    setSelectedTextColor(TEXT_COLORS[0]);
    fetchTags();
  };

  const handleEditTag = (tag) => {
    setEditingTag(tag);
    tagForm.setValue("name", tag.name);
    // หาสีพื้นหลังที่ตรงกับแท็กที่กำลังแก้ไข
    const matchingColor = COLOR_PRESETS.find(
      color => color.bg === tag.color
    ) || COLOR_PRESETS[0];
    setSelectedColor(matchingColor);
    // หาสีตัวอักษรที่ตรงกับแท็กที่กำลังแก้ไข
    const matchingTextColor = TEXT_COLORS.find(
      color => color.value === tag.textColor
    ) || TEXT_COLORS[0];
    setSelectedTextColor(matchingTextColor);
  };

  const handleDeleteTag = async (tag) => {
    setLoading(true);
    // 1. ลบ tag ออกจากตาราง tags
    await supabase.from("tags").delete().eq("id", tag.id);

    // 2. ดึง bookmarks ที่มี tag นี้
    const { data: bookmarksWithTag } = await supabase
      .from("bookmarks")
      .select("id, tags")
      .contains("tags", [tag.name]);

    // 3. ลบ tag ออกจากแต่ละ bookmark
    if (bookmarksWithTag) {
      for (const bm of bookmarksWithTag) {
        const newTags = (bm.tags || []).filter(t => t !== tag.name);
        await supabase.from("bookmarks").update({ tags: newTags }).eq("id", bm.id);
      }
    }

    setLoading(false);
    fetchTags();
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    tagForm.reset({ name: "" });
    setSelectedColor(COLOR_PRESETS[0]);
    setSelectedTextColor(TEXT_COLORS[0]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>จัดการแท็กของคุณ</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={tagForm.handleSubmit(handleAddTag)} className="space-y-4">
              <div className="flex gap-2 flex-wrap items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium mb-1">ชื่อแท็ก</label>
                  <Input {...tagForm.register("name", { required: true })} placeholder="เช่น ข่าว, AI, เทคโนโลยี" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" type="button" onClick={handleCancelEdit}>
                    ยกเลิก
                  </Button>
                  <Button type="submit" disabled={loading} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    {editingTag ? "แก้ไข" : "เพิ่ม"}
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* เลือกสีพื้นหลัง */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">สีพื้นหลัง</label>
                  <div className="grid grid-cols-5 gap-2 max-h-[320px] overflow-y-auto p-2 border rounded-lg">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color.bg}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className="relative aspect-square rounded-md transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        style={{ background: color.bg }}
                        title={color.name}
                      >
                        {selectedColor.bg === color.bg && (
                          <Check className={`absolute inset-0 m-auto h-4 w-4 ${color.text === '#000000' ? 'text-black' : 'text-white'}`} />
                        )}
                        <span className="sr-only">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* เลือกสีตัวอักษร */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">สีตัวอักษร</label>
                  <div className="grid grid-cols-5 gap-2 p-2 border rounded-lg">
                    {TEXT_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setSelectedTextColor(color)}
                        className="relative aspect-square rounded-md transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border"
                        style={{ 
                          background: color.value === '#ffffff' ? '#f3f4f6' : color.value,
                          borderColor: color.value === '#ffffff' ? '#e5e7eb' : 'transparent'
                        }}
                        title={color.name}
                      >
                        {selectedTextColor.value === color.value && (
                          <Check className={`absolute inset-0 m-auto h-4 w-4 ${color.value === '#ffffff' || color.value === '#f3f4f6' ? 'text-black' : 'text-white'}`} />
                        )}
                        <span className="sr-only">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ตัวอย่างแท็ก */}
              <div className="pt-2">
                <label className="block text-sm font-medium mb-2">ตัวอย่าง</label>
                <Badge 
                  style={{ 
                    background: selectedColor.bg,
                    color: selectedTextColor.value,
                  }}
                  className="font-semibold"
                >
                  {tagForm.watch("name") || "ตัวอย่างแท็ก"}
                </Badge>
              </div>
            </form>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">แท็กทั้งหมด</h3>
              <div className="space-y-2">
                {tags.map((tag) => (
                  <div key={tag.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
                    <Badge
                      style={{
                        background: tag.color || COLOR_PRESETS[0].bg,
                        color: tag.textColor || TEXT_COLORS[0].value,
                      }}
                      className="font-semibold text-base px-3 py-1"
                    >
                      {tag.name}
                    </Badge>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditTag(tag)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTag(tag)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Tags; 