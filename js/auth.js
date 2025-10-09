// js/auth.js - authentication and profile logic
async function signUpUser(e) {
  e.preventDefault();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  if (!email || !password) return alert('اكمل الحقول المطلوبة');

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('already registered') || msg.includes('user already exists')) {
      alert('هذا البريد مسجل بالفعل، سيتم تحويلك إلى صفحة تسجيل الدخول.');
      window.location.href = 'login.html';
      return;
    }
    alert('خطأ أثناء التسجيل: ' + (error.message || JSON.stringify(error)));
    return;
  }
  alert('تم إنشاء الحساب! تم إرسال رسالة تفعيل إلى بريدك. بعد التفعيل سجل الدخول.');
  window.location.href = 'login.html';
}

async function signInUser(e) {
  if (e && e.preventDefault) e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) return alert('اكمل الحقول المطلوبة');

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    alert('خطأ في البريد أو كلمة المرور: ' + (error.message || ''));
    console.error(error);
    return;
  }

  const user = (await supabase.auth.getUser()).data.user;
  if (!user) {
    alert('حدث خطأ: لم يتم التعرف على المستخدم بعد تسجيل الدخول.');
    return;
  }

  const { data: profile, error: pErr } = await supabase.from('profiles').select('id,role_id,full_name_ar').eq('id', user.id).maybeSingle();
  if (pErr) console.error('profile fetch error', pErr);

  if (profile && profile.id) {
    window.location.href = 'requirements.html';
  } else {
    window.location.href = 'complete-profile.html';
  }
}

async function submitProfile() {
  const userResp = await supabase.auth.getUser();
  const user = userResp.data.user;
  if (!user) {
    alert('الرجاء تسجيل الدخول أولًا');
    window.location.href = 'login.html';
    return;
  }
  const payload = {
    id: user.id,
    full_name_ar: document.getElementById('full_name_ar').value.trim(),
    client_number: document.getElementById('client_number').value.trim() || null,
    company_name: document.getElementById('company_name').value.trim() || null,
    phone_number: document.getElementById('phone_number').value.trim() || null,
    role_id: 4,
    is_active: true
  };

  const { data, error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
  if (error) {
    console.error('upsert profile error', error);
    alert('حدث خطأ أثناء حفظ الملف الشخصي: ' + (error.message || ''));
    return;
  }
  alert('تم حفظ ملفك الشخصي بنجاح');
  window.location.href = 'requirements.html';
}

async function requireAuthRedirect(to='login.html') {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    window.location.href = to;
    return null;
  }
  return data.session.user;
}
