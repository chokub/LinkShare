import { 
  Home, 
  Plus, 
  Settings, 
  Bookmark,
  Filter,
  Tag,
  Heart,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";

interface AppSidebarProps {
  onAddLinkClick: () => void;
  onFilterChange: (filter: string) => void;
  selectedFilter: string;
  platforms: string[];
}

export function AppSidebar({ onAddLinkClick, onFilterChange, selectedFilter, platforms }: AppSidebarProps) {
  const navigate = useNavigate();
  const staticMenu = [
    { title: "ทั้งหมด", icon: Home, value: "all" },
    { title: "รายการโปรด", icon: Heart, value: "favorites" },
  ];
  // auto-generate platform menu
  const platformIcons: Record<string, any> = {
    YouTube: Bookmark,
    Instagram: Bookmark,
    TikTok: Bookmark,
    Facebook: Bookmark,
    Twitter: Bookmark,
    Shopee: Bookmark,
    // เพิ่ม platform อื่นๆ ได้ที่นี่
  };
  const platformMenu = platforms.map((p) => ({
    title: p,
    icon: platformIcons[p] || Bookmark,
    value: p.toLowerCase()
  }));
  const menuItems = [...staticMenu, ...platformMenu];

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
            <Bookmark className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            LinkKeep
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <Button 
              onClick={onAddLinkClick}
              className="w-full mb-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มลิงก์
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>หมวดหมู่</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton 
                    isActive={selectedFilter === item.value}
                    onClick={() => onFilterChange(item.value)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>เครื่องมือ</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate("/tags")}>
                  <Tag className="h-4 w-4" />
                  <span>จัดการแท็ก</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Settings className="h-4 w-4" />
                  <span>ตั้งค่า</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
