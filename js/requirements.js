// js/requirements.js
(async () => {
  const qEl = document.getElementById('q');
  qEl.addEventListener('input', render);

  async function getProfile() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return null;
    const { data: profile } = await supabase.from('profiles').select('role_id,full_name_ar').eq('id', user.id).maybeSingle();
    return profile;
  }

  async function render() {
    const term = qEl.value || '';
    const res = await supabase.from('export_requirements')
      .select('id,publication_number,publication_year,full_requirements,country_id,crop_id,user_id')
      .ilike('full_requirements','%' + term + '%')
      .order('created_at', { ascending: false })
      .limit(100);
    const data = res.data;
    const container = document.getElementById('results');
    container.innerHTML = '';
    if (!data || data.length === 0) {
      container.innerHTML = '<div class="text-muted p-3">لا توجد نتائج</div>';
      return;
    }
    data.forEach(r => {
      const div = document.createElement('div');
      div.className = 'mb-2 p-3 border rounded';
      div.innerHTML = '<strong>رقم النشر:</strong> ' + (r.publication_number || '-') + ' &nbsp; <strong>السنة:</strong> ' + (r.publication_year || '-') + '<p>' + (r.full_requirements || '') + '</p>';
      container.appendChild(div);
    });
  }

  const actions = document.getElementById('actions');
  actions.innerHTML = '';
  const profile = await getProfile();
  const addBtn = document.createElement('a');
  addBtn.className = 'btn btn-outline-primary';
  addBtn.textContent = 'إضافة اشتراط جديد';
  addBtn.href = 'add-requirement.html';
  if (profile && (profile.role_id === 1 || profile.role_id === 2)) {
    actions.appendChild(addBtn);
  }

  await render();
})();
