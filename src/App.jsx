import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { loadSiteData } from './lib/supabase';
import { SiteExperience } from './site/Chrome';
import Home from './site/Home';
import { Story, Events, Catering, Menu, Contact } from './site/Pages';
import Admin from './site/Admin';

const replaceBrandText=value=>{
  if(typeof value==='string') return value.replace(/S\/S/g,'I/A').replace(/s\/s/g,'I/A').replace(/Saffron\s*&\s*Silk/gi,'The Proposal').replace(/Saffron and Silk/gi,'The Proposal');
  if(Array.isArray(value)) return value.map(replaceBrandText);
  if(value&&typeof value==='object') return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,replaceBrandText(item)]));
  return value;
};

const applyRequestedCopy=content=>{
  const next=replaceBrandText(content);
  next.shared={...(next.shared||{}),brandName:'The Proposal',monogram:'I/A',siteTitle:'The Pilgrimage'};
  next.shared.navigation=(next.shared.navigation||[]).map(item=>({
    ...item,
    label:item.href==='/brand-story'?'Our Story':item.href==='/events'?'Her Beauty':item.href==='/menu'?'Our Love':item.href==='/catering'?'Arsh':item.label
  }));
  next.home={...(next.home||{}),eyebrow:'The Dame The Brute',headline:'ACTIONS ONLY',headlineAccent:'they speak.',storyPanel:{...(next.home?.storyPanel||{}),kicker:'two hearts unified',heading:'our versions of love,',headingSecondLine:'without compromise',note:'An original form of love that combines our ecstasy with passion. Pilgrimage, where we come together as one this time.'}};
  next.story={...(next.story||{}),heading:'OBSESSION',headingAccent:'ethereal romance.',intro:[
    'We began with one simple belief, in each other. We were learning about each other, and we found familiarity. Then that familiarity turned into a friendship, a bond as strong as the stars gazed from above and smiled.',
    'From manager and intern, to mentor and prodigy, to friends, to one. The long due scooty ride, the coffee with black salt, it was soaking our hearts with ointment.'
  ],leadPhoto:{...(next.story?.leadPhoto||{}),title:'A place where we found belonging',text:'The exterior seemed warm and welcoming, but the place had everyone for purpose. Do not serve yours and it is not home anymore. We became home for each other in that place; we were in a room of ours in a room full of strangers.'},philosophy:{...(next.story?.philosophy||{}),heading:'Romance is a religion, not an extension.',paragraphs:[
    'The most beautiful part about us was never that we had common grounds. It was always about how we were so different yet found a way to love each other a little more each passing day. We built ourselves from the ground up.',
    'The OG Batman and Superman.'
  ]}};
  if(next.story.photos?.[0]) next.story.photos[0]={...next.story.photos[0],label:'The office',title:'No restraints',text:'We met, we went 2+2=4, we confessed and confided in the span of 18 days, made a rhythm, built inside jokes and all of it. We knew the intensity.'};
  if(next.story.photos?.[1]) next.story.photos[1]={...next.story.photos[1],label:'Ramadan and long distance',title:'Tested our longevity',text:'This was the toughest phase, and the phase where our relationship matured.'};
  next.catering={...(next.catering||{}),headingAccent:'Arsh.'};
  const menuLongForm=next.menu?.longForm||{};
  next.menu={
    ...(next.menu||{}),
    sections:(next.menu?.sections||[]).slice(0,4),
    longForm:{
      label:'The unabridged chapter',
      heading:'OUR LOVE, IN FULL.',
      ...menuLongForm,
      paragraphs:Array.isArray(menuLongForm.paragraphs)?menuLongForm.paragraphs:[]
    }
  };
  const whatNow=next.whatNow||{};
  const whatNowForm=whatNow.form||{};
  const photoDefaults=[
    {src:'',alt:'',caption:''},
    {src:'',alt:'',caption:''},
    {src:'',alt:'',caption:''}
  ];
  const savedPhotos=Array.isArray(whatNow.photos)?whatNow.photos:[];
  next.whatNow={
    index:'06 · What now',
    label:'The final chapter is not mine alone',
    heading:'YOUR TURN, ILMA.',
    intro:[
      'I have told our story the way I see it.',
      'I have told you how I see you.',
      'I have told you who I am trying to become.',
      'I have told you what this love means to me.'
    ],
    transition:"I don't get to write what comes next alone.",
    photos:photoDefaults,
    form:{
      index:'Her chapter',
      heading:'Where do we go from here?',
      intro:'There are three things I want to ask you. Take all the space you need.',
      prompts:[
        'What does our pilgrimage mean to you?',
        'What do you want from the man walking beside you?',
        'Where do we go from here?'
      ],
      nextButton:'Continue ↗',
      backButton:'Back',
      button:'Add your chapter.',
      success:'The Pilgrimage continues.',
      error:'Your chapter could not be saved. Please try again.'
    },
    ...whatNow,
    photos:photoDefaults.map((fallback,index)=>({...fallback,...(savedPhotos[index]||{})})),
    form:{
      index:'Her chapter',
      heading:'Where do we go from here?',
      intro:'There are three things I want to ask you. Take all the space you need.',
      prompts:[
        'What does our pilgrimage mean to you?',
        'What do you want from the man walking beside you?',
        'Where do we go from here?'
      ],
      nextButton:'Continue ↗',
      backButton:'Back',
      button:'Add your chapter.',
      success:'The Pilgrimage continues.',
      error:'Your chapter could not be saved. Please try again.',
      ...whatNowForm,
      prompts:Array.isArray(whatNowForm.prompts)&&whatNowForm.prompts.length===3?whatNowForm.prompts:[
        'What does our pilgrimage mean to you?',
        'What do you want from the man walking beside you?',
        'Where do we go from here?'
      ]
    }
  };
  return next;
};

const Loading=({error})=><div className="loading"><h1>The Proposal</h1><p>{error||'Loading The Proposal…'}</p></div>;

export default function App(){
  const[c,setC]=useState(null),[s,setS]=useState(null),[error,setError]=useState('');
  const location=useLocation();
  useEffect(()=>{loadSiteData().then(d=>{setC(applyRequestedCopy(d.content));setS(d.settings)}).catch(e=>setError(e.message))},[]);
  const ready=Boolean(c&&s);
  const isAdmin=location.pathname==='/admin';
  return <>
    {ready&&!isAdmin&&<SiteExperience content={c} settings={s}/>} 
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
