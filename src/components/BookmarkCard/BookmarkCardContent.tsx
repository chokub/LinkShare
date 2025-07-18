import React from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Eye, EyeOff, Plus, X, Calendar } from "lucide-react";

export default function BookmarkCardContent({
  bookmark,
  tags,
  editTagMode,
  getTagStyle,
  truncatedSummary,
  summaryExpanded,
  setSummaryExpanded,
  formatDate,
  handleRemoveTag
}: any) {
  return (
    <>
      <div className="p-3 pb-2">
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
            <span className="text-xs text-muted-foreground truncate">
              {bookmark.channel_name}
            </span>
          </div>
        )}
        <h3 className="font-semibold text-sm line-clamp-2 mb-1">
          {bookmark.title || "ไม่มีชื่อเรื่อง"}
        </h3>
        {/* Description or Summary */}
        {(bookmark.user_description || bookmark.ai_summary) && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {bookmark.user_description || truncatedSummary}
          </p>
        )}
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
            {bookmark.suggested_tags.map((tag: string, index: number) => (
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
                  onClick={e => e.stopPropagation()}
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
          {(Array.isArray(bookmark.tags) ? bookmark.tags : []).filter((tag: string) => tags.some((t: any) => t.name === tag)).map((tag: string, index: number) => (
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
                  onClick={e => handleRemoveTag(tag, e)}
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
    </>
  );
} 