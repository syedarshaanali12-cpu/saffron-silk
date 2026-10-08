import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { Search, Phone, Users, CheckCircle2, Clock3, ChevronRight, Filter, LayoutDashboard, LogOut, RefreshCw, Upload, CalendarClock, X, Plus, Download } from 'lucide-react';
import './styles.css';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
const statuses = ['fresh','contacted','interested','follow_up','no_answer','busy','not_interested','wrong_number','enrolled','won','lost'];
const statusLabel = s => ({follow_up:'Follow-up',no_answer:'No Answer',not_interested:'Not Interested',wrong_number:'Wrong Number'}[s] || (s || '').replaceAll('_',' ').replace(/\b\w/g, c=>c.toUpperCase()));
const normalize = p => String(p || '').replace(/\D/g,'').slice(-10);
function parseCSV(text) {
  const rows=[]; let row=[], cell='', quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1]; if(c==='"'&&quoted&&n==='"'){cell+='"';i++} else if(c==='"'){quoted=!quoted} else if(c===','&&!quoted){row.push(cell.trim());cell=''} else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&n==='\n')i++;row.push(cell.trim());if(row.some(v=>v!==''))rows.push(row);row=[];cell=''} else cell+=c;}
  row.push(cell.trim()); if(row.some(v=>v!==''))rows.push(row);
  if(!rows.length)return [];
  const headers=rows.shift().map(x=>x.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''));
  return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]||''])));
}
function pick(row, names) { for(const n of names){const found=Object.keys(row).find(k=>k===n||k.includes(n));if(found&&row[found])return row[found].trim()} return ''; }
function App(){
 const [session,setSession]=useState(null), [profile,setProfile]=useState(null), [email,setEmail]=useState(''), [password,setPassword]=useState(''), [fullName,setFullName]=useState('');
 const [authMode,setAuthMode]=useState('signin'), [authLoading,setAuthLoading]=useState(false);
 const [leads,setLeads]=useState([]), [followups,setFollowups]=useState([]), [profiles,setProfiles]=useState([]), [calls,setCalls]=useState([]);
 const [q,setQ]=useState(''), [filter,setFilter]=useState('all'), [section,setSection]=useState('overview'), [selected,setSelected]=useState(null), [toast,setToast]=useState(''), [busy,setBusy]=useState(false), [error,setError]=useState('');
 const [note,setNote]=useState(''), [followDate,setFollowDate]=useState(''), [followNote,setFollowNote]=useState('');
 const [importType,setImportType]=useState('leads'), [importFile,setImportFile]=useState(null);
 function notify(s){setToast(s);setTimeout(()=>setToast(''),3200)}
 async function loadData(userId, role){
   setBusy(true);setError('');
   try{
    let lq=supabase.from('leads').select('*').order('created_at',{ascending:false}).limit(1000);
    if(role!=='admin')lq=lq.eq('assigned_to',userId);
    const [lr,fr,pr,cr]=await Promise.all([
      lq,
      supabase.from('follow_ups').select('*').is('completed_at',null).order('due_at',{ascending:true}).limit(500),
      supabase.from('profiles').select('id,full_name,role,active').eq('active',true).order('full_name'),
      supabase.from('call_logs').select('*').order('created_at',{ascending:false}).limit(500)
    ]);
    for(const r of [lr,fr,pr,cr])if(r.error)throw r.error;
    setLeads(lr.data||[]);setFollowups(fr.data||[]);setProfiles(pr.data||[]);setCalls(cr.data||[]);
    const p=(pr.data||[]).find(x=>x.id===userId);setProfile(p||{id:userId,full_name:'Sales user',role:'sales'});
   }catch(e){setError(e.message||'Could not load CRM data')}
   finally{setBusy(false)}
 }
 useEffect(()=>{if(!supabase)return;supabase.auth.getSession().then(({data})=>setSession(data.session));const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>subscription.unsubscribe()},[]);
 useEffect(()=>{if(session&&supabase){supabase.from('profiles').select('id,full_name,role,active').eq('id',session.user.id).maybeSingle().then(({data})=>{setProfile(data);loadData(session.user.id,data?.role||'sales')})}},[session?.user?.id]);
 async function authenticate(e){e.preventDefault();setAuthLoading(true);setError('');try{if(authMode==='signup'){const {error}=await supabase.auth.signUp({email,password,options:{data:{full_name:fullName}}});if(error)throw error;notify('Account created. If email confirmation is enabled, verify your email then sign in.')}else{const {error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;}}catch(e){setError(e.message||'Authentication failed')}finally{setAuthLoading(false)}}
 async function signOut(){await supabase.auth.signOut();setSession(null);setProfile(null);setLeads([]);setSelected(null)}
 const fresh=useMemo(()=>leads.filter(l=>l.status==='fresh'),[leads]);
 const visible=useMemo(()=>leads.filter(l=>(filter==='all'||l.status===filter)&&[l.full_name,l.phone,l.course,l.source,l.status].join(' ').toLowerCase().includes(q.toLowerCase())),[leads,filter,q]);
 const due=followups.filter(f=>new Date(f.due_at)<=new Date()).length;
 const stats={fresh:fresh.length,active:leads.filter(x=>['fresh','contacted','interested','follow_up'].includes(x.status)).length,connected:calls.filter(x=>x.outcome==='connected').length,won:leads.filter(x=>x.status==='won').length};
 async function refresh(){await loadData(session.user.id,profile?.role||'sales');notify('Data refreshed')}
 async function updateLead(id,patch){const {data,error}=await supabase.from('leads').update(patch).eq('id',id).select().single();if(error){notify(error.message);return false}setLeads(ls=>ls.map(l=>l.id===id?data:l));setSelected(data);return true}
 async function logCall(outcome){
   if(!selected)return;setBusy(true);
   try{const {error:ce}=await supabase.from('call_logs').insert({lead_id:selected.id,salesperson_id:session.user.id,outcome,provider:'manual',notes:note});if(ce)throw ce;
    const nextStatus=outcome==='connected'?(selected.status==='fresh'?'contacted':selected.status):outcome;
    const {error:le}=await supabase.from('leads').update({status:nextStatus,last_contacted_at:new Date().toISOString(),notes:note||selected.notes}).eq('id',selected.id);if(le)throw le;
    setNote('');await loadData(session.user.id,profile?.role||'sales');setSelected(s=>s?{...s,status:nextStatus,last_contacted_at:new Date().toISOString()}:null);notify('Call outcome saved');
   }catch(e){notify(e.message||'Call could not be logged')}finally{setBusy(false)}
 }
 async function addFollowup(){if(!selected||!followDate)return;setBusy(true);try{const dueAt=new Date(followDate).toISOString();const {error:fe}=await supabase.from('follow_ups').insert({lead_id:selected.id,assigned_to:selected.assigned_to||session.user.id,due_at:dueAt,note:followNote,created_by:session.user.id});if(fe)throw fe;const ok=await updateLead(selected.id,{status:'follow_up',next_follow_up_at:dueAt});if(!ok)throw new Error('Follow-up saved but lead status update failed');setFollowDate('');setFollowNote('');await loadData(session.user.id,profile?.role||'sales');notify('Follow-up scheduled')}catch(e){notify(e.message||'Could not schedule follow-up')}finally{setBusy(false)}}
 async function completeFollowup(id){const {error}=await supabase.from('follow_ups').update({completed_at:new Date().toISOString()}).eq('id',id);if(error)notify(error.message);else{setFollowups(fs=>fs.filter(f=>f.id!==id));notify('Follow-up completed')}}
 async function importCSV(){
   if(!importFile)return;setBusy(true);setError('');
   try{
    const rows=parseCSV(await importFile.text());if(!rows.length)throw new Error('CSV appears empty. Export your spreadsheet as CSV first.');
    const batch={file_name:importFile.name,import_type:importType,rows_seen:rows.length,created_by:session.user.id};
    const {data:batchRow,error:be}=await supabase.from('import_batches').insert(batch).select().single();if(be)throw be;
    let inserted=0,dupes=0,enrolledSkip=0;
    if(importType==='enrollments'){
      const payload=rows.map(r=>({full_name:pick(r,['full_name','name','student']),phone:pick(r,['phone_normalized','phone','mobile','contact']),phone_normalized:normalize(pick(r,['phone_normalized','phone','mobile','contact'])),course:pick(r,['course','program']),academic_year:pick(r,['academic_year','year'])})).filter(x=>x.full_name&&x.phone_normalized.length===10);
      for(let i=0;i<payload.length;i+=200){const {data,error}=await supabase.from('enrollments').upsert(payload.slice(i,i+200),{onConflict:'phone_normalized',ignoreDuplicates:true}).select('id');if(error)throw error;inserted+=(data||[]).length;}
      // Leads already imported for these numbers are marked enrolled and removed from the fresh queue.
      const {data:enrs,error:ee}=await supabase.from('enrollments').select('phone_normalized');if(ee)throw ee;const set=new Set((enrs||[]).map(x=>x.phone_normalized));
      const toMark=leads.filter(l=>set.has(l.phone_normalized)&&l.status!=='enrolled');
      for(const l of toMark){await supabase.from('leads').update({status:'enrolled'}).eq('id',l.id)}
    }else{
      const {data:enrs,error:ee}=await supabase.from('enrollments').select('phone_normalized');if(ee)throw ee;const enrolledSet=new Set((enrs||[]).map(x=>x.phone_normalized));
      const {data:existing,error:xe}=await supabase.from('leads').select('phone_normalized');if(xe)throw xe;const existingSet=new Set((existing||[]).map(x=>x.phone_normalized));
      const payload=[];
      for(const r of rows){const name=pick(r,['full_name','name','student']);const phone=pick(r,['phone_normalized','phone','mobile','contact','number']);const pn=normalize(phone);if(!name||pn.length!==10)continue;if(enrolledSet.has(pn)){enrolledSkip++;continue}if(existingSet.has(pn)){dupes++;continue}existingSet.add(pn);payload.push({full_name:name,phone,phone_normalized:pn,email:pick(r,['email']),course:pick(r,['course','program']),source:pick(r,['source','campaign'])||'csv_import',status:'fresh',created_by:session.user.id,assigned_to:profile?.role==='admin'?null:session.user.id,import_batch_id:batchRow.id})}
      for(let i=0;i<payload.length;i+=200){const {data,error}=await supabase.from('leads').insert(payload.slice(i,i+200)).select('id');if(error)throw error;inserted+=(data||[]).length;}
    }
    await supabase.from('import_batches').update({rows_inserted:inserted,rows_skipped_duplicate:dupes,rows_skipped_enrolled:enrolledSkip}).eq('id',batchRow.id);
    setImportFile(null);await loadData(session.user.id,profile?.role||'sales');notify(`Import complete: ${inserted} added, ${dupes} duplicates, ${enrolledSkip} enrolled skipped`);setSection('leads');
   }catch(e){setError(e.message||'Import failed');notify(e.message||'Import failed')}finally{setBusy(false)}
 }
 async function assignLead(id, userId){const {error}=await supabase.from('leads').update({assigned_to:userId||null}).eq('id',id);if(error){notify(error.message);return}await loadData(session.user.id,profile?.role||'sales');setSelected(null);notify('Lead assignment updated')}
 if(!supabase)return <div className="auth-shell"><div className="auth-card"><div className="mark">S</div><h1>Connect SalesOS</h1><p>Set the two environment variables in the project deployment settings to connect the CRM to its database.</p><code>VITE_SUPABASE_URL</code><code>VITE_SUPABASE_PUBLISHABLE_KEY</code><p>Supabase project: setryfvduwqsllsmauyi</p></div></div>;
 if(!session)return <div className="auth-shell"><form className="auth-card" onSubmit={authenticate}><div className="mark">S</div><p className="eyebrow">SALES OPERATIONS</p><h1>{authMode==='signin'?'Welcome back.':'Create your account.'}</h1><p className="muted">Sign in to your team's sales workspace.</p>{authMode==='signup'&&<input required placeholder="Full name" value={fullName} onChange={e=>setFullName(e.target.value)}/>}<input required type="email" placeholder="Work email" value={email} onChange={e=>setEmail(e.target.value)}/><input required minLength="8" type="password" placeholder="Password (8+ characters)" value={password} onChange={e=>setPassword(e.target.value)}/>{error&&<p className="error">{error}</p>}<button className="primary wide" disabled={authLoading}>{authLoading?'Please wait…':authMode==='signin'?'Sign in':'Create account'}</button><button type="button" className="text-button" onClick={()=>{setAuthMode(authMode==='signin'?'signup':'signin');setError('')}}>{authMode==='signin'?'First account? Create an account':'Already registered? Sign in'}</button><p className="fineprint">The first account created becomes the CRM administrator. Create it before inviting salespeople.</p></form></div>;
 return <div className="app">
  <aside><div className="brand"><div className="mark">S</div><div><b>SalesOS</b><span>Lead command center</span></div></div><nav>
   <button className={section==='overview'?'active':''} onClick={()=>setSection('overview')}><LayoutDashboard size={18}/>Overview</button>
   <button className={section==='leads'?'active':''} onClick={()=>setSection('leads')}><Users size={18}/>Leads <em>{fresh.length}</em></button>
   <button className={section==='followups'?'active':''} onClick={()=>setSection('followups')}><Clock3 size={18}/>Follow-ups <em>{due}</em></button>
   <button className={section==='imports'?'active':''} onClick={()=>setSection('imports')}><Upload size={18}/>Import CSV</button>
  </nav><div className="profile"><div className="avatar">{(profile?.full_name||session.user.email||'S').slice(0,2).toUpperCase()}</div><div><b>{profile?.full_name||session.user.email}</b><span>{profile?.role||'Sales'}</span></div><button className="iconbtn" onClick={signOut} title="Sign out"><LogOut size={16}/></button></div></aside>
  <main><header><div><p className="eyebrow">SALES OPERATIONS</p><h1>{section==='overview'?'Good to see you.':section==='leads'?'Lead management':section==='followups'?'Follow-ups': 'Import spreadsheet'}</h1><p className="muted">{section==='overview'?<>You have <strong>{fresh.length} fresh leads</strong> available in your assigned queue.</>:section==='leads'?'Search, filter and update your lead pipeline.':section==='followups'?'Open tasks assigned to you or your team.':'Upload a CSV exported from Google Sheets or Excel.'}</p></div><div className="header-actions"><button className="ghost" onClick={refresh}><RefreshCw size={17}/> Refresh</button>{section!=='imports'&&<button className="primary" onClick={()=>{setSection('imports')}}><Upload size={17}/> Import leads</button>}</div></header>
  {error&&<div className="error-banner">{error}<button onClick={()=>setError('')}><X size={16}/></button></div>}
  {section==='overview'&&<><section className="stats"><Card icon={<Users/>} label="Fresh leads" value={stats.fresh} note="not marked as enrolled"/><Card icon={<Phone/>} label="Active pipeline" value={stats.active} note="fresh + contacted + follow-up"/><Card icon={<CheckCircle2/>} label="Connected calls" value={stats.connected} note="logged in the database"/><Card icon={<CheckCircle2/>} label="Won" value={stats.won} note="converted leads"/></section><section className="panel"><div className="panel-head"><div><h2>Sales queue</h2><p>Real records from your CRM database.</p></div><button className="ghost" onClick={()=>{setFilter('fresh');setSection('leads')}}>View fresh leads <ChevronRight size={15}/></button></div><LeadTable visible={leads.slice(0,8)} setSelected={setSelected}/></section></>}
  {section==='leads'&&<section className="panel"><div className="panel-head"><div><h2>All leads</h2><p>{visible.length} matching records</p></div></div><div className="toolbar"><div className="search"><Search size={18}/><input placeholder="Search name, phone, course..." value={q} onChange={e=>setQ(e.target.value)}/></div><div className="filters"><Filter size={16}/>{['all',...statuses].map(x=><button key={x} className={filter===x?'selected':''} onClick={()=>setFilter(x)}>{statusLabel(x)}</button>)}</div></div><LeadTable visible={visible} setSelected={setSelected}/></section>}
  {section==='followups'&&<section className="panel"><div className="panel-head"><div><h2>Pending follow-ups</h2><p>Complete the task when the student has been contacted.</p></div></div><div className="follow-list">{followups.map(f=>{const lead=leads.find(l=>l.id===f.lead_id);return <div className="follow-row" key={f.id}><div className="card-icon"><CalendarClock size={16}/></div><div className="follow-main"><b>{lead?.full_name||'Lead'}</b><span>{lead?.phone||''} · {f.note||'Follow-up'}</span></div><div className="follow-date">{new Date(f.due_at).toLocaleString()}</div><button className="ghost" onClick={()=>completeFollowup(f.id)}>Complete</button></div>})}{!followups.length&&<div className="empty">No pending follow-ups.</div>}</div></section>}
  {section==='imports'&&<section className="panel import-panel"><div className="panel-head"><div><h2>Import a spreadsheet</h2><p>Export Google Sheets as CSV, then upload the file here.</p></div></div><div className="import-content"><label>What are you importing?<select value={importType} onChange={e=>setImportType(e.target.value)}><option value="leads">New leads</option><option value="enrollments">Enrolled students (yearly master sheet)</option></select></label><label className="upload-box"><Upload size={24}/><b>{importFile?importFile.name:'Choose a CSV file'}</b><span>CSV only · phone and name columns required</span><input type="file" accept=".csv,text/csv" onChange={e=>setImportFile(e.target.files?.[0]||null)}/></label><div className="import-help"><b>Expected column names (flexible)</b><p><strong>Leads:</strong> name/full_name, phone/mobile, course, email, source</p><p><strong>Enrollments:</strong> name/full_name, phone/mobile, course, academic_year</p><p>Phone numbers are normalized to the last 10 digits. Existing phone numbers and enrolled students are skipped from lead imports.</p></div><button className="primary" disabled={!importFile||busy} onClick={importCSV}>{busy?'Importing…':'Import CSV'}</button></div></section>}
  {busy&&<div className="busy-strip">Working…</div>}
  </main>
  {selected&&<div className="drawer"><div className="drawer-top"><div><p className="eyebrow">LEAD PROFILE</p><h2>{selected.full_name}</h2><p className="muted">{selected.phone}</p></div><button className="iconbtn" onClick={()=>setSelected(null)}><X size={19}/></button></div><div className="detail"><Badge status={selected.status}/><div className="detail-grid"><div><label>Course</label><b>{selected.course||'—'}</b></div><div><label>Source</label><b>{selected.source||'—'}</b></div><div><label>Last activity</label><b>{selected.last_contacted_at?new Date(selected.last_contacted_at).toLocaleString():'Never'}</b></div><div><label>Created</label><b>{new Date(selected.created_at).toLocaleDateString()}</b></div></div>{profile?.role==='admin'&&<label className="field-label">Assign owner<select value={selected.assigned_to||''} onChange={e=>assignLead(selected.id,e.target.value)}><option value="">Unassigned</option>{profiles.map(p=><option key={p.id} value={p.id}>{p.full_name||p.id} ({p.role})</option>)}</select></label>}<label className="field-label">Lead status<select value={selected.status} onChange={e=>updateLead(selected.id,{status:e.target.value})}>{statuses.map(s=><option key={s} value={s}>{statusLabel(s)}</option>)}</select></label><label className="field-label">Call notes<textarea rows="3" value={note} onChange={e=>setNote(e.target.value)} placeholder="What happened on the call?"/></label></div><div className="callbox"><Phone size={22}/><div><b>Call logging</b><span>This logs the result to the database; it does not place a phone call yet.</span></div></div><div className="outcomes"><p>Save call outcome</p><button disabled={busy} onClick={()=>logCall('connected')}>Connected</button><button disabled={busy} onClick={()=>logCall('no_answer')}>No answer</button><button disabled={busy} onClick={()=>logCall('busy')}>Busy</button><button disabled={busy} onClick={()=>logCall('failed')}>Failed</button></div><div className="schedule-box"><b>Schedule follow-up</b><input type="datetime-local" value={followDate} onChange={e=>setFollowDate(e.target.value)}/><input placeholder="Follow-up note (optional)" value={followNote} onChange={e=>setFollowNote(e.target.value)}/><button className="primary wide" disabled={!followDate||busy} onClick={addFollowup}><CalendarClock size={16}/> Save follow-up</button></div><div className="note"><b>Calling integration</b><p>Connect a provider such as Exotel or Knowlarity to place real calls and receive webhook events for call status, duration and recording links.</p></div></div>}
  {toast&&<div className="toast">{toast}</div>}
 </div>
}
function LeadTable({visible,setSelected}){return <div className="table"><div className="tr th"><span>Lead</span><span>Course</span><span>Source</span><span>Status</span><span>Last activity</span><span></span></div>{visible.map(l=><div className="tr" key={l.id} onClick={()=>setSelected(l)}><span className="lead"><div className="avatar small">{(l.full_name||'L').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()}</div><div><b>{l.full_name}</b><small>{l.phone}</small></div></span><span>{l.course||'—'}</span><span className="muted">{l.source||'—'}</span><span><Badge status={l.status}/></span><span className="muted">{l.last_contacted_at?new Date(l.last_contacted_at).toLocaleString():'Never'}</span><ChevronRight size={17}/></div>)}{!visible.length&&<div className="empty">No leads found. Import a CSV to get started.</div>}</div>}
function Card({icon,label,value,note}){return <div className="card"><div className="card-icon">{icon}</div><span>{label}</span><strong>{value}</strong><small>{note}</small></div>}
function Badge({status}){return <span className={'badge '+(status||'').replaceAll('_','-')}>{statusLabel(status)}</span>}
createRoot(document.getElementById('root')).render(<App/>);
