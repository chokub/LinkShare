import { useState, useEffect, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle successful sign in - only show toast, no redirect
        if (event === 'SIGNED_IN' && session?.user) {
          // ป้องกัน toast ซ้ำ: ใช้ sessionStorage
          if (!sessionStorage.getItem('login-toast-shown')) {
          toast({
            title: "เข้าสู่ระบบสำเร็จ!",
            description: `ยินดีต้อนรับ ${session.user.email}`,
          });
            sessionStorage.setItem('login-toast-shown', '1');
          }
        }

        // Handle sign out - only show toast, no redirect
        if (event === 'SIGNED_OUT') {
          toast({
            title: "ออกจากระบบสำเร็จ",
            description: "ขอบคุณที่ใช้บริการ LinkKeep",
          });
        }
      }
    );

    // Then check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast]);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) {
        console.error('Signup error:', error);
        let errorMessage = "เกิดข้อผิดพลาดในการสมัครสมาชิก";
        
        if (error.message.includes('User already registered')) {
          errorMessage = "อีเมลนี้ได้ลงทะเบียนแล้ว กรุณาใช้อีเมลอื่น";
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
        } else if (error.message.includes('Invalid email')) {
          errorMessage = "รูปแบบอีเมลไม่ถูกต้อง";
        }
        
        toast({
          title: "ไม่สามารถสมัครสมาชิกได้",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "สมัครสมาชิกสำเร็จ!",
          description: "กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี",
        });
      }

      return { error };
    } catch (error: any) {
      console.error('Signup exception:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        variant: "destructive",
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Signin error:', error);
        let errorMessage = "เข้าสู่ระบบไม่สำเร็จ";
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ";
        } else if (error.message.includes('Too many requests')) {
          errorMessage = "พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่";
        }
        
        toast({
          title: "เข้าสู่ระบบไม่สำเร็จ",
          description: errorMessage,
          variant: "destructive",
        });
      }

      return { error };
    } catch (error: any) {
      console.error('Signin exception:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        variant: "destructive",
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        console.error('Google signin error:', error);
        let errorMessage = "ไม่สามารถเข้าสู่ระบบด้วย Google ได้";
        
        if (error.message.includes('provider is not enabled')) {
          errorMessage = "การเข้าสู่ระบบด้วย Google ยังไม่เปิดใช้งาน กรุณาใช้อีเมล/รหัsผ่าน";
        }
        
        toast({
          title: "Google Login ไม่สำเร็จ",
          description: errorMessage,
          variant: "destructive",
        });
      }

      return { error };
    } catch (error: any) {
      console.error('Google signin exception:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเชื่อมต่อกับ Google ได้",
        variant: "destructive",
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Signout error:', error);
      }
    } catch (error) {
      console.error('Signout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
