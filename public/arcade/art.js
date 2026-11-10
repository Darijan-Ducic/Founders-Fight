import { paintWeapon } from './weapon-art.js';
import { drawFittedFighter, drawFittedPortrait, loadSpriteAtlases, prepareFighterSprite } from './fighter-sprites.js';

export const roster = [
  {name:'Sam Altman', skin:'#d69878', shade:'#9d5e57', hair:'#272031', cut:'wave', jaw:-2, brow:1, coat:'#4e4b5f', dark:'#2e2b40', pants:'#3d517e', shoes:'#eaba59', accent:'#81addb'},
  {name:'Dario Amodei', skin:'#d89c7a', shade:'#9c6156', hair:'#433040', cut:'curl', glasses:true, coat:'#81767d', dark:'#484253', pants:'#424861', shoes:'#332d44', accent:'#e4a592', shirt:'#ede1c9'},
  {name:'Elon Musk', skin:'#e0a180', shade:'#a76057', hair:'#4b302e', cut:'sweep', jaw:2, nose:1, coat:'#393649', dark:'#242335', pants:'#33364f', shoes:'#252032', accent:'#e17d72', leather:true, broad:2},
  {name:'Larry Ellison', skin:'#ca876a', shade:'#89504d', hair:'#40323b', cut:'sweep', jaw:1, nose:2, beard:true, coat:'#4a3d56', dark:'#2c263f', pants:'#332d4c', shoes:'#292236', accent:'#bd8aca', shirt:'#e7c5a4'},
  {name:'Larry Page', skin:'#d29c83', shade:'#975e5c', hair:'#635253', cut:'short', jaw:-1, brow:1, coat:'#537ca3', dark:'#344568', pants:'#414965', shoes:'#c3ac9f', accent:'#80c5c9'},
  {name:'Jeff Bezos', skin:'#dba386', shade:'#a16561', hair:'#825449', cut:'bald', jaw:3, brow:-1, coat:'#374567', dark:'#272b47', pants:'#373c56', shoes:'#252139', accent:'#9a9ee4', broad:3},
  {name:'Warren Buffett', skin:'#e5aa89', shade:'#a36862', hair:'#d1c0ba', cut:'silver', jaw:2, nose:2, glasses:true, coat:'#445276', dark:'#2d3152', pants:'#303552', shoes:'#302537', accent:'#e4c36d', shirt:'#fff0d2', tie:'#bb465e'},
];
export const napoleon = {name:'Napoleon Bonaparte', skin:'#e7a37b', shade:'#a75950', hair:'#543640', cut:'hat', coat:'#41648b', dark:'#272a50', pants:'#cdc3ab', shoes:'#37273e', accent:'#efbb65', shirt:'#e8ceb0', tie:'#b54252', broad:2};

function poly(c, color, ...xy) {
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(xy[0],xy[1]);
  for(let i=2;i<xy.length;i+=2) c.lineTo(xy[i],xy[i+1]);
  c.closePath();
  c.fill();
}
function rect(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(x,y,w,h);}
const ink='#211a31', light='#ffd6a4';

const paintedFighters = new Map();
let artwork;

export function loadFighterArt(){
  artwork ??= loadSpriteAtlases(['fighters-detailed-a.webp','fighters-detailed-b.webp']).then(sprites => {
    [...roster,napoleon].forEach((profile,index) => {
      if(sprites[index]) paintedFighters.set(profile,prepareFighterSprite(sprites[index],index));
    });
    return roster.map(profile => paintedFighters.get(profile));
  });
  return artwork;
}

function head(c,f){
  const {skin,shade,hair,cut}=f;
  const jaw=f.jaw??0;
  const nose=f.nose??0;
  const brow=f.brow??0;
  poly(c,ink,-14,-12,-11,-19,3,-22,12,-17,13,-8,17+nose,0,15,3,14,11,8+jaw,16,-5,17,-12,10);
  poly(c,shade,-12,-11,-9,-17,3,-19,10,-15,11,-7,15+nose,0,12,2,12,10,7+jaw,14,-5,15,-10,9);
  poly(c,skin,-8,-13,3,-18,9,-14,10,-6,14+nose,0,10,1,11,8,7+jaw,12,-3,11,-7,7);
  poly(c,light,0,-15,8,-13,9,-8,6,-9,1,-11,-4,-9);
  rect(c,skin,-12,-2,5,7);
  rect(c,shade,-10,0,2,4);
  rect(c,'#512e40',3,-6+brow,7,2);
  rect(c,'#f7dfc5',4,-4,5,2);
  rect(c,ink,7,-4,2,2);
  rect(c,shade,9,0,3+nose,2);
  rect(c,'#723e4a',5,6,6,1);
  rect(c,light,6,8,4,1);
  if (f.beard) {
    poly(c,'#50404a',-8,0,-4,6,3,9,11,7,11,11,7,14,-3,14,-8,8);
    rect(c,'#9d8680',0,11,7,1);
    rect(c,'#9d8680',-4,9,2,1);
  }
  if (f.glasses){
    rect(c,ink,-8,-5,12,2);
    rect(c,ink,2,-7,10,1);
    rect(c,ink,2,-7,1,7);
    rect(c,ink,11,-7,1,7);
    rect(c,ink,2,-1,10,1);
    rect(c,'#bcadad',4,-5,2,1);
  }
  if(cut==='bald') {
    poly(c,light,-9,-14,-4,-18,4,-19,7,-17,0,-17,-6,-13);
  } else if(cut==='hat'){
    poly(c,ink,-23,-20,-20,-27,-15,-25,-9,-23,-4,-33,3,-36,10,-33,14,-24,21,-27,23,-20,14,-15,-15,-15);
    poly(c,'#393852',-21,-21,-19,-25,-12,-22,-7,-22,-3,-31,3,-34,9,-31,13,-22,21,-25,20,-20,11,-17,-13,-17);
    poly(c,'#dca953',-20,-21,-13,-19,10,-19,21,-23,19,-20,11,-17,-13,-17);
    rect(c,'#c05359',6,-27,4,5);
    rect(c,light,7,-26,2,2);
  } else {
    const top=cut==='curl'?-25:cut==='short'?-20:-23;
    poly(c,hair,-14,-4,-16,-15,-12,top+4,-7,top,4,top-1,11,top+2,15,top+7,10,-10,6,-14,0,-12,-5,-10,-7,0,-10,-3);
    const shine=cut==='silver'?'#fff0d2':cut==='sweep'?'#886561':'#77535b';
    poly(c,shine,-13,-16,-7,top+2,5,top+1,10,top+4,1,top+4,-8,-13);
    if(cut==='curl') {
      for(const [x,y] of [[-12,-19],[-7,-24],[-1,-25],[5,-24],[10,-21],[-15,-14],[-12,-9],[-5,-17],[3,-19]]) {
        rect(c,hair,x-1,y,5,4);
        rect(c,shine,x,y,3,1);
      }
    }
    if(cut==='wave') {
      poly(c,hair,-12,-19,-8,-24,-3,-25,2,-22,8,-24,13,-20,12,-15,7,-17,1,-18,-5,-15);
      poly(c,shine,-9,-22,-4,-24,0,-22,-5,-20);
    }
    if(cut==='sweep'||cut==='silver') {
      poly(c,shine,-10,-15,-2,-20,9,-21,12,-18,4,-18,-4,-16);
      rect(c,shine,-12,-10,2,4);
    }
  }
}

// Hard stops give cloth the same clustered light and shadow as the head art.
function fabric(c,base,shadow,x,y,w,h,shine='#e7b9a0',strength=.35){
  const lit = base.match(/[\da-f]{2}/gi).map((part,i) => {
    const channel = parseInt(part,16);
    const target = parseInt(shine.slice(1+i*2,3+i*2),16);
    return Math.round(channel+(target-channel)*strength);
  });
  const paint = c.createLinearGradient(x,y,x+w,y+h);
  paint.addColorStop(0,shadow);
  paint.addColorStop(.22,shadow);
  paint.addColorStop(.22,base);
  paint.addColorStop(.44,base);
  paint.addColorStop(.44,'rgb('+lit.join(',')+')');
  paint.addColorStop(.65,'rgb('+lit.join(',')+')');
  paint.addColorStop(.65,base);
  paint.addColorStop(.84,base);
  paint.addColorStop(.84,shadow);
  return paint;
}

export function portrait(canvas,f,index){
  const c=canvas.getContext('2d');
  const w=74;
  c.save();
  c.scale(canvas.width/w,canvas.height/w);
  rect(c,'#252237',0,0,w,w);
  c.globalAlpha=.27;
  poly(c,f.accent,0,67,52,0,74,0,25,74,0,74);
  poly(c,f.accent,27,74,74,12,74,49,55,74);
  c.globalAlpha=1;
  for(let i=0;i<w;i+=5) rect(c,'#211e32',0,i,w,1);
  const fitted = paintedFighters.get(f);
  if(fitted){
    drawFittedPortrait(c,fitted);
  }else{
    c.save();
    c.translate(36,35);
    c.scale(1.4,1.4);
    poly(c,ink,-25,29,-23,22,-10,15,8,14,22,19,28,29);
    poly(c,fabric(c,f.coat,f.dark,-24,28,50,-9),-24,29,-20,22,-9,16,9,15,21,20,26,29);
    poly(c,f.coat,-21,24,-12,19,-8,19,-12,24,-16,25,-18,29,-22,29);
    poly(c,f.dark,-18,29,-16,23,-8,18,-4,27,5,29);
    poly(c,f.shirt||f.dark,-5,16,9,15,7,25,1,28);
    if(f.tie) poly(c,f.tie,4,19,7,20,6,29,2,29);
    if(f.shirt) {
      poly(c,fabric(c,f.coat,f.dark,-9,17,24,11),-10,16,-4,18,1,29,-8,24,-12,23);
      poly(c,'#e8d1b9',6,17,12,18,9,23,5,20);
    }
    if(f.leather) {
      poly(c,'#857082',-20,23,-10,19,-9,21,-18,26);
      poly(c,'#62536b',10,17,18,20,12,27,10,25,13,21);
      rect(c,'#bca7a4',7,23,1,5);
    }
    head(c,f);
    c.restore();
  }
  rect(c,f.accent,w-15-index%2,7,8,2);
  c.restore();
}

export function fighter(c, actor, time){
  const f=actor.fighter;
  const step=actor.moving ? Math.sin(time*17)*8 : 0;
  const wind=actor.attack>0 && !actor.struck;
  const strike=actor.attack>0 && actor.struck;
  const boss=f===napoleon;
  c.save();
  c.translate(Math.round(actor.x),Math.round(223-actor.y));
  c.scale(actor.facing,1);
  if(actor.hp<=0){c.translate(0,-7);c.rotate(1.45);}
  if(actor.hit>0 && !actor.weapon){c.translate(-3,0);c.globalAlpha=.68;}
  const fitted = paintedFighters.get(f);
  if(fitted){
    drawFittedFighter(c,fitted,actor,time,wind,strike);
    c.restore();
    return;
  }
  const wide=f.broad||0;
  const bodyRise = 1.12;
  c.scale(1,bodyRise);
  for(const [offset,shift,col] of [[-7,-step,f.dark],[7,step,f.pants]]){
    poly(c,ink,offset-7,-34,offset+6,-35,offset+shift+6,-8,offset+shift+10,-5,offset+shift+10,0,offset+shift-6,0,offset+shift-7,-6);
    const legLight=fabric(c,col,f.dark,offset-7,-17,15,2,boss?'#ffe7bc':'#c7b5d2',boss ? .48 : .32);
    poly(c,legLight,offset-5,-33,offset+5,-33,offset+shift+5,-15,offset+shift+3,-8,offset+shift-4,-8,offset+shift-6,-17);
    poly(c,col,offset+shift-5,-19,offset+shift+4,-17,offset+shift+3,-15,offset+shift-3,-16);
    poly(c,f.dark,offset+shift-3,-11,offset+shift+4,-13,offset+shift+4,-11,offset+shift-2,-9);
    poly(c,f.dark,offset-4,-31,offset-1,-31,offset+shift+2,-9,offset+shift-4,-9);
    c.globalAlpha *= .38;
    poly(c,f.accent,offset+2,-30,offset+4,-29,offset+shift+4,-10,offset+shift+2,-12);
    c.globalAlpha /= .38;
    poly(c,fabric(c,f.shoes,ink,offset+shift-6,-4,18,0),offset+shift-5,-7,offset+shift+2,-7,offset+shift+5,-5,offset+shift+9,-4,offset+shift+9,-1,offset+shift-5,-1);
    rect(c,boss?'#c69a58':f.dark,offset+shift+3,-4,4,1);
    if(f===roster[0]){
      rect(c,'#b6576e',offset+shift-3,-5,3,3);
      rect(c,'#eed9a3',offset+shift+1,-4,4,1);
    }
    rect(c,ink,offset+shift-5,-1,14,1);
    rect(c,f.accent,offset+shift+3,-3,4,1);
  }
  c.translate(0,actor.moving?Math.round(-Math.abs(step)*.28):Math.round(Math.sin(time*5)));
  // The far fist stays in guard while the near arm telegraphs the strike.
  poly(c,ink,8,-64,17,-63,23,-55,21,-49,11,-50,6,-56);
  poly(c,f.dark,9,-62,15,-62,21,-54,18,-51,11,-52,7,-56);
  rect(c,f.shade,18,-56,6,6);
  rect(c,f.skin,19,-56,5,3);
  poly(c,ink,-15-wide,-65,-8,-70,9,-69,17+wide,-61,15,-31,-13,-30);
  const jacket = fabric(c,f.coat,f.dark,-16,-49,36,-11,'#ddbbad',f.leather ? .48 : .38);
  poly(c,jacket,-13-wide,-63,-8,-68,8,-67,15+wide,-60,14,-44,11,-33,-11,-33,-14,-45);
  poly(c,f.dark,-13-wide,-60,-6,-56,-3,-36,-12,-33);
  poly(c,f.shirt||f.dark,-5,-67,8,-66,5,-45,0,-40);
  poly(c,fabric(c,f.shirt||f.coat,f.dark,-5,-66,12,13),-4,-67,7,-65,5,-54,2,-50,-2,-57);
  poly(c,f.coat,-11,-45,-5,-43,-1,-41,-4,-39,-11,-42);
  poly(c,f.dark,-10,-36,-4,-38,4,-36,10,-39,11,-36,8,-34,-9,-34);
  if(!f.shirt && !f.leather){
    for(let y=-63;y<=-60;y++) rect(c,y%2?f.dark:f.coat,-6+(y+63),y,12-2*(y+63),1);
  }
  if(f.tie) poly(c,f.tie,4,-63,7,-62,4,-47,1,-46);
  if(f.leather){
    poly(c,'#786678',-10,-62,-3,-60,-1,-57,-9,-58);
    poly(c,'#70647e',9,-63,13,-60,10,-50,9,-54);
    poly(c,'#63576e',-11,-39,-5,-41,-4,-40,-11,-37);
    rect(c,'#b8a9a2',5,-43,1,7);
  }else{
    c.globalAlpha *= .25;
    poly(c,f.accent,-9,-61,-5,-59,-4,-43,-8,-45);
    poly(c,f.accent,12,-59,14,-56,11,-37,9,-37);
    c.globalAlpha /= .25;
  }
  rect(c,f.dark,-11,-36,23,2);
  poly(c,f.accent,-14-wide,-63,-8,-68,-5,-67,-12-wide,-61);
  if(boss || f.shirt){
    poly(c,'#9a8793',9,-65,13,-62,10,-57,8,-59);
    rect(c,'#332a44',9,-51,2,2);
    rect(c,'#332a44',8,-44,2,2);
  }
  if(boss){
    poly(c,'#c84557',-12,-59,-8,-61,13,-39,13,-35,9,-35);
    for(const x of [-16,9]){
      poly(c,'#6f473d',x,-63,x+4,-66,x+10,-64,x+9,-58,x+2,-59);
      poly(c,'#f0bf68',x,-64,x+5,-66,x+10,-64,x+9,-61,x+1,-61);
      for(let i=1;i<9;i+=2) rect(c,i%4===1?'#f8d690':'#ba7746',x+i,-62,1,4);
    }
    for(let y=-58;y<-44;y+=5) rect(c,'#eac474',6,y,2,2);
    rect(c,'#a8374c',8,-56,3,3);
    rect(c,'#f5cd76',9,-54,2,2);
  }
  const weaponType=actor.weapon?.type;
  const lowRelease=weaponType==='bolt'||weaponType==='orb'||weaponType==='slam';
  const handX=strike?(boss?40:lowRelease?18:29):wind?-5:18;
  const handY=strike?(lowRelease?-33:-52):wind?-66:-48;
  poly(c,ink,-12,-61,-5,-63,4,-51,handX,handY-5,handX+6,handY,handX+3,handY+5,1,-40,-10,-48);
  const sleeve = fabric(c,f.coat,f.dark,-8,-60,8,21,'#e4bd9d',f.leather ? .52 : .4);
  poly(c,sleeve,-11,-60,-6,-61,4,-48,handX,handY-3,handX+2,handY+3,1,-42,-8,-50);
  poly(c,f.dark,-9,-53,-4,-53,3,-46,handX-2,handY+1,handX-2,handY+3,1,-42,-8,-50);
  rect(c,f.accent,handX-2,handY-2,2,6);
  poly(c,ink,handX,handY-4,handX+5,handY-5,handX+8,handY-2,handX+7,handY+4,handX+1,handY+4,handX-1,handY+1);
  poly(c,f.shade,handX,handY-3,handX+5,handY-4,handX+7,handY-2,handX+6,handY+3,handX+1,handY+3);
  poly(c,f.skin,handX+1,handY-3,handX+5,handY-4,handX+7,handY-2,handX+5,handY+1,handX+1,handY);
  rect(c,light,handX+4,handY-3,2,1);
  if(actor.weapon) paintWeapon(c,actor,handX+5,handY);
  else if(boss&&(wind||strike)) {
    rect(c,'#eac474',handX+5,handY-6,3,12);
    if(strike) poly(c,'#ffe7c5',handX+8,handY-2,handX+37,handY-7,handX+30,handY-1,handX+8,handY+1);
    else poly(c,'#ffe7c5',handX+5,handY,handX-16,handY-25,handX-9,handY-23,handX+8,handY-3);
  }
  c.translate(0,-78);
  c.scale(.81,.81/bodyRise);
  head(c,f);
  c.restore();
}

export function courtyard(c){
  const sky=c.createLinearGradient(0,0,0,172);
  sky.addColorStop(0,'#171b38');sky.addColorStop(1,'#9a5063');
  rect(c,sky,0,0,480,270);
  for(let i=0;i<55;i++) rect(c,i%5?'#605478':'#e5baae',(i*127+23)%480,(i*31+11)%102,1+(i%5===0),1);
  poly(c,'#f4c396',351,30,359,24,373,24,383,31,387,42,383,54,373,61,359,60,350,53,346,42);
  rect(c,'#e5a587',356,38,9,2);rect(c,'#e5a587',370,50,10,3);
  poly(c,'#41314c',0,136,48,98,71,112,122,75,160,103,208,89,258,123,318,90,365,113,421,86,480,108,480,192,0,192);
  rect(c,'#5d4259',0,124,480,75);
  rect(c,'#9d6870',0,121,480,5);
  rect(c,'#362c46',0,126,480,4);
  for(let i=0;i<8;i++){
    const x= i*64-13;
    poly(c,'#342940',x,190,x,155,x+8,141,x+18,135,x+32,135,x+42,141,x+49,155,x+49,190);
    poly(c,'#47304a',x+6,190,x+6,157,x+12,146,x+21,141,x+30,141,x+39,147,x+43,158,x+43,190);
    for(let y=155;y<189;y+=7) rect(c,'#51384e',x+7,y,35,1);
    rect(c,'#744d60',x+51,130,6,68);
    if(i%2===1){
      rect(c,'#ad735d',x+44,113,20,2);
      poly(c,'#89344e',x+47,115,x+61,115,x+61,151,x+54,156,x+47,151);
      rect(c,'#ca6263',x+47,116,2,32);
      rect(c,'#e9b780',x+53,127,2,10);
      rect(c,'#e9b780',x+50,131,8,2);
    }else{
      const glow=c.createRadialGradient(x+54,151,1,x+54,151,24);
      glow.addColorStop(0,'#ffac70aa');glow.addColorStop(1,'#ffac7000');
      rect(c,glow,x+30,127,48,48);
      rect(c,'#281f35',x+50,145,8,12);
      rect(c,'#ffce7f',x+52,148,4,7);
    }
  }
  rect(c,'#2d263e',0,194,480,76);
  rect(c,'#90747c',0,192,480,3);
  for(const [row,y] of [198,205,215,229,248,270].entries()){
    const next=[205,215,229,248,270,292][row];
    const width=23+row*9;
    for(let x=-(row%2)*width/2;x<480;x+=width){
      const n=(Math.round(x*19+row*23)%5+5)%5;
      poly(c,['#63546b','#594e66','#6c596f','#5b516b','#695869'][n],x,y,x+width-2,y,x+width+2,next-2,x-4,next-2);
      rect(c,'#806677',Math.max(0,x+4),y+1,width/3,1);
    }
  }
}
