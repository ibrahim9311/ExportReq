// js/add-requirement.js
document.getElementById('addForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    alert('الرجاء تسجيل الدخول');
    window.location.href = 'login.html';
    return;
  }
  const { data: profile, error: pErr } = await supabase.from('profiles').select('role_id').eq('id', user.id).maybeSingle();
  if (pErr) { console.error(pErr); alert('خطأ في التحقق من الصلاحية'); return; }
  if (!profile || (profile.role_id !== 1 && profile.role_id !== 2)) {
    alert('ليس لديك صلاحية لإضافة اشتراط جديد.');
    window.location.href = 'requirements.html';
    return;
  }

  const payload = {
    user_id: user.id,
    country_id: Number(document.getElementById('country_id').value),
    crop_id: Number(document.getElementById('crop_id').value),
    full_requirements: document.getElementById('full_requirements').value,
    publication_number: document.getElementById('publication_number').value || null,
    publication_year: Number(document.getElementById('publication_year').value) || null,
    pdf_file_url: document.getElementById('pdf_file_url').value || null
  };

  const { data, error } = await supabase.from('export_requirements').insert(payload);
  if (error) {
    console.error('insert error', error);
    alert('حدث خطأ أثناء الحفظ: ' + (error.message || ''));
    return;
  }
  alert('تمت إضافة الاشتراط بنجاح');
  window.location.href = 'requirements.html';
});
