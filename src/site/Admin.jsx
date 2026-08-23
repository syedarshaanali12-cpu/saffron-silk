import { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, saveSiteData, supabase, uploadSiteMedia } from '../lib/supabase';

const ADMIN_EMAIL = 'syedarshaanali12@gmail.com';
const clone = value => JSON.parse(JSON.stringify(value));
const titleCase = value => String(value).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
const isImage = (label, value) => /image|photo|poster|artwork/i.test(label) || /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(value || '') || /images\.unsplash\.com/i.test(value || '');
const isAudio = (label, value) => /audio|music/i.test(label) || /\.(mp3|wav|ogg|m4a)(\?|$)/i.test(value || '');
const isVideo = (label, value) => /video/i.test(label) || /\.(mp4|webm|mov)(\?|$)/i.test(value || '');

async function normalizeAudioFile(file) {
  const bytes=new Uint8Array(await file.slice(0,12).arrayBuffer());
  const container=String.fromCharCode(...bytes.slice(4,8));
  if(container==='ftyp'&&!/\.m4a$/i.test(file.name)){
    const correctedName=file.name.replace(/\.[^.]+$/, '')+'.m4a';
    return new File([file],correctedName,{type:'audio/mp4',lastModified:file.lastModified});
  }
  return file;
}

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

function MusicEditor({music, onChange, onUpload}) {
  const pageNames={'/':'Home','/brand-story':'Our Story','/events':'Her Beauty','/catering':'Arsh','/menu':'Our Love','/contact':'What Now'};
  const upload=async(route,file)=>{
    if(!file)return;
    const audioSrc=await onUpload(await normalizeAudioFile(file));
    onChange({...music,[route]:{...(music?.[route]||{}),audioSrc,title:file.name}});
  };
  return <section className="admin-card"><div className="admin-card-heading"><div><p className="eyebrow">Page music</p><h2>One song for each page</h2></div><p>Upload a different track for every page. MP3 and M4A files are handled automatically.</p></div><div className="menu-admin-grid">{Object.entries(pageNames).map(([route,label])=>{const current=music?.[route]?.audioSrc||'';return <article className="menu-admin-card" key={route}><div className="menu-admin-number">{label}</div>{current?<div className="admin-media-preview admin-media-preview--audio"><audio controls preload="none" src={current}/><span>Current song</span></div>:<div className="menu-art-empty">No song uploaded yet</div>}<label className="admin-upload admin-upload--large"><b>{current?'Replace song':'Upload song'}</b><input type="file" accept="audio/*,.mp3,.m4a,.aac" onChange={event=>upload(route,event.target.files?.[0])}/></label></article>})}</div></section>;
}

function LongFormEditor({longForm, onChange}) {
  const paragraphs=Array.isArray(longForm?.paragraphs)?longForm.paragraphs:[];
  const updateParagraph=(index,value)=>onChange({...longForm,paragraphs:paragraphs.map((paragraph,itemIndex)=>itemIndex===index?value:paragraph)});
  return <section className="admin-card"><div className="admin-card-heading"><div><p className="eyebrow">Our Love · final section</p><h2>Long-form paragraphs</h2></div><p>This section is built for roughly 3,000 words. Add as many paragraphs as you need; they appear after the four PNGs.</p></div><div className="editor-group"><Field label="Section label" value={longForm?.label||''} onChange={label=>onChange({...longForm,label})}/><Field label="Section heading" value={longForm?.heading||''} onChange={heading=>onChange({...longForm,heading})}/></div><div className="longform-admin"><div className="array-head"><b>Paragraphs</b><button type="button" onClick={()=>onChange({...longForm,paragraphs:[...paragraphs,'']})}>+ Add paragraph</button></div>{paragraphs.length===0&&<div className="longform-empty">No paragraphs yet. Add the first one when your writing is ready.</div>}{paragraphs.map((paragraph,index)=><div className="longform-paragraph" key={index}><label><span>Paragraph {index+1}</span><textarea value={paragraph} rows={10} onChange={event=>updateParagraph(index,event.target.value)} placeholder="Write this paragraph here…"/></label><button className="remove" type="button" onClick={()=>onChange({...longForm,paragraphs:paragraphs.filter((_,itemIndex)=>itemIndex!==index)})}>Remove</button></div>)}</div></section>;
}

function MenuEditor({menu, onChange, onUpload}) {
  const sections=(menu.sections||[]).slice(0,4);
  const setSection=(index,next)=>{const copy=clone(sections);copy[index]=next;onChange({...menu,sections:copy})};
  return <><section className="admin-card"><div className="admin-card-heading"><div><p className="eyebrow">Our Love artwork</p><h2>Upload four PNGs</h2></div><p>Each file replaces one artwork slot. The fifth slot has been removed.</p></div><div className="menu-admin-grid">{sections.map((section,index) => <article className="menu-admin-card" key={index}><div className="menu-admin-number">Artwork 0{index+1}</div>{section.image?<div className="menu-art-preview"><img src={section.image} alt={section.imageAlt||`Artwork ${index+1}`}/></div>:<div className="menu-art-empty">No PNG uploaded yet</div>}<label className="admin-upload admin-upload--large"><b>{section.image?'Replace PNG':'Upload PNG'}</b><input type="file" accept="image/png" onChange={async event=>{const file=event.target.files?.[0];if(!file)return;const image=await onUpload(file);setSection(index,{...section,image,useImage:true,imageAlt:section.imageAlt||`Artwork ${index+1}`})}}/></label></article>)}</div></section><LongFormEditor longForm={menu.longForm||{label:'',heading:'',paragraphs:[]}} onChange={longForm=>onChange({...menu,sections,longForm})}/></>;
}

function HomeEditor({home, onChange, onUpload}) {
  const media=home.media||{};
  const setMedia=next=>onChange({...home,media:{...media,...next}});
  const rest={...home,media:undefined};
  return <><section className="admin-card"><div className="admin-card-heading"><div><p className="eyebrow">Home hero</p><h2>Hero video or images</h2></div><p>Upload a video here to make the home hero play video. Leave it blank to use the two image panels.</p></div><div className="admin-grid"><article className="menu-admin-card"><div className="menu-mode"><div className="menu-admin-number">Video hero</div>{media.videoSrc?<div className="admin-media-preview"><video controls muted src={media.videoSrc} poster={media.videoPoster}/><span>Current hero video</span></div>:<div className="menu-art-empty">No hero video uploaded yet</div>}<label className="admin-upload admin-upload--large"><b>{media.videoSrc?'Replace video':'Upload video'}</b><input type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" onChange={async event=>{const file=event.target.files?.[0];if(!file)return;const videoSrc=await onUpload(file);setMedia({videoSrc})}}/></label>{media.videoSrc&&<button className="remove" type="button" onClick={()=>setMedia({videoSrc:''})}>Use images instead</button>}</div></article><article className="menu-admin-card"><div className="menu-mode"><div className="menu-admin-number">Video poster</div>{media.videoPoster?<div className="admin-media-preview"><img src={media.videoPoster} alt="Current video poster"/><span>Current poster</span></div>:<div className="menu-art-empty">No poster uploaded yet</div>}<label className="admin-upload admin-upload--large"><b>{media.videoPoster?'Replace poster':'Upload poster'}</b><input type="file" accept="image/*" onChange={async event=>{const file=event.target.files?.[0];if(!file)return;const videoPoster=await onUpload(file);setMedia({videoPoster})}}/></label></div></article></div><div className="editor-group" style={{marginTop:24}}><ObjectEditor value={{imageOne:media.imageOne||'',imageTwo:media.imageTwo||''}} path="Fallback hero images" onUpload={onUpload} onChange={next=>setMedia(next)}/></div></section><section className="admin-card"><div className="admin-card-heading"><div><p className="eyebrow">Home content</p><h2>Text and panels</h2></div></div><ObjectEditor value={rest} path="Home content" onUpload={onUpload} onChange={next=>onChange({...next,media})}/></section></>;
}

const PAGE_ROUTES={home:'/',story:'/brand-story',events:'/events',catering:'/catering',menu:'/menu',whatNow:'/contact'};

export default function Admin({c,s,setC,setS,loadError=''}) {
  const [session,setSession]=useState(null),[password,setPassword]=useState(''),[newPassword,setNewPassword]=useState(''),[tab,setTab]=useState('pageNames'),[status,setStatus]=useState(''),[saving,setSaving]=useState(false);
  useEffect(()=>{supabase?.auth.getSession().then(({data})=>setSession(data.session));const subscription=supabase?.auth.onAuthStateChange((_event,next)=>setSession(next)).data.subscription;return()=>subscription?.unsubscribe()},[]);
  const labels=useMemo(()=>Object.fromEntries((c?.shared?.navigation||[]).map(item=>[item.href,item.label])),[c]);
  if(!isSupabaseConfigured) return <div className="admin-login"><div><h1>Admin setup needed</h1><p>Supabase environment variables are missing.</p></div></div>;
  if(!session) return <div className="admin-login"><form onSubmit={async event=>{event.preventDefault();setStatus('Signing in…');const {error}=await supabase.auth.signInWithPassword({email:ADMIN_EMAIL,password});setStatus(error?error.message:'Signed in')}}><p className="eyebrow">Saffron & Silk</p><h1>Admin login</h1><input type="email" value={ADMIN_EMAIL} readOnly aria-label="Admin email"/><input type="password" required minLength="6" placeholder="Password" value={password} onChange={event=>setPassword(event.target.value)} autoComplete="current-password"/><button className="button">Sign in</button><p>{status}</p></form></div>;
  if(!c||!s) return <div className="admin-login"><div><h1>Admin connected</h1><p>{loadError||'Loading website content…'}</p><button className="button" onClick={()=>supabase.auth.signOut()}>Log out</button></div></div>;
  const save=async()=>{setSaving(true);setStatus('Saving changes…');try{await saveSiteData(c,s);setStatus('Everything is saved and live.')}catch(error){setStatus(error.message)}finally{setSaving(false)}};
  const tabs=[['pageNames','Page Names'],['music','Music'],['global','Brand & Footer'],['home',labels['/']||'Home'],['story',labels['/brand-story']||'Brand Story'],['events',labels['/events']||'Events'],['catering',labels['/catering']||'Catering'],['menu',labels['/menu']||'Menu'],['whatNow',labels['/contact']||'What Now'],['design','Design & effects']];
  const pageRoute=PAGE_ROUTES[tab];
  const renderEditor=()=>{
    if(tab==='pageNames') return <NavigationEditor navigation={c.shared.navigation} onChange={navigation=>setC({...c,shared:{...c.shared,navigation}})}/>;
    if(tab==='music') return <MusicEditor music={c.music} onUpload={uploadSiteMedia} onChange={music=>setC({...c,music})}/>;
    if(tab==='global') return <section className="admin-card"><div className="admin-card-heading"><div><p className="eyebrow">Shared across the site</p><h2>Brand, opening and footer</h2></div></div><ObjectEditor value={{shared:{...c.shared,navigation:undefined},opening:c.opening}} path="Global content" onUpload={uploadSiteMedia} onChange={next=>setC({...c,...next,shared:{...next.shared,navigation:c.shared.navigation}})}/></section>;
    if(tab==='design') return <section className="admin-card"><div className="admin-card-heading"><div><p className="eyebrow">Appearance</p><h2>Design and effects</h2></div></div><ObjectEditor value={s} path="Design settings" onUpload={uploadSiteMedia} onChange={setS}/><div className="admin-password"><div><h3>Change admin password</h3><p>Use at least six characters.</p></div><input type="password" minLength="6" placeholder="New password" value={newPassword} onChange={event=>setNewPassword(event.target.value)}/><button disabled={newPassword.length<6} onClick={async()=>{const{error}=await supabase.auth.updateUser({password:newPassword});setStatus(error?error.message:'Password updated.');if(!error)setNewPassword('')}}>Update password</button></div></section>;
    if(tab==='home') return <HomeEditor home={c.home} onChange={home=>setC({...c,home})} onUpload={uploadSiteMedia}/>;
    if(tab==='menu') return <MenuEditor menu={c.menu} onChange={menu=>setC({...c,menu})} onUpload={uploadSiteMedia}/>;
    return <section className="admin-card"><div className="admin-card-heading"><div><p className="eyebrow">Page editor</p><h2>{labels[pageRoute]||titleCase(tab)}</h2></div><p>Images show a preview before you replace them. Save when you are finished.</p></div><ObjectEditor value={c[tab]} path={`${labels[pageRoute]||tab} content`} onUpload={uploadSiteMedia} onChange={next=>setC({...c,[tab]:next})}/></section>;
  };
  return <div className="admin-shell"><aside className="admin-sidebar"><div><p className="eyebrow">Saffron & Silk</p><h1>Site editor</h1></div><nav>{tabs.map(([key,label])=><button key={key} className={tab===key?'active':''} onClick={()=>setTab(key)}>{label}</button>)}</nav><button className="admin-logout" onClick={()=>supabase.auth.signOut()}>Log out</button></aside><main className="admin-main"><header className="admin-toolbar"><div><p className="admin-breadcrumb">Editing · {tabs.find(([key])=>key===tab)?.[1]}</p><p className={`status ${status?'has-message':''}`}>{status||'Changes stay private until you save.'}</p></div><div>{pageRoute&&<a className="admin-preview-link" href={pageRoute} target="_blank" rel="noreferrer">Preview page ↗</a>}<button className="admin-save" disabled={saving} onClick={save}>{saving?'Saving…':'Save changes'}</button></div></header><div className="admin-content">{renderEditor()}</div></main></div>;
}
