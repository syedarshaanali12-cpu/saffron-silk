import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { isSupabaseConfigured, loadSiteData, saveSiteData, supabase, uploadSiteMedia } from './lib/supabase';

const splitLines = (text='') => text.split('\n').map((line,i)=><span key={i}>{line}{i < text.split('\n').length-1 && <br/>}</span>);
const clone=v=>JSON.parse(JSON.stringify(v));

function PetalField({settings}){
 const location=useLocation();
 const effects=settings?.effects || {};
 const amount=Math.max(0,Math.min(48,Number(effects.petalAmount ?? 16)));
 const intensity=Math.max(.25,Math.min(2,Number(effects.animationIntensity ?? 1)));
 const show=location.pathname==='/' || effects.showPetalsOnInteriorPages;
 if(!show || amount===0)return null;
 return <div className="petal-field" aria-hidden="true">{Array.from({length:amount},(_,i)=>{
   const left=(i*37+11)%100;
   const delay=-((i*1.73)%12);
   const duration=(9+(i%7)*1.15)/intensity;
   const drift=((i%2?1:-1)*(28+(i*19)%75));
   const scale=.55+((i*13)%50)/100;
   const rotate=(i*47)%360;
   return <span key={i} className="petal" style={{'--left':`${left}%`,'--delay':`${delay}s`,'--duration':`${duration}s`,'--drift':`${drift}px`,'--scale':scale,'--rotate':`${rotate}deg`}}/>;
 })}</div>;
}

function MusicControl({c}){
 const location=useLocation();
 const audioRef=useRef(null);
 const [playing,setPlaying]=useState(false);
 const track=c.music?.[location.pathname] || c.music?.['/'];
 useEffect(()=>{setPlaying(false); if(audioRef.current){audioRef.current.pause();audioRef.current.currentTime=0}},[location.pathname,track?.audioSrc]);
 if(!track?.audioSrc)return <button className="music-control muted" type="button">{c.ui?.playMusicLabel || 'Play music'}</button>;
 return <><audio ref={audioRef} src={track.audioSrc} loop/><button className="music-control" type="button" onClick={async()=>{if(!audioRef.current)return;if(playing){audioRef.current.pause();setPlaying(false)}else{await audioRef.current.play();setPlaying(true)}}}>{playing?(c.ui?.pauseMusicLabel||'Pause music'):(c.ui?.playMusicLabel||'Play music')}</button></>;
}

function Header({c}){
 const nav=[{path:'/',label:'Home'},...c.navigation];
 return <header className="site-header">
   <Link to="/" className="monogram">S/S</Link>
   <MusicControl c={c}/>
   <Link to="/" className="wordmark"><span>S/S</span><b>{c.brand.name}</b></Link>
   <nav className="top-nav">{nav.map(x=><NavLink key={x.path} to={x.path} end={x.path==='/' }>{x.label}</NavLink>)}</nav>
   <Link className="admin-link" to="/admin">Admin</Link>
 </header>
}
function SectionRail({c}){const nav=[{path:'/',label:'Home'},...c.navigation];return <aside className="section-rail">{nav.map((x,i)=><NavLink key={x.path} to={x.path} end={x.path==='/' }><span>{String(i+1).padStart(2,'0')}</span>{x.label}</NavLink>)}</aside>}
function Footer({c}){return <footer className="target-footer"><div className="footer-brand"><span>S/S</span><h2>{c.brand.name}</h2><p>Pan-Asian soul and Italian instinct, served with a distinctly Lucknow rhythm.</p></div><div><h3>Find us</h3><p>{c.contact.address}</p><a href={`mailto:${c.contact.email}`}>{c.contact.email}</a></div><div><h3>Opening hours</h3>{c.contact.hours.map((h,i)=><p key={i}>{h}</p>)}<Link to="/contact">Reservations & enquiries ↗</Link></div><div className="copyright">{c.footer.copyright}</div></footer>}
function Layout({c,s,children}){return <div className="site-frame"><PetalField settings={s}/><Header c={c}/><SectionRail c={c}/><main>{children}</main><Footer c={c}/></div>}
function Intro({eyebrow,title,intro}){return <section className="intro"><p className="eyebrow">{eyebrow}</p><h1>{splitLines(title)}</h1>{intro&&<p className="lead">{intro}</p>}</section>}
function Home({c}){const h=c.home;return <>
 <section className="after-dark-hero" style={{backgroundImage:`linear-gradient(100deg,rgba(11,10,9,.90),rgba(11,10,9,.42)),url(${h.media.imageOne})`}}>
   <div className="hero-copy"><p className="eyebrow">{h.eyebrow}</p><h1>{splitLines(h.title)}</h1><Link className="menu-cta" to="/menu">{h.primaryButton}</Link></div>
   <div className="hero-meta"><div><span>{h.locationLabel || 'Gomti Nagar · Lucknow'}</span><span>{h.hoursLabel || 'Open daily · 12:00—23:30'}</span></div><a href="#welcome">Scroll</a></div>
 </section>
 <section id="welcome" className="east-west"><div><p>{c.ui.welcomeEyebrow || 'Two kitchens. One table.'}</p><h2>{h.welcomeTitle}</h2><p>{h.welcomeText}</p></div>{h.welcomeImage&&<img src={h.welcomeImage} alt={h.welcomeImageAlt}/>}</section>
 </>}
function Story({c}){const s=c.story;return <><Intro {...s}/><img className="wide" src={s.heroImage} alt={s.heroImageAlt}/><section className="cards">{s.sections.map((x,i)=><article key={i}><img src={x.image} alt={x.imageAlt}/><p className="eyebrow">{x.meta||c.ui.defaultDiscover}</p><h2>{x.title}</h2><p>{x.text}</p><p>{x.expandedText}</p></article>)}</section></>}
function Events({c}){const e=c.events;return <><Intro {...e}/><section className="cards">{e.cards.map((x,i)=><article key={i}><img src={x.image} alt={x.imageAlt||x.title}/><p className="eyebrow">{x.meta}</p><h2>{x.title}</h2><p>{x.text}</p><p>{x.expandedText||x.details}</p></article>)}</section></>}
function Catering({c}){const x=c.catering;return <><Intro {...x}/><img className="wide" src={x.heroImage} alt={x.heroImageAlt}/><section className="cards">{x.services.map((s,i)=><article key={i}><p className="eyebrow">{s.meta}</p><h2>{s.title}</h2><p>{s.text}</p><p>{s.expandedText||s.details}</p></article>)}</section></>}
function Menu({c}){const m=c.menu;return <><Intro {...m}/><section className="menu-groups">{m.groups.map((g,i)=><div className="menu-group" key={i}><h2>{g.title}</h2>{g.items.map((x,j)=><div className="menu-item" key={j}><div><b>{x.name}</b><p>{x.description}</p></div><strong>{x.price}</strong></div>)}</div>)}</section></>}
function Contact({c}){const x=c.contact;const[done,setDone]=useState(false);return <><Intro {...x}/><section className="contact"><div><h2>{c.ui.visitLabel}</h2><p>{x.address}</p><a href={`tel:${x.phone}`}>{x.phone}</a><a href={`mailto:${x.email}`}>{x.email}</a>{x.hours.map((h,i)=><p key={i}>{h}</p>)}</div><form onSubmit={e=>{e.preventDefault();setDone(true)}}><h2>{x.formTitle}</h2><input required placeholder={c.ui.nameLabel}/><input required type="email" placeholder={c.ui.emailLabel}/><textarea required placeholder={c.ui.messageLabel}/><button className="button">{c.ui.submitEnquiry}</button>{done&&<p>{x.successMessage}</p>}</form></section></>}

function Field({label,value,onChange,onUpload}){
 if(typeof value==='boolean')return <label className="field checkbox"><input type="checkbox" checked={value} onChange={e=>onChange(e.target.checked)}/>{label}</label>;
 if(typeof value==='number')return <label className="field"><span>{label}</span><input type="number" value={value} onChange={e=>onChange(Number(e.target.value))}/></label>;
 const media=typeof value==='string' && /image|audio|video|poster|src/i.test(label);
 return <label className="field"><span>{label}</span>{String(value??'').length>90?<textarea value={value??''} onChange={e=>onChange(e.target.value)}/>:<input value={value??''} onChange={e=>onChange(e.target.value)}/>} {media&&<><input type="file" onChange={async e=>{const f=e.target.files?.[0];if(f){const u=await onUpload(f);onChange(u)}}}/>{value&&/^https?:|^\//.test(value)&&<small>{value}</small>}</>}</label>
}
function ObjectEditor({value,onChange,path='root',onUpload}){
 if(Array.isArray(value))return <div className="array"><div className="array-head"><b>{path}</b><button type="button" onClick={()=>onChange([...value, typeof value[0]==='object'?{}:''])}>+ Add</button></div>{value.map((v,i)=><div className="array-item" key={i}><button className="remove" type="button" onClick={()=>onChange(value.filter((_,j)=>j!==i))}>Remove</button><ObjectEditor value={v} path={`${path} ${i+1}`} onUpload={onUpload} onChange={nv=>{const n=clone(value);n[i]=nv;onChange(n)}}/></div>)}</div>;
 if(value&&typeof value==='object')return <fieldset><legend>{path}</legend>{Object.entries(value).map(([k,v])=><ObjectEditor key={k} value={v} path={k} onUpload={onUpload} onChange={nv=>onChange({...value,[k]:nv})}/>)}</fieldset>;
 return <Field label={path} value={value} onUpload={onUpload} onChange={onChange}/>;
}
function Admin({c,s,setC,setS}){
 const[session,setSession]=useState(null),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[tab,setTab]=useState('content'),[status,setStatus]=useState('');
 useEffect(()=>{supabase?.auth.getSession().then(({data})=>setSession(data.session));const sub=supabase?.auth.onAuthStateChange((_e,x)=>setSession(x)).data.subscription;return()=>sub?.unsubscribe()},[]);
 if(!isSupabaseConfigured)return <div className="admin-login"><h1>Admin setup needed</h1><p>Supabase environment variables are missing.</p></div>;
 if(!session)return <div className="admin-login"><form onSubmit={async e=>{e.preventDefault();setStatus('Signing in…');const{error}=await supabase.auth.signInWithPassword({email,password});setStatus(error?error.message:'Signed in')}}><p className="eyebrow">Saffron & Silk</p><h1>Admin login</h1><input type="email" required placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/><input type="password" required placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/><button className="button">Sign in</button><p>{status}</p></form></div>;
 const active=tab==='content'?c:s;const setActive=tab==='content'?setC:setS;
 return <div className="admin"><div className="admin-top"><div><p className="eyebrow">Saffron & Silk</p><h1>Site editor</h1></div><div><button onClick={()=>setTab('content')} className={tab==='content'?'active':''}>Content</button><button onClick={()=>setTab('settings')} className={tab==='settings'?'active':''}>Design</button><button onClick={async()=>{setStatus('Saving…');try{await saveSiteData(c,s);setStatus('Saved')}catch(e){setStatus(e.message)}}}>Save changes</button><button onClick={()=>supabase.auth.signOut()}>Log out</button></div></div><p className="status">{status}</p><ObjectEditor value={active} path={tab==='content'?'Website content':'Design settings'} onUpload={uploadSiteMedia} onChange={setActive}/></div>
}
function App(){const[c,setC]=useState(null),[s,setS]=useState(null),[error,setError]=useState('');useEffect(()=>{loadSiteData().then(d=>{setC(d.content);setS(d.settings)}).catch(e=>setError(e.message))},[]);if(error)return <div className="loading"><h1>Saffron & Silk</h1><p>{error}</p></div>;if(!c||!s)return <div className="loading">Loading Saffron & Silk…</div>;return <Routes><Route path="/admin" element={<Admin c={c} s={s} setC={setC} setS={setS}/>}/><Route path="*" element={<Layout c={c} s={s}><Routes><Route path="/" element={<Home c={c}/>}/><Route path="/brand-story" element={<Story c={c}/>}/><Route path="/events" element={<Events c={c}/>}/><Route path="/catering" element={<Catering c={c}/>}/><Route path="/menu" element={<Menu c={c}/>}/><Route path="/contact" element={<Contact c={c}/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></Layout>}/></Routes>}
export default App;
