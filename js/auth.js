// ===========================
// إعداد اتصال Supabase
// ===========================
const SUPABASE_URL = "https://uulzslgyqygvtpfgeecr.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1bHpzbGd5cXlndnRwZmdlZWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NzM4ODEsImV4cCI6MjA3NTM0OTg4MX0.VLJ_R6aKKz39AvZphb0JGVspUpw--l2JNzrk5yuNwkQ";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===========================
// تسجيل حساب جديد
// ===========================
async function signUpUser(event) {
  event.preventDefault();
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    if (error.message.includes("already registered")) {
      alert("⚠️ هذا البريد الإلكتروني مسجل مسبقًا. يُرجى تسجيل الدخول بدلًا من إنشاء حساب جديد.");
      window.location.href = "/login.html";
    } else {
      alert("حدث خطأ أثناء إنشاء الحساب: " + error.message);
    }
    return;
  }

  alert("✅ تم إرسال رسالة التفعيل إلى بريدك الإلكتروني. يرجى التحقق منها لتفعيل الحساب.");
  window.location.href = "/login.html";
}

// ===========================
// تسجيل الدخول
// ===========================
async function signInUser(event) {
  event.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) {
    alert("خطأ في البريد أو كلمة المرور");
  } else {
    alert("تم تسجيل الدخول بنجاح ✅");
    window.location.href = "/complete-profile.html";
  }
}

// ===========================
// التحقق من الجلسة الحالية
// ===========================
async function checkSession() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    console.log("مستخدم حالي:", user.email);
  } else {
    console.log("لا يوجد مستخدم مسجل دخول.");
  }
}

// ===========================
// تسجيل الخروج
// ===========================
async function logoutUser() {
  await supabase.auth.signOut();
  alert("تم تسجيل الخروج بنجاح");
  window.location.href = "/index.html";
}

// استدعاء التحقق من الجلسة عند تحميل الصفحة
checkSession();
