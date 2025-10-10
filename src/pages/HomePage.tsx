import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail, User, ArrowLeft } from "lucide-react";

const HomePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم المستخدم وكلمة المرور",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    // Simulate authentication
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في لوحة التحكم"
      });
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <div dir="rtl" className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900" style={{ fontFamily: "'Cairo', sans-serif" }}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }} />

        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }} />

        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{
            scale: [1, 1.4, 1]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }} />

      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md">

          {/* Logo and welcome section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-8">

            <motion.div
              className="inline-block mb-4"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}>

              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl">
                <Lock className="w-10 h-10 text-white" />
              </div>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-4xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">

              مرحباً بك
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-lg text-purple-200">

              سجّل الدخول للوصول إلى حسابك
            </motion.p>
          </motion.div>

          {/* Login card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Username/Email field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-2">

                <Label htmlFor="username" className="text-white text-lg font-semibold flex items-center gap-2">
                  <User className="w-5 h-5" />
                  اسم المستخدم أو البريد الإلكتروني
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-white/90 border-white/30 text-gray-900 placeholder:text-gray-500 h-12 text-lg rounded-xl focus:ring-2 focus:ring-purple-400 transition-all"
                  placeholder="أدخل اسم المستخدم أو البريد"
                  dir="rtl" />

              </motion.div>

              {/* Password field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="space-y-2">

                <Label htmlFor="password" className="text-white text-lg font-semibold flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  كلمة المرور
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/90 border-white/30 text-gray-900 placeholder:text-gray-500 h-12 text-lg rounded-xl focus:ring-2 focus:ring-purple-400 transition-all"
                  placeholder="أدخل كلمة المرور"
                  dir="rtl" />

              </motion.div>

              {/* Forgot password link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-left">

                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-purple-200 hover:text-white transition-colors text-sm font-medium underline underline-offset-2">

                  هل نسيت كلمة المرور؟
                </button>
              </motion.div>

              {/* Login button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-lg font-bold bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">

                  {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                </Button>
              </motion.div>

              {/* Divider */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="relative">

                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-transparent text-purple-200">أو</span>
                </div>
              </motion.div>

              {/* Register button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}>

                <Button
                  type="button"
                  onClick={() => navigate("/register")}
                  variant="outline"
                  className="w-full h-12 text-lg font-bold bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 rounded-xl transition-all duration-300 transform hover:scale-[1.02] bg-white text-[#e9d5ff]">

                  إنشاء حساب جديد
                </Button>
              </motion.div>
            </form>
          </motion.div>

          {/* Footer text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-center mt-8">

            <p className="text-purple-200 text-sm">
              جميع الحقوق محفوظة © {new Date().getFullYear()}
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>);

};

export default HomePage;