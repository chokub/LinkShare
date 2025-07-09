
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Brain, Tags, Loader2 } from "lucide-react";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useToast } from "@/hooks/use-toast";

interface AIAnalysisCardProps {
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

export const AIAnalysisCard = ({ bookmark }: AIAnalysisCardProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState<'summary' | 'tags' | null>(null);
  const { analyzeWithAI, updateBookmarkAI } = useBookmarks();
  const { toast } = useToast();

  const handleAISummary = async () => {
    setIsAnalyzing('summary');
    try {
      const summary = await analyzeWithAI(
        bookmark.url,
        bookmark.title || '',
        bookmark.description || '',
        'summary'
      );

      if (summary) {
        updateBookmarkAI({ 
          id: bookmark.id, 
          ai_summary: summary 
        });
        toast({
          title: "สรุปสำเร็จ!",
          description: "AI ได้สรุปเนื้อหาให้แล้ว",
        });
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสรุปเนื้อหาได้",
        variant: "destructive",
      });
    }
    setIsAnalyzing(null);
  };

  const handleAITags = async () => {
    setIsAnalyzing('tags');
    try {
      const suggestedTags = await analyzeWithAI(
        bookmark.url,
        bookmark.title || '',
        bookmark.description || '',
        'tags'
      );

      if (suggestedTags && Array.isArray(suggestedTags)) {
        updateBookmarkAI({ 
          id: bookmark.id, 
          suggested_tags: suggestedTags 
        });
        toast({
          title: "แนะนำ Tags สำเร็จ!",
          description: `AI แนะนำ ${suggestedTags.length} tags ให้`,
        });
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถแนะนำ tags ได้",
        variant: "destructive",
      });
    }
    setIsAnalyzing(null);
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600" />
          AI Assistant
        </CardTitle>
        <CardDescription className="text-xs">
          ใช้ AI ช่วยวิเคราะห์และจัดระเบียบเนื้อหา
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* AI Summary Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-1">
              <Brain className="h-3 w-3" />
              สรุปโดย AI
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAISummary}
              disabled={isAnalyzing === 'summary'}
              className="h-6 px-2 text-xs"
            >
              {isAnalyzing === 'summary' ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "สร้างสรุป"
              )}
            </Button>
          </div>
          
          {bookmark.ai_summary && (
            <div className="bg-white/80 rounded p-2 border border-purple-100">
              <p className="text-xs text-gray-700">{bookmark.ai_summary}</p>
            </div>
          )}
        </div>

        {/* AI Tags Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-1">
              <Tags className="h-3 w-3" />
              Tags แนะนำ
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAITags}
              disabled={isAnalyzing === 'tags'}
              className="h-6 px-2 text-xs"
            >
              {isAnalyzing === 'tags' ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "แนะนำ Tags"
              )}
            </Button>
          </div>
          
          {bookmark.suggested_tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {bookmark.suggested_tags.map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs bg-purple-100 text-purple-700 border-purple-200"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
