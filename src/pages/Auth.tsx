import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Wallet, Eye, EyeOff } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signUp, loading } = useAuth();
  
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  
  const [signupForm, setSignupForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(loginForm.email)) {
      toast({
        title: "Email tidak valid",
        description: "Silakan masukkan email yang benar",
        variant: "destructive",
      });
      return;
    }

    if (!validatePassword(loginForm.password)) {
      toast({
        title: "Password terlalu pendek",
        description: "Password minimal 6 karakter",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(loginForm.email, loginForm.password);
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast({
          title: "Login gagal",
          description: "Email atau password salah",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Terjadi kesalahan",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Login berhasil",
        description: "Selamat datang kembali!",
      });
      navigate('/');
    }
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupForm.fullName.trim()) {
      toast({
        title: "Nama lengkap diperlukan",
        description: "Silakan masukkan nama lengkap Anda",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(signupForm.email)) {
      toast({
        title: "Email tidak valid",
        description: "Silakan masukkan email yang benar",
        variant: "destructive",
      });
      return;
    }

    if (!validatePassword(signupForm.password)) {
      toast({
        title: "Password terlalu pendek",
        description: "Password minimal 6 karakter",
        variant: "destructive",
      });
      return;
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      toast({
        title: "Password tidak cocok",
        description: "Konfirmasi password harus sama dengan password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(signupForm.email, signupForm.password, signupForm.fullName);
    
    if (error) {
      if (error.message.includes('User already registered')) {
        toast({
          title: "Email sudah terdaftar",
          description: "Silakan gunakan email lain atau login",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Pendaftaran gagal",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Pendaftaran berhasil",
        description: "Akun Anda telah dibuat, silakan login",
      });
      // Reset form and switch to login tab
      setSignupForm({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
    }
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
            <Wallet className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Keuangan Keluarga
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Kelola keuangan rumah tangga Anda dengan mudah
          </p>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Daftar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4 mt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="nama@email.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({
                      ...loginForm,
                      email: e.target.value
                    })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimal 6 karakter"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({
                        ...loginForm,
                        password: e.target.value
                      })}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? "Memproses..." : "Login"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4 mt-6">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nama Lengkap</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Masukkan nama lengkap"
                    value={signupForm.fullName}
                    onChange={(e) => setSignupForm({
                      ...signupForm,
                      fullName: e.target.value
                    })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="nama@email.com"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({
                      ...signupForm,
                      email: e.target.value
                    })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimal 6 karakter"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({
                        ...signupForm,
                        password: e.target.value
                      })}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Konfirmasi Password</Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ulangi password"
                    value={signupForm.confirmPassword}
                    onChange={(e) => setSignupForm({
                      ...signupForm,
                      confirmPassword: e.target.value
                    })}
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? "Memproses..." : "Daftar Sekarang"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;