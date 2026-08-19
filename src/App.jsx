import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { loadSiteData } from './lib/supabase';
import { SiteExperience } from './site/Chrome';
import Home from './site/Home';
import { Story, Events, Catering, Menu, Contact } from './site/Pages';
import Admin from './site/Admin';

const Loading=({error})=><div className="loading"><h1>Saffron & Silk</h1><p>{error||'Loading Saffron & Silk…'}</p></div>;

export default function App(){
  const[c,setC]=useState(null),[s,setS]=useState(null),[error,setError]=useState('');
  useEffect(()=>{loadSiteData().then(d=>{setC(d.content);setS(d.settings)}).catch(e=>setError(e.message))},[]);
  const ready=Boolean(c&&s);
  return <>
    {ready&&<SiteExperience content={c} settings={s}/>} 
    <Routes>
      <Route path="/admin" element={<Admin c={c} s={s} setC={setC} setS={setS} loadError={error}/>}/>
      <Route path="/" element={ready?<Home content={c} settings={s}/>:<Loading error={error}/>}/>
      <Route path="/brand-story" element={ready?<Story content={c} settings={s}/>:<Loading error={error}/>}/>
      <Route path="/events" element={ready?<Events content={c} settings={s}/>:<Loading error={error}/>}/>
      <Route path="/catering" element={ready?<Catering content={c} settings={s}/>:<Loading error={error}/>}/>
      <Route path="/menu" element={ready?<Menu content={c} settings={s}/>:<Loading error={error}/>}/>
      <Route path="/contact" element={ready?<Contact content={c} settings={s}/>:<Loading error={error}/>}/>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
  </>
}
