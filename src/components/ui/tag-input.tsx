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
      <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-2 bg-background rounded-md border">
        {tags.map((tag, index) => {
          // Find matching suggestion for color
          const suggestion = suggestions.find(s => s.name === tag);
          return (
            <Badge
              key={index}
              variant="secondary"
              style={suggestion?.color ? {
                background: suggestion.color,
                color: suggestion.textColor || '#ffffff',
              } : undefined}
              className="h-6 px-2 flex items-center gap-1 font-semibold"
            >
              {tag}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  removeTag(index);
                }}
                className="hover:bg-black/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          );
        })}
        <div className="flex-1 flex gap-2 items-center min-w-[150px]">
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border-0 p-0 h-6 focus-visible:ring-0 placeholder:text-muted-foreground"
            placeholder={tags.length === 0 ? placeholder : ""}
          />
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                type="button" 
                variant="ghost" 
                size="icon"
                className="h-6 w-6"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-[280px] max-h-[500px] overflow-y-auto"
            >
              {/* ปุ่มสร้างแท็กใหม่ */}
              {userId && (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      setCreateDialogOpen(true);
                      setDropdownOpen(false);
                    }}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>สร้างแท็กใหม่</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              {/* แท็กที่มีอยู่ */}
              {suggestions.length > 0 && (
                <>
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <Tags className="h-4 w-4" />
                    แท็กของคุณ
                  </DropdownMenuLabel>
                  <div className="p-2 flex flex-wrap gap-1">
                    {suggestions.map((tag) => (
                      <Badge
                        key={tag.id}
                        style={tag.color ? {
                          background: tag.color,
                          color: tag.textColor || '#ffffff',
                        } : undefined}
                        className="cursor-pointer hover:opacity-80 font-semibold"
                        onClick={() => handleSuggestionClick(tag.name)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}

              {/* แท็กแนะนำตามหมวดหมู่ */}
              {Object.entries(QUICK_SUGGESTIONS).map(([category, categoryTags]) => {
                const IconComponent = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
                return (
                  <DropdownMenuGroup key={category}>
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      {category}
                    </DropdownMenuLabel>
                    <div className="p-2 flex flex-wrap gap-1">
                      {categoryTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="cursor-pointer hover:bg-accent"
                          onClick={() => handleSuggestionClick(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <DropdownMenuSeparator />
                  </DropdownMenuGroup>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Dialog สร้างแท็กใหม่ */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>สร้างแท็กใหม่</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">ชื่อแท็ก</label>
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="เช่น AI, เทคโนโลยี, การเรียนรู้"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">เลือกสี</label>
              <div className="grid grid-cols-5 gap-2 max-h-[320px] overflow-y-auto p-2">
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
              <div className="pt-2">
                <Badge 
                  style={{ 
                    background: selectedColor.bg,
                    color: selectedColor.text,
                  }}
                  className="font-semibold"
                >
                  {newTagName || "ตัวอย่างแท็ก"}
                </Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleCreateNewTag}
              disabled={!newTagName.trim() || isCreating}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isCreating ? "กำลังสร้าง..." : "สร้างแท็ก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 