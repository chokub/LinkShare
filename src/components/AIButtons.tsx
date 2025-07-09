import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Brain, Tags, Loader2 } from "lucide-react";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useToast } from "@/hooks/use-toast";
interface AIButtonsProps {
  bookmark: {
    id: string;
    title: string | null;
    description: string | null;
    user_description: string | null;
    ai_summary: string | null;
    suggested_tags: string[];
    url: string;
    tags: string[];
  };
}
export const AIButtons = ({
  bookmark
}: AIButtonsProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState<'summary' | 'tags' | null>(null);
  const {
    analyzeWithAI,
    updateBookmarkAI
  } = useBookmarks();
  const {
    toast
  } = useToast();
  const handleAISummary = async () => {
    setIsAnalyzing('summary');
    try {
      const summary = await analyzeWithAI(bookmark.url, bookmark.title || '', bookmark.description || '', 'summary');
      if (summary) {
        updateBookmarkAI({
          id: bookmark.id,
          ai_summary: summary
        });
        toast({
          title: "สรุปสำเร็จ!",
          description: "AI ได้สรุปเนื้อหาให้แล้ว"
        });
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสรุปเนื้อหาได้",
        variant: "destructive"
      });
    }
    setIsAnalyzing(null);
  };
  const handleAITags = async () => {
    setIsAnalyzing('tags');
    try {
      const suggestedTags = await analyzeWithAI(bookmark.url, bookmark.title || '', bookmark.description || '', 'tags');
      if (suggestedTags && Array.isArray(suggestedTags)) {
        updateBookmarkAI({
          id: bookmark.id,
          suggested_tags: suggestedTags
        });
        toast({
          title: "แนะนำ Tags สำเร็จ!",
          description: `AI แนะนำ ${suggestedTags.length} tags ให้`
        });
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถแนะนำ tags ได้",
        variant: "destructive"
      });
    }
    setIsAnalyzing(null);
  };
  return <div className="flex gap-1">
      <Button size="sm" variant="outline" onClick={handleAISummary} disabled={isAnalyzing === 'summary'} className="h-7 px-2 text-xs bg-purple-50 border-purple-200 hover:bg-purple-100 text-zinc-950">
        {isAnalyzing === 'summary' ? <Loader2 className="h-3 w-3 animate-spin" /> : <>
            <Brain className="h-3 w-3 mr-1" />
            สรุป AI
          </>}
      </Button>
      
      <Button size="sm" variant="outline" onClick={handleAITags} disabled={isAnalyzing === 'tags'} className="h-7 px-2 text-xs bg-blue-50 border-blue-200 hover:bg-blue-100 text-zinc-950">
        {isAnalyzing === 'tags' ? <Loader2 className="h-3 w-3 animate-spin" /> : <>
            <Tags className="h-3 w-3 mr-1" />
            AI Tags
          </>}
      </Button>
    </div>;
};