import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Bookmark } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { ProfileDropdown } from "@/components/ProfileDropdown";

interface HeaderProps {
  onAuthClick: () => void;
}

const Header = ({ onAuthClick }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="px-6 py-4 bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
            <Bookmark className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            LinkKeep
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
            ฟีเจอร์
          </a>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
            ราคา
          </a>
          <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
            เกี่ยวกับ
          </a>
          <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
            ติดต่อ
          </a>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          {user ? (
            <>
              <span className="text-sm text-muted-foreground mr-2">{user.email}</span>
              <ProfileDropdown />
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={onAuthClick}>
                เข้าสู่ระบบ
              </Button>
              <Button 
                onClick={onAuthClick}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                เริ่มใช้งาน
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost" 
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pb-4 border-t border-border">
          <nav className="flex flex-col gap-4 mt-4">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              ฟีเจอร์
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              ราคา
            </a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
              เกี่ยวกับ
            </a>
            <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
              ติดต่อ
            </a>
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              {user ? (
                <>
                  <span className="text-sm text-muted-foreground mb-2">{user.email}</span>
                  <ProfileDropdown />
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={onAuthClick} className="justify-start">
                    เข้าสู่ระบบ
                  </Button>
                  <Button 
                    onClick={onAuthClick}
                    className="justify-start bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    เริ่มใช้งาน
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
