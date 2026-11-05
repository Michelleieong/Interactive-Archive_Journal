import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Check, ChevronDown, Copy, Download, Edit3, Eye, Grid3X3, ImagePlus, Layers, LayoutGrid, Menu, Move, Plus, RotateCcw, Save, Search, SlidersHorizontal, Trash2, Type, Upload, X } from 'lucide-react';
import { backgrounds, colorPalettes, fontCss, fonts, newJournal, starterJournals, mergeOriginalPhotos } from './data';
import { imageFromFile, loadJournals, saveJournals } from './storage';

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const defaultImage = 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=2000&q=85';
const downloadJSON = (journals) => {
  const blob = new Blob([JSON.stringify(journals, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'my-journal-backup.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 300);
};

function ColorPicker({value, onChange, includeBackgrounds=false}) {
  return <div className="palette-picker">
    {Object.entries(colorPalettes).map(([name, colors]) => <div key={name} className="palette-row"><span className="palette-name">{name}</span><div className="swatches">{colors.map(color => <button key={color} title={color} aria-label={`Choose ${color}`} className={`swatch ${value === color ? 'active' : ''}`} style={{backgroundColor:color}} onClick={()=>onChange(color)} />)}</div></div>)}
    {includeBackgrounds && <div className="palette-row"><span className="palette-name">Paper</span><div className="swatches">{backgrounds.map(color => <button key={color} title={color} aria-label={`Choose ${color}`} className={`swatch ${value === color ? 'active' : ''}`} style={{backgroundColor:color}} onClick={()=>onChange(color)} />)}</div></div>}
    <label className="custom-color">Custom color <input type="color" value={/^#[\da-f]{6}$/i.test(value)?value:'#ffffff'} onChange={e=>onChange(e.target.value)} /></label>
  </div>;
}

function ImageBorder({item}) {
  return <div className={`image-frame frame-${item.frame || 'none'}`}><img src={item.src} alt={item.caption || 'Journal photo'} draggable="false" />{item.frame === 'polaroid' && <span>{item.caption || 'a little memory'}</span>}</div>;
}

function FreeformCanvas({journal, edit, selected, setSelected, updateItem}) {
  const stage = useRef(null);
  const gesture = useRef(null);
  const pixels = journal.freeformUnits === 'px';
  const bottom = Math.max(460, ...journal.items.map(it =>
    pixels ? (Number(it.y || 0) + Number(it.h || 190) + 80) : 460
  ));
  const begin = (e, item, mode='move') => {
    if (!edit) return;
    e.preventDefault();
    e.stopPropagation();
    setSelected(item.id);
    const rect = stage.current.getBoundingClientRect();
    gesture.current = {
      id:item.id, mode, pointer:e.pointerId, startX:e.clientX, startY:e.clientY,
      x:Number(item.x||0), y:Number(item.y||0), w:Number(item.w||30),
      h:Number(item.h||180), stageW:rect.width, stageH:rect.height
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e) => {
    const g=gesture.current;
    if (!g || g.pointer!==e.pointerId) return;
    e.preventDefault();
    const dx=(e.clientX-g.startX)/g.stageW*100;
    const dy=pixels ? e.clientY-g.startY : (e.clientY-g.startY)/g.stageH*100;
    if (g.mode==='resize') {
      const dw=dx, dh=dy;
      updateItem(g.id, {w:clamp(g.w+dw,8,95-g.x),
        ...(pixels ? {h:Math.max(65,g.h+dh)} : {h:clamp(g.h+dh,6,95-g.y)})});
    } else {
      updateItem(g.id,{x:clamp(g.x+dx,0,Math.max(0,100-g.w)),
        y:pixels ? Math.max(0,g.y+dy) : clamp(g.y+dy,0,Math.max(0,100-g.h))});
    }
  };
  return <div className={`collage-stage ${edit ? 'editing' : ''}`} ref={stage}
      style={pixels ? {height:`${bottom}px`,minHeight:0,aspectRatio:'auto'} : undefined}
      onClick={()=>edit&&setSelected(null)}>
    {journal.items.map(item => <div key={item.id}
      className={`collage-item ${edit && selected===item.id?'selected':''} ${item.type==='note'?'collage-note':''}`}
      onClick={e=>{e.stopPropagation();if(edit)setSelected(item.id);}}
      onPointerDown={e=>begin(e,item)} onPointerMove={move}
      onPointerUp={e=>{if(gesture.current?.pointer===e.pointerId)gesture.current=null;}}
      onPointerCancel={()=>gesture.current=null}
      style={{left:`${item.x}%`,top:pixels?`${item.y}px`:`${item.y}%`,
        width:`${item.w}%`,
        height:item.type==='image'?(pixels?`${item.h}px`:`${item.h}%`):'auto',
        transform:`rotate(${item.rotation||0}deg)`,zIndex:item.z||1}}>
      {item.type==='image'? <ImageBorder item={item}/> :
        <div className="annotation-text" style={{fontFamily:fontCss(item.font),color:item.color,fontSize:`${item.size}px`}}>{item.text}</div>}
      {edit&&selected===item.id&&<button type="button" className="resize-handle" aria-label="Drag to resize element"
        title="Drag this corner to resize" onPointerDown={e=>begin(e,item,'resize')}
        />}
    </div>)}
    {!journal.items.length && <div className="empty-collage">Your blank page is waiting.<small>Add photos or a handwritten note to start.</small></div>}
  </div>;
}

function Sidebar({journal,edit,selectedItem,update,updateTheme,updateItem,addImage,addNote,deleteItem,moveLayer,onHeroUpload,saveStatus}) {
  const photoInput = useRef(null);
  const heroInput = useRef(null);
  return <aside className="sidebar">
    <div className="sidebar-heading"><span>THE EDITOR</span><span className="status">{saveStatus}</span></div>
    <div className="editor-scroll">
      <section className="editor-group"><div className="editor-group-title">01 / Cover</div>
        <label>City or country title<input value={journal.title} onChange={e=>update({title:e.target.value})} placeholder="Paris" maxLength={32}/></label>
        <label>Location / country<input value={journal.location} onChange={e=>update({location:e.target.value})}/></label>
        <label>Date<input type="date" value={journal.date} onChange={e=>update({date:e.target.value})}/></label>
        <button className="outline-action" onClick={()=>heroInput.current?.click()}><ImagePlus size={16}/> Replace hero landscape</button>
        <input ref={heroInput} type="file" accept="image/*" hidden onChange={e=>{onHeroUpload(e.target.files?.[0]);e.target.value='';}} />
        <label>Title font<select value={journal.theme.font} onChange={e=>updateTheme({font:e.target.value})}>{fonts.map(font=><option value={font.id} key={font.id}>{font.name}</option>)}</select></label>
        <label>Font weight<select value={journal.theme.weight} onChange={e=>updateTheme({weight:Number(e.target.value)})}><option value={300}>Light</option><option value={400}>Regular</option><option value={500}>Medium</option><option value={700}>Bold</option></select></label>
        <label>Title size <span className="range-value">{journal.theme.size}px</span><input type="range" min="38" max="150" value={journal.theme.size} onChange={e=>updateTheme({size:Number(e.target.value)})}/></label>
        <label>Photo darkening <span className="range-value">{journal.theme.overlay}%</span><input type="range" min="0" max="75" value={journal.theme.overlay} onChange={e=>updateTheme({overlay:Number(e.target.value)})}/></label>
        <div className="editor-label">Title color</div><ColorPicker value={journal.theme.color} onChange={color=>updateTheme({color})}/>
        <div className="editor-label">Page background</div><ColorPicker value={journal.theme.bg} onChange={bg=>updateTheme({bg})} includeBackgrounds/>
      </section>
      <section className="editor-group"><div className="editor-group-title">02 / Collage</div>
        <p className="hint">Edit directly on the page: drag any photo or handwritten note to move it. Drag the small handle at its lower-right corner to resize. No layout mode to switch.</p>
        <div className="action-pair"><button className="outline-action" onClick={()=>photoInput.current?.click()}><ImagePlus size={16}/> Add photos</button><button className="outline-action" onClick={addNote}><Type size={16}/> Add note</button></div>
        <input ref={photoInput} type="file" accept="image/*" multiple hidden onChange={e=>{addImage([...e.target.files]);e.target.value='';}} />
      </section>
      {selectedItem && <section className="editor-group selected-group"><div className="editor-group-title">03 / Selected {selectedItem.type==='image'?'photo':'note'}</div>
        {selectedItem.type === 'note'? <>
          <label>Handwritten note<textarea rows={3} value={selectedItem.text} onChange={e=>updateItem(selectedItem.id,{text:e.target.value})} /></label>
          <label>Handwriting style<select value={selectedItem.font} onChange={e=>updateItem(selectedItem.id,{font:e.target.value})}>{fonts.map(font=><option value={font.id} key={font.id}>{font.name}</option>)}</select></label>
          <label>Text size <span className="range-value">{selectedItem.size}px</span><input type="range" min="14" max="60" value={selectedItem.size} onChange={e=>updateItem(selectedItem.id,{size:Number(e.target.value)})}/></label>
          <div className="editor-label">Ink color</div><ColorPicker value={selectedItem.color} onChange={color=>updateItem(selectedItem.id,{color})}/>
        </> : <>
          <label>Photo caption<input value={selectedItem.caption||''} onChange={e=>updateItem(selectedItem.id,{caption:e.target.value})} placeholder="a little moment"/></label>
          <label>Photo frame<select value={selectedItem.frame||'none'} onChange={e=>updateItem(selectedItem.id,{frame:e.target.value})}><option value="none">No border</option><option value="thin">Thin border</option><option value="paper">Paper edge</option><option value="polaroid">Polaroid</option></select></label>
          {<>
            <label>Width <span className="range-value">{selectedItem.w}%</span><input type="range" min="12" max="90" value={selectedItem.w} onChange={e=>updateItem(selectedItem.id,{w:Number(e.target.value)})}/></label>
            <label>Height <span className="range-value">{Math.round(selectedItem.h)}px</span><input type="range" min="70" max="650" value={selectedItem.h} onChange={e=>updateItem(selectedItem.id,{h:Number(e.target.value)})}/></label>
          </>}
        </>}
        <label>Rotation <span className="range-value">{selectedItem.rotation||0}°</span><input type="range" min="-25" max="25" value={selectedItem.rotation||0} onChange={e=>updateItem(selectedItem.id,{rotation:Number(e.target.value)})}/></label>
        {<div className="action-pair"><button className="outline-action" onClick={()=>moveLayer(selectedItem.id,1)}><ArrowUp size={15}/> Bring front</button><button className="outline-action" onClick={()=>moveLayer(selectedItem.id,-1)}><ArrowDown size={15}/> Send back</button></div>}
        <button className="delete-action" onClick={()=>deleteItem(selectedItem.id)}><Trash2 size={15}/> Delete element</button>
      </section>}
      <section className="editor-group"><div className="editor-group-title">04 / Journal note</div>
        <label>Short introduction<textarea rows={3} value={journal.description} onChange={e=>update({description:e.target.value})}/></label>
        <p className="hint">Your changes save to this browser automatically. Export a backup so you don't lose your journal.</p>
      </section>
    </div>
  </aside>;
}

function Archive({journals,onOpen,onCreate,onImport,onExport}) {
  const [query,setQuery]=useState('');
  const [sort,setSort]=useState('newest');
  const [category,setCategory]=useState('All places');
  const places=['All places',...new Set(journals.map(j=>j.location).filter(Boolean))];
  const filtered=journals.filter(j => (category==='All places'||j.location===category) && `${j.title} ${j.location} ${j.description}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a,b)=>sort==='newest'?b.date.localeCompare(a.date):sort==='oldest'?a.date.localeCompare(b.date):a.title.localeCompare(b.title));
  const featured=filtered[0];
  return <main className="archive editorial-home">
    <header className="homepage-head">
      <div className="home-introline"><span>a collection of places & little things</span><span>photographs · stories · fragments</span></div>
    </header>
    {featured && <button className="feature-journal" onClick={()=>onOpen(featured.id)} aria-label={`Open ${featured.title} journal`}>
      <img src={featured.hero} alt={`${featured.title} travel photography`} />
      <div className="feature-shade"/>
      <span className="feature-top">01 / SELECTED MEMORY</span>
      <span className="feature-name">{featured.title}</span>
      <span className="feature-bottom">OPEN JOURNAL <ArrowRight size={18}/></span>
    </button>}
    <div className="archive-curation-bar"><div className="archive-curation-left"><span>THE COLLECTION</span><span className="archive-total">{filtered.length} ENTRIES</span></div><button className="text-new" onClick={onCreate}><Plus size={15}/> NEW JOURNAL</button></div>
    <div className="archive-quiet-tools"><div className="search"><Search size={15}/><input aria-label="Search journals" placeholder="Search the archive" value={query} onChange={e=>setQuery(e.target.value)}/></div><select aria-label="Filter by place" value={category} onChange={e=>setCategory(e.target.value)}>{places.map(x=><option key={x}>{x}</option>)}</select><select aria-label="Sort journals" value={sort} onChange={e=>setSort(e.target.value)}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="name">A–Z</option></select></div>
    <div className="editorial-index">{filtered.map((j,i)=><button className={`editorial-entry editorial-entry-${i%3}`} key={j.id} onClick={()=>onOpen(j.id)}><div className="entry-picture"><img src={j.hero} alt={`${j.title} travel photograph`} /></div><div className="entry-heading"><span className="entry-place">{String(i+1).padStart(2,'0')} &nbsp; / &nbsp; {j.location}</span><span className="entry-city">{j.title}</span><ArrowRight size={18}/></div></button>)}</div>
    {!filtered.length && <div className="no-results">Nothing found in this part of the archive.</div>}
    <footer className="editorial-footer"><span>MY JOURNAL © {new Date().getFullYear()}</span><div><button onClick={onExport}>EXPORT BACKUP</button><label>IMPORT BACKUP <input type="file" accept="application/json" hidden onChange={e=>{onImport(e.target.files?.[0]);e.target.value='';}}/></label></div><span>MORE TO COME ↗</span></footer>
  </main>;
}

export default function App() {
  const [journals,setJournals]=useState([]);
  const [ready,setReady]=useState(false);
  const [page,setPage]=useState(null);
  const [edit,setEdit]=useState(false);
  const [selected,setSelected]=useState(null);
  const [saveStatus,setSaveStatus]=useState('Saved locally');
  const [error,setError]=useState('');
  const backupInput = useRef(null);

  useEffect(()=>{ loadJournals().then(saved=>{setJournals(mergeOriginalPhotos(saved));setReady(true);}).catch(()=>{setJournals(starterJournals);setReady(true);setError('Local storage is unavailable in this browser.');}); },[]);
  useEffect(()=>{ if(!ready) return; setSaveStatus('Saving...'); const timer=setTimeout(()=>{saveJournals(journals).then(()=>setSaveStatus('Saved locally')).catch(()=>{setSaveStatus('Could not save');setError('Could not save to browser storage. Please export a backup.');});},450); return()=>clearTimeout(timer); },[journals,ready]);

  const journal = journals.find(j=>j.id===page);
  const update = (patch) => setJournals(prev=>prev.map(j=>j.id===page?{...j,...patch}:j));
  const updateTheme = (patch) => setJournals(prev=>prev.map(j=>j.id===page?{...j,theme:{...j.theme,...patch}}:j));
  const updateItem = (id,patch) => setJournals(prev=>prev.map(j=>j.id===page?{...j,items:j.items.map(it=>it.id===id?{...it,...patch}:it)}:j));
  const addItem = (item) => { setJournals(prev=>prev.map(j=>j.id===page?{...j,items:[...j.items,item]}:j));setSelected(item.id); };
  const create = () => { const j=newJournal();setJournals(prev=>[j,...prev]);setPage(j.id);setEdit(true);setSelected(null);window.scrollTo(0,0); };
  const open = id => {setPage(id);setEdit(false);setSelected(null);window.scrollTo(0,0);};
  const back = () => {setPage(null);setEdit(false);setSelected(null);window.scrollTo(0,0);};
  const deletePage = () => { if(!confirm(`Delete the entire ${journal.title} journal? This cannot be undone unless you have a backup.`)) return;setJournals(prev=>prev.filter(j=>j.id!==page));back(); };
  const addNote = () => addItem({id:crypto.randomUUID(),type:'note',text:'a little note...',x:28,y:journal?.freeformUnits==='px'?120:35,w:39,h:journal?.freeformUnits==='px'?90:12,rotation:-4,font:'french',color:'#5e5552',size:29,z:3});
  const addImage = async files => {for(const file of files){try{const src=await imageFromFile(file);addItem({id:crypto.randomUUID(),type:'image',src,caption:'',x:10+Math.random()*25,y:journal?.freeformUnits==='px'?80+Math.random()*90:8+Math.random()*25,w:34,h:journal?.freeformUnits==='px'?230:38,rotation:0,frame:'paper',z:2});}catch(e){setError(e.message);}}};
  const onHeroUpload = async file => {if(!file)return;try{update({hero:await imageFromFile(file)});}catch(e){setError(e.message);}};
  const deleteItem = id => {setJournals(prev=>prev.map(j=>j.id===page?{...j,items:j.items.filter(it=>it.id!==id)}:j));setSelected(null);};
  const moveLayer = (id,direction) => updateItem(id,{z: Math.max(0,(journal.items.find(it=>it.id===id)?.z||1)+direction)});
  const importJSON = async file => {if(!file)return;try{const obj=JSON.parse(await file.text());if(!Array.isArray(obj)||obj.some(j=>!j.id||!Array.isArray(j.items)||!j.theme))throw new Error('Not a valid My Journal backup.');if(!confirm('Replace the current journal collection with this backup?'))return;setJournals(obj);back();}catch(e){setError(e.message);}};

  if(!ready) return <div className="loading">Opening your journal...</div>;
  const selectedItem=journal?.items.find(it=>it.id===selected);
  return <div className="app-shell">
    <nav className={`topbar ${journal?'topbar-on-hero':''}`}><button className="wordmark" onClick={back}>my journal</button><div className="topbar-right">{journal && <><button className="nav-link" onClick={back}><ArrowLeft size={15}/> Archive</button><button className={`edit-switch ${edit?'active':''}`} onClick={()=>{setEdit(!edit);setSelected(null);}}>{edit?<><Eye size={15}/> View</>:<><Edit3 size={15}/> Edit</>}</button></>}</div></nav>
    {error && <div className="error-bar">{error}<button aria-label="Dismiss error" onClick={()=>setError('')}><X size={16}/></button></div>}
    {!journal?<Archive journals={journals} onOpen={open} onCreate={create} onExport={()=>downloadJSON(journals)} onImport={importJSON}/>:<div className={`journal-view ${edit?'has-editor':''}`}>
      <main className="journal-main" style={{background:journal.theme.bg}}>
        <section className="hero" style={{backgroundImage:`linear-gradient(to top, rgba(0,0,0,${journal.theme.overlay/100}) 0%, rgba(0,0,0,0) 70%), url("${journal.hero||defaultImage}")`}}><h1 style={{fontFamily:fontCss(journal.theme.font),color:journal.theme.color,fontSize:`clamp(44px, ${journal.theme.size/12}vw, ${journal.theme.size}px)`,fontWeight:journal.theme.weight}}>{journal.title||'Untitled'}</h1><div className="hero-pagination">{journal.location} <span>—</span> {journal.date?.slice(0,4)}</div></section>
        <section className="journal-body"><div className="page-metadata"><span>{journal.location} · {journal.date}</span><span>VOL. {String(journals.findIndex(j=>j.id===page)+1).padStart(2,'0')}</span></div><div className="journal-intro"><p>{journal.description}</p></div>
          <div className="collage-heading"><span>PHOTOGRAPHS & FRAGMENTS</span><span>{journal.items.length} elements · drag to arrange in Edit</span></div>
          <FreeformCanvas journal={journal} edit={edit} selected={selected} setSelected={setSelected} updateItem={updateItem}/>
          <div className="page-end">END OF ENTRY &nbsp; / &nbsp; {journal.title.toUpperCase()}</div>
        </section>
      </main>
      {edit && <Sidebar journal={journal} edit={edit} selectedItem={selectedItem} update={update} updateTheme={updateTheme} updateItem={updateItem} addImage={addImage} addNote={addNote} deleteItem={deleteItem} moveLayer={moveLayer} onHeroUpload={onHeroUpload} saveStatus={saveStatus}/>}
      {edit && <div className="editor-bottom-bar"><span><Save size={14}/> {saveStatus}</span><button onClick={()=>downloadJSON(journals)}><Download size={14}/> Backup</button><button className="delete-page" onClick={deletePage}><Trash2 size={14}/> Delete page</button></div>}
    </div>}
  </div>;
}
