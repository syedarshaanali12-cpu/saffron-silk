import { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, saveSiteData, supabase, uploadSiteMedia } from '../lib/supabase';

const ADMIN_EMAIL = 'syedarshaanali12@gmail.com';
const clone = value => JSON.parse(JSON.stringify(value));
const titleCase = value => String(value).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
const isImage = (label, value) => /image|photo|poster|artwork/i.test(label) || /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(value || '') || /images\.unsplash\.com/i.test(value || '');
const isAudio = (label, value) => /audio|music/i.test(label) || /\.(mp3|wav|ogg|m4a)(\?|$)/i.test(value || '');
const isVideo = (label, value) => /video/i.test(label) || /\.(mp4|webm|mov)(\?|$)/i.test(value || '');

function MediaPreview({label, value}) {
  if (!value || !/^https?:|^\//.test(value)) return null;
  if (isImage(label, value)) return <div className="admin-media-preview"><img src={value} alt="Current preview"/><span>Current image</span></div>;
  if (isAudio(label, value)) return <div className="admin-media-preview admin-media-preview--audio"><audio controls src={value}/><span>Current audio</span></div>;
  if (isVideo(label, value)) return <div className="admin-media-preview"><video controls muted src={value}/><span>Current video</span></div>;
  return null;
}

function Field({label, value, onChange, onUpload}) {
  if (typeof value === 'boolean') return <label className="field checkbox"><input type="checkbox" checked={value} onChange={event => onChange(event.target.checked)}/><span>{titleCase(label)}</span></label>;
  if (typeof value === 'number') return <label className="field"><span>{titleCase(label)}</span><input type="number" value={value} onChange={event => onChange(Number(event.target.value))}/></label>;
  const stringValue = String(value ?? '');
  const media = isImage(label, stringValue) || isAudio(label, stringValue) || isVideo(label, stringValue) || /src/i.test(label);
  return <label className="field"><span>{titleCase(label)}</span>{stringValue.length > 90 ? <textarea value={stringValue} onChange={event => onChange(event.target.value)}/> : <input value={stringValue} onChange={event => onChange(event.target.value)}/>} {media && <><MediaPreview label={label} value={stringValue}/><span className="admin-upload"><b>Replace media</b><input type="file" accept="image/*,audio/*,video/*" onChange={async event => {const file=event.target.files?.[0];if(!file)return;const url=await onUpload(file);onChange(url)}}/></span></>}</label>;
}

function ObjectEditor({value, onChange, path='section', onUpload, depth=0}) {
  if (Array.isArray(value)) return <div className="array"><div className="array-head"><b>{titleCase(path)}</b><button type="button" onClick={() => onChange([...value, Array.isArray(value[0]) ? [] : typeof value[0] === 'object' ? {} : ''])}>+ Add item</button></div>{value.map((item,index) => <details className="array-item" key={index} open={index===0 && depth<2}><summary>{titleCase(path)} {index+1}</summary><button className="remove" type="button" onClick={() => onChange(value.filter((_,itemIndex) => itemIndex!==index))}>Remove</button><ObjectEditor value={item} path={`${path} ${index+1}`} onUpload={onUpload} depth={depth+1} onChange={next => {const copy=clone(value);copy[index]=next;onChange(copy)}}/></details>)}</div>;
  if (value && typeof value === 'object') return <div className={`editor-group editor-group--${depth}`}>{depth>0 && <h3>{titleCase(path)}</h3>}{Object.entries(value).filter(([,item])=>item!==undefined).map(([key,item]) => <ObjectEditor key={key} value={item} path={key} onUpload={onUpload} depth={depth+1} onChange={next => onChange({...value,[key]:next})}/>)}</div>;
  return <Field label={path} value={value} onUpload={onUpload} onChange={onChange}/>;
}

function NavigationEditor({navigation, onChange}) {
  return <section className="admin-card"><div className="admin-card-heading"><div><p className="eyebrow">Page names</p><h2>Navigation labels</h2></div><p>Change “Brand Story” to “Our Story” here. The page address remains safely unchanged.</p></div><div className="navigation-editor">{navigation.map((item,index) => <label key={item.href}><small>{item.href}</small><input value={item.label} onChange={event => {const copy=clone(navigation);copy[index].label=event.target.value;onChange(copy)}}/></label>)}</div></section>;
}

function MenuEditor({menu, onChange, onUpload}) {
  const setSection=(index,next)=>{const sections=clone(menu.sections);sections[index]=next;onChange({...menu,sections})};
  return <><section className="admin-card"><div className="admin-card-heading"><div><p className="eyebrow">Menu page</p><h2>Page introduction</h2></div></div><div className="admin-grid"><Field label="Page index" value={menu.index} onChange={index=>onChange({...menu,index})}/><Field label="Heading" value={menu.heading} onChange={heading=>onChange({...menu,heading})}/><Field label="Introduction" value={menu.intro} onChange={intro=>onChange({...menu,intro})}/><Field label="Currency" value={menu.currency} onChange={currency=>onChange({...menu,currency})}/></div></section><section className="admin-card"><div className="admin-card-heading"><div><p className="eyebrow">Five menu squares</p><h2>Text menu or PNG artwork</h2></div><p>Each square can keep its editable dishes or display one uploaded PNG instead.</p></div><div className="menu-admin-grid">{menu.sections.map((section,index) => <article className="menu-admin-card" key={index}><div className="menu-admin-number">0{index+1}</div><label className="checkbox menu-mode"><input type="checkbox" checked={Boolean(section.useImage)} onChange={event=>setSection(index,{...section,useImage:event.target.checked})}/><span>Use PNG instead of text</span></label><Field label="Section title" value={section.title} onChange={title=>setSection(index,{...section,title})}/>{section.useImage ? <>{section.image ? <div className="menu-art-preview"><img src={section.image} alt={section.imageAlt||section.title}/></div> : <div className="menu-art-empty">No PNG uploaded yet</div>}<label className="admin-upload admin-upload--large"><b>{section.image?'Replace PNG':'Upload PNG'}</b><input type="file" accept="image/png" onChange={async event=>{const file=event.target.files?.[0];if(!file)return;const image=await onUpload(file);setSection(index,{...section,image,useImage:true,imageAlt:section.imageAlt||`${section.title} menu`})}}/></label><Field label="Image description" value={section.imageAlt||''} onChange={imageAlt=>setSection(index,{...section,imageAlt})}/></> : <ObjectEditor value={{note:section.note,items:section.items}} path="Menu text" onUpload={onUpload} onChange={next=>setSection(index,{...section,...next})}/>}</article>)}</div></section></>;
}

const PAGE_ROUTES={home:'/',story:'/brand-story',events:'/events',catering:'/catering',menu:'/menu',contact:'/contact'};

export default function Admin({c,s,setC,setS,loadError=''}) {
  const [session,setSession]=useState(null),[password,setPassword]=useState(''),[newPassword,setNewPassword]=useState(''),[tab,setTab]=useState('pageNames'),[status,setStatus]=useState(''),[saving,setSaving]=useState(false);
  useEffect(()=>{supabase?.auth.getSession().then(({data})=>setSession(data.session));const subscription=supabase?.auth.onAuthStateChange((_event,next)=>setSession(next)).data.subscription;return()=>subscription?.unsubscribe()},[]);
  const labels=useMemo(()=>Object.fromEntries((c?.shared?.navigation||[]).map(item=>[item.href,item.label])),[c]);
  if(!isSupabaseConfigured) return <div className="admin-login"><div><h1>Admin setup needed</h1><p>Supabase environment variables are missing.</p></div></div>;
  if(!session) return <div className="admin-login"><form onSubmit={async event=>{event.preventDefault();setStatus('Signing in…');const {error}=await supabase.auth.signInWithPassword({email:ADMIN_EMAIL,password});setStatus(error?error.message:'Signed in')}}><p className="eyebrow">Saffron & Silk</p><h1>Admin login</h1><input type="email" value={ADMIN_EMAIL} readOnly aria-label="Admin email"/><input type="password" required minLength="6" placeholder="Password" value={password} onChange={event=>setPassword(event.target.value)} autoComplete="current-password"/><button className="button">Sign in</button><p>{status}</p></form></div>;
  if(!c||!s) return <div className="admin-login"><div><h1>Admin connected</h1><p>{loadError||'Loading website content…'}</p><button className="button" onClick={()=>supabase.auth.signOut()}>Log out</button></div></div>;
  const save=async()=>{setSaving(true);setStatus('Saving changes…');try{await saveSiteData(c,s);setStatus('Everything is saved and live.')}catch(error){setStatus(error.message)}finally{setSaving(false)}};
  const tabs=[['pageNames','Page Names'],['music','Music'],['global','Brand & Footer'],['home',labels['/']||'Home'],['story',labels['/brand-story']||'Brand Story'],['events',labels['/events']||'Events'],['catering',labels['/catering']||'Catering'],['menu',labels['/menu']||'Menu'],['contact',labels['/contact']||'Contact'],['design','Design & effects']];
  const pageRoute=PAGE_ROUTES[tab];
  const renderEditor=()=>{
    if(tab==='pageNames') return <NavigationEditor navigation={c.shared.navigation} onChange={navigation=>setC({...c,shared:{...c.shared,navigation}})}/>;
    if(tab==='music') return <section className="admin-card"><div className="admin-card-heading"><div><p className="eyebrow">Music controls</p><h2>Music for every page</h2></div><p>Open a page below to change its track name, upload an audio file, or adjust the generated notes and tempo.</p></div><ObjectEditor value={c.music} path="Page music" onUpload={uploadSiteMedia} onChange={music=>setC({...c,music})}/></section>;
    if(tab==='global') return <section className="admin-card"><div className="admin-card-heading"><div><p className="eyebrow">Shared across the site</p><h2>Brand, opening and footer</h2></div></div><ObjectEditor value={{shared:{...c.shared,navigation:undefined},opening:c.opening}} path="Global content" onUpload={uploadSiteMedia} onChange={next=>setC({...c,...next,shared:{...next.shared,navigation:c.shared.navigation}})}/></section>;
    if(tab==='design') return <section className="admin-card"><div className="admin-card-heading"><div><p className="eyebrow">Appearance</p><h2>Design and effects</h2></div></div><ObjectEditor value={s} path="Design settings" onUpload={uploadSiteMedia} onChange={setS}/><div className="admin-password"><div><h3>Change admin password</h3><p>Use at least six characters.</p></div><input type="password" minLength="6" placeholder="New password" value={newPassword} onChange={event=>setNewPassword(event.target.value)}/><button disabled={newPassword.length<6} onClick={async()=>{const{error}=await supabase.auth.updateUser({password:newPassword});setStatus(error?error.message:'Password updated.');if(!error)setNewPassword('')}}>Update password</button></div></section>;
    if(tab==='menu') return <MenuEditor menu={c.menu} onChange={menu=>setC({...c,menu})} onUpload={uploadSiteMedia}/>;
    return <section className="admin-card"><div className="admin-card-heading"><div><p className="eyebrow">Page editor</p><h2>{labels[pageRoute]||titleCase(tab)}</h2></div><p>Images show a preview before you replace them. Save when you are finished.</p></div><ObjectEditor value={c[tab]} path={`${labels[pageRoute]||tab} content`} onUpload={uploadSiteMedia} onChange={next=>setC({...c,[tab]:next})}/></section>;
  };
  return <div className="admin-shell"><aside className="admin-sidebar"><div><p className="eyebrow">Saffron & Silk</p><h1>Site editor</h1></div><nav>{tabs.map(([key,label])=><button key={key} className={tab===key?'active':''} onClick={()=>setTab(key)}>{label}</button>)}</nav><button className="admin-logout" onClick={()=>supabase.auth.signOut()}>Log out</button></aside><main className="admin-main"><header className="admin-toolbar"><div><p className="admin-breadcrumb">Editing · {tabs.find(([key])=>key===tab)?.[1]}</p><p className={`status ${status?'has-message':''}`}>{status||'Changes stay private until you save.'}</p></div><div>{pageRoute&&<a className="admin-preview-link" href={pageRoute} target="_blank" rel="noreferrer">Preview page ↗</a>}<button className="admin-save" disabled={saving} onClick={save}>{saving?'Saving…':'Save changes'}</button></div></header><div className="admin-content">{renderEditor()}</div></main></div>;
}
