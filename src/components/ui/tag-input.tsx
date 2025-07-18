import React, { useState, useRef, KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus, Hash, Sparkles, Clock, Star, Tags, Type, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

interface TagInputProps {
  value: string[] | string;  // Support both array and string
  onChange: (value: string[] | string) => void;  // Support both array and string
  suggestions?: { 
    id: string; 
    name: string; 
    color?: string;
    textColor?: string;
  }[];
  placeholder?: string;
  userId?: string;
  onTagsChange?: () => void;
  returnType?: 'array' | 'string';  // New prop to specify return type
}

// แท็กแนะนำตามหมวดหมู่
const QUICK_SUGGESTIONS = {
  ประเภทเนื้อหา: ["บทความ", "วิดีโอ", "รูปภาพ", "พอดคาสต์", "ข่าว"],
  เทคโนโลยี: ["AI", "Blockchain", "Cloud", "Mobile", "Web"],
  การเรียนรู้: ["สอน", "เรียน", "คู่มือ", "แนะนำ", "เคล็ดลับ"],
  ความบันเทิง: ["เพลง", "หนัง", "เกม", "กีฬา", "ท่องเที่ยว"],
  สถานะ: ["อ่านแล้ว", "ต้องอ่าน", "กำลังอ่าน", "รอดู", "เก็บไว้อ้างอิง"]
};

const CATEGORY_ICONS = {
  ประเภทเนื้อหา: Hash,
  เทคโนโลยี: Sparkles,
  การเรียนรู้: Star,
  ความบันเทิง: Star,
  สถานะ: Clock,
};

// ชุดสีที่กำหนดไว้ล่วงหน้า
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

export function TagInput({ 
  value, 
  onChange, 
  suggestions = [], 
  placeholder = "เพิ่มแท็ก...", 
  userId, 
  onTagsChange,
  returnType = 'array'  // Default to array
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Convert input value to array of tags
  const tags = Array.isArray(value) ? value : (value ? value.split(",").filter(Boolean).map(t => t.trim()) : []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      const newTags = [...tags, trimmedTag];
      onChange(returnType === 'string' ? newTags.join(",") : newTags);
      setInputValue("");
    }
  };

  const removeTag = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index);
    onChange(returnType === 'string' ? newTags.join(",") : newTags);
  };

  const handleSuggestionClick = (tagName: string) => {
    if (!tags.includes(tagName)) {
      const newTags = [...tags, tagName];
      onChange(returnType === 'string' ? newTags.join(",") : newTags);
    }
    setDropdownOpen(false);
  };

  const handleCreateNewTag = async () => {
    if (!userId || !newTagName.trim()) return;
    
    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from("tags")
        .insert({ 
          name: newTagName.trim(), 
          color: selectedColor.bg,
          textColor: selectedColor.text,
          user_id: userId 
        })
        .select()
        .single();

      if (error) throw error;

      // เพิ่มแท็กใหม่เข้าไปในรายการที่เลือก
      handleSuggestionClick(data.name);
      
      // รีเฟรชรายการแท็กทั้งหมด
      if (onTagsChange) {
        onTagsChange();
      }

      // ปิด dialog และล้างค่า
      setCreateDialogOpen(false);
      setNewTagName("");
      setSelectedColor(COLOR_PRESETS[0]);
    } catch (error) {
      console.error('Error creating tag:', error);
      alert('ไม่สามารถสร้างแท็กได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* ปุ่ม + ใหญ่สำหรับสร้างแท็กใหม่ */}
      <button
        type="button"
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-md transition-all duration-150 py-3 text-lg"
        onClick={() => setCreateDialogOpen(true)}
      >
        <Plus className="h-6 w-6" />
        <span>สร้างแท็กใหม่</span>
      </button>
      {/* Dialog สำหรับสร้างแท็กใหม่ (คงไว้เหมือนเดิม) */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>สร้างแท็กใหม่</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!userId || !newTagName.trim()) return;
              setIsCreating(true);
              try {
                const { data, error } = await supabase
                  .from("tags")
                  .insert({
                    name: newTagName.trim(),
                    color: selectedColor.bg,
                    textColor: selectedColor.text,
                    user_id: userId,
                  })
                  .select()
                  .single();
                if (error) throw error;
                handleSuggestionClick(data.name);
                if (onTagsChange) onTagsChange();
                setCreateDialogOpen(false);
                setNewTagName("");
                setSelectedColor(COLOR_PRESETS[0]);
                setSelectedTextColor(TEXT_COLORS[0]);
              } catch (error) {
                alert("ไม่สามารถสร้างแท็กได้ กรุณาลองใหม่อีกครั้ง");
              } finally {
                setIsCreating(false);
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">ชื่อแท็ก</label>
              <Input
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                placeholder="เช่น ข่าว, AI, เทคโนโลยี"
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {/* เลือกสีพื้นหลัง */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">สีพื้นหลัง</label>
                <div className="grid grid-cols-5 gap-2 max-h-[160px] overflow-y-auto p-2 border rounded-lg">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color.bg}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`relative aspect-square rounded-md transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${selectedColor.bg === color.bg ? 'ring-2 ring-blue-500' : ''}`}
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
                      className={`relative aspect-square rounded-md transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border ${selectedTextColor.value === color.value ? 'ring-2 ring-purple-500' : ''}`}
                      style={{ background: color.value === '#ffffff' ? '#f3f4f6' : color.value, borderColor: color.value === '#ffffff' ? '#e5e7eb' : 'transparent' }}
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
                style={{ background: selectedColor.bg, color: selectedTextColor.value }}
                className="font-semibold"
              >
                {newTagName || "ตัวอย่างแท็ก"}
              </Badge>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isCreating || !newTagName.trim()} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                {isCreating ? "กำลังสร้าง..." : "สร้างแท็ก"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 