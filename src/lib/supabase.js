import { createClient } from '@supabase/supabase-js';

// Prefer Netlify/Vite environment variables when available, but fall back to
// this project's public Supabase connection details. The publishable key is
// intentionally safe for browser use; database/storage writes are protected
// by Supabase Auth + RLS policies.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://zdpgkmpjrblmuagztlnp.supabase.co';

const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_AX2ZOx7khhPhnACZ8La2Sg_qQIkW9zc';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export async function loadSiteData() {
  if (!supabase) throw new Error('Supabase is not configured');
  const { data, error } = await supabase
    .from('site_config')
    .select('key, value')
    .in('key', ['content', 'settings']);
  if (error) throw error;
  const map = Object.fromEntries((data || []).map(row => [row.key, row.value]));
  return { content: map.content, settings: map.settings };
}

export async function saveSiteData(content, settings) {
  if (!supabase) throw new Error('Supabase is not configured');
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error('Your admin session has expired. Please sign in again.');

  const rows = [
    { key: 'content', value: content, updated_by: userData.user.id },
    { key: 'settings', value: settings, updated_by: userData.user.id },
  ];
  const { error } = await supabase.from('site_config').upsert(rows, { onConflict: 'key' });
  if (error) throw error;
}

export async function uploadSiteMedia(file) {
  if (!supabase) throw new Error('Supabase is not configured');
  const extension = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const base = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]+/g, '-').slice(0, 60) || 'media';
  const fileName = `${Date.now()}-${crypto.randomUUID()}-${base}.${extension}`;
  const { error } = await supabase.storage.from('site-media').upload(fileName, file, {
    cacheControl: '31536000',
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('site-media').getPublicUrl(fileName);
  return data.publicUrl;
}

export async function submitWhatNowResponse(answers) {
  if (!supabase) throw new Error('Supabase is not configured');
  const { error } = await supabase.from('pilgrimage_responses').insert({
    pilgrimage_meaning: answers[0],
    walking_beside: answers[1],
    where_next: answers[2],
  });
  if (error) throw error;
}
