import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBookmarks } from "@/hooks/useBookmarks";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import { BookmarkCard } from "@/components/BookmarkCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, Plus, Grid, List, Edit2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { X as XIcon, Edit2 as Edit2Icon, Trash2, Check, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TagInput } from "@/components/ui/tag-input";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

// ฟังก์ชันใหม่: autoDetectPlatform (แทน detectPlatformFromUrl)
function autoDetectPlatform(url: string): string {
  try {
    const { hostname } = new URL(url);
    let domain = hostname.replace(/^www\./, "");
    const parts = domain.split(".");
    let platform = "";
    if (parts.length >= 2) {
      if (["co", "com", "net", "org", "tv", "io", "th"].includes(parts[parts.length - 2])) {
        platform = parts[parts.length - 3];
      } else {
        platform = parts[parts.length - 2];
      }
    } else {
      platform = parts[0];
    }
    // Normalize platform name
    const special = {
      youtube: "YouTube",
      youtu: "YouTube",
      facebook: "Facebook",
      shopee: "Shopee",
      lazada: "Lazada",
      twitch: "Twitch",
      tiktok: "TikTok",
      instagram: "Instagram",
      twitter: "Twitter"
    };
    const key = platform.toLowerCase();
    if (special[key]) return special[key];
    return platform.charAt(0).toUpperCase() + platform.slice(1).toLowerCase();
  } catch {
    return "Other";
  }
}

// ฟังก์ชัน normalizePlatformName
function normalizePlatformName(name: string): string {
  if (!name) return "";
  const special = {
    youtube: "YouTube",
    youtu: "YouTube",
    facebook: "Facebook",
    shopee: "Shopee",
    lazada: "Lazada",
    twitch: "Twitch",
    tiktok: "TikTok",
    instagram: "Instagram",
    twitter: "Twitter"
  };
  const key = name.toLowerCase();
  if (special[key]) return special[key];
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { bookmarks, isLoading: bookmarksLoading, addBookmark, isAddingBookmark, extractMetadata } = useBookmarks();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagLoading, setTagLoading] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const tagForm = useForm({ defaultValues: { name: "", color: "#6366f1" } });
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  // เพิ่ม state สำหรับ Edit Tag Mode
  const [editTagMode, setEditTagMode] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const { toast } = useToast();
  const [draggingTag, setDraggingTag] = useState<null | { name: string; color: string; textColor: string }>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const dragPointerMoveRef = useRef<(e: PointerEvent) => void>();
  const transparentImg = useRef<HTMLImageElement>();
  useEffect(() => {
    if (!transparentImg.current) {
      const img = new window.Image(1, 1);
      img.src =
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=";
      transparentImg.current = img;
    }
  }, []);

  useEffect(() => {
    if (!draggingTag) return;
    const onDragOver = (e: DragEvent) => {
      setDragPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('dragover', onDragOver);
    return () => window.removeEventListener('dragover', onDragOver);
  }, [draggingTag]);

  useEffect(() => {
    if (draggingTag) {
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.userSelect = '';
    }
    return () => {
      document.body.style.userSelect = '';
    };
  }, [draggingTag]);

  useEffect(() => {
    if (dragPos) {
      console.log('Dashboard dragPos', dragPos, 'draggingTag', draggingTag);
    }
  }, [dragPos, draggingTag]);

  // --- เพิ่มชุดสีและ state สำหรับ Dialog สร้างแท็กใหม่ ---
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

  const form = useForm({
    defaultValues: {
      url: "",
      title: "",
      user_description: "",
      tags: []  // Change to array instead of string
    }
  });

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ฟังก์ชันดึง oEmbed จาก YouTube
  async function fetchYoutubeOembed(url: string) {
    try {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
      );
      if (!res.ok) return null;
      const data = await res.json();
      return {
        title: data.title,
        channel: data.author_name,
        thumbnail: data.thumbnail_url,
        html: data.html,
      };
    } catch (err) {
      return null;
    }
  }

  // ฟังก์ชันดึง metadata Facebook จาก backend API
  async function fetchFacebookMetadata(url: string) {
    try {
      const res = await fetch('http://localhost:3001/api/fb-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      return {
        title: data.title,
        description: data.description,
        thumbnail: data.image,
        platform: data.platform || 'Facebook',
        channel_name: null, // Facebook API/scrape ไม่ได้ชื่อเพจตรงๆ จาก meta
        group_name: null,
        poster_name: null,
        caption: data.description
      };
    } catch (err) {
      // fallback mock
      return {
        title: "ไม่สามารถดึงข้อมูล Facebook ได้",
        description: "เกิดข้อผิดพลาดหรือโดนบล็อก",
        thumbnail: "",
        platform: "Facebook",
        channel_name: null,
        group_name: null,
        poster_name: null,
        caption: null
      };
    }
  }

  // ฟังก์ชันดึง metadata Shopee จาก backend API
  async function fetchShopeeMetadata(url: string) {
    try {
      const res = await fetch('http://localhost:3001/api/shopee-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      return {
        title: data.title,
        description: data.price ? `ราคา: ${data.price}` : '',
        thumbnail: data.image,
        platform: data.platform || 'Shopee',
      };
    } catch (err) {
      return {
        title: "ไม่สามารถดึงข้อมูล Shopee ได้",
        description: "เกิดข้อผิดพลาดหรือโดนบล็อก",
        thumbnail: "",
        platform: "Shopee"
      };
    }
  }

  const handleUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    form.setValue("url", url);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // ถ้า input ว่าง ไม่ต้อง setMetadata หรือ error
    if (!url || url.trim() === "") {
      setMetadata(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      if (/shopee\.co\.th\//.test(url)) {
        setMetaLoading(true);
        const meta = await fetchShopeeMetadata(url);
        setMetaLoading(false);
        if (meta) {
          setMetadata(meta);
          // ถ้า meta.title ไม่มี ให้ fallback เป็น slug จาก url
          let title = meta.title;
          if (!title || title.trim() === '' || title === 'Shopee' || title === 'ตัวอย่างชื่อสินค้า Shopee') {
            try {
              const u = new URL(url);
              const slug = decodeURIComponent(u.pathname.split('/')[1] || '');
              const titlePart = slug.replace(/-i\.[0-9]+\.[0-9]+$/, '');
              title = titlePart.replace(/-/g, ' ').trim();
            } catch {}
          }
          form.setValue("title", title);
        }
        return;
      }
      if (/facebook\.com\//.test(url)) {
        setMetaLoading(true);
        const meta = await fetchFacebookMetadata(url);
        setMetaLoading(false);
        if (meta) {
          setMetadata(meta);
          form.setValue("title", meta.title);
        }
        return;
      }
      if (/youtube\.com|youtu\.be/.test(url)) {
        setMetaLoading(true);
        const meta = await fetchYoutubeOembed(url);
        setMetaLoading(false);
        if (meta) {
          setMetadata(meta);
          form.setValue("title", meta.title);
        }
      } else {
        setMetaLoading(true);
        const meta = await extractMetadata(url);
        setMetaLoading(false);
        setMetadata(meta);
        if (meta && meta.title) {
          form.setValue("title", meta.title);
        }
      }
    }, 400);
  };

  const onSubmit = async (values: any) => {
    await new Promise((resolve) => setTimeout(resolve, 200)); // for UX
    // ถ้า metadata.platform ไม่มี หรือเป็น Other ให้ auto detect
    const platformTag = (
      metadata?.platform && metadata.platform !== "Other"
        ? metadata.platform
        : autoDetectPlatform(values.url)
    );
    const userTags = values.tags || []; // Use tags array directly
    // --- เพิ่ม logic sync tag เข้า table tags ---
    const existingTagNames = tags.map(t => t.name);
    for (const tagName of userTags) {
      if (!existingTagNames.includes(tagName)) {
        await supabase.from("tags").insert({ name: tagName, color: "#6366f1", user_id: user.id });
      }
    }
    // ---
    console.log('DEBUG onSubmit:', { platformTag, userTags, metadata });
    addBookmark({
      url: values.url,
      title: values.title,
      user_description: values.user_description,
      tags: userTags,
      channel_name: metadata?.channel || metadata?.channel_name || metadata?.poster_name || null,
      channel_avatar: metadata?.channel_avatar || null,
      group_name: metadata?.group_name || null,
      description: metadata?.caption || metadata?.description || null,
      thumbnail_url: metadata?.thumbnail || null,
      platform: platformTag
    });
    setAddDialogOpen(false);
    form.reset();
    setMetadata(null);
    fetchTags();
  };

  const fetchTags = async () => {
    setTagLoading(true);
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    setTagLoading(false);
    if (!error) setTags(data);
  };

  useEffect(() => {
    if (user) fetchTags();
  }, [user]);

  useEffect(() => {
    if (tagDialogOpen && user) fetchTags();
  }, [tagDialogOpen, user]);

  const handleAddTag = async (values) => {
    if (!values.name) return;
    setTagLoading(true);
    if (editingTag) {
      await supabase.from("tags").update({ name: values.name, color: selectedColor.bg, textColor: selectedTextColor.value }).eq("id", editingTag.id);
    } else {
      await supabase.from("tags").insert({ name: values.name, color: selectedColor.bg, textColor: selectedTextColor.value, user_id: user.id });
      // Toast แจ้งเตือนสำเร็จ
      toast({
        title: (
          <span className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            สร้างแท็กใหม่สำเร็จ!
          </span>
        ),
        description: `เพิ่มแท็ก ‘${values.name}’ เรียบร้อยแล้ว`,
        duration: 2500,
      });
    }
    setTagLoading(false);
    setEditingTag(null);
    tagForm.reset({ name: "" });
    setSelectedColor(COLOR_PRESETS[0]);
    setSelectedTextColor(TEXT_COLORS[0]);
    fetchTags();
  };

  const handleEditTag = (tag) => {
    setEditingTag(tag);
    tagForm.setValue("name", tag.name);
    tagForm.setValue("color", tag.color || "#6366f1");
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
    setTagLoading(true);
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

    setTagLoading(false);
    fetchTags();
  };

  const handleTagDialogClose = () => {
    setTagDialogOpen(false);
    setEditingTag(null);
    tagForm.reset({ name: "", color: "#6366f1" });
  };

  // ฟังก์ชันสำหรับโหมด Edit Tag
  const handleDeleteTagFromFilter = async (tagName: string) => {
    if (!user) return;
    // หา tag object จาก tags array
    const tagToDelete = tags.find(t => t.name === tagName);
    if (tagToDelete) {
      // ลบ tag จาก database
      await supabase.from("tags").delete().eq("id", tagToDelete.id);
      // ลบ tag ออกจาก bookmarks
      const { data: bookmarksWithTag } = await supabase
        .from("bookmarks")
        .select("id, tags")
        .contains("tags", [tagToDelete.name]);
      if (bookmarksWithTag) {
        for (const bm of bookmarksWithTag) {
          const newTags = (bm.tags || []).filter(t => t !== tagToDelete.name);
          await supabase.from("bookmarks").update({ tags: newTags }).eq("id", bm.id);
        }
      }
      // อัปเดต tags state
      setTags(tags.filter(t => t.id !== tagToDelete.id));
      // ถ้า tag ที่ลบเป็น tag ที่เลือกอยู่ ให้ล้างการเลือก
      if (selectedTagFilter === tagName) {
        setSelectedTagFilter(null);
      }
    }
  };

  const handleAddNewTag = async () => {
    if (!user || !newTagName.trim()) return;
    // เพิ่ม tag ใหม่
    const { data, error } = await supabase
      .from("tags")
      .insert({ 
        name: newTagName.trim(), 
        color: "#6366f1", 
        user_id: user.id 
      })
      .select()
      .single();
    if (!error && data) {
      setNewTagName("");
      fetchTags(); // ดึงแท็กใหม่จากฐานข้อมูล
      // ไม่ต้อง auto-select tag ใหม่ที่สร้าง
    }
  };

  const handleTagCreated = (newTag) => {
    setTags(prev => [...prev, newTag]);
  };

  // Redirect to home if not authenticated - but only once auth loading is complete
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('User not authenticated, redirecting to home');
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

  const handleAddLinkClick = () => {
    setAddDialogOpen(true);
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    console.log('Filter changed to:', filter);
  };

  // ฟังก์ชันช่วย filter bookmarks ตาม selectedFilter
  const getFilteredBookmarks = () => {
    let filtered = bookmarks;
    if (selectedFilter !== 'all' && selectedFilter !== 'favorites') {
      filtered = filtered.filter(b => normalizePlatformName(b.platform) === normalizePlatformName(selectedFilter));
    }
    if (selectedFilter === 'favorites') {
      filtered = filtered.filter(b => b.is_favorite);
    }
    if (selectedTagFilter) {
      filtered = filtered.filter(b => (b.tags || []).includes(selectedTagFilter));
    }
    return filtered;
  };

  console.log('Dashboard render', { draggingTag, dragPos });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" onDragOver={e => e.preventDefault()}>
        <AppSidebar 
          onAddLinkClick={handleAddLinkClick}
          onFilterChange={handleFilterChange}
          selectedFilter={selectedFilter}
          platforms={Array.from(
            new Set(bookmarks.map(b => normalizePlatformName(b.platform)).filter(Boolean))
          )}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onAuthClick={() => {}} />
          
          <main className="flex-1 overflow-auto p-4 md:p-6" onDragOver={e => e.preventDefault()}>
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Dashboard Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    แดชบอร์ด
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    จัดการลิงก์ที่บันทึกไว้ของคุณ
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">ลิงก์ทั้งหมด</CardTitle>
                    <Link className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {bookmarksLoading ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        bookmarks?.length || 0
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">รายการโปรด</CardTitle>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {bookmarksLoading ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        bookmarks?.filter(b => b.is_favorite).length || 0
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">แพลตฟอร์ม</CardTitle>
                    <Grid className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {bookmarksLoading ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        new Set(bookmarks?.map(b => b.platform).filter(Boolean)).size || 0
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">แท็กทั้งหมด</CardTitle>
                    <List className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {bookmarksLoading ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        new Set(bookmarks?.flatMap(b => b.tags || []).filter(Boolean)).size || 0
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Bookmarks Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    ลิงก์ที่บันทึกไว้
                  </h2>
                </div>
                {/* Tag Filter UI */}
                {selectedTagFilter && (
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-sm">กำลังกรองด้วยแท็ก:</span>
                    {(() => {
                      const tagObj = tags.find(t => t.name === selectedTagFilter);
                      return (
                        <Badge
                          style={{
                            background: tagObj?.color || "#6366f1",
                            color: "#fff",
                            fontWeight: "bold",
                            boxShadow: "0 0 0 2px #fff, 0 2px 8px rgba(0,0,0,0.15)"
                          }}
                          className="text-base"
                        >
                          {selectedTagFilter}
                        </Badge>
                      );
                    })()}
                    <button onClick={() => setSelectedTagFilter(null)} className="ml-2 text-xs text-red-500 hover:underline">ล้าง</button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mb-2">
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-sm text-muted-foreground">กรองด้วยแท็ก:</span>
                    <Button
                      variant={editTagMode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setEditTagMode(!editTagMode)}
                      className="h-6 px-2 text-xs"
                    >
                      <Edit2Icon className="h-3 w-3 mr-1" />
                      {editTagMode ? "ออกจากโหมดแก้ไข" : "โหมดแก้ไข"}
                    </Button>
                  </div>
                  
                  <Badge
                    variant={selectedTagFilter === null ? "default" : "outline"}
                    className={`cursor-pointer ${selectedTagFilter === null ? "scale-110 font-bold ring-2 ring-blue-400" : ""}`}
                    onClick={() => setSelectedTagFilter(null)}
                  >
                    ทั้งหมด
                  </Badge>
                  
                  {/* เดิม: รวม tag name จากทั้ง tags และ bookmarks */}
                  {/* {Array.from(new Set([
                    ...tags.map(t => t.name),
                    ...bookmarks.flatMap(b => b.tags || [])
                  ])).filter(Boolean).map(name => {
                    const tagObj = tags.find(t => t.name === name);
                    const isSelected = selectedTagFilter === name;
                    return (
                      <Badge
                        key={name}
                        variant={isSelected ? "default" : "outline"}
                        className={`cursor-pointer transition-all ${isSelected ? "scale-110 font-bold ring-2 ring-blue-400 shadow-lg" : ""}`}
                        style={{ background: tagObj?.color || undefined, color: tagObj?.color ? '#fff' : undefined }}
                        onClick={() => !editTagMode && setSelectedTagFilter(name)}
                      >
                        {name}
                      </Badge>
                    );
                  })} */}
                  {/* ใหม่: แสดงเฉพาะ tag ที่มีอยู่ในตาราง tags จริง ๆ */}
                  {tags.map(tag => {
                    const isSelected = selectedTagFilter === tag.name;
                    const isDragging = draggingTag?.name === tag.name;
                    return (
                      <Badge
                        key={tag.name}
                        variant={isSelected ? "default" : "outline"}
                        className={`cursor-pointer transition-all ${isSelected ? "scale-110 font-bold ring-2 ring-blue-400 shadow-lg" : ""} ${isDragging ? "scale-110 font-bold ring-4 ring-yellow-400 shadow-2xl z-50" : ""}`}
                        style={{ background: tag.color || undefined, color: tag.textColor || undefined, zIndex: isDragging ? 9999 : undefined }}
                        onClick={() => !editTagMode && setSelectedTagFilter(tag.name)}
                        // draggable, onDragStart, onDragEnd, onDragOver ถูกลบออก
                        onPointerDown={e => {
                          setDraggingTag(tag);
                          setDragPos({ x: e.clientX, y: e.clientY });
                          // pointermove สำหรับ custom drag
                          dragPointerMoveRef.current = (ev: PointerEvent) => {
                            setDragPos({ x: ev.clientX, y: ev.clientY });
                          };
                          window.addEventListener('pointermove', dragPointerMoveRef.current);
                          // pointerup สำหรับ drop
                          const handlePointerUp = (ev: PointerEvent) => {
                            // ตรวจสอบว่าปล่อยเม้าส์บนการ์ดไหน (เช็คใน BookmarkCard)
                            setDraggingTag(null);
                            setDragPos(null);
                            window.removeEventListener('pointermove', dragPointerMoveRef.current!);
                            window.removeEventListener('pointerup', handlePointerUp);
                          };
                          window.addEventListener('pointerup', handlePointerUp);
                        }}
                        data-drag-tag
                      >
                        {tag.name}
                      </Badge>
                    );
                  })}
                  {/* ปุ่ม + กลมๆ ต่อท้ายแถว filter tag */}
                  <button
                    type="button"
                    className="flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-green-400 hover:from-blue-600 hover:to-green-500 shadow-lg w-10 h-10 text-white text-2xl font-bold border-2 border-white transition-all duration-150 ml-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    onClick={() => setTagDialogOpen(true)}
                    title="สร้างแท็กใหม่"
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                  
                </div>

                {/* Loading State */}
                {bookmarksLoading && (
                  <div className={viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    : "space-y-4"
                  }>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-4">
                          <Skeleton className="h-4 w-3/4 mb-2" />
                          <Skeleton className="h-3 w-1/2 mb-4" />
                          <Skeleton className="h-32 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {!bookmarksLoading && (!bookmarks || bookmarks.length === 0) && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Link className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        ยังไม่มีลิงก์ที่บันทึกไว้
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        เริ่มเพิ่มลิงก์แรกของคุณเพื่อจัดระเบียบเนื้อหาที่คุณชื่นชอบ
                      </p>
                      <Button 
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        onClick={handleAddLinkClick}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        เพิ่มลิงก์แรก
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Bookmarks Grid/List */}
                {!bookmarksLoading && bookmarks && getFilteredBookmarks().length > 0 && (
                  <div
                    className={viewMode === 'grid' 
                      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                      : 'space-y-4'
                    }
                    onDragOver={e => e.preventDefault()}
                  >
                    {getFilteredBookmarks().map((bookmark) => {
                      console.log('Render BookmarkCard', { id: bookmark.id, draggingTag, dragPos });
                      return (
                        <BookmarkCard 
                          key={bookmark.id} 
                          bookmark={bookmark} 
                          viewMode={viewMode}
                          editTagMode={editTagMode}
                          tags={tags} // ส่ง tags state กลางไปด้วย
                          onTagCreated={handleTagCreated}
                          draggingTag={draggingTag}
                          dragPos={dragPos}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) setMetadata(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เพิ่มลิงก์ใหม่</DialogTitle>
            <DialogDescription>กรอก URL แล้วระบบจะดึงชื่อเรื่องให้อัตโนมัติ</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField name="url" control={form.control} rules={{ required: "กรุณากรอก URL" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} onChange={handleUrlChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* หัวข้อใหม่: Platform (readonly) */}
              <div>
                <div className="font-medium text-sm mb-1">Platform</div>
                <Badge variant="secondary" className="opacity-80 cursor-not-allowed">
                  {(metadata?.platform && metadata.platform !== "Other")
                    ? metadata.platform
                    : autoDetectPlatform(form.watch("url"))}
                </Badge>
              </div>
              <FormField name="title" control={form.control} rules={{ required: "กรุณากรอกชื่อเรื่อง" }}
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
              <FormField name="user_description" control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>คำอธิบาย (ถ้ามี)</FormLabel>
                    <FormControl>
                      <Input placeholder="คำอธิบายเพิ่มเติม" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField name="tags" control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>แท็ก</FormLabel>
                    <div className="text-xs text-muted-foreground mb-2">เลือกแท็กที่ต้องการเพิ่ม (สามารถเลือกได้หลายแท็ก)</div>
                    <div className="flex flex-col gap-2">
                      {tags.length === 0 ? (
                        <div className="text-sm text-muted-foreground">ยังไม่มีแท็ก</div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {tags.filter(tag => !(field.value || []).includes(tag.name)).map(tag => (
                            <button
                              key={tag.id}
                              type="button"
                              className="flex items-center justify-between w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 bg-transparent hover:bg-accent transition text-left"
                              onClick={() => {
                                if (!(field.value || []).includes(tag.name)) {
                                  field.onChange([...(field.value || []), tag.name]);
                                }
                              }}
                            >
                              <span className="flex items-center gap-2">
                                <span className="inline-block w-3 h-3 rounded-full" style={{ background: tag.color || '#6366f1' }}></span>
                                <span>{tag.name}</span>
                              </span>
                              <span className="text-lg font-bold text-blue-600">+</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {(field.value || []).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(field.value || []).map((name) => {
                            const tag = tags.find(t => t.name === name);
                            return tag ? (
                              <span key={tag.id} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium" style={{ background: tag.color || '#6366f1', color: '#fff' }}>
                                {tag.name}
                                <button
                                  type="button"
                                  className="ml-2 text-xs text-white/80 hover:text-red-200"
                                  onClick={() => field.onChange((field.value || []).filter((n) => n !== tag.name))}
                                >
                                  ×
                                </button>
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-md transition-all duration-150 py-2 mt-2 text-base"
                      onClick={() => setTagDialogOpen(true)}
                    >
                      <Plus className="h-5 w-5" />
                      <span>สร้างแท็กใหม่</span>
                    </button>
                  </FormItem>
                )}
              />
              {metadata && (
                <div className="pt-2">
                  <div className="text-xs text-muted-foreground mb-1">Preview:</div>
                  <div className="flex items-center gap-3">
                    {/* แสดงรูปสินค้า Shopee ถ้ามี */}
                    {(metadata.image || metadata.thumbnail) && (
                      <img
                        src={metadata.image || metadata.thumbnail}
                        alt="product"
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                    <div>
                      <div className="font-medium text-sm line-clamp-1">{metadata.title}</div>
                      {metadata.channel && <div className="text-xs text-muted-foreground line-clamp-1">{metadata.channel}</div>}
                      <div className="text-xs text-muted-foreground line-clamp-1">{metadata.description}</div>
                    </div>
                  </div>
                  {metadata.html && (
                    <div className="mt-2 border rounded overflow-hidden" dangerouslySetInnerHTML={{ __html: metadata.html }} />
                  )}
                </div>
              )}
              <DialogFooter>
                <Button type="submit" disabled={isAddingBookmark || metaLoading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">{isAddingBookmark ? "กำลังเพิ่ม..." : metaLoading ? "กำลังดึงข้อมูล..." : "เพิ่มลิงก์"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={tagDialogOpen} onOpenChange={handleTagDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>สร้างแท็กใหม่</DialogTitle>
            <DialogDescription>ตั้งชื่อแท็ก เลือกสีพื้นหลังและสีตัวอักษร พร้อมดูตัวอย่าง</DialogDescription>
          </DialogHeader>
          <Form {...tagForm}>
            <form onSubmit={tagForm.handleSubmit(handleAddTag)} className="space-y-4">
              <div className="flex gap-2 flex-wrap items-end">
                <div className="flex-1 min-w-[200px]">
                    <FormLabel>ชื่อแท็ก</FormLabel>
                  <Input {...tagForm.register("name", { required: true })} placeholder="เช่น ข่าว, AI, เทคโนโลยี" />
                </div>
                <Button type="submit" disabled={tagLoading} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  {editingTag ? "แก้ไข" : "เพิ่ม"}
              </Button>
              {editingTag && (
                  <Button type="button" variant="outline" onClick={() => { setEditingTag(null); tagForm.reset({ name: "" }); setSelectedColor(COLOR_PRESETS[0]); setSelectedTextColor(TEXT_COLORS[0]); }}>
                  ยกเลิก
                </Button>
              )}
                  </div>
              <div className="grid gap-4 md:grid-cols-2">
                {/* เลือกสีพื้นหลัง */}
                <div className="space-y-2">
                  <FormLabel>สีพื้นหลัง</FormLabel>
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
                  <FormLabel>สีตัวอักษร</FormLabel>
                  <div className="grid grid-cols-5 gap-2 p-2 border rounded-lg">
                    {TEXT_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setSelectedTextColor(color)}
                        className="relative aspect-square rounded-md transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border"
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
                <FormLabel>ตัวอย่าง</FormLabel>
                <Badge 
                  style={{ background: selectedColor.bg, color: selectedTextColor.value }}
                  className="font-semibold"
                >
                  {tagForm.watch("name") || "ตัวอย่างแท็ก"}
                </Badge>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      {/* Custom drag layer for tag */}
      {draggingTag && dragPos && (
        <div
          style={{
            position: 'fixed',
            left: dragPos.x,
            top: dragPos.y,
            pointerEvents: 'none',
            zIndex: 99999,
            transform: 'translate(-50%, -50%) scale(1.18)',
            filter: 'brightness(1.15) drop-shadow(0 2px 12px #0008)',
          }}
        >
          <Badge
            variant="default"
            className="font-bold px-5 py-2 shadow-2xl"
            style={{
              background: draggingTag.color,
              color: draggingTag.textColor,
              borderRadius: 9999,
              boxShadow: `0 0 0 4px #fff, 0 0 0 10px ${draggingTag.color}, 0 4px 24px 4px ${draggingTag.color}99, 0 8px 32px 0px #0004`,
              border: '2px solid #fff',
              fontSize: 18,
              letterSpacing: 0.5,
              minWidth: 60,
              textAlign: 'center',
            }}
          >
            {draggingTag.name}
          </Badge>
        </div>
      )}
    </SidebarProvider>
  );
};

export default Dashboard;
