import React from "react";
import { Button } from "../ui/button";
import { Heart, ExternalLink, MoreVertical, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";

export default function BookmarkCardActions({ bookmark, toggleFavorite, setEditOpen, setDeleteOpen }: any) {
  return (
    <div className="flex items-center gap-1 ml-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={e => { e.stopPropagation(); toggleFavorite({ id: bookmark.id, isFavorite: bookmark.is_favorite || false }); }}
        className="h-8 w-8 p-0"
      >
        <Heart className={`h-4 w-4 ${bookmark.is_favorite ? 'fill-red-500 text-red-500' : ''}`} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={e => { e.stopPropagation(); window.open(bookmark.url, '_blank'); }}
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
          <DropdownMenuItem onClick={e => { e.stopPropagation(); setEditOpen(true); }}>
            แก้ไข
          </DropdownMenuItem>
          <DropdownMenuItem onClick={e => { e.stopPropagation(); setDeleteOpen(true); }} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            ลบ
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 