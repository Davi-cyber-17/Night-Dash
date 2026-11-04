const cv=document.getElementById('c'),ctx=cv.getContext('2d');
const H=1080,PX=400,G=2800,JV=1350,C1='#22e5ff',C2='#ff2bd6';
let W=1920,CH=1080,hs=1,stars=[];

// Responsivo: paisagem usa mais largura; retrato (celular) usa mais altura
function fit(){
  const a=innerWidth/Math.max(1,innerHeight);
  if(a>=1.3){CH=H;W=Math.round(Math.min(2400,H*a))}
  else{W=1400;CH=Math.round(Math.min(2600,Math.max(H,W/a)))}
  cv.width=W;cv.height=CH;
  hs=innerWidth<700?1.8:innerWidth<1100?1.3:1;
  stars=Array.from({length:80},()=>({x:Math.random()*W,y:Math.random()*CH*.6,r:1+Math.random()*2,p:Math.random()*6}));
}
addEventListener('resize',fit);addEventListener('orientationchange',fit);fit();

let st='start',d,speed,y,vy,onG,plats,rocks,coins,nextX,lastY,coinsN,score,best=0,deadAt=0,t=0,ang=0,lastG=0;
try{best=+localStorage.getItem('skate-best')||0}catch(e){}

function reset(){
  d=0;speed=520;y=900;vy=0;onG=true;ang=0;lastG=0;
  plats=[{x:-600,w:1500,y:900}];rocks=[];coins=[];nextX=900;lastY=900;coinsN=0;score=0;
  gen();
}
function gen(){
  while(nextX<d+W+900){
    const gap=150+Math.random()*(100+speed*0.22);
    let ny=lastY+[-110,0,0,110][Math.random()*4|0];
    ny=Math.max(680,Math.min(900,ny));
    const hasRock=Math.random()<.6;
    const margin=300+speed*0.35;
    const x=nextX+gap,w=hasRock?2*margin+100+Math.random()*400:500+Math.random()*900;
    plats.push({x,w,y:ny});
    coins.push({x:nextX+gap/2,y:Math.min(lastY,ny)-260});
    if(hasRock){
      const rx=x+margin+Math.random()*(w-2*margin-100);
      rocks.push({x:rx,y:ny});
      coins.push({x:rx+50,y:ny-255});
    }else if(Math.random()<.7){
      const n=3+(Math.random()*3|0),sx=x+100+Math.random()*100,cy=ny-(Math.random()<.5?130:260);
      for(let i=0;i<n;i++)coins.push({x:sx+i*90,y:cy});
    }
    nextX=x+w;lastY=ny;
  }
}
function die(){
  st='over';deadAt=performance.now();
  if(score>best){best=score;try{localStorage.setItem('skate-best',best)}catch(e){}}
}
function press(){
  if(st==='start'){reset();st='play'}
  else if(st==='over'){if(performance.now()-deadAt>500){reset();st='play'}}
  else if(t-lastG<0.1&&vy>=0||onG){vy=-JV;onG=false;lastG=-1}
}
function release(){if(st==='play'&&vy<-400)vy*=.5}
addEventListener('pointerdown',e=>{e.preventDefault();press()});
addEventListener('pointerup',release);
addEventListener('pointercancel',release);
addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{if(['Space','ArrowUp','KeyW'].includes(e.code)){e.preventDefault();if(!e.repeat)press()}});
addEventListener('keyup',e=>{if(['Space','ArrowUp','KeyW'].includes(e.code))release()});

function update(dt){
  if(st!=='play')return;
  speed=Math.min(950,520+d/40);
  d+=speed*dt;gen();
  const prev=y;vy+=G*dt;y+=vy*dt;onG=false;
  const L=d+PX-65,R=d+PX+65;
  for(const p of plats){
    if(p.x+p.w<L||p.x>R)continue;
    if(vy>=0&&prev<=p.y+2&&y>=p.y){y=p.y;vy=0;onG=true}
    else if(y>p.y+30)return die();
  }
  if(onG)lastG=t;
  if(y>H+200)return die();
  for(const r of rocks){
    if(r.x+100>L+15&&r.x<R-15&&y>r.y-90)return die();
  }
  for(const c of coins){
    if(!c.got&&Math.hypot(c.x-(d+PX),c.y-(y-70))<85){c.got=1;coinsN++}
  }
  if(plats.length>8&&plats[1].x+plats[1].w<d-400){plats.shift()}
  rocks=rocks.filter(r=>r.x>d-400);coins=coins.filter(c=>c.x>d-400&&!c.got);
  score=Math.floor(d/60)+coinsN*5;
  const target=Math.max(-.3,Math.min(.3,vy/2200));
  ang+=(target-ang)*Math.min(1,dt*12);
}

/* ---------- Cenário ---------- */
function hash(i){const s=Math.sin(i*127.1)*43758.5453;return s-Math.floor(s)}
function skyline(f,col,win,hmin,hmax){
  const bw=150,off=d*f,i0=Math.floor(off/bw);
  for(let i=i0;i*bw-off<W+bw;i++){
    const x=i*bw-off,h=hmin+hash(i+f*100)*(hmax-hmin),w=bw-20-hash(i*3)*30;
    ctx.fillStyle=col;ctx.fillRect(x,H-h,w,h);
    if(win){ctx.fillStyle='rgba(34,229,255,.55)';
      for(let k=0;k<4;k++)if(hash(i*7+k)>.45)ctx.fillRect(x+14+(k%2)*w*.45,H-h+20+Math.floor(k/2)*40,10,16)}
  }
}
function bg(){
  const g=ctx.createLinearGradient(0,0,0,CH);
  g.addColorStop(0,'#04061a');g.addColorStop(.6,'#1a1050');g.addColorStop(1,'#5a1a7a');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,CH);
  ctx.fillStyle='#fff';
  for(const s of stars){ctx.globalAlpha=.4+.6*Math.abs(Math.sin(t*1.5+s.p));ctx.fillRect(s.x,s.y,s.r,s.r)}
  ctx.globalAlpha=1;
  ctx.save();ctx.translate(0,CH-H);
  const sx=W*.72,sy=420,sg=ctx.createLinearGradient(0,sy-170,0,sy+170);
  sg.addColorStop(0,'#ffe14d');sg.addColorStop(1,C2);
  ctx.fillStyle=sg;ctx.shadowColor=C2;ctx.shadowBlur=60;
  ctx.beginPath();ctx.arc(sx,sy,170,0,7);ctx.fill();ctx.shadowBlur=0;
  skyline(.08,'#1a1450',false,200,520);skyline(.2,'#0d0a30',true,150,380);
  ctx.restore();
}
function drawPlat(p){
  const sx=p.x-d;if(sx>W||sx+p.w<0)return;
  ctx.save();ctx.beginPath();ctx.rect(sx,p.y,p.w,H-p.y);ctx.clip();
  const g=ctx.createLinearGradient(0,p.y,0,H);g.addColorStop(0,'#16204a');g.addColorStop(1,'#070a1c');
  ctx.fillStyle=g;ctx.fillRect(sx,p.y,p.w,H-p.y);
  ctx.strokeStyle='rgba(34,229,255,.18)';ctx.lineWidth=2;ctx.beginPath();
  for(let x=Math.ceil(p.x/80)*80;x<p.x+p.w;x+=80){ctx.moveTo(x-d,p.y);ctx.lineTo(x-d,H)}
  for(let yy=p.y+60;yy<H;yy+=60){ctx.moveTo(sx,yy);ctx.lineTo(sx+p.w,yy)}
  ctx.stroke();ctx.restore();
  ctx.save();ctx.shadowColor=C1;ctx.shadowBlur=24;ctx.fillStyle=C1;ctx.fillRect(sx,p.y,p.w,8);ctx.restore();
}
function drawRock(r){ // barreira neon
  const sx=r.x-d;if(sx>W||sx<-120)return;
  ctx.save();ctx.fillStyle='#1a0b2e';ctx.strokeStyle=C2;ctx.lineWidth=4;ctx.shadowColor=C2;ctx.shadowBlur=22;
  ctx.beginPath();ctx.roundRect(sx,r.y-105,100,105,8);ctx.fill();ctx.stroke();
  ctx.shadowBlur=0;ctx.clip();ctx.strokeStyle='rgba(255,43,214,.5)';ctx.lineWidth=10;
  ctx.beginPath();for(let k=-2;k<6;k++){ctx.moveTo(sx+k*30,r.y);ctx.lineTo(sx+k*30+105,r.y-105)}
  ctx.stroke();ctx.restore();
}
function hex(r){ctx.beginPath();for(let i=0;i<6;i++){const a=Math.PI/3*i+Math.PI/6;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath()}
function coin(x,yy,s){ // chip de energia
  const sc=Math.max(.3,Math.abs(Math.cos(t*3+x*.01)));
  ctx.save();ctx.translate(x,yy);ctx.scale(sc*s,s);
  ctx.shadowColor=C1;ctx.shadowBlur=18;hex(28);ctx.fillStyle=C1;ctx.fill();
  ctx.shadowBlur=0;hex(16);ctx.fillStyle='#04061a';ctx.fill();
  hex(7);ctx.fillStyle=C1;ctx.fill();ctx.restore();
}

/* ---------- Personagem ---------- */
const SPRITE=[
"....h..hh..h....",
"...hHHHHHHHHh...",
"..hHHHHHHHHHHh..",
"..hHHHHHHHHHHh..",
"..hHHSSHHHHHHh..",
"..hHSSSSSSSSh...",
"...hSSSESSESs...",
"...hSSSSSSSSs...",
"....hSSSSSSs....",
"......SSSS......",
"...mMMMMMMMMm...",
"..MMMMMMMMMMMM..",
"..MMmmmmmmmmMM..",
"..MMMMMMMMMMMM..",
"..SSmmmmmmmmSS..",
"....PPPPPPPP....",
"....PPPPPPPP....",
"....PPP..PPP....",
"....PPP..PPP....",
"....PPP..PPP....",
"...BBBB..BBBB...",
"...BBBB..BBBB..."
];
const PAL={h:'#2a1650',H:'#6d3fd1',S:'#f2b995',s:'#d9956f',E:'#22e5ff',M:'#0f1a3a',m:'#22e5ff',P:'#1a2142',B:'#ff2bd6'};
function drawChar(){
  const k=5,ox=-SPRITE[0].length*k/2,oy=-40-SPRITE.length*k;
  SPRITE.forEach((row,j)=>{for(let i=0;i<row.length;i++){
    const c=PAL[row[i]];if(!c)continue;
    ctx.fillStyle=c;ctx.fillRect(Math.round(ox+i*k),Math.round(oy+j*k),k,k);
  }});
}
function pou(){
  ctx.save();ctx.translate(PX,y);ctx.rotate(ang);
  ctx.fillStyle='rgba(34,229,255,.25)';ctx.beginPath();ctx.ellipse(0,-6,120,10,0,0,7);ctx.fill();
  ctx.shadowColor=C1;ctx.shadowBlur=16;ctx.fillStyle='#0e1530';ctx.strokeStyle=C1;ctx.lineWidth=3;
  ctx.beginPath();ctx.roundRect(-115,-42,230,20,10);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
  for(const wx of[-70,70]){
    ctx.fillStyle='#0a0f1f';ctx.strokeStyle=C1;ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(wx,-14,14,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle=C1;ctx.beginPath();ctx.arc(wx,-14,4,0,7);ctx.fill();
  }
  drawChar();
  ctx.restore();
}

/* ---------- Interface ---------- */
function txt(s,x,yy,size,fill,align){
  size*=hs;ctx.font='900 '+size+'px Orbitron,"Segoe UI",Arial,sans-serif';
  ctx.textAlign=align||'left';ctx.textBaseline='alphabetic';ctx.lineJoin='round';
  ctx.lineWidth=size*.1;ctx.strokeStyle='#04061a';ctx.shadowColor=C1;ctx.shadowBlur=size*.3;
  ctx.strokeText(s,x,yy,W*.92);ctx.fillStyle=fill;ctx.fillText(s,x,yy,W*.92);ctx.shadowBlur=0;
}
function draw(){
  bg();
  ctx.save();ctx.translate(0,CH-H);
  plats.forEach(drawPlat);rocks.forEach(drawRock);
  for(const c of coins){const sx=c.x-d;if(!c.got&&sx>-50&&sx<W+50)coin(sx,c.y,1)}
  pou();
  ctx.restore();
  const sz=56,b1=30+sz*hs,b2=b1+30+44*hs;
  txt('Pontuação: '+score,32,b1,sz,'#fff');
  coin(32+22*hs,b2-14*hs,.8*hs);txt(String(coinsN),32+56*hs,b2,44,C1);
  if(st!=='play'){
    ctx.fillStyle='rgba(4,6,26,.55)';ctx.fillRect(0,0,W,CH);
    const cy=CH/2,cx=W/2;
    if(st==='start'){
      txt('Night Dash',cx,cy-110*hs,130,'#fff','center');
      txt('Toque ou aperte espaço para pular',cx,cy+10,38,'#fff','center');
      txt('Segure para pular mais alto',cx,cy+10+60*hs,32,C2,'center');
    }else{
      txt('FIM DE JOGO',cx,cy-90*hs,100,C2,'center');
      txt('Pontuação: '+score,cx,cy+10,48,'#fff','center');
      txt('Recorde: '+best,cx,cy+10+70*hs,42,C1,'center');
      txt('Toque para jogar de novo',cx,cy+10+150*hs,34,'#fff','center');
    }
  }
}
let last=performance.now();
function loop(now){
  const dt=Math.min(.033,(now-last)/1000);last=now;t+=dt;
  update(dt);draw();requestAnimationFrame(loop);
}
reset();requestAnimationFrame(loop);
