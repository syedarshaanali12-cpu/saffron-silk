import React,{useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Search,Phone,Users,CheckCircle2,Clock3,ChevronRight,Filter,LayoutDashboard,LogOut,RefreshCw,MoreHorizontal} from 'lucide-react';
import './styles.css';

const enrolled=[
 {phone:'9876543210',name:'Aarav Sharma',course:'CUET'},
 {phone:'9123456780',name:'Mehak Singh',course:'Class 12'},
 {phone:'9988776655',name:'Zoya Khan',course:'Commerce'}
];
const seed=[
 {id:1,name:'Rohan Verma',phone:'9811111111',course:'CUET',source:'Lead App',status:'Fresh',owner:'Unassigned',last:'Never'},
 {id:2,name:'Ananya Gupta',phone:'9822222222',course:'Class 12',source:'Instagram',status:'Interested',owner:'Arshaan',last:'Today 11:42'},
 {id:3,name:'Kabir Ali',phone:'9833333333',course:'Commerce',source:'Lead App',status:'Follow-up',owner:'Priya',last:'Yesterday 17:10'},
 {id:4,name:'Aarav Sharma',phone:'9876543210',course:'CUET',source:'Lead App',status:'Enrolled',owner:'—',last:'Today 09:20'},
 {id:5,name:'Sara Khan',phone:'9844444444',course:'CUET',source:'Lead App',status:'Fresh',owner:'Unassigned',last:'Never'},
 {id:6,name:'Dev Malhotra',phone:'9855555555',course:'Class 12',source:'Website',status:'No Answer',owner:'Arshaan',last:'Today 12:06'}
];
function normalize(p){return p.replace(/\D/g,'').slice(-10)}
function App(){
 const [leads,setLeads]=useState(seed); const [q,setQ]=useState(''); const [filter,setFilter]=useState('All'); const [selected,setSelected]=useState(null); const [dialing,setDialing]=useState(false); const [toast,setToast]=useState('');
 const fresh=useMemo(()=>leads.filter(x=>x.status==='Fresh'&& !enrolled.some(e=>normalize(e.phone)===normalize(x.phone))),[leads]);
 const visible=leads.filter(x=>(filter==='All'||x.status===filter)&&Object.values(x).join(' ').toLowerCase().includes(q.toLowerCase()));
 const stats={fresh:fresh.length,active:leads.filter(x=>['Fresh','Interested','Follow-up'].includes(x.status)).length,connected:leads.filter(x=>['Interested','Follow-up','Won'].includes(x.status)).length,won:leads.filter(x=>x.status==='Won').length};
 function notify(s){setToast(s);setTimeout(()=>setToast(''),2200)}
 function startDial(){const next=fresh[0]||leads.find(x=>x.status==='Fresh');if(!next){notify('No fresh leads in the queue');return}setSelected(next);setDialing(true);notify(`Calling ${next.name}`)}
 function outcome(status){if(!selected)return;setLeads(ls=>ls.map(x=>x.id===selected.id?{...x,status,last:'Just now',owner:x.owner==='Unassigned'?'You':x.owner}:x));setDialing(false);notify(`Logged: ${status}`);}
 return <div className="app">
  <aside><div className="brand"><div className="mark">S</div><div><b>SalesOS</b><span>Lead command center</span></div></div>
   <nav><button className="active"><LayoutDashboard size={18}/>Overview</button><button><Users size={18}/>Leads <em>{fresh.length}</em></button><button><Clock3 size={18}/>Follow-ups</button><button><CheckCircle2 size={18}/>Conversions</button></nav>
   <div className="profile"><div className="avatar">SA</div><div><b>Syed Arshaan</b><span>Administrator</span></div><LogOut size={16}/></div>
  </aside>
  <main><header><div><p className="eyebrow">SALES OPERATIONS</p><h1>Good afternoon, Arshaan.</h1><p className="muted">Your team has <strong>{fresh.length} fresh leads</strong> ready to work.</p></div><div className="header-actions"><button className="ghost" onClick={()=>notify('Lead sources refreshed') }><RefreshCw size={17}/> Sync leads</button><button className="primary" onClick={startDial}><Phone size={17}/> Start power dialer</button></div></header>
   <section className="stats"><Card icon={<Users/>} label="Fresh leads" value={stats.fresh} note="eligible after enrollment check"/><Card icon={<Phone/>} label="Active pipeline" value={stats.active} note="fresh + interested + follow-up"/><Card icon={<CheckCircle2/>} label="Connected" value={stats.connected} note="this current dataset"/><Card icon={<CheckCircle2/>} label="Won" value={stats.won} note="converted leads"/></section>
   <section className="panel"><div className="panel-head"><div><h2>Sales queue</h2><p>Only leads that need action should reach your salespeople.</p></div><button className="iconbtn"><MoreHorizontal/></button></div>
    <div className="toolbar"><div className="search"><Search size={18}/><input placeholder="Search name, phone, course..." value={q} onChange={e=>setQ(e.target.value)}/></div><div className="filters"><Filter size={16}/>{['All','Fresh','Interested','Follow-up','No Answer','Enrolled'].map(x=><button key={x} className={filter===x?'selected':''} onClick={()=>setFilter(x)}>{x}</button>)}</div></div>
    <div className="table"><div className="tr th"><span>Lead</span><span>Course</span><span>Source</span><span>Status</span><span>Owner</span><span>Last activity</span><span></span></div>{visible.map(l=><div className="tr" key={l.id} onClick={()=>setSelected(l)}><span className="lead"><div className="avatar small">{l.name.split(' ').map(x=>x[0]).join('').slice(0,2)}</div><div><b>{l.name}</b><small>{l.phone}</small></div></span><span>{l.course}</span><span className="muted">{l.source}</span><span><Badge status={l.status}/></span><span>{l.owner}</span><span className="muted">{l.last}</span><ChevronRight size={17}/></div>)}</div>
   </section>
  </main>
  {selected&&<div className="drawer"><div className="drawer-top"><div><p className="eyebrow">LEAD PROFILE</p><h2>{selected.name}</h2><p className="muted">{selected.phone}</p></div><button className="iconbtn" onClick={()=>{setSelected(null);setDialing(false)}}>×</button></div><div className="detail"><Badge status={selected.status}/><div className="detail-grid"><div><label>Course</label><b>{selected.course}</b></div><div><label>Source</label><b>{selected.source}</b></div><div><label>Owner</label><b>{selected.owner}</b></div><div><label>Last activity</label><b>{selected.last}</b></div></div></div><div className="callbox"><Phone size={22}/><div><b>{dialing?'Calling…':'Ready to call'}</b><span>{dialing?'Telephony event stream active':'Use the power dialer to log the call automatically.'}</span></div></div>{dialing?<div className="outcomes"><p>Call result</p><button onClick={()=>outcome('Connected')}>Connected</button><button onClick={()=>outcome('No Answer')}>No answer</button><button onClick={()=>outcome('Busy')}>Busy</button></div>:<button className="primary wide" onClick={()=>{setDialing(true);notify(`Calling ${selected.name}`)}}><Phone size={17}/> Call lead</button>}<div className="note"><b>Automation note</b><p>In production, the dialer webhook will write call status, duration and timestamps here automatically. Connected calls can then require a manual disposition.</p></div></div>}
  {toast&&<div className="toast">{toast}</div>}
 </div>
}
function Card({icon,label,value,note}){return <div className="card"><div className="card-icon">{icon}</div><span>{label}</span><strong>{value}</strong><small>{note}</small></div>}
function Badge({status}){return <span className={'badge '+status.toLowerCase().replaceAll(' ','-')}>{status}</span>}
createRoot(document.getElementById('root')).render(<App/>);
