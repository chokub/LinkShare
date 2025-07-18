
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, ExternalLink } from "lucide-react";

interface MetadataPreviewProps {
  metadata: {
    title: string;
    description: string;
    thumbnail: string;
    platform: string;
  } | null;
  url: string;
  isLoading: boolean;
  onRefresh: () => void;
}

const getPlatformColor = (platform: string) => {
  const colors: { [key: string]: string } = {
    "YouTube": "bg-red-500",
    "Instagram": "bg-gradient-to-r from-purple-500 to-pink-500",
    "TikTok": "bg-black",
    "Facebook": "bg-blue-600",
    "Twitter": "bg-blue-400",
  };
  return colors[platform] || "bg-gray-500";
};

export const MetadataPreview = ({ metadata, url, isLoading, onRefresh }: MetadataPreviewProps) => {
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground">กำลังดึงข้อมูล...</CardTitle>
            <div className="animate-spin">
              <RefreshCw className="h-4 w-4" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="w-20 h-20 bg-muted animate-pulse rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-3 bg-muted animate-pulse rounded w-full" />
              <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metadata) {
    return (
      <Card className="w-full border-dashed">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <p className="mb-2">ไม่สามารถดึงข้อมูลได้</p>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              ลองอีกครั้ง
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-muted-foreground">ตัวอย่างลิงก์</CardTitle>
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <div className="relative">
            <img
              src={metadata.thumbnail && !metadata.thumbnail.includes("photo-1611224923853-80b023f02d71") ? metadata.thumbnail : "/linkkeep-logo.png"}
              alt={metadata.title}
              className="w-20 h-20 object-cover rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/linkkeep-logo.png";
              }}
            />
            <Badge 
              className={`absolute -top-1 -right-1 text-white text-xs ${getPlatformColor(metadata.platform)}`}
            >
              {metadata.platform}
            </Badge>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm line-clamp-2 mb-1">{metadata.title}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{metadata.description}</p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => window.open(url, '_blank')}>
                <ExternalLink className="h-3 w-3 mr-1" />
                เปิดลิงก์
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
