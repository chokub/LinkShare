import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Bookmark {
  id: string;
  title: string | null;
  description: string | null;
  user_description: string | null;
  ai_summary: string | null;
  suggested_tags: string[];
  url: string;
  thumbnail_url: string | null;
  platform: string | null;
  channel_name: string | null;
  channel_avatar: string | null;
  tags: string[];
  is_favorite: boolean | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface MetadataResult {
  title: string;
  description: string;
  thumbnail: string;
  platform: string;
  channel_name?: string;
  channel_avatar?: string;
}

export const useBookmarks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey: ["bookmarks", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("bookmarks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Bookmark[];
    },
    enabled: !!user,
  });

  // Function to extract metadata from URL
  const extractMetadata = async (url: string): Promise<MetadataResult | null> => {
    try {
      console.log('Extracting metadata for:', url);
      const { data, error } = await supabase.functions.invoke('extract-metadata', {
        body: { url }
      });

      if (error) {
        console.error('Metadata extraction error:', error);
        return null;
      }

      console.log('Metadata extracted:', data);
      return data as MetadataResult;
    } catch (error) {
      console.error('Failed to extract metadata:', error);
      return null;
    }
  };

  // AI Analysis functions
  const analyzeWithAI = async (url: string, title: string, description: string, action: 'summary' | 'tags') => {
    try {
      console.log('Analyzing with AI:', { url, title, description, action });
      const { data, error } = await supabase.functions.invoke('ai-content-analyzer', {
        body: { url, title, description, action }
      });

      if (error) {
        console.error('AI analysis error:', error);
        return null;
      }

      console.log('AI analysis result:', data);
      return data.result;
    } catch (error) {
      console.error('Failed to analyze with AI:', error);
      return null;
    }
  };

  const addBookmarkMutation = useMutation({
    mutationFn: async (bookmarkData: {
      url: string;
      title?: string;
      user_description?: string;
      tags?: string[];
      skipMetadataExtraction?: boolean;
      channel_name?: string | null;
      channel_avatar?: string | null;
      platform?: string | null;
    }) => {
      if (!user) throw new Error("User not authenticated");

      let finalTitle = bookmarkData.title;
      let finalDescription = "";
      let finalThumbnail = null;
      let finalPlatform = bookmarkData.platform || "Other";
      let channelName: string | null = bookmarkData.channel_name || null;
      let channelAvatar: string | null = bookmarkData.channel_avatar || null;

      // Always try to extract metadata for better titles and thumbnails
      console.log('Attempting to extract metadata...');
      const metadata = await extractMetadata(bookmarkData.url);
      if (metadata) {
        if (!bookmarkData.title || bookmarkData.title.trim() === "") {
        finalTitle = metadata.title;
        }
        finalDescription = metadata.description;
        finalThumbnail = metadata.thumbnail;
        // ถ้า parameter ไม่มี platform ให้ใช้จาก metadata
        if (!bookmarkData.platform && metadata.platform) finalPlatform = metadata.platform;
        if (!channelName && metadata.channel_name) channelName = metadata.channel_name;
        if (!channelAvatar && metadata.channel_avatar) channelAvatar = metadata.channel_avatar;
        console.log('Using extracted metadata:', metadata);
      } else {
        console.log('Metadata extraction failed, using manual input');
        // Simple platform detection for manual entries
        const platformMap: { [key: string]: string } = {
          "youtube.com": "YouTube",
          "youtu.be": "YouTube",
          "instagram.com": "Instagram", 
          "tiktok.com": "TikTok",
          "facebook.com": "Facebook",
          "twitter.com": "Twitter",
          "x.com": "Twitter",
          "shopee.co.th": "Shopee"
        };
        for (const [domain, platformName] of Object.entries(platformMap)) {
          if (bookmarkData.url.includes(domain)) {
            finalPlatform = platformName;
            break;
          }
        }
      }

      const { data, error } = await supabase
        .from("bookmarks")
        .insert({
          user_id: user.id,
          url: bookmarkData.url,
          title: finalTitle || "ไม่มีชื่อเรื่อง",
          description: finalDescription || "ไม่มีคำอธิบาย",
          user_description: bookmarkData.user_description || null,
          platform: finalPlatform,
          thumbnail_url: finalThumbnail,
          channel_name: channelName,
          channel_avatar: channelAvatar,
          tags: bookmarkData.tags || [],
          suggested_tags: [],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      toast({
        title: "เพิ่มลิงก์สำเร็จ!",
        description: "ลิงก์ได้ถูกเพิ่มเข้าคอลเลกชันแล้ว",
      });
    },
    onError: (error: any) => {
      console.error('Add bookmark error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateBookmarkMutation = useMutation({
    mutationFn: async ({ 
      id, 
      title, 
      user_description, 
      tags 
    }: { 
      id: string;
      title?: string;
      user_description?: string;
      tags?: string[];
    }) => {
      if (!user) throw new Error("User not authenticated");

      // Sync new tags to tags table
      if (tags) {
        const { data: existingTags } = await supabase
          .from("tags")
          .select("name")
          .eq("user_id", user.id);

        const existingTagNames = existingTags?.map(t => t.name) || [];
        const newTags = tags.filter(tag => !existingTagNames.includes(tag));

        if (newTags.length > 0) {
          await supabase.from("tags").insert(
            newTags.map(name => ({
              name,
              color: "#6366f1",
              user_id: user.id
            }))
          );
        }
      }

      const { error } = await supabase
        .from("bookmarks")
        .update({
          ...(title !== undefined && { title }),
          ...(user_description !== undefined && { user_description }),
          ...(tags !== undefined && { tags })
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      toast({
        title: "อัพเดทลิงก์สำเร็จ!",
        description: "ข้อมูลลิงก์ได้รับการอัพเดทแล้ว",
      });
    },
    onError: (error: any) => {
      console.error('Update bookmark error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateBookmarkAI = useMutation({
    mutationFn: async ({ id, ai_summary, suggested_tags }: { 
      id: string; 
      ai_summary?: string; 
      suggested_tags?: string[] 
    }) => {
      const updateData: any = {};
      if (ai_summary !== undefined) updateData.ai_summary = ai_summary;
      if (suggested_tags !== undefined) updateData.suggested_tags = suggested_tags;

      const { error } = await supabase
        .from("bookmarks")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const { error } = await supabase
        .from("bookmarks")
        .update({ is_favorite: !isFavorite })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  const deleteBookmarkMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      toast({
        title: "ลบลิงก์สำเร็จ!",
        description: "ลิงก์ได้ถูกลบออกจากคอลเลกชันแล้ว",
      });
    },
    onError: (error: any) => {
      console.error('Delete bookmark error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    bookmarks,
    isLoading,
    addBookmark: addBookmarkMutation.mutate,
    isAddingBookmark: addBookmarkMutation.isPending,
    updateBookmark: updateBookmarkMutation.mutate,
    isUpdatingBookmark: updateBookmarkMutation.isPending,
    toggleFavorite: toggleFavoriteMutation.mutate,
    deleteBookmark: deleteBookmarkMutation.mutate,
    isDeletingBookmark: deleteBookmarkMutation.isPending,
    updateBookmarkAI: updateBookmarkAI.mutate,
    extractMetadata,
    analyzeWithAI,
  };
};
