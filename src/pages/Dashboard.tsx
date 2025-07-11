import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBookmarks } from "@/hooks/useBookmarks";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import { BookmarkCard } from "@/components/BookmarkCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, Plus, Grid, List } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { X, Edit2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TagInput } from "@/components/ui/tag-input";
import { toast } from "@/components/ui/use-toast";

// ฟังก์ชันใหม่: autoDetectPlatform (แทน detectPlatformFromUrl)
function autoDetectPlatform(url: string): string {
  try {
    const { hostname } = new URL(url);
    const domain = hostname.replace(/^www\./, "");
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

  const form = useForm({
    defaultValues: {
      url: "",
      title: "",
      user_description: "",
      tags: []  // Change to array instead of string
    }
  });

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const extractDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };

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
          form.setValue("title", meta.title);
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

  const onSubmit = async (values: { url: string; title: string; user_description?: string; tags?: string[] }) => {
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

  const fetchTags = useCallback(async () => {
    setTagLoading(true);
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    setTagLoading(false);
    if (!error) setTags(data);
  }, [user?.id]);

  useEffect(() => {
    if (user) fetchTags();
  }, [user, fetchTags]);

  useEffect(() => {
    if (tagDialogOpen && user) fetchTags();
  }, [tagDialogOpen, user, fetchTags]);

  const handleAddTag = async (values) => {
    if (!values.name) return;
    setTagLoading(true);
    if (editingTag) {
      await supabase.from("tags").update({ name: values.name, color: values.color }).eq("id", editingTag.id);
    } else {
      await supabase.from("tags").insert({ name: values.name, color: values.color, user_id: user.id });
    }
    setTagLoading(false);
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
    setTagLoading(true);
    await supabase.from("tags").delete().eq("id", tag.id);
    setTagLoading(false);
    fetchTags();
  };

  const handleTagDialogClose = () => {
    setTagDialogOpen(false);
    setEditingTag(null);
    tagForm.reset({ name: "", color: "#6366f1" });
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
          
          <main className="flex-1 overflow-auto p-4 md:p-6">
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
                  <span className="text-sm text-muted-foreground mr-2">กรองด้วยแท็ก:</span>
                  <Badge
                    variant={selectedTagFilter === null ? "default" : "outline"}
                    className={`cursor-pointer ${selectedTagFilter === null ? "scale-110 font-bold ring-2 ring-blue-400" : ""}`}
                    onClick={() => setSelectedTagFilter(null)}
                  >
                    ทั้งหมด
                  </Badge>
                  {Array.from(new Set([
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
                        onClick={() => setSelectedTagFilter(name)}
                      >
                        {name}
                      </Badge>
                    );
                  })}
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
                  <div className={viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    : "space-y-4"
                  }>
                    {getFilteredBookmarks().map((bookmark) => (
                      <BookmarkCard 
                        key={bookmark.id} 
                        bookmark={bookmark} 
                        viewMode={viewMode}
                      />
                    ))}
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
                    <FormControl>
                      <TagInput
                        {...field}
                        placeholder="พิมพ์แท็กแล้วกด Enter"
                        tags={tags}
                        onValueChange={(value) => field.onChange(value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {metadata && (
                <div className="pt-2">
                  <div className="text-xs text-muted-foreground mb-1">Preview:</div>
                  <div className="flex items-center gap-3">
                    <img src={metadata.thumbnail || metadata.thumbnail_url} alt="thumbnail" className="w-12 h-12 rounded object-cover" />
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
            <DialogTitle>จัดการแท็กของคุณ</DialogTitle>
            <DialogDescription>เพิ่ม/แก้ไข/ลบแท็ก และเลือกสีได้</DialogDescription>
          </DialogHeader>
          <Form {...tagForm}>
            <form onSubmit={tagForm.handleSubmit(handleAddTag)} className="flex gap-2 mb-4">
              <FormField name="name" control={tagForm.control} rules={{ required: "กรุณากรอกชื่อแท็ก" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อแท็ก</FormLabel>
                    <FormControl>
                      <Input placeholder="เช่น ข่าว, AI, เทคโนโลยี" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField name="color" control={tagForm.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>สี</FormLabel>
                    <FormControl>
                      <input type="color" {...field} className="w-10 h-10 p-0 border-none bg-transparent" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={tagLoading} className="h-10 mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                {editingTag ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {editingTag ? "แก้ไข" : "เพิ่ม"}
              </Button>
              {editingTag && (
                <Button type="button" variant="outline" className="h-10 mt-6" onClick={() => { setEditingTag(null); tagForm.reset({ name: "", color: "#6366f1" }); }}>
                  ยกเลิก
                </Button>
              )}
            </form>
          </Form>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {tagLoading ? (
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
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default Dashboard;
