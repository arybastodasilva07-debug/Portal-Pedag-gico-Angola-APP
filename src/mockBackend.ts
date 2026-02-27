// src/mockBackend.ts
const originalFetch = window.fetch;

const initDB = () => {
  if (!localStorage.getItem('ppa_users')) {
    localStorage.setItem('ppa_users', JSON.stringify([
      { id: 1, email: 'arybastodasilva07@gmail.com', password: 'Ab005345RM', is_admin: 1, status: 'Ativo', professor_nome: 'Administrador', planos_consumidos: 0 }
    ]));
  }
  if (!localStorage.getItem('ppa_news')) {
    localStorage.setItem('ppa_news', JSON.stringify([
      { id: 1, title: 'Bem-vindo ao PPA Local', content: 'Esta versão corre localmente no seu navegador. Os dados são guardados apenas neste dispositivo.', category: 'Aviso', date: new Date().toISOString() }
    ]));
  }
};

initDB();

const getTable = (table: string) => JSON.parse(localStorage.getItem(`ppa_${table}`) || '[]');
const setTable = (table: string, data: any) => localStorage.setItem(`ppa_${table}`, JSON.stringify(data));

const jsonResponse = (data: any, status = 200) => {
  return Promise.resolve(new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  }));
};

window.fetch = async (...args) => {
  const [resource, config] = args;
  const url = typeof resource === 'string' ? resource : resource.url;

  if (url.startsWith('/api/')) {
    console.log(`[Mock API] Intercepted ${config?.method || 'GET'} ${url}`);
    
    try {
      // Auth
      if (url === '/api/auth/login' && config?.method === 'POST') {
        const body = JSON.parse(config.body as string);
        const users = getTable('users');
        const user = users.find((u: any) => (u.email === body.identifier || u.telefone === body.identifier) && u.password === body.password);
        if (user) return jsonResponse({ user });
        return jsonResponse({ error: 'Credenciais inválidas' }, 401);
      }
      if (url === '/api/auth/register' && config?.method === 'POST') {
        const body = JSON.parse(config.body as string);
        const users = getTable('users');
        const newUser = { ...body, id: Date.now(), status: 'Pendente', planos_consumidos: 0, is_admin: 0 };
        users.push(newUser);
        setTable('users', users);
        return jsonResponse({ id: newUser.id });
      }
      if (url === '/api/auth/request-email' && config?.method === 'POST') {
        return jsonResponse({ success: true, message: 'Pedido simulado com sucesso.' });
      }
      if (url === '/api/auth/forgot-password' && config?.method === 'POST') {
        return jsonResponse({ success: true, message: 'Senha temporária gerada (Simulação).' });
      }

      // News
      if (url === '/api/news' && (!config || config.method === 'GET')) {
        return jsonResponse(getTable('news'));
      }
      if (url === '/api/admin/news' && config?.method === 'POST') {
        const body = JSON.parse(config.body as string);
        const news = getTable('news');
        news.push({ ...body, id: Date.now(), date: new Date().toISOString() });
        setTable('news', news);
        return jsonResponse({ success: true });
      }
      if (url.startsWith('/api/admin/news/') && config?.method === 'DELETE') {
        const id = parseInt(url.split('/').pop() || '0');
        let news = getTable('news');
        news = news.filter((n: any) => n.id !== id);
        setTable('news', news);
        return jsonResponse({ success: true });
      }

      // Users
      if (url === '/api/admin/users' && (!config || config.method === 'GET')) {
        return jsonResponse(getTable('users'));
      }
      if (url === '/api/admin/update-user' && config?.method === 'POST') {
        const body = JSON.parse(config.body as string);
        let users = getTable('users');
        users = users.map((u: any) => u.id === body.id ? { ...u, ...body } : u);
        setTable('users', users);
        return jsonResponse({ success: true, activationMessage: 'Usuário atualizado (Simulação)' });
      }
      if (url === '/api/users/update-credits' && config?.method === 'POST') {
        const body = JSON.parse(config.body as string);
        let users = getTable('users');
        users = users.map((u: any) => u.id === body.userId ? { ...u, planos_consumidos: (u.planos_consumidos || 0) + 1 } : u);
        setTable('users', users);
        return jsonResponse({ success: true });
      }

      // Plans History
      if (url.startsWith('/api/plans/history/') && (!config || config.method === 'GET')) {
        const userId = parseInt(url.split('/').pop() || '0');
        return jsonResponse(getTable('plans_history').filter((p: any) => p.user_id === userId));
      }
      if (url === '/api/plans/save' && config?.method === 'POST') {
        const body = JSON.parse(config.body as string);
        const plans = getTable('plans_history');
        plans.push({ ...body, id: Date.now(), created_at: new Date().toISOString() });
        setTable('plans_history', plans);
        return jsonResponse({ success: true });
      }
      if (url === '/api/plans/update' && config?.method === 'POST') {
        const body = JSON.parse(config.body as string);
        let plans = getTable('plans_history');
        plans = plans.map((p: any) => p.id === body.id ? { ...p, content: body.content } : p);
        setTable('plans_history', plans);
        return jsonResponse({ success: true });
      }

      // Students
      if (url.startsWith('/api/students/') && (!config || config.method === 'GET')) {
        const userId = parseInt(url.split('/').pop() || '0');
        return jsonResponse(getTable('students').filter((s: any) => s.user_id === userId));
      }
      if (url === '/api/students/add' && config?.method === 'POST') {
        const body = JSON.parse(config.body as string);
        const students = getTable('students');
        students.push({ ...body, id: Date.now() });
        setTable('students', students);
        return jsonResponse({ success: true });
      }
      if (url.startsWith('/api/students/') && config?.method === 'DELETE') {
        const id = parseInt(url.split('/').pop() || '0');
        let students = getTable('students');
        students = students.filter((s: any) => s.id !== id);
        setTable('students', students);
        return jsonResponse({ success: true });
      }

      // Calendar
      if (url.startsWith('/api/calendar/') && (!config || config.method === 'GET')) {
        const userId = parseInt(url.split('/').pop() || '0');
        return jsonResponse(getTable('calendar').filter((c: any) => c.user_id === userId));
      }
      if (url === '/api/calendar/add' && config?.method === 'POST') {
        const body = JSON.parse(config.body as string);
        const calendar = getTable('calendar');
        calendar.push({ ...body, id: Date.now() });
        setTable('calendar', calendar);
        return jsonResponse({ success: true });
      }
      if (url.startsWith('/api/calendar/') && config?.method === 'DELETE') {
        const id = parseInt(url.split('/').pop() || '0');
        let calendar = getTable('calendar');
        calendar = calendar.filter((c: any) => c.id !== id);
        setTable('calendar', calendar);
        return jsonResponse({ success: true });
      }

      // Questions Bank
      if (url.startsWith('/api/questions/') && (!config || config.method === 'GET')) {
        const userId = parseInt(url.split('/').pop() || '0');
        return jsonResponse(getTable('questions').filter((q: any) => q.user_id === userId));
      }
      if (url === '/api/questions/save' && config?.method === 'POST') {
        const body = JSON.parse(config.body as string);
        const questions = getTable('questions');
        questions.push({ ...body, id: Date.now(), created_at: new Date().toISOString() });
        setTable('questions', questions);
        return jsonResponse({ success: true });
      }

      // Feedback
      if (url === '/api/feedback' && config?.method === 'POST') {
        const body = JSON.parse(config.body as string);
        const feedback = getTable('feedback');
        feedback.push({ ...body, id: Date.now(), created_at: new Date().toISOString(), status: 'Pendente' });
        setTable('feedback', feedback);
        return jsonResponse({ success: true });
      }
      if (url === '/api/admin/feedback' && (!config || config.method === 'GET')) {
        return jsonResponse(getTable('feedback'));
      }
      if (url === '/api/admin/feedback/resolve' && config?.method === 'POST') {
        const body = JSON.parse(config.body as string);
        let feedback = getTable('feedback');
        feedback = feedback.map((f: any) => f.id === body.id ? { ...f, status: 'Resolvido' } : f);
        setTable('feedback', feedback);
        return jsonResponse({ success: true });
      }

      // Community Plans
      if (url === '/api/community/plans' && (!config || config.method === 'GET')) {
        return jsonResponse(getTable('community_plans').filter((p: any) => p.status === 'Aprovado'));
      }
      if (url === '/api/admin/community/plans' && (!config || config.method === 'GET')) {
        return jsonResponse(getTable('community_plans'));
      }
      if (url === '/api/community/share' && config?.method === 'POST') {
        const body = JSON.parse(config.body as string);
        const plans = getTable('community_plans');
        plans.push({ ...body, id: Date.now(), created_at: new Date().toISOString(), status: 'Pendente', likes: 0 });
        setTable('community_plans', plans);
        return jsonResponse({ success: true });
      }
      if (url === '/api/community/like' && config?.method === 'POST') {
        const body = JSON.parse(config.body as string);
        let plans = getTable('community_plans');
        plans = plans.map((p: any) => p.id === body.id ? { ...p, likes: (p.likes || 0) + 1 } : p);
        setTable('community_plans', plans);
        return jsonResponse({ success: true });
      }
      if (url === '/api/admin/community/approve' && config?.method === 'POST') {
        const body = JSON.parse(config.body as string);
        let plans = getTable('community_plans');
        plans = plans.map((p: any) => p.id === body.id ? { ...p, status: 'Aprovado' } : p);
        setTable('community_plans', plans);
        return jsonResponse({ success: true });
      }
      if (url === '/api/admin/community/reject' && config?.method === 'POST') {
        const body = JSON.parse(config.body as string);
        let plans = getTable('community_plans');
        plans = plans.map((p: any) => p.id === body.id ? { ...p, status: 'Rejeitado' } : p);
        setTable('community_plans', plans);
        return jsonResponse({ success: true });
      }

      // Stats
      if (url.startsWith('/api/stats/')) {
        return jsonResponse({ plansByMonth: [], subjectsCount: [] });
      }

      // Library
      if (url === '/api/library/files') {
        return jsonResponse([]);
      }
      if (url === '/api/admin/library/upload' && config?.method === 'POST') {
        return jsonResponse({ success: true });
      }
      if (url === '/api/admin/library/file' && config?.method === 'DELETE') {
        return jsonResponse({ success: true });
      }
      if (url === '/api/admin/library/folder' && config?.method === 'POST') {
        return jsonResponse({ success: true });
      }

      // Settings
      if (url === '/api/admin/settings' && (!config || config.method === 'GET')) {
        return jsonResponse(getTable('settings').reduce((acc: any, row: any) => ({ ...acc, [row.key]: row.value }), {}));
      }
      if (url === '/api/admin/settings' && config?.method === 'POST') {
        const body = JSON.parse(config.body as string);
        const settingsArray = Object.entries(body).map(([key, value]) => ({ key, value }));
        setTable('settings', settingsArray);
        return jsonResponse({ success: true });
      }

      // Fallback for any other API route
      console.warn(`[Mock API] Unhandled route: ${url}`);
      return jsonResponse({ error: 'Not implemented in mock' }, 404);

    } catch (e: any) {
      console.error('[Mock API] Error:', e);
      return jsonResponse({ error: e.message }, 500);
    }
  }

  return originalFetch(...args);
};
