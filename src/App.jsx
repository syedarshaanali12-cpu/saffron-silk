import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { loadSiteData } from './lib/supabase';
import { SiteExperience } from './site/Chrome';
import Home from './site/Home';
import { Story, Events, Catering, Menu, Contact } from './site/Pages';
import Admin from './site/Admin';

export default function App(){const[c,setC]=useState(null),[s,setS]=useState(null),[error,setError]=useState('');useEffect(()=>{loadSiteData().then(d=>{setC(d.content);setS(d.settings)}).catch(e=>setError(e.message))},[]);if(error)return <div className="loading"><h1>Saffron & Silk</h1><p>{error}</p></div>;if(!c||!s)return <div className="loading">Loading Saffron & Silk…</div>;return <><SiteExperience content={c} settings={s}/><Routes><Route path="/" element={<Home content={c}/>}/><Route path="/brand-story" element={<Story content={c} settings={s}/>}/><Route path="/events" element={<Events content={c} settings={s}/>}/><Route path="/catering" element={<Catering content={c} settings={s}/>}/><Route path="/menu" element={<Menu content={c} settings={s}/>}/><Route path="/contact" element={<Contact content={c} settings={s}/>}/><Route path="/admin" element={<Admin c={c} s={s} setC={setC} setS={setS}/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></>}
