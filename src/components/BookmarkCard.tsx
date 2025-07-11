import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  ExternalLink, 
  MoreVertical, 
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  Plus
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
import { TagInput } from "@/components/ui/tag-input";

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
    user_id?: string;
    group_name?: string;
    caption?: string;
  };
  cardSize?: string;
  viewMode?: "grid" | "list";
}

export const BookmarkCard = ({ 
  bookmark, 
  cardSize = "scale-100",
  viewMode = "grid"
}: BookmarkCardProps) => {
  const { toggleFavorite, deleteBookmark, updateBookmark } = useBookmarks();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [uploader, setUploader] = useState<{ avatar_url: string | null, full_name: string | null } | null>(null);
  const [tags, setTags] = useState<Array<{ id: string; name: string; color: string; textColor: string }>>([]);
  const { user } = useAuth();
  const editForm = useForm({ 
    defaultValues: { 
      title: bookmark.title || "", 
      user_description: bookmark.user_description || "", 
      tags: bookmark.tags || []  // Array of tags
    } 
  });

  const fetchTags = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (!error) setTags(data);
  }, [user]);

  useEffect(() => {
    fetchTags();
  }, [user, fetchTags]);

  const handleDelete = () => {
    deleteBookmark(bookmark.id);
  };

  const handleToggleFavorite = () => {
    toggleFavorite({ id: bookmark.id, isFavorite: bookmark.is_favorite || false });
  };

  const handleAddSuggestedTag = async (tagToAdd: string) => {
    const currentTags = bookmark.tags || [];
    if (!currentTags.includes(tagToAdd)) {
      const newTags = [...currentTags, tagToAdd];
      try {
        await updateBookmark({
          id: bookmark.id,
          tags: newTags
        });
      } catch (error) {
        console.error('Failed to add suggested tag:', error);
      }
    }
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

  const handleEditSubmit = async (values: { title: string; user_description: string; tags: string[] }) => {
    try {
      await updateBookmark({
        id: bookmark.id,
        title: values.title,
        user_description: values.user_description,
        tags: values.tags // Array of tags
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

  if (viewMode === "list") {
    return (
      <motion.div
        whileHover={{ scale: 1.03, boxShadow: "0 4px 24px rgba(80,80,160,0.10)" }}
        whileTap={{ scale: 0.98 }}
        className="h-full"
        onClick={() => window.open(bookmark.url, '_blank')}
      >
        <Card className="w-full hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex flex-col sm:flex-row">
          {/* Thumbnail */}
          <div className="w-full sm:w-48 h-32 sm:h-24 flex-shrink-0">
            {bookmark.thumbnail_url ? (
              <img 
                src={bookmark.thumbnail_url} 
                alt={bookmark.title || "Thumbnail"}
                className="w-full h-full object-cover rounded-t-lg sm:rounded-l-lg sm:rounded-t-none"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center rounded-t-lg sm:rounded-l-lg sm:rounded-t-none">
                <ExternalLink className="h-8 w-8 text-muted-foreground" />
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
                    {bookmark.title || "ไม่มีชื่อเรื่อง"}
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
                            handleAddSuggestedTag(tag);
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
                    {bookmark.tags && bookmark.tags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="text-xs"
                        style={getTagStyle(tag)}
                      >
                      {tag}
                    </Badge>
                  ))}
                  {bookmark.tags.length > 3 && (
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
                    onClick={(e) => { e.stopPropagation(); handleToggleFavorite(); }}
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
                <AlertDialogAction onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="bg-destructive text-destructive-foreground">
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
    <div className={`transform transition-transform ${cardSize}`}>
      <motion.div
        whileHover={{ scale: 1.03, boxShadow: "0 4px 24px rgba(80,80,160,0.10)" }}
        whileTap={{ scale: 0.98 }}
        className="h-full"
        onClick={() => window.open(bookmark.url, '_blank')}
      >
        <Card className="h-full hover:shadow-lg transition-shadow group cursor-pointer">
        {/* Thumbnail */}
        <div className="relative w-full h-32 sm:h-40">
          {bookmark.thumbnail_url ? (
            <img 
              src={bookmark.thumbnail_url} 
              alt={bookmark.title || "Thumbnail"}
              className="w-full h-full object-cover rounded-t-lg"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center rounded-t-lg">
              <ExternalLink className="h-8 w-8 text-muted-foreground" />
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
                onClick={(e) => { e.stopPropagation(); handleToggleFavorite(); }}
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
            {bookmark.title || "ไม่มีชื่อเรื่อง"}
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
                      handleAddSuggestedTag(tag);
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
            {bookmark.tags.slice(0, 3).map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs"
                style={getTagStyle(tag)}
              >
                {tag}
              </Badge>
            ))}
            {bookmark.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{bookmark.tags.length - 3}
              </Badge>
            )}
          </div>

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
                <AlertDialogAction onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="bg-destructive text-destructive-foreground">
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
                    <FormControl>
                      <TagInput 
                        {...field}
                        suggestions={tags}
                        placeholder="เพิ่มแท็ก..."
                        userId={user?.id}
                        onTagsChange={fetchTags}
                        returnType="array"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">บันทึกการแก้ไข</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
