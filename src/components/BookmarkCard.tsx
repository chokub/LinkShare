import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  ExternalLink, 
  MoreVertical, 
  Trash2,
  Plus,
  X,
  Calendar,
  Eye,
  EyeOff,
  Check
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AIButtons } from "@/components/AIButtons";
import { useBookmarks } from "@/hooks/useBookmarks";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { FaInstagram, FaFacebook, FaTwitter, FaYoutube, FaTiktok, FaLinkedin, FaDiscord, FaGithub, FaGlobe } from "react-icons/fa";

interface BookmarkCardProps {
  bookmark: {
    id: string;
    title: string | null;
    description: string | null;
    user_description: string | null;
    ai_summary: string | null;
    suggested_tags: string[];
    url: string;
    tags: string[];
    thumbnail_url: string | null;
    channel_name: string | null;
    channel_avatar: string | null;
    platform: string | null;
    is_favorite: boolean | null;
    created_at: string;
    group_name?: string;
    caption?: string;
  };
  cardSize?: string;
  viewMode?: "grid" | "list";
  editTagMode?: boolean;
  tags: Array<{ id: string; name: string; color: string; textColor: string }>;
  onTagCreated?: (newTag: { name: string; color: string; textColor: string }) => void;
  draggingTag?: { name: string; color: string; textColor: string } | null;
  dragPos?: { x: number; y: number } | null;
}

export const BookmarkCard = ({ 
  bookmark, 
  cardSize = "scale-100",
  viewMode = "grid",
  editTagMode = false,
  tags,
  onTagCreated,
  draggingTag,
  dragPos
}: BookmarkCardProps) => {
  const { toggleFavorite, deleteBookmark, updateBookmark } = useBookmarks();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const { user } = useAuth();
  const editForm = useForm({ 
    defaultValues: { 
      title: bookmark.title || "", 
      user_description: bookmark.user_description || "", 
      tags: bookmark.tags || []
    } 
  });
  const [newTagName, setNewTagName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showCreateTagDialog, setShowCreateTagDialog] = useState(false);
  const navigate = useNavigate();
  const [isDragOver, setIsDragOver] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isMouseOverDrag, setIsMouseOverDrag] = useState(false);
  const [glow, setGlow] = useState(() => localStorage.getItem('cardGlowGradient'));
  const isMouseOverDragRef = useRef(isMouseOverDrag);
  useEffect(() => { isMouseOverDragRef.current = isMouseOverDrag; }, [isMouseOverDrag]);
  const draggingTagRef = useRef(draggingTag);
  useEffect(() => { draggingTagRef.current = draggingTag; }, [draggingTag]);

  // Register pointerup handler แค่รอบเดียว
  useEffect(() => {
    const handlePointerUp = () => {
      if (isMouseOverDragRef.current && draggingTagRef.current) {
        if (!Array.isArray(bookmark.tags) || !bookmark.tags.includes(draggingTagRef.current.name)) {
          handleAddTagToBookmark(draggingTagRef.current.name);
        }
      }
    };
    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
  }, [bookmark.tags]);

  // Sync glow if changed in another tab
  useEffect(() => {
    const onStorage = () => setGlow(localStorage.getItem('cardGlowGradient'));
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // เช็ค mouse position กับ bounding box ขณะ drag tag
  useEffect(() => {
    if (!draggingTag || !dragPos) {
      setIsMouseOverDrag(false);
      return;
    }
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const isOver =
      dragPos.x >= rect.left &&
      dragPos.x <= rect.right &&
      dragPos.y >= rect.top &&
      dragPos.y <= rect.bottom;
    setIsMouseOverDrag(isOver);
    // debug log
    // console.log('BookmarkCard', bookmark.title, { dragPos, rect, isOver, draggingTag });
  }, [dragPos, draggingTag]);

  // Remove tag from bookmark
  const handleRemoveTag = async (tagToRemove: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newTags = (bookmark.tags || []).filter(t => t !== tagToRemove);
      try {
        await updateBookmark({
          id: bookmark.id,
          tags: newTags
        });
      } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  };

  // Minimal tag creation and add to bookmark
  const handleCreateAndAddTag = async () => {
    const tagName = newTagName.trim();
    if (!tagName) return;
    if (tags.some(t => t.name.trim().toLowerCase() === tagName.trim().toLowerCase())) return;
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("tags")
        .insert({ name: tagName, user_id: user.id })
        .select()
        .single();
      if (!error && data) {
        const newTags = Array.isArray(bookmark.tags) ? [...bookmark.tags, tagName] : [tagName];
        await updateBookmark({ id: bookmark.id, tags: newTags });
        setNewTagName("");
        setShowCreateTagDialog(false);
      }
    } catch (e) {
      // handle error
    }
    setCreating(false);
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true,
        locale: th 
      });
    } catch {
      return "ไม่ทราบเวลา";
    }
  };

  const truncatedSummary = bookmark.ai_summary && bookmark.ai_summary.length > 150 
    ? bookmark.ai_summary.slice(0, 150) + "..." 
    : bookmark.ai_summary;

  const handleEdit = () => {
    setEditOpen(true);
    editForm.reset({ title: bookmark.title || "", user_description: bookmark.user_description || "", tags: (bookmark.tags || []).join(",") });
  };

  const handleEditSubmit = async (values: any) => {
    try {
      await updateBookmark({
        id: bookmark.id,
        title: values.title,
        user_description: values.user_description,
        tags: values.tags
      });
      setEditOpen(false);
    } catch (error) {
      console.error('Failed to update bookmark:', error);
    }
  };

  // Helper function to get tag style
  const getTagStyle = (tagName: string) => {
    const tagData = tags.find(t => t.name === tagName);
    if (tagData?.color) {
      return {
        background: tagData.color,
        color: tagData.textColor || '#ffffff'
      };
    }
    return undefined;
  };

  const COLOR_PRESETS = [
    { bg: "#2563eb", text: "#ffffff", name: "น้ำเงิน" },
    { bg: "#1d4ed8", text: "#ffffff", name: "น้ำเงินเข้ม" },
    { bg: "#3b82f6", text: "#ffffff", name: "น้ำเงินสว่าง" },
    { bg: "#60a5fa", text: "#000000", name: "ฟ้า" },
    { bg: "#93c5fd", text: "#000000", name: "ฟ้าอ่อน" },
    { bg: "#16a34a", text: "#ffffff", name: "เขียว" },
    { bg: "#15803d", text: "#ffffff", name: "เขียวเข้ม" },
    { bg: "#22c55e", text: "#000000", name: "เขียวสด" },
    { bg: "#4ade80", text: "#000000", name: "เขียวอ่อน" },
    { bg: "#86efac", text: "#000000", name: "เขียวพาสเทล" },
    { bg: "#dc2626", text: "#ffffff", name: "แดง" },
    { bg: "#b91c1c", text: "#ffffff", name: "แดงเข้ม" },
    { bg: "#ef4444", text: "#ffffff", name: "แดงสด" },
    { bg: "#f87171", text: "#000000", name: "แดงอ่อน" },
    { bg: "#fca5a5", text: "#000000", name: "แดงพาสเทล" },
    { bg: "#ca8a04", text: "#000000", name: "เหลือง" },
    { bg: "#a16207", text: "#ffffff", name: "เหลืองเข้ม" },
    { bg: "#eab308", text: "#000000", name: "เหลืองสด" },
    { bg: "#facc15", text: "#000000", name: "เหลืองสว่าง" },
    { bg: "#fde047", text: "#000000", name: "เหลืองอ่อน" },
    { bg: "#9333ea", text: "#ffffff", name: "ม่วง" },
    { bg: "#7e22ce", text: "#ffffff", name: "ม่วงเข้ม" },
    { bg: "#a855f7", text: "#ffffff", name: "ม่วงสด" },
    { bg: "#c084fc", text: "#000000", name: "ม่วงอ่อน" },
    { bg: "#d8b4fe", text: "#000000", name: "ม่วงพาสเทล" },
    { bg: "#ea580c", text: "#ffffff", name: "ส้ม" },
    { bg: "#c2410c", text: "#ffffff", name: "ส้มเข้ม" },
    { bg: "#f97316", text: "#ffffff", name: "ส้มสด" },
    { bg: "#fb923c", text: "#000000", name: "ส้มอ่อน" },
    { bg: "#fdba74", text: "#000000", name: "ส้มพาสเทล" },
    { bg: "#db2777", text: "#ffffff", name: "ชมพู" },
    { bg: "#be185d", text: "#ffffff", name: "ชมพูเข้ม" },
    { bg: "#ec4899", text: "#ffffff", name: "ชมพูสด" },
    { bg: "#f472b6", text: "#000000", name: "ชมพูอ่อน" },
    { bg: "#f9a8d4", text: "#000000", name: "ชมพูพาสเทล" },
    { bg: "#1e293b", text: "#ffffff", name: "กรมท่า" },
    { bg: "#334155", text: "#ffffff", name: "เทาเข้ม" },
    { bg: "#475569", text: "#ffffff", name: "เทา" },
    { bg: "#64748b", text: "#ffffff", name: "เทากลาง" },
    { bg: "#94a3b8", text: "#000000", name: "เทาอ่อน" }
  ];
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
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  const [selectedTextColor, setSelectedTextColor] = useState(TEXT_COLORS[0]);

  // Update handleCreateTagFromEditForm to use color and textColor
  const handleCreateTagFromEditForm = async () => {
    const tagName = newTagName.trim();
    if (!tagName) return;
    if (tags.some(t => t.name.trim().toLowerCase() === tagName.toLowerCase())) return;
    setCreating(true);
    // Optimistic UI: add tag immediately (deduplicate)
    const prevTags = editForm.getValues("tags") || [];
    if (!prevTags.some(t => t.toLowerCase() === tagName.toLowerCase())) {
      editForm.setValue("tags", [...prevTags, tagName]);
    }
    setNewTagName("");
    setShowCreateTagDialog(false);
    setSelectedColor(COLOR_PRESETS[0]);
    setSelectedTextColor(TEXT_COLORS[0]);
    try {
      const { data, error } = await supabase
        .from("tags")
        .insert({ name: tagName, color: selectedColor.bg, textColor: selectedTextColor.value, user_id: user.id })
        .select()
        .single();
      if (error) {
        // Rollback if error
        editForm.setValue("tags", prevTags);
        alert('เกิดข้อผิดพลาด: ' + error.message);
      } else if (!error && data) {
        // Deduplicate again after insert
        const currentTags = editForm.getValues("tags") || [];
        if (!currentTags.some(t => t.toLowerCase() === tagName.toLowerCase())) {
          editForm.setValue("tags", [...currentTags, tagName]);
        }
        setNewTagName("");
        setShowCreateTagDialog(false);
        setSelectedColor(COLOR_PRESETS[0]);
        setSelectedTextColor(TEXT_COLORS[0]);
        if (typeof onTagCreated === 'function') {
          onTagCreated({ name: tagName, color: selectedColor.bg, textColor: selectedTextColor.value });
        }
      }
    } catch (e) {
      editForm.setValue("tags", prevTags);
      alert('เกิดข้อผิดพลาด: ' + (e.message || e));
    }
    setCreating(false);
  };

  const handleAddTagToBookmark = async (tagName: string) => {
    if (!tagName) return;
    if (Array.isArray(bookmark.tags) && bookmark.tags.includes(tagName)) return;
    try {
      const newTags = [...(bookmark.tags || []), tagName];
      console.log('DEBUG: updateBookmark', bookmark.id, newTags);
      await updateBookmark({ id: bookmark.id, tags: newTags });
    } catch (e) { console.error('DEBUG: updateBookmark error', e); }
  };

  // Helper สำหรับเลือก icon ตาม platform
  const getPlatformIcon = (platform: string | null, size = 48) => {
    switch ((platform || "").toLowerCase()) {
      case "instagram": return <FaInstagram size={size} color="#E1306C" />;
      case "facebook": return <FaFacebook size={size} color="#1877F3" />;
      case "twitter": return <FaTwitter size={size} color="#1DA1F2" />;
      case "youtube": return <FaYoutube size={size} color="#FF0000" />;
      case "tiktok": return <FaTiktok size={size} color="#000000" />;
      case "linkedin": return <FaLinkedin size={size} color="#0A66C2" />;
      case "discord": return <FaDiscord size={size} color="#5865F2" />;
      case "github": return <FaGithub size={size} color="#333" />;
      default: return <FaGlobe size={size} color="#64748b" />;
    }
  };

  if (viewMode === "list") {
    return (
      <motion.div
        whileHover={{ scale: 1.03, boxShadow: "0 4px 24px rgba(80,80,160,0.10)" }}
        whileTap={{ scale: 0.98 }}
        className="h-full"
        onClick={() => window.open(bookmark.url, '_blank')}
      >
        <Card
          className="w-full hover:shadow-md transition-shadow cursor-pointer"
          style={glow ? { boxShadow: `0 0 0 4px #000, 0 0 16px 4px #0008, 0 0 0 6px ${glow}` } : {}}
        >
        <div className="flex flex-col sm:flex-row">
          {/* Thumbnail */}
          <div className="w-full sm:w-48 h-32 sm:h-24 flex-shrink-0">
            {bookmark.thumbnail_url && !bookmark.thumbnail_url.includes("photo-1611224923853-80b023f02d71") ? (
              <img 
                src={bookmark.thumbnail_url} 
                alt={bookmark.title || "Thumbnail"}
                className="w-full h-full object-cover rounded-t-lg sm:rounded-l-lg sm:rounded-t-none"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted rounded-t-lg sm:rounded-l-lg sm:rounded-t-none">
                {getPlatformIcon(bookmark.platform, 48)}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {/* Facebook-specific info */}
                    {bookmark.platform === "Facebook" && (
                      <div className="flex flex-col gap-1 mb-2">
                        {bookmark.group_name && (
                          <span className="text-xs text-blue-700 dark:text-blue-300 font-semibold truncate">
                            กลุ่ม: {bookmark.group_name}
                          </span>
                        )}
                        {bookmark.channel_name && (
                          <span className="text-xs text-blue-600 dark:text-blue-200 truncate">
                            โพสต์โดย: {bookmark.channel_name}
                          </span>
                        )}
                      </div>
                    )}
                    {/* Default uploader/channel for other platforms */}
                    {bookmark.platform !== "Facebook" && bookmark.channel_name && (
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="w-6 h-6">
                          {bookmark.channel_avatar ? (
                            <AvatarImage src={bookmark.channel_avatar} alt={bookmark.channel_name} />
                          ) : (
                            <AvatarFallback>
                              {bookmark.channel_name[0]}
                            </AvatarFallback>
                    )}
                        </Avatar>
                        <span className="text-xs text-muted-foreground truncate">
                      {bookmark.channel_name}
                    </span>
                  </div>
                )}
                  </div>
                  <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                    {bookmark.title && !bookmark.title.startsWith("ไม่สามารถดึงข้อมูล") && bookmark.title !== "ไม่มีชื่อเรื่อง"
                      ? bookmark.title
                      : (bookmark.platform || "ลิงก์")}
                  </h3>

                {/* Description or Summary */}
                {(bookmark.user_description || bookmark.ai_summary) && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {bookmark.user_description || truncatedSummary}
                  </p>
                )}

                {/* Suggested tags */}
                {bookmark.suggested_tags && bookmark.suggested_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {bookmark.suggested_tags.map((tag, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <Badge 
                          variant="secondary" 
                          className="text-xs bg-purple-100 text-purple-700 border-purple-200"
                        >
                          {tag}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            // handleAddSuggestedTag(tag); // ลบบรรทัดนี้เนื่องจากรับ tags จาก props
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* User tags */}
                <div className="flex flex-wrap gap-1 mb-2">
                    {/* Platform tag (readonly/locked) */}
                    {bookmark.platform && (
                      <Badge variant="secondary" className="text-xs opacity-80 cursor-not-allowed" title="Platform tag (auto)">
                        {bookmark.platform}
                      </Badge>
                    )}
                    {(Array.isArray(bookmark.tags) ? bookmark.tags : []).filter(tag => tags.some(t => t.name === tag)).map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="text-xs"
                        style={getTagStyle(tag)}
                      >
                      {tag}
                    </Badge>
                  ))}
                  {Array.isArray(bookmark.tags) && bookmark.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{bookmark.tags.length - 3}
                    </Badge>
                  )}
                </div>

                {/* Meta info */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(bookmark.created_at)}
                  </span>
                  {bookmark.platform && (
                    <Badge variant="outline" className="text-xs">
                      {bookmark.platform}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                    onClick={(e) => { e.stopPropagation(); toggleFavorite({ id: bookmark.id, isFavorite: bookmark.is_favorite || false }); }}
                  className="h-8 w-8 p-0"
                >
                  <Heart 
                    className={`h-4 w-4 ${bookmark.is_favorite ? 'fill-red-500 text-red-500' : ''}`} 
                  />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                    onClick={(e) => { e.stopPropagation(); window.open(bookmark.url, '_blank'); }}
                  className="h-8 w-8 p-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); setEditOpen(true); }}
                      >
                        แก้ไข
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); setDeleteOpen(true); }}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      ลบ
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* AI Actions */}
            <div className="flex justify-between items-center">
              <AIButtons bookmark={bookmark} />
            </div>
          </div>
        </div>

        {/* Delete Dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
              <AlertDialogDescription>
                คุณแน่ใจหรือไม่ที่จะลบลิงก์นี้? การดำเนินการนี้ไม่สามารถยกเลิกได้
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                <AlertDialogAction onClick={(e) => { e.stopPropagation(); deleteBookmark(bookmark.id); }} className="bg-destructive text-destructive-foreground">
                ลบ
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
      </motion.div>
    );
  }

  // Grid view (existing code with improvements)
  return (
    <div className={`transform transition-transform ${cardSize}`} ref={cardRef}>
      <motion.div
        whileHover={{ scale: 1.03, boxShadow: "0 4px 24px rgba(80,80,160,0.10)" }}
        whileTap={{ scale: 0.98 }}
        className={`h-full transition-all ${(isMouseOverDrag) ? 'card-glow-anim scale-105 shadow-xl' : ''}`}
        onClick={() => window.open(bookmark.url, '_blank')}
        // ไม่ใช้ onDrop/onDragOver/onDragEnter/onDragLeave อีกต่อไป
      >
        <Card
          className="h-full hover:shadow-lg transition-shadow group cursor-pointer relative"
          style={glow ? { boxShadow: `0 0 0 4px #000, 0 0 16px 4px #0008, 0 0 0 6px ${glow}` } : {}}
        >
          {/* ปุ่มลบแบบถังขยะในโหมดแก้ไข */}
          {editTagMode && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 z-20 shadow-md"
              onClick={e => { e.stopPropagation(); setDeleteOpen(true); }}
              title="ลบลิงก์นี้"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          )}
        {/* Thumbnail */}
        <div className="relative w-full h-32 sm:h-40">
          {bookmark.thumbnail_url && !bookmark.thumbnail_url.includes("photo-1611224923853-80b023f02d71") ? (
            <img 
              src={bookmark.thumbnail_url} 
              alt={bookmark.title || "Thumbnail"}
              className="w-full h-full object-cover rounded-t-lg"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted rounded-t-lg">
              {getPlatformIcon(bookmark.platform, 56)}
            </div>
          )}
          
          {/* Platform badge */}
          {bookmark.platform && (
            <Badge 
              className="absolute top-2 left-2 text-xs"
              variant="secondary"
            >
              {bookmark.platform}
            </Badge>
          )}

          {/* Actions overlay */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button
              variant="secondary"
              size="sm"
                onClick={(e) => { e.stopPropagation(); toggleFavorite({ id: bookmark.id, isFavorite: bookmark.is_favorite || false }); }}
              className="h-8 w-8 p-0"
            >
              <Heart 
                className={`h-4 w-4 ${bookmark.is_favorite ? 'fill-red-500 text-red-500' : ''}`} 
              />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); setEditOpen(true); }}
                  >
                    แก้ไข
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); window.open(bookmark.url, '_blank'); }}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  เปิดลิงก์
                </DropdownMenuItem>
                <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); setDeleteOpen(true); }}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  ลบ
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <CardHeader className="p-3 pb-2">
            {/* Facebook-specific info */}
            {bookmark.platform === "Facebook" && (
              <div className="flex flex-col gap-1 mb-2">
                {bookmark.group_name && (
                  <span className="text-xs text-blue-700 dark:text-blue-300 font-semibold truncate">
                    กลุ่ม: {bookmark.group_name}
                  </span>
                )}
          {bookmark.channel_name && (
                  <span className="text-xs text-blue-600 dark:text-blue-200 truncate">
                    โพสต์โดย: {bookmark.channel_name}
                  </span>
                )}
              </div>
            )}
            {/* Default uploader/channel for other platforms */}
            {bookmark.platform !== "Facebook" && bookmark.channel_name && (
            <div className="flex items-center gap-2 mb-2">
                <Avatar className="w-6 h-6">
                  {bookmark.channel_avatar ? (
                    <AvatarImage src={bookmark.channel_avatar} alt={bookmark.channel_name} />
                  ) : (
                    <AvatarFallback>
                      {bookmark.channel_name[0]}
                    </AvatarFallback>
              )}
                </Avatar>
              <span className="text-xs text-muted-foreground truncate">
                {bookmark.channel_name}
              </span>
            </div>
          )}
          <CardTitle className="text-sm line-clamp-2 min-h-[2.5rem]">
            {bookmark.title && !bookmark.title.startsWith("ไม่สามารถดึงข้อมูล") && bookmark.title !== "ไม่มีชื่อเรื่อง"
              ? bookmark.title
              : (bookmark.platform || "ลิงก์")}
          </CardTitle>
            {/* Facebook caption/description */}
            {bookmark.platform === "Facebook" && (
              <CardDescription className="text-xs line-clamp-2">
                {bookmark.description || bookmark.caption || "ไม่มีแคปชั่น"}
              </CardDescription>
            )}
            {/* Default description for other platforms */}
            {bookmark.platform !== "Facebook" && (bookmark.user_description || bookmark.ai_summary) && (
            <CardDescription className="text-xs line-clamp-2">
              {bookmark.user_description || truncatedSummary}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="p-3 pt-0">
          {/* AI Summary Preview */}
          {bookmark.ai_summary && (
            <div className="mb-3 p-2 bg-purple-50 dark:bg-purple-950/20 rounded-md">
              <div className="text-xs text-purple-700 dark:text-purple-300">
                {summaryExpanded ? bookmark.ai_summary : truncatedSummary}
              </div>
              {bookmark.ai_summary.length > 150 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSummaryExpanded(!summaryExpanded)}
                  className="h-6 p-0 text-xs text-purple-600 hover:text-purple-700"
                >
                  {summaryExpanded ? (
                    <>
                      <EyeOff className="h-3 w-3 mr-1" />
                      ย่อ
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3 mr-1" />
                      อ่านเพิ่ม
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Suggested tags */}
          {bookmark.suggested_tags && bookmark.suggested_tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {bookmark.suggested_tags.map((tag, index) => (
                <div key={index} className="flex items-center gap-1">
                  <Badge 
                    variant="secondary" 
                    className="text-xs bg-purple-100 text-purple-700 border-purple-200"
                  >
                    {tag}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      // handleAddSuggestedTag(tag); // ลบบรรทัดนี้เนื่องจากรับ tags จาก props
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-2">
            {(Array.isArray(bookmark.tags) ? bookmark.tags.slice(0, 3) : []).map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs"
                style={getTagStyle(tag)}
              >
                {tag}
                {editTagMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 ml-1"
                    onClick={(e) => handleRemoveTag(tag, e)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </Badge>
            ))}
            {Array.isArray(bookmark.tags) && bookmark.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{bookmark.tags.length - 3}
              </Badge>
            )}
          </div>
          {editTagMode && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 p-0 rounded-full border border-green-500 bg-green-100 text-green-600 hover:bg-green-500 hover:text-white transition"
                    title="เพิ่มแท็ก"
                    style={{ boxShadow: "0 2px 8px rgba(34,197,94,0.15)" }}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[180px]">
                  <DropdownMenuItem disabled className="font-semibold text-xs opacity-70 cursor-default select-none">
                    เลือกแท็กที่มีอยู่
                  </DropdownMenuItem>
                  {tags.filter(t => Array.isArray(bookmark.tags) ? !bookmark.tags.includes(t.name) : true).map(t => (
                    <DropdownMenuItem
                      key={t.id}
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const newTags = Array.isArray(bookmark.tags) ? [...bookmark.tags, t.name] : [t.name];
                        try {
                          await updateBookmark({
                            id: bookmark.id,
                            tags: newTags
                          });
                        } catch (error) {
                          console.error('Failed to add tag:', error);
                        }
                      }}
                    >
                      <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ background: t.color || '#6366f1' }} />
                      {t.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowCreateTagDialog(true);
                    }}
                    className="font-semibold text-green-600 hover:bg-green-50 cursor-pointer mt-1"
                  >
                    <Plus className="h-4 w-4 mr-1" /> เพิ่มแท็กใหม่
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {/* Dialog สำหรับสร้างแท็กใหม่ (ฟอร์มเต็มรูปแบบ) */}
              <Dialog open={showCreateTagDialog} onOpenChange={setShowCreateTagDialog}>
                <DialogContent onClick={e => e.stopPropagation()}>
                  <DialogHeader>
                    <DialogTitle>สร้างแท็กใหม่</DialogTitle>
                    <DialogDescription>
                      ตั้งชื่อแท็ก เลือกสีพื้นหลังและสีตัวอักษร พร้อมดูตัวอย่าง
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="เช่น ข่าว, AI, เทคโนโลยี"
                      value={newTagName}
                      onChange={e => setNewTagName(e.target.value)}
                    />
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* เลือกสีพื้นหลัง */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">สีพื้นหลัง</label>
                        <div className="grid grid-cols-5 gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-lg">
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
                              className={`relative aspect-square rounded-md transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border ${selectedTextColor.value === color.value ? 'ring-2 ring-blue-500' : ''}`}
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
                        {newTagName || "ตัวอย่างแท็ก"}
                      </Badge>
                    </div>
                    <Button
                      onClick={handleCreateTagFromEditForm}
                      disabled={!newTagName.trim() || tags.some(t => t.name.trim().toLowerCase() === newTagName.trim().toLowerCase()) || creating}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {creating ? <span className="animate-spin mr-2">⏳</span> : null}
                      เพิ่ม
                    </Button>
                    {tags.some(t => t.name.trim().toLowerCase() === newTagName.trim().toLowerCase()) && (
                      <div className="text-xs text-red-500 mt-2">มีแท็กนี้อยู่แล้ว</div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}

          {/* AI Actions and Date */}
          <div className="flex justify-between items-center">
            <AIButtons bookmark={bookmark} />
            <span className="text-xs text-muted-foreground">
              {formatDate(bookmark.created_at)}
            </span>
          </div>
        </CardContent>

        {/* Delete Dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
              <AlertDialogDescription>
                คุณแน่ใจหรือไม่ที่จะลบลิงก์นี้? การดำเนินการนี้ไม่สามารถยกเลิกได้
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                <AlertDialogAction onClick={(e) => { e.stopPropagation(); deleteBookmark(bookmark.id); }} className="bg-destructive text-destructive-foreground">
                ลบ
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
      </motion.div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขลิงก์</DialogTitle>
            <DialogDescription>แก้ไขชื่อ, คำอธิบาย, และแท็กของลิงก์นี้</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField 
                name="title" 
                control={editForm.control} 
                rules={{ required: "กรุณากรอกชื่อเรื่อง" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อเรื่อง</FormLabel>
                    <FormControl>
                      <Input placeholder="ชื่อวิดีโอหรือชื่อเรื่อง" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField 
                name="user_description" 
                control={editForm.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>คำอธิบาย</FormLabel>
                    <FormControl>
                      <Input placeholder="คำอธิบายเพิ่มเติม" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField 
                name="tags" 
                control={editForm.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>แท็ก</FormLabel>
                    <div className="space-y-3">
                      {/* แสดงแท็กที่เลือกแล้ว */}
                      {Array.isArray(field.value) && field.value.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {field.value.map((tag, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="text-xs"
                              style={getTagStyle(tag)}
                            >
                              {tag}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 ml-1"
                                onClick={() => {
                                  const newTags = field.value.filter((_, i) => i !== index);
                                  field.onChange(newTags);
                                }}
                              >
                                <X className="h-2 w-2" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {/* Dropdown เลือกแท็กที่มีอยู่ */}
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">เลือกแท็กที่มีอยู่:</div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full justify-start">
                              <Plus className="h-4 w-4 mr-2" />
                              เลือกแท็ก
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="min-w-[200px] max-h-[200px] overflow-y-auto">
                            {tags.filter(t => !(field.value || []).includes(t.name)).map(t => (
                              <DropdownMenuItem
                                key={t.id}
                                onClick={() => {
                                  const newTags = [...(field.value || []), t.name];
                                  field.onChange(newTags);
                                }}
                              >
                                <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ background: t.color || '#6366f1' }} />
                                {t.name}
                              </DropdownMenuItem>
                            ))}
                            {tags.filter(t => !(field.value || []).includes(t.name)).length === 0 && (
                              <DropdownMenuItem disabled className="text-muted-foreground">
                                ไม่มีแท็กอื่นให้เลือก
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* แท็กแนะนำจาก AI */}
                      {bookmark.suggested_tags && bookmark.suggested_tags.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs text-muted-foreground">แท็กแนะนำจาก AI:</div>
                          <div className="flex flex-wrap gap-1">
                            {bookmark.suggested_tags.filter(tag => !(field.value || []).includes(tag)).map((tag, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                className="text-xs h-6 px-2"
                                onClick={() => {
                                  const newTags = [...(field.value || []), tag];
                                  field.onChange(newTags);
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                {tag}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ปุ่มสร้างแท็กใหม่ */}
                      {/* Replace the minimal tag creation dialog in the edit dialog with the full-featured one */}
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">สร้างแท็กใหม่:</div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setShowCreateTagDialog(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          สร้างแท็กใหม่
                        </Button>
                        <Dialog open={showCreateTagDialog} onOpenChange={setShowCreateTagDialog}>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>สร้างแท็กใหม่</DialogTitle>
                              <DialogDescription>
                                ตั้งชื่อแท็ก เลือกสีพื้นหลังและสีตัวอักษร พร้อมดูตัวอย่าง
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Input
                                placeholder="เช่น ข่าว, AI, เทคโนโลยี"
                                value={newTagName}
                                onChange={e => setNewTagName(e.target.value)}
                              />
                              <div className="grid gap-4 md:grid-cols-2">
                                {/* เลือกสีพื้นหลัง */}
                                <div className="space-y-2">
                                  <label className="block text-sm font-medium">สีพื้นหลัง</label>
                                  <div className="grid grid-cols-5 gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-lg">
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
                                        className={`relative aspect-square rounded-md transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border ${selectedTextColor.value === color.value ? 'ring-2 ring-blue-500' : ''}`}
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
                                  {newTagName || "ตัวอย่างแท็ก"}
                                </Badge>
                              </div>
                              <Button
                                onClick={handleCreateTagFromEditForm}
                                disabled={!newTagName.trim() || tags.some(t => t.name.trim().toLowerCase() === newTagName.trim().toLowerCase()) || creating}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                              >
                                เพิ่ม
                              </Button>
                              {tags.some(t => t.name.trim().toLowerCase() === newTagName.trim().toLowerCase()) && (
                                <div className="text-xs text-red-500 mt-2">มีแท็กนี้อยู่แล้ว</div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">บันทึกการแก้ไข</Button>
                {/* ปุ่มลบลิงก์ในโหมดแก้ไข */}
                <Button type="button" variant="destructive" onClick={() => { setEditOpen(false); setDeleteOpen(true); }}>
                  <Trash2 className="h-4 w-4 mr-2" /> ลบลิงก์
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
