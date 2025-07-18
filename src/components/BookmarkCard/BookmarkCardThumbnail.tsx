import React from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Heart, ExternalLink, MoreVertical } from "lucide-react";
import { FaInstagram, FaFacebook, FaTwitter, FaYoutube, FaTiktok, FaLinkedin, FaDiscord, FaGithub, FaGlobe } from "react-icons/fa";

export default function BookmarkCardThumbnail({ bookmark, toggleFavorite, setEditOpen, setDeleteOpen }: any) {
  // Helper สำหรับเลือก icon ตาม platform
  const getPlatformIcon = (platform: string | null, size = 56) => {
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

  return (
    <div className="relative w-full h-32 sm:h-40">
      {bookmark.thumbnail_url ? (
        <img 
          src={bookmark.thumbnail_url} 
          alt={bookmark.title || "Thumbnail"}
          className="w-full h-full object-cover rounded-t-lg"
        />
      ) : (
        <img
          src="/linkkeep-logo.png"
          alt="LinkKeep Logo"
          className="w-full h-full object-cover rounded-t-lg p-6 bg-muted"
          style={{ objectFit: "contain" }}
        />
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
          onClick={e => { e.stopPropagation(); toggleFavorite({ id: bookmark.id, isFavorite: bookmark.is_favorite || false }); }}
          className="h-8 w-8 p-0"
        >
          <Heart className={`h-4 w-4 ${bookmark.is_favorite ? 'fill-red-500 text-red-500' : ''}`} />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={e => { e.stopPropagation(); window.open(bookmark.url, '_blank'); }}
          className="h-8 w-8 p-0"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={e => { e.stopPropagation(); setEditOpen(true); }}
          className="h-8 w-8 p-0"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 