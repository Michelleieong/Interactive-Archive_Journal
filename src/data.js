// Starter content: 3 sample journals, 15 photos total, so the archive
// already satisfies the assignment's minimum item count.
// Replace demo images with your own photos in the website editor.
// Photographs are from the user's original Assignment 1 travel-collage repository.
// The original repository remains the source of the images; no stock placeholders.
const originalPhoto = (place, number, x, y, w=37, h=38, rotation=0, frame='none') => ({
  id: crypto.randomUUID(), type:'image',
  src:`https://raw.githubusercontent.com/Michelleieong/travel-collage/master/images/${place}${number}.jpg`,
  x,y,w,h,rotation,frame,caption:'',z:1
});
const originalHero = (place, number) => `https://raw.githubusercontent.com/Michelleieong/travel-collage/master/images/${place}${number}.jpg`;

export const fonts = [
  { id:'typewriter', name:'Worn Typewriter', css:'"Special Elite", "Courier New", monospace' },
  { id:'romantic', name:'Romantic Pen Script', css:'"Pinyon Script", cursive' },
  { id:'gothic', name:'Gothic Blackletter', css:'"UnifrakturMaguntia", serif' },
  { id:'sans', name:'Modern Sans', css:'"DM Sans", sans-serif' },
  { id:'french', name:'French Handwriting', css:'"Caveat", cursive' },
  { id:'courtly', name:'Courtly Calligraphy', css:'"Great Vibes", cursive' },
];
export const fontCss = (id) => fonts.find((f) => f.id === id)?.css || fonts[0].css;

export const colorPalettes = {
  Neutral: ['#ffffff','#292725','#74706e','#aaa6a2','#ede7de'],
  Macaron: ['#e9b6bf','#e1c77e','#b9d7e8','#b8d8c5','#c8b8e6','#f4d6b9'],
  Morandi: ['#ae8790','#8a9b90','#8b96ac','#b7a58c','#918598','#c6afa6'],
};
export const backgrounds = ['#ffffff','#f7f2eb','#e9e2d6','#f1e1e4','#e7ece2','#e4e9ee','#d8d1cb','#272626'];

const annotation = (text,x,y,w=38,rotation=0) => ({
  id: crypto.randomUUID(),type:'note',text,x,y,w,h:12,rotation,frame:'none',font:'french',color:'#5e5552',size:29,z:3,
});

// Every image in the original repository's images/ directory is represented.
// Photo 1 is both the hero cover and the first archive image, avoiding omissions.
// Keep the original numeric sequence so a journal can be read like the old website.
export const originalCounts = {Antwerp:63, Paris:26, Cusco:47};
const allTravelPhotos = (city, count) => Array.from({length:count}, (_,n) => {
  const index=n+1;
  const row=Math.floor(n/3), col=n%3;
  // All images are independently positioned and editable; these are only starting placements.
  const widths=[27,32,27], offsets=[5,37,71], heights=[200,235,195];
  return originalPhoto(city,index, offsets[col], row*275+(col===1?35:0), widths[col], heights[(n+row)%3], 0,'none');
});

export const starterJournals = [
  {
    id:'antwerp',title:'Antwerp',location:'Belgium',date:'2026-08-11',
    description:'A visual record of days in Antwerp. Clothes, food, museums, streets and things I wanted to remember.',
    hero:originalHero('Antwerp',1),
    theme:{bg:'#ffffff',color:'#ffffff',font:'typewriter',weight:400,size:100,overlay:24},
    layout:'freeform',freeformUnits:'px',items:allTravelPhotos('Antwerp', originalCounts.Antwerp),
  },
  {
    id:'paris',title:'Paris',location:'France',date:'2026-09-18',
    description:'Days in Paris — little streets, quiet afternoons, fashion, and familiar feelings.',
    hero:originalHero('Paris',1),
    theme:{bg:'#ffffff',color:'#ffffff',font:'romantic',weight:400,size:110,overlay:25},
    layout:'freeform',freeformUnits:'px',items:allTravelPhotos('Paris', originalCounts.Paris),
  },
  {
    id:'cusco',title:'Cusco',location:'Peru',date:'2026-07-25',
    description:'Color of Andes. A brave little journey through mountains, markets and unexpected moments.',
    hero:originalHero('Cusco',1),
    theme:{bg:'#ffffff',color:'#ffffff',font:'typewriter',weight:400,size:105,overlay:32},
    layout:'freeform',freeformUnits:'px',items:allTravelPhotos('Cusco', originalCounts.Cusco),
  },
];

// Already-saved projects should gain missing original images without losing
// any hand-edited captions, arrangements, uploaded media, or notes.
export const mergeOriginalPhotos = (saved) => {
  if (!Array.isArray(saved)) return starterJournals;
  const migrate = (j) => {
    if(j.layout==='freeform' && j.freeformUnits==='px') return j;
    // Old layouts (including Editorial/Grid/Polaroid) become directly editable,
    // using the original displayed image order and keeping captions, frames and notes.
    // Existing freeform pages use their old percentage positions as a starting point.
    const items=(j.items||[]).map((item,i) => {
      const row=Math.floor(i/3),col=i%3;
      const legacyFreeform=j.layout==='freeform';
      return {...item,
        x:legacyFreeform ? Math.max(0,Math.min(95-Number(item.w||30),Number(item.x||0))) : [5,37,71][col],
        y:legacyFreeform ? Math.max(0,Number(item.y||0)*10) : row*275+(col===1?35:0),
        w:legacyFreeform ? Number(item.w||30):[27,32,27][col],
        h:legacyFreeform ? Math.max(100,Number(item.h||25)*8):[200,235,195][(i+row)%3]
      };
    });
    return {...j,layout:'freeform',freeformUnits:'px',items};
  };
  return saved.map(j => {
    const starter=starterJournals.find(entry=>entry.id===j.id);
    if (!starter) return migrate(j);
    const originalIds=new Set(starter.items.map(it=>it.src));
    const bySource=new Map((j.items||[]).filter(it=>it.type==='image').map(it=>[it.src,it]));
    const ordered=starter.items.map(it=>bySource.get(it.src)||it);
    const custom=(j.items||[]).filter(it=>it.type!=='image'||!originalIds.has(it.src));
    return migrate({...j,items:[...ordered,...custom]});
  });
};

export const newJournal = () => ({
  id:crypto.randomUUID(),title:'New York',location:'United States',date:new Date().toISOString().slice(0,10),
  description:'A new page of little moments.',hero:'',
  theme:{bg:'#ffffff',color:'#ffffff',font:'typewriter',weight:400,size:86,overlay:30},
  layout:'freeform',freeformUnits:'px',items:[],
});
