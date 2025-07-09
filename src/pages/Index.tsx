
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AuthDialog from "@/components/AuthDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  Bookmark, 
  Sparkles, 
  Search, 
  Heart,
  Zap,
  Globe,
  Users,
  Star,
  Mail,
  MessageCircle,
  Phone
} from "lucide-react";
import { useState } from "react";

const Index = () => {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <Bookmark className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              LinkKeep
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button onClick={() => setAuthOpen(true)}>
              เข้าสู่ระบบ
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="mb-8">
          <Badge variant="secondary" className="mb-4 px-4 py-2">
            <Sparkles className="h-4 w-4 mr-2" />
            AI-Powered Bookmarking
          </Badge>
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            เก็บลิงก์ที่คุณชอบ
            <br />
            ด้วยพลัง AI
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            จัดระเบียบและค้นหาลิงก์โซเชียลมีเดียของคุณได้อย่างง่ายดาย 
            พร้อมการสรุปอัตโนมัติและการแนะนำแท็กโดย AI
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-3"
              onClick={() => setAuthOpen(true)}
            >
              เริ่มใช้งานฟรี
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3">
              ดูตัวอย่าง
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">ฟีเจอร์เด่น</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            เครื่องมือครบครันสำหรับการจัดการลิงก์ยุคใหม่
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="hover:shadow-lg transition-shadow border-2 hover:border-blue-200">
            <CardHeader>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg w-fit mb-4">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>สรุปเนื้อหาด้วย AI</CardTitle>
              <CardDescription>
                AI จะอ่านและสรุปเนื้อหาให้คุณอัตโนมัติ ช่วยให้เข้าใจได้เร็วขึ้น
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-2 hover:border-purple-200">
            <CardHeader>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg w-fit mb-4">
                <Search className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>ค้นหาอัจฉริยะ</CardTitle>
              <CardDescription>
                ค้นหาลิงก์ได้จากชื่อเรื่อง เนื้อหา แท็ก หรือแม้แต่สรุป AI
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-2 hover:border-green-200">
            <CardHeader>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg w-fit mb-4">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>แท็กอัตโนมัติ</CardTitle>
              <CardDescription>
                AI แนะนำแท็กที่เหมาะสมสำหรับเนื้อหาแต่ละชิ้นโดยอัตโนมัติ
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-2 hover:border-pink-200">
            <CardHeader>
              <div className="p-3 bg-pink-100 dark:bg-pink-900/20 rounded-lg w-fit mb-4">
                <Globe className="h-6 w-6 text-pink-600" />
              </div>
              <CardTitle>รองรับทุกแพลตฟอร์ม</CardTitle>
              <CardDescription>
                YouTube, Instagram, TikTok, Facebook, Twitter และอื่นๆ อีกมากมาย
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-2 hover:border-orange-200">
            <CardHeader>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg w-fit mb-4">
                <Heart className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>รายการโปรด</CardTitle>
              <CardDescription>
                จัดกลุ่มและจัดระเบียบลิงก์ที่สำคัญไว้หาง่าย
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-2 hover:border-indigo-200">
            <CardHeader>
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg w-fit mb-4">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <CardTitle>ใช้งานง่าย</CardTitle>
              <CardDescription>
                อินเทอร์เฟซที่เข้าใจง่าย เหมาะสำหรับทุกคน
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white/50 dark:bg-gray-800/50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">วิธีใช้งาน</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              เริ่มใช้งานได้ในไม่กี่ขั้นตอน
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">แปะลิงก์</h3>
              <p className="text-gray-600 dark:text-gray-300">
                คัดลอกลิงก์จากโซเชียลมีเดียและแปะในแอป
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">AI ประมวลผล</h3>
              <p className="text-gray-600 dark:text-gray-300">
                AI จะดึงข้อมูล สรุปเนื้อหา และแนะนำแท็กให้
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-600 to-red-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">จัดระเบียบ & ค้นหา</h3>
              <p className="text-gray-600 dark:text-gray-300">
                ค้นหาและจัดกลุ่มลิงก์ได้อย่างรวดเร็ว
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">ติดต่อเรา</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            มีคำถามหรือต้องการความช่วยเหลือ? เรายินดีให้บริการ
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow text-center">
            <CardHeader>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg w-fit mx-auto mb-4">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>อีเมล</CardTitle>
              <CardDescription>
                ส่งคำถามหรือข้อเสนอแนะมาที่เรา
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-blue-600 font-medium">support@linkkeep.com</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow text-center">
            <CardHeader>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg w-fit mx-auto mb-4">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>แชท</CardTitle>
              <CardDescription>
                คุยกับทีมซัพพอร์ตแบบเรียลไทม์
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                เริ่มแชท
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow text-center">
            <CardHeader>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg w-fit mx-auto mb-4">
                <Phone className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>โทรศัพท์</CardTitle>
              <CardDescription>
                โทรสอบถามในเวลาทำการ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-purple-600 font-medium">02-xxx-xxxx</p>
              <p className="text-sm text-gray-500 mt-1">จ-ศ 9:00-18:00 น.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">พร้อมเริ่มต้นแล้วหรือยัง?</h2>
          <p className="text-xl mb-8 opacity-90">
            ลงทะเบียนวันนี้และเริ่มจัดระเบียบลิงก์ของคุณด้วย AI
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            className="text-lg px-8 py-3"
            onClick={() => setAuthOpen(true)}
          >
            เริ่มใช้งานฟรี
            <Star className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Bookmark className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">LinkKeep</span>
            </div>
            <p className="text-gray-400">
              © 2024 LinkKeep. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
};

export default Index;
