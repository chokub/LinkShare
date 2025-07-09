
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Grid3X3, List, LayoutGrid } from "lucide-react";

interface LayoutControllerProps {
  cardsPerRow: number;
  onCardsPerRowChange: (count: number) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
}

export const LayoutController = ({ 
  cardsPerRow, 
  onCardsPerRowChange, 
  viewMode, 
  onViewModeChange 
}: LayoutControllerProps) => {
  const cardOptions = [3, 4, 5, 6];
  
  return (
    <Card className="w-80">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <LayoutGrid className="h-4 w-4" />
          ปรับแต่งการแสดงผล
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>จำนวน Card/แถว</span>
            <span className="text-muted-foreground">{cardsPerRow} การ์ด</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {cardOptions.map((count) => (
              <Button
                key={count}
                variant={cardsPerRow === count ? "default" : "outline"}
                size="sm"
                onClick={() => onCardsPerRowChange(count)}
                className="text-xs"
              >
                {count}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => onViewModeChange("grid")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              viewMode === "grid" 
                ? "bg-primary text-primary-foreground" 
                : "bg-secondary hover:bg-secondary/80"
            }`}
          >
            <Grid3X3 className="h-4 w-4" />
            Grid
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              viewMode === "list" 
                ? "bg-primary text-primary-foreground" 
                : "bg-secondary hover:bg-secondary/80"
            }`}
          >
            <List className="h-4 w-4" />
            List
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
