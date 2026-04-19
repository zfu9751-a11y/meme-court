// Meme Court - Constants & Configuration
// Contract addresses, tier thresholds, global state


/* ══ init ══ */



/* ── Safe DOM helper ── */
const $s = (id, val, prop='textContent') => { const el=document.getElementById(id); if(el) el[prop]=val; };
const $h = (id, val) => $s(id, val, 'innerHTML');


/* ── 页面切换 ── */
let chartInited=false;
function showPage(id) {
  // 离开详情页时停止弹幕
  if (id !== 'court-detail') clearDanmakuBattlefield();
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  const navEl = document.getElementById('nav-' + id);
  if(navEl) navEl.classList.add('active');
  window.scrollTo(0,0);
  if(id==='rank'){
    renderBscTable();
    renderBscFeed();
    renderBattleMap();
    setTimeout(()=>{initBscBarChart();initBscPieChart();},100);
    loadDexScreenerData();
  }
  if(id==='court'){
    renderCourtCards();
    renderHotCourtCards();
    // 尝试用真实 four.meme 新币数据更新热门卡片
    fetchFourMemeLatest().then(coins => {
      if (coins.length) updateHotCardsWithReal(coins);
    });
  }
  if(id==='profile') renderProfilePage();
  if(id==='court'){ renderCourtCards(); renderHotCourtCards(); }
}

/* ── 弹幕 ── */
const dmData = [
  {text:'满仓PEPE，项目方直接改名跑路',type:'rip'},{text:'抄底WIF三次，次次抄在半山腰',type:'rip'},
  {text:'DOGE信仰者，持仓三年终于回本',type:'win'},{text:'朋友推荐的币，朋友比我先跑了',type:'rip'},
  {text:'以为找到下一个DOGE，找到的是教训',type:'rip'},{text:'BONK小仓参与，意外翻了四倍',type:'win'},
  {text:'已亏67%，但我还在坚守WIF信仰',type:'rip'},{text:'群主说稳，群主已解散群跑路',type:'rip'},
  {text:'链上数据说谎了，我的钱包更诚实',type:'rip'},{text:'FLOKI持仓180天，终于等来了解套',type:'win'},
  {text:'梭哈是不对的，我悔悟了，破产了',type:'rip'},{text:'止损是美德，我终于学会了，晚了',type:'rip'},
  {text:'巨鲸出逃那天，我刚买入，完美配合',type:'rip'},{text:'小仓试水TURBO，叙事确实新颖',type:'win'},
  {text:'DOGE真的是信仰，别的是赌博',type:'win'},{text:'止盈了BONK，感谢法庭判决',type:'win'},
];
function initDanmaku() {
  const layer = document.getElementById('danmakuLayer');
  if (!layer) return;
  const cfgs = [{slice:[0,8],top:'8%',dur:60,rev:false},{slice:[5,14],top:'32%',dur:50,rev:true},{slice:[10,16],top:'58%',dur:68,rev:false},{slice:[12,16],top:'82%',dur:55,rev:true}];
  cfgs.forEach(cfg => {
    const items = dmData.slice(...cfg.slice);
    const doubled = [...items,...items];
    const html = doubled.map(d=>`<div class="danmaku-item"><span class="di-tag ${d.type==='rip'?'di-rip':'di-win'}">${d.type==='rip'?'RIP':'WIN'}</span>${d.text}</div>`).join('');
    const track = document.createElement('div');
    track.className = 'danmaku-track';
    track.style.cssText = `top:${cfg.top};animation:${cfg.rev?'to-right':'to-left'} ${cfg.dur}s linear infinite;`;
    track.innerHTML = html;
    layer.appendChild(track);
  });
}

/* ── 判决书展开 ── */
function toggleVerdict() {
  const body = document.getElementById('vbBody');
  const toggle = document.getElementById('vbToggle');
  body.classList.toggle('open');
  toggle.classList.toggle('open');
}

/* ── 今日开庭 新币数据 ── */
const newCoins = [
  {id:1, icon:'🦊', name:'FOXAI', time:'2小时前', liq:'$48K', holders:'312', change:'+127%', risk:'high', riskLabel:'高风险', heatScore:88,
   verdictShort:'本庭注意到 FOXAI 在过去两小时内吸引了大量早期进场者。机会确实存在，但流动性薄如蝉翼，稍有风吹草动即可能血崩。',
   verdictFull:'从链上数据看，前 10 地址持有 68% 筹码，高度集中。初始流动性 $48K 属于极低水位，任何大单都可能造成剧烈滑点。\n建议仓位不超总资产 2%，且必须设置止损。叙事角度看，AI+Fox 的组合有一定新颖性，但需要观察社区能否持续扩张。',
   tags:['four.meme NEW','AI 叙事','高波动'], fourUrl:'https://four.meme'},
  {id:2, icon:'🌙', name:'MOONPIG', time:'5小时前', liq:'$156K', holders:'891', change:'+43%', risk:'mid', riskLabel:'中风险', heatScore:76,
   verdictShort:'MOONPIG 的社区活跃度在同期新币中属于上游水平。流动性尚可，但本庭提醒：猪会飞的前提是有人托举。',
   verdictFull:'持仓分布相对均匀，前 10 地址持仓比例约 41%，优于行业平均。过去 5 小时链上交易笔数稳定增长，显示真实用户参与。\n风险点在于整体市场情绪，若大盘走弱，此类新兴项目往往首当其冲。建议小仓参与，止盈设在 2-3 倍。',
   tags:['four.meme NEW','社区驱动','流动性一般'], fourUrl:'https://four.meme'},
  {id:3, icon:'🤖', name:'AIBONK', time:'8小时前', liq:'$320K', holders:'1,243', change:'+18%', risk:'low', riskLabel:'低风险', heatScore:91,
   verdictShort:'AIBONK 是本期新案中流动性最充裕的一个。AI+BONK 的叙事组合有一定感召力，链上数据支撑较为健康。',
   verdictFull:'$320K 初始流动性在 four.meme 新项目中属于较高水平，持仓分散度良好。过去 8 小时无明显的巨鲸集中吸筹迹象，属于相对健康的自然增长。\nAI 叙事结合 BONK 的社区基础有一定的市场吸引力。但需注意，任何新币都存在不可预知风险，建议仓位适中，保持理性。',
   tags:['four.meme NEW','AI 叙事','流动性较好'], fourUrl:'https://four.meme'},
  {id:4, icon:'🐲', name:'DRAGONX', time:'11小时前', liq:'$89K', holders:'567', change:'-12%', risk:'high', riskLabel:'高风险', heatScore:62,
   verdictShort:'本庭观察到 DRAGONX 已出现早期卖压。上线 11 小时即下跌 12%，散户情绪开始动摇。',
   verdictFull:'链上数据显示，部分早期进场地址已开始分批出货。持仓集中度偏高，前 5 地址合计持有约 55%。目前价格趋势偏弱，需要等待明确的企稳信号。\n本庭建议当前不宜追入，若已持仓可考虑降低仓位至可承受范围，等待社区能否重新聚合叙事。',
   tags:['four.meme','卖压出现','谨慎观望'], fourUrl:'https://four.meme'},
  {id:5, icon:'⚡', name:'ZAPCAT', time:'14小时前', liq:'$210K', holders:'1,056', change:'+67%', risk:'mid', riskLabel:'中风险', heatScore:84,
   verdictShort:'ZAPCAT 的 14 小时表现相当亮眼。涨幅 67% 且持仓人数破千，显示有真实社区在跟进。',
   verdictFull:'从链上活跃度看，ZAPCAT 的交易频次持续，并非单纯的刷量。$210K 流动性提供了较好的出入场空间。但上涨 67% 之后追入需要承担回调风险。\n本庭建议：如果你在早期已进场，可以考虑部分止盈锁住利润；如果还未进场，等待回调后再考虑参与更为稳妥。',
   tags:['four.meme','涨势良好','社区活跃'], fourUrl:'https://four.meme'},
  {id:6, icon:'🍄', name:'SHROOMZ', time:'18小时前', liq:'$62K', holders:'428', change:'+234%', risk:'high', riskLabel:'高风险', heatScore:79,
   verdictShort:'234% 的涨幅令人眩晕。但本庭见过太多从 +300% 直接归零的案例——这个数字本身就是风险信号。',
   verdictFull:'极端涨幅通常伴随着极端集中的筹码结构。链上数据显示 SHROOMZ 持仓高度集中，少数地址掌握大量筹码。\n本庭强烈建议：如未持仓不宜此时入场；如已持仓获利丰厚，应考虑大幅减仓，只用"赚来的钱"继续博弈。止损是你唯一的朋友。',
   tags:['four.meme NEW','极高波动','极度谨慎'], fourUrl:'https://four.meme'},
  {id:7, icon:'🌊', name:'WAVEMEME', time:'22小时前', liq:'$445K', holders:'2,134', change:'+29%', risk:'low', riskLabel:'低风险', heatScore:95,
   verdictShort:'WAVEMEME 是本期新案中持仓人数最多的项目，社区基础相对扎实，流动性充足。',
   verdictFull:'2,134 名持仓地址和 $445K 流动性的组合，在 four.meme 新项目中属于头部水平。持仓分散，链上交互健康，无明显操控迹象。\n该项目展现出较强的社区自发增长特征。本庭认为风险相对可控，可以考虑小仓参与，但仍需设置止损，Meme 市场没有绝对安全。',
   tags:['four.meme','社区最大','流动性充足'], fourUrl:'https://four.meme'},
];

const riskColors = {low:'nc-risk-low', mid:'nc-risk-mid', high:'nc-risk-high'};

function renderNewCoins() {
  const scroll = document.getElementById('newcoinScroll');
  if(!scroll)return;
  scroll.innerHTML = newCoins.map(c => `
    <div class="nc-card" onclick="openModal(${c.id})">
      <div class="nc-top">
        <div class="nc-head">
          <div class="nc-avatar">
            ${c.icon}
            <div class="nc-risk ${riskColors[c.risk]}">${c.riskLabel}</div>
          </div>
          <div class="nc-name-block">
            <div class="nc-name">${c.name}</div>
            <div class="nc-time">${c.time}上线</div>
          </div>
        </div>
        <div class="nc-metrics">
          <div class="nc-metric"><div class="nc-metric-val">${c.liq}</div><div class="nc-metric-lbl">初始流动性</div></div>
          <div class="nc-metric"><div class="nc-metric-val">${c.holders}</div><div class="nc-metric-lbl">持仓地址</div></div>
          <div class="nc-metric"><div class="nc-metric-val ${c.change.startsWith('+')?'up':'down'}">${c.change}</div><div class="nc-metric-lbl">涨跌幅</div></div>
        </div>
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <span style="font-size:9px;color:var(--text3);font-weight:600">🔥 热度指数</span>
            <span style="font-size:9px;font-weight:700;color:var(--accent);font-family:var(--mono)">${c.heatScore||72}/100</span>
          </div>
          <div style="height:3px;background:var(--border);border-radius:99px">
            <div style="height:100%;width:${c.heatScore||72}%;background:linear-gradient(to right,var(--accent),#ff8a65);border-radius:99px"></div>
          </div>
        </div>
      </div>
      <div class="nc-verdict">
        <div class="nc-verdict-label">⚖️ AI 法官庭前印象 <span style="float:right;background:#fffbeb;color:#d97706;border:1px solid #fde68a;border-radius:99px;padding:1px 7px;font-size:9px;font-weight:700;letter-spacing:0.02em">🔥 热度已达标</span></div>
        <div class="nc-verdict-text">${c.verdictShort.substring(0,60)}…</div>
      </div>
      <div class="nc-bottom">
        <button class="nc-btn-primary" onclick="event.stopPropagation();openModal(${c.id})">展开庭审</button>
        <a class="nc-btn-secondary" href="${c.fourUrl}" target="_blank" onclick="event.stopPropagation()">four.meme ↗</a>
      </div>
    </div>
  `).join('');
}

function openModal(id) {
  const c = newCoins.find(x => x.id === id);
  if (!c) return;
  document.getElementById('modalAvatar').textContent = c.icon;
  document.getElementById('modalName').textContent = c.name;
  document.getElementById('modalSub').textContent = `four.meme · ${c.time}上线 · ${c.riskLabel}`;
  document.getElementById('modalMetrics').innerHTML = [
    {val:c.liq, lbl:'初始流动性'},{val:c.holders, lbl:'持仓地址'},
    {val:c.change, lbl:'涨跌幅'},{val:c.tags[0], lbl:'来源'},{val:'待审', lbl:'社区评级'},{val:'—', lbl:'巨鲸动向'}
  ].map(m=>`<div class="nc-modal-metric"><div class="nc-modal-metric-val">${m.val}</div><div class="nc-modal-metric-lbl">${m.lbl}</div></div>`).join('');
  document.getElementById('modalVerdictShort').textContent = c.verdictShort;
  document.getElementById('modalVerdictFull').innerHTML = c.verdictFull.replace(/\n/g,'<br>');
  document.getElementById('modalTags').innerHTML = c.tags.map(t=>`<span class="nc-modal-tag">${t}</span>`).join('');
  document.getElementById('modalFourLink').href = c.fourUrl;
  document.getElementById('ncModalOverlay').classList.add('open');
}
function closeModal(e) { if(e.target === document.getElementById('ncModalOverlay')) closeModalDirect(); }
function closeModalDirect() { document.getElementById('ncModalOverlay').classList.remove('open'); }

/* ── 折线图 ── */
const chartColors=['#ff6340','#16a34a','#2563eb','#d97706','#7c3aed','#0891b2','#dc2626','#059669','#9333ea','#f59e0b'];
const days=['4/1','4/2','4/3','4/4','4/5','4/6','4/7'];
const coinTrends={};let chartVisible={};let chartData=[];

function genTrend(base){
  const arr=[base];
  for(let i=1;i<7;i++){const last=arr[i-1];arr.push(Math.max(10,Math.min(100,Math.round(last+(Math.random()-.46)*12))));}
  return arr;
}

function initChart(){
  allCoins.forEach((c,i)=>{coinTrends[c.name]=genTrend(c.score);chartVisible[c.name]=i<5;});
  const legend=document.getElementById('chartLegend');
  if(!legend)return;
  legend.innerHTML=allCoins.map((c,i)=>`
    <div class="chart-legend-item ${chartVisible[c.name]?'':'off'}"
         style="border-color:${chartColors[i]};color:${chartColors[i]};background:${chartVisible[c.name]?chartColors[i]+'18':'transparent'}"
         onclick="toggleChartLine('${c.name}',${i},this)">
      <div class="chart-legend-dot" style="background:${chartColors[i]}"></div>${c.icon}${c.name}
    </div>`).join('');
  const cxl=document.getElementById('chartXLabels');if(cxl)cxl.innerHTML=days.map(d=>`<span>${d}</span>`).join('');
  drawChart();
  const canvas=document.getElementById('heatChart');
  if(!canvas)return;
  canvas.addEventListener('mousemove',onChartMouseMove);
  canvas.addEventListener('mouseleave',()=>document.getElementById('chartTooltip').style.display='none');
  // 初始化气泡图和雷达图
  initBubbleChart();
  initRadarChart();
  window.addEventListener('resize',()=>{drawChart();drawBubbleChart();});
}

function toggleChartLine(name,idx,el){
  chartVisible[name]=!chartVisible[name];
  el.classList.toggle('off');
  el.style.background=chartVisible[name]?chartColors[idx]+'18':'transparent';
  drawChart();
}

function drawChart(){
  const canvas=document.getElementById('heatChart');
  if(!canvas)return;
  const dpr=window.devicePixelRatio||1;
  const w=canvas.offsetWidth,h=180;
  canvas.width=w*dpr;canvas.height=h*dpr;
  const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
  const pad={top:12,right:12,bottom:8,left:36};
  const iw=w-pad.left-pad.right,ih=h-pad.top-pad.bottom;
  ctx.clearRect(0,0,w,h);
  // 网格
  [0,25,50,75,100].forEach(v=>{
    const y=pad.top+ih-(v/100)*ih;
    ctx.strokeStyle='#e8e8e4';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(pad.left,y);ctx.lineTo(pad.left+iw,y);ctx.stroke();
    ctx.fillStyle='#a8a8a4';ctx.font='10px monospace';ctx.textAlign='right';
    ctx.fillText(v,pad.left-6,y+3);
  });
  // 线
  chartData=[];
  allCoins.forEach((c,ci)=>{
    if(!chartVisible[c.name])return;
    const trend=coinTrends[c.name],color=chartColors[ci];
    const pts=trend.map((v,i)=>({x:pad.left+(i/(days.length-1))*iw,y:pad.top+ih-(v/100)*ih,v,name:c.name,icon:c.icon,color,day:days[i]}));
    chartData.push({name:c.name,color,pts});
    // 渐变填充
    const grad=ctx.createLinearGradient(0,pad.top,0,pad.top+ih);
    grad.addColorStop(0,color+'28');grad.addColorStop(1,color+'00');
    ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
    for(let i=1;i<pts.length;i++){const cx=(pts[i-1].x+pts[i].x)/2;ctx.bezierCurveTo(cx,pts[i-1].y,cx,pts[i].y,pts[i].x,pts[i].y);}
    ctx.lineTo(pts[pts.length-1].x,pad.top+ih);ctx.lineTo(pts[0].x,pad.top+ih);
    ctx.closePath();ctx.fillStyle=grad;ctx.fill();
    // 线条
    ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.lineJoin='round';
    ctx.moveTo(pts[0].x,pts[0].y);
    for(let i=1;i<pts.length;i++){const cx=(pts[i-1].x+pts[i].x)/2;ctx.bezierCurveTo(cx,pts[i-1].y,cx,pts[i].y,pts[i].x,pts[i].y);}
    ctx.stroke();
    // 端点
    pts.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();});
  });
}

function onChartMouseMove(e){
  const canvas=document.getElementById('heatChart');
  const rect=canvas.getBoundingClientRect();
  const mx=e.clientX-rect.left,my=e.clientY-rect.top;
  const tt=document.getElementById('chartTooltip');
  let closest=null,minDist=Infinity;
  chartData.forEach(line=>line.pts.forEach(p=>{
    const d=Math.sqrt((p.x-mx)**2+(p.y-my)**2);
    if(d<minDist){minDist=d;closest={...p,color:line.color};}
  }));
  if(closest&&minDist<28){
    tt.style.display='block';
    tt.style.left=Math.min(closest.x+12,canvas.offsetWidth-140)+'px';
    tt.style.top=Math.max(closest.y-40,4)+'px';
    document.getElementById('ttName').textContent=`${closest.icon||''}${closest.name} · ${closest.day}`;
    document.getElementById('ttVal').textContent=`综合评分 ${closest.v}/100`;
    tt.style.background=closest.color;
  }else{tt.style.display='none';}
}

/* ── 势力榜列表 + 翻页 ── */
const allCoins=[
  {name:'DOGE',icon:'🐶',type:'CEX',score:92,votes:1842,change:'+12%',up:true,heat:92,tags:['rct-cex']},
  {name:'PEPE',icon:'🐸',type:'CEX',score:76,votes:1431,change:'-8%',up:false,heat:76,tags:['rct-cex','rct-whale-out']},
  {name:'TURBO',icon:'⚡',type:'DEX',score:80,votes:634,change:'+31%',up:true,heat:80,tags:['rct-dex','rct-new','rct-whale-in'],isNew:true},
  {name:'WIF',icon:'🎩',type:'CEX',score:61,votes:987,change:'+2%',up:true,heat:61,tags:['rct-cex']},
  {name:'MAGA',icon:'🦅',type:'DEX',score:71,votes:521,change:'+18%',up:true,heat:71,tags:['rct-dex']},
  {name:'BONK',icon:'🔨',type:'CEX',score:54,votes:743,change:'+5%',up:true,heat:54,tags:['rct-cex','rct-whale-in']},
  {name:'GIGA',icon:'🦾',type:'DEX',score:58,votes:389,change:'+9%',up:true,heat:58,tags:['rct-dex','rct-new'],isNew:true},
  {name:'FLOKI',icon:'🪙',type:'CEX',score:38,votes:412,change:'-3%',up:false,heat:38,tags:['rct-cex','rct-whale-out']},
  {name:'NEIRO',icon:'🐱',type:'DEX',score:45,votes:276,change:'+6%',up:true,heat:45,tags:['rct-dex']},
  {name:'MOCHI',icon:'🍡',type:'DEX',score:32,votes:198,change:'-12%',up:false,heat:32,tags:['rct-dex','rct-new'],isNew:true},
];
const voted={},baseVotes=5214;
const ITEMS_PER_PAGE=10;
let currentPage=1;

function renderRankList(){
  const sorted=[...allCoins].sort((a,b)=>(b.score+(voted[b.name]?3:0))-(a.score+(voted[a.name]?3:0)));
  const total=sorted.length,totalPages=Math.ceil(total/ITEMS_PER_PAGE);
  const start=(currentPage-1)*ITEMS_PER_PAGE;
  const items=sorted.slice(start,start+ITEMS_PER_PAGE);
  const rl=document.getElementById('rankList');if(!rl)return;
  rl.innerHTML=items.map((c,pi)=>{
    const i=start+pi;
    const rc=i===0?'g1':i===1?'g2':i===2?'g3':'';
    const v=c.votes+(voted[c.name]?1:0);
    const wt=c.tags.includes('rct-whale-out')?`<span class="rl-tag rlt-out" title="巨鲸出逃">🐳↓</span>`:c.tags.includes('rct-whale-in')?`<span class="rl-tag rlt-in" title="巨鲸买入">🐳↑</span>`:'';
    const nt=c.isNew?`<span class="rl-tag rlt-new">NEW</span>`:'';
    const tt=`<span class="rl-tag ${c.type==='CEX'?'rlt-cex':'rlt-dex'}">${c.type}</span>`;
    const myBet = coinBets[c.name];
    const betLabel = myBet?.myDir ? (myBet.myDir === 'up' ? '📈已押' : '📉已押') : '押注';
    return `<div class="rl-row ${voted[c.name]?'voted':''}" onclick="selectRadarFromList('${c.name}')">
      <div class="rl-rank ${rc}">${i+1}</div>
      <div class="rl-avatar">${c.icon}</div>
      <div class="rl-name-cell"><span class="rl-name">${c.name}</span><div class="rl-tags">${tt}${nt}${wt}</div></div>
      <div class="rl-cell">${c.score}</div>
      <div class="rl-cell">${v.toLocaleString()}</div>
      <div class="rl-cell ${c.up?'up':'down'}">${c.change}</div>
      <div class="rl-heat-cell"><div class="rl-heat-bar"><div class="rl-heat-fill" style="width:${c.heat}%"></div></div><span class="rl-heat-num">${c.heat}</span></div>
      <div class="rl-bet-cell"><button class="rbb ${myBet?.myDir?'has-bet':''}" onclick="event.stopPropagation();openBetModal('${c.name}')">${betLabel}</button></div>
      <div class="rl-vote-cell"><button class="rvb ${voted[c.name]?'on':''}" onclick="event.stopPropagation();vote('${c.name}')">${voted[c.name]?'已投 ✓':'投票'}</button></div>
    </div>`;
  }).join('');
  const pi=document.getElementById('pageInfo');if(pi)pi.textContent=`第 ${currentPage} / ${totalPages} 页 · 共 ${total} 项`;
  const btns=document.getElementById('pageBtns');
  if(!btns)return;
  btns.innerHTML=`<button class="page-btn" onclick="goPage(${currentPage-1})" ${currentPage===1?'disabled':''}>‹</button>`
    +Array.from({length:totalPages},(_,i)=>`<button class="page-btn ${currentPage===i+1?'active':''}" onclick="goPage(${i+1})">${i+1}</button>`).join('')
    +`<button class="page-btn" onclick="goPage(${currentPage+1})" ${currentPage===totalPages?'disabled':''}>›</button>`;
  const tvEl=document.getElementById('totalV');if(tvEl)tvEl.textContent=(baseVotes+Object.keys(voted).length).toLocaleString();
}

function selectRadarFromList(name){
  radarCoin=name;
  document.querySelectorAll('.radar-coin-btn').forEach(b=>{
    b.classList.toggle('active',b.textContent.includes(name));
  });
  drawRadarChart();
  // 滚动到雷达图
  document.querySelector('.radar-section')?.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function goPage(p){
  const tp=Math.ceil(allCoins.length/ITEMS_PER_PAGE);
  if(p<1||p>tp)return;
  currentPage=p;renderRankList();
}

function vote(name){
  voted[name]?delete voted[name]:voted[name]=true;
  renderRankList();updateCertBar();
}

/* ── 陪审员证书 ── */
function updateCertBar(){
  const bar=document.getElementById('certBar');
  const keys=Object.keys(voted);
  if(keys.length===0){bar.classList.remove('show');return}
  bar.classList.add('show');
  const coinData=keys.map(k=>allCoins.find(c=>c.name===k)).filter(Boolean);
  document.getElementById('certBarCoins').textContent=coinData.map(c=>c.icon+c.name).join('、');
}

async function openCertModal(){
  const keys=Object.keys(voted);
  if(keys.length===0)return;
  const coinData=keys.map(k=>allCoins.find(c=>c.name===k)).filter(Boolean);

  // 填充证书卡片
  document.getElementById('certNo').textContent=`NO.2026-001 · ${new Date().toLocaleDateString('zh-CN')}`;

  // 投票的币 chips
  const verdictMap={'持有':'HOLD','谨慎':'CAUTION','观望':'WATCH','小仓':'SMALL','等待':'WAIT'};
  document.getElementById('certCoinsRow').innerHTML=coinData.map(c=>`
    <div class="cert-coin-chip">
      <span class="cert-coin-icon">${c.icon}</span>
      <div>
        <div class="cert-coin-name">${c.name}</div>
        <div class="cert-coin-verdict">${c.change} · ${c.type}</div>
      </div>
    </div>
  `).join('');

  // 重置评语区为 loading
  document.getElementById('certQuote').innerHTML=`
    <div class="cert-quote-loading">
      <div class="jp-dots"><span></span><span></span><span></span></div>
      法官正在撰写专属评语…
    </div>`;

  // 打开弹窗
  document.getElementById('certOverlay').classList.add('open');
  document.getElementById('certClaimBtn').classList.add('loading');
  document.getElementById('certClaimBtn').textContent='生成中…';

  // 调用 AI 生成评语（mock 数据模式：直接用预设）
  const mockQuotes=[
    `你投票支持了 ${coinData.map(c=>c.name).join('、')}。本庭观察到你的选择兼顾了主流信仰与新兴机会，是一个懂得分散风险的理性陪审员。但请记住：法庭的判决只是参考，止损单才是你最忠诚的伙伴。`,
    `${coinData.map(c=>c.icon+c.name).join(' ')}——你的投票组合透露了一个老手的直觉。本庭认为，能在 Meme 市场存活下来的人，不是最聪明的，而是最懂得止损的。愿你下期继续参与，带着你的仓位和理智。`,
    `本庭注意到你在本期共支持了 ${coinData.length} 个项目。多元投票是智慧的体现，但本庭提醒：投票不等于梭哈。你的陪审员身份已被记录在案，下期开庭，希望你的仓位还在。`,
  ];
  const quote=mockQuotes[Math.floor(Math.random()*mockQuotes.length)];

  // 短暂延迟模拟 AI 思考
  await new Promise(r=>setTimeout(r,1200));

  document.getElementById('certQuote').innerHTML=`<div class="cert-quote-text">"${quote}"</div>`;
  document.getElementById('certClaimBtn').classList.remove('loading');
  document.getElementById('certClaimBtn').textContent='🎖️ 领取陪审员证书';
}

function closeCertModal(e){if(e.target===document.getElementById('certOverlay'))closeCertDirect()}
function closeCertDirect(){document.getElementById('certOverlay').classList.remove('open')}

async function copyCertImage(){
  const btn=document.getElementById('certCopyBtn');
  btn.textContent='生成中…';btn.style.opacity='.7';btn.style.pointerEvents='none';
  try{
    const card=document.getElementById('certCard');
    // 用 html2canvas 渲染
    const script=document.createElement('script');
    script.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    document.head.appendChild(script);
    await new Promise(r=>script.onload=r);
    const canvas=await html2canvas(card,{scale:2,backgroundColor:'#ffffff',useCORS:true,logging:false});
    canvas.toBlob(async blob=>{
      try{
        await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);
        btn.textContent='✓ 已复制到剪贴板！';
        setTimeout(()=>{btn.textContent='📋 复制图片到剪贴板';btn.style.opacity='';btn.style.pointerEvents='';},2500);
      }catch{
        // 降级：下载图片
        const url=URL.createObjectURL(blob);
        const a=document.createElement('a');a.href=url;a.download='meme-court-juror.png';a.click();
        URL.revokeObjectURL(url);
        btn.textContent='✓ 已下载图片';
        setTimeout(()=>{btn.textContent='📋 复制图片到剪贴板';btn.style.opacity='';btn.style.pointerEvents='';},2500);
      }
    },'image/png');
  }catch(err){
    btn.textContent='复制失败，请截图保存';
    setTimeout(()=>{btn.textContent='📋 复制图片到剪贴板';btn.style.opacity='';btn.style.pointerEvents='';},2500);
  }
}

/* ── 巨鲸 ── */
const whaleData=[
  {time:'刚刚',tag:'wt-run',tagText:'出逃',coin:'PEPE',text:'某地址将 2,300 万枚 PEPE 转入 Binance 热钱包。',trans:'他要跑了，而且跑得很急。'},
  {time:'32分前',tag:'wt-buy',tagText:'抄底',coin:'WIF',text:'巨鲸 0x7a…4f 过去 72 小时分 12 笔买入 $83 万 WIF。',trans:'他在抄底，且刻意不想让你看出来。'},
  {time:'1小时前',tag:'wt-buy',tagText:'买入',coin:'TURBO',text:'新地址 0xb3…9c 以市价单一次性买入 $42 万 TURBO。',trans:'有人在赌叙事，赌注不小。'},
  {time:'3小时前',tag:'wt-hold',tagText:'观望',coin:'DOGE',text:'大量 DOGE 链上转移但未流入任何交易所。',trans:'他在换冷钱包，长期主义者，不慌。'},
  {time:'5小时前',tag:'wt-run',tagText:'减仓',coin:'FLOKI',text:'FLOKI 前 10 持仓地址中 3 个同步减仓 40%。',trans:'大户协同撤退，你还在等什么？'},
  {time:'8小时前',tag:'wt-buy',tagText:'建仓',coin:'BONK',text:'0xf1…2a 分批建仓 BONK，总计 $31 万，均价偏低。',trans:'聪明钱在悄悄进场，动作很轻。'},
  {time:'12小时前',tag:'wt-run',tagText:'出逃',coin:'MOCHI',text:'MOCHI 创始人关联地址将 80% 持仓转出。',trans:'项目方自己跑路？这波不用翻译。'},
];
function renderWhaleFeed(){
  const wf=document.getElementById('whaleFeed');if(!wf)return;
  wf.innerHTML=whaleData.map(w=>`
    <div class="wf-item">
      <div class="wf-top"><span class="wtag ${w.tag}">${w.tagText}</span><span class="wf-coin">${w.coin}</span><span class="wf-time">${w.time}</span></div>
      <div class="wtext">${w.text}</div>
      <div class="wtrans">翻译：${w.trans}</div>
    </div>`).join('');
}

/* ── 遗言 ── */
const notes=[
  {text:'满仓进去，结果一路阴跌。我没等来翻倍，等来的是项目方改名。望后来者引以为戒。',author:'持有PEPE 87天',type:'rip',rot:-2.5},
  {text:'我以为找到了下一个DOGE。没想到只是找到了下一个教训。钱没了，但精神还在。',author:'某散户，仓位归零',type:'rip',rot:1.8},
  {text:'朋友说这个稳，我信了。朋友早跑了，我还在站岗。请转告我家人，我尽力了。',author:'WIF 站岗中，亏67%',type:'rip',rot:-1.2},
  {text:'每次看到绿色就以为要反弹，结果是回光返照。我的止损单一次都没触发过。',author:'BONK持有者',type:'rip',rot:2.3},
  {text:'BONK小仓参与，意外翻了四倍。感谢法庭本周的判决，救了我一命。',author:'理性散户，安然离场',type:'win',rot:-1.8},
  {text:'DOGE真的是信仰，别的都是赌博。持了三年，终于等来了回本的那天。',author:'DOGE信仰者',type:'win',rot:1.5},
];
function renderNotes(ai=-1){
  if(!document.getElementById('notesGrid')&&!document.getElementById('miniNotesGrid'))return;
  document.getElementById('notesGrid') && (document.getElementById('notesGrid').innerHTML=notes.map((n,i)=>`
    <div class="note ${n.type} ${i===ai?'new-note':''}" style="transform:rotate(${n.rot}deg);--rot:${n.rot}deg;">
      <div class="note-tag">${n.type==='rip'?'RIP':'WIN'}</div>
      <div class="note-text">"${n.text}"</div>
      <div class="note-author">${n.author}</div>
    </div>`).join(''));
  // 迷你软木板便利贴
  const mini = document.getElementById('miniNotesGrid');
  if(mini){
    const rots=[-2.5,1.8,-1.2,2.3];
    mini.innerHTML = notes.slice(0,4).map((n,i)=>`
      <div class="mini-note ${n.type}" style="transform:rotate(${rots[i]||0}deg)">
        <div class="mini-note-tag">${n.type==='rip'?'RIP':'WIN'}</div>
        <div class="mini-note-text">"${n.text.substring(0,48)}${n.text.length>48?'…':''}"</div>
        <div class="mini-note-author">${n.author}</div>
      </div>`).join('');
  }
}
function submitEpi(){
  const el=document.getElementById('epi');
  const val=el?.value.trim();if(!val)return;
  notes.unshift({text:val,author:'匿名散户 · 刚刚提交',type:'rip',rot:(Math.random()-.5)*5});
  if(notes.length>6)notes.pop();
  if(el)el.value='';
  renderNotes(0);
  const m=document.getElementById('smsg');if(m){m.style.display='block';setTimeout(()=>m.style.display='none',3500);}
}
function submitSideEpi(){
  const val=document.getElementById('sideEpi')?.value.trim();if(!val)return;
  notes.unshift({text:val,author:'匿名散户 · 刚刚提交',type:'rip',rot:(Math.random()-.5)*5});
  if(notes.length>6)notes.pop();
  document.getElementById('sideEpi').value='';
  renderNotes(0);
  const m=document.getElementById('sideSmsg');if(m){m.style.display='block';setTimeout(()=>m.style.display='none',3500);}
}

/* ── AI 法官申诉 ── */
function fillHint(el){document.getElementById('appealInput').value=el.textContent;document.getElementById('appealInput').focus()}
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&document.activeElement.id==='appealInput')submitAppeal()});

// ── 已结案裁定弹窗 ──
function openVerdictModal(id) {
  const c = courtData.closed.find(x => x.id === id);
  if (!c) return;

  const isWinUp = c.verdictResult?.includes('看涨');
  const verdictColor = (c.verdict === '持有' || c.verdict === '小仓' || c.verdict === '建仓') ? '#16a34a'
    : (c.verdict === '等待' || c.verdict === '谨慎') ? '#dc2626' : '#d97706';
  const verdictBg = (c.verdict === '持有' || c.verdict === '小仓' || c.verdict === '建仓') ? '#f0fdf4'
    : (c.verdict === '等待' || c.verdict === '谨慎') ? '#fef2f2' : '#fffbeb';
  const verdictLabel = (c.verdict === '持有' || c.verdict === '小仓' || c.verdict === '建仓') ? '📈 ' + c.verdict
    : (c.verdict === '等待' || c.verdict === '谨慎') ? '📉 ' + c.verdict : '⚖️ ' + c.verdict;

  document.getElementById('vmIcon').textContent = c.icon;
  document.getElementById('vmName').textContent = c.name;
  document.getElementById('vmId').textContent = c.id + ' · ' + c.tierLabel;
  const vmV = document.getElementById('vmVerdict');
  vmV.textContent = verdictLabel;
  vmV.style.cssText = `font-size:13px;font-weight:800;padding:5px 14px;border-radius:99px;background:${verdictBg};color:${verdictColor};border:1.5px solid ${verdictColor}40`;
  document.getElementById('vmConfidence').textContent = `置信度 ${c.confidence || 80}%`;
  document.getElementById('vmRisk').textContent = c.risk || '中风险';
  document.getElementById('vmResult').textContent = c.verdictResult || '';

  // 裁定文字
  const lines = (c.verdictShort || '').split('\n').filter(Boolean);
  const last = lines.pop();
  document.getElementById('vmShort').innerHTML =
    lines.map(l => `<span style="color:var(--text2)">${l}</span>`).join('<br>') +
    (lines.length ? '<br>' : '') +
    `<strong style="color:var(--accent)">${last}</strong>`;

  document.getElementById('vmPool').textContent = (c.pool || 0).toLocaleString();
  document.getElementById('vmParticipants').textContent = c.participants || 0;
  document.getElementById('vmBetUp').textContent = (c.betUp || 0) + '%';

  // 领取区域
  document.getElementById('vmClaimArea').innerHTML = walletConnected
    ? `<button onclick="claimGavelReward('${c.id}')" style="width:100%;background:var(--accent);color:#fff;border:none;border-radius:10px;padding:11px;font-size:13px;font-weight:700;cursor:pointer;font-family:var(--sans);margin-bottom:12px">🎁 领取 $GAVEL 奖励</button>`
    : `<div style="text-align:center;font-size:12px;color:var(--text3);padding:6px 0 12px">连接钱包后可查看并领取押注奖励</div>`;

  document.getElementById('verdictOverlay').style.display = 'flex';
}

function closeVerdictModal(e) {
  if (!e || e.target === document.getElementById('verdictOverlay')) closeVerdictDirect();
}
function closeVerdictDirect() {
  document.getElementById('verdictOverlay').style.display = 'none';
}


async function claimGavelReward(caseId) {
  if (!walletConnected) { showToast('请先连接钱包'); return; }
  const btn = event.target;
  btn.textContent = '⏳ 链上领取中…';
  btn.disabled = true;

  // claimGavel(string caseId)
  const cidBytes = new TextEncoder().encode(caseId);
  const cidHex = Array.from(cidBytes).map(b => b.toString(16).padStart(2,'0')).join('');
  const cidLen = cidBytes.length.toString(16).padStart(64,'0');
  const cidPadded = cidHex.padEnd(Math.ceil(cidHex.length/64)*64,'0');
  // claimGavel selector: keccak256("claimGavel(string)") 首4字节
  const data = '0x' + 'a0712d68'
    + '0000000000000000000000000000000000000000000000000000000000000020'
    + cidLen + cidPadded;

  const txHash = await callContract(MEME_COURT_ADDRESS, data);
  if (txHash) {
    btn.textContent = '✅ 领取成功！';
    showToast('🎁 $GAVEL 奖励已发放！');
    // 刷新余额
    setTimeout(async () => {
      const bal = await fetchRealGavelBalance(walletAddress);
      if (bal > 0) {
        gavelBalance = Math.floor(bal);
        const el = document.getElementById('gavelBalNum');
        if (el) el.textContent = gavelBalance.toLocaleString();
      }
    }, 3000);
  } else {
    btn.textContent = '🎁 领取 $GAVEL 奖励';
    btn.disabled = false;
  }
}


// 把裁定摘要哈希以 0-value tx 的 input data 形式写入链上，不依赖任何额外合约
async function doStoreVerdict(btn) {
  btn.disabled = true;
  btn.textContent = '⏳ 存证中…';
  const txHash = await storeVerdictOnChain(window._lastVerdictQ || '', window._lastVerdictParsed || {});
  if (txHash) {
    btn.outerHTML = `<div style="margin-top:6px;font-size:11px;color:#16a34a">🔒 已上链存证 · <a href="https://testnet.bscscan.com/tx/${txHash}" target="_blank" style="color:var(--accent)">BSCScan ↗</a></div>`;
  } else {
    btn.textContent = '🔒 上链存证';
    btn.disabled = false;
  }
}

async function storeVerdictOnChain(question, parsed) {
  if (!walletConnected || !window.ethereum?.isMetaMask) return null;
  try {
    const summary = `MEME-COURT|${parsed.verdict}|${parsed.confidence}|${question.slice(0,50)}|${Date.now()}`;
    const hashHex = simpleHashHex(summary);
    // 前缀 0x4d454d45 = "MEME"（方便 BSCScan 上识别）
    const data = '0x4d454d45' + hashHex;
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{ from: walletAddress, to: MEME_COURT_ADDRESS, data, value: '0x0', gas: '0x7530' }]
    });
    return txHash;
  } catch(e) { return null; } // 存证失败不影响主流程
}

// 简易确定性哈希（无需 keccak256 库，足够做存证 ID）
function simpleHashHex(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
  h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
  const combined = (4294967296 * (2097151 & h2) + (h1>>>0));
  return combined.toString(16).padStart(16,'0') + Date.now().toString(16).padStart(16,'0');
}

const DEEPSEEK_KEY = 'sk-792c9ca476a64b56a262030afb063f4b';
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

async function callGemini(systemPrompt, userMessage) {
  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      max_tokens: 1000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]
    })
  });
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';
  console.log('DeepSeek 原始返回:', text);
  return text;
}

async function submitAppeal() {
  const q = document.getElementById('appealInput').value.trim();
  if (!q) return;
  const btn = document.getElementById('appealBtn');
  const panel = document.getElementById('judgePanel');
  const jpQ = document.getElementById('jpQuestion');
  const jpBody = document.getElementById('jpBody');
  const jpStamp = document.getElementById('jpStamp');

  btn.classList.add('loading'); btn.textContent = '审阅中…';
  panel.classList.add('open');
  jpQ.textContent = `"${q}"`;
  jpBody.innerHTML = `<div class="jp-loading"><div class="jp-dots"><span></span><span></span><span></span></div>法官正在审阅案情…</div>`;
  jpStamp.textContent = `MEME COURT · ${new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}`;

  const sys = `你是 Meme 法庭的 AI 法官，代号「链上包公」，在 BNB Chain 的 four.meme 平台工作。
风格：幽默毒舌、数据扎实、有立场、敢判断，像一个见过太多韭菜被割的老法官。
严格按以下 JSON 格式输出，不输出任何其他内容，不加 markdown 代码块：
{"verdict":"BULLISH或BEARISH或NEUTRAL","confidence":0到100的数字,"short":"3-4句精简裁定，法庭语气，幽默毒舌，最后一句扎心。句间用\\n分隔。","full":"详细分析，链上数据逻辑+风险提示+具体建议，2-3段，段间用\\n\\n分隔。","risk":"低风险或中风险或高风险或极高风险"}
注意：不构成投资建议，纯娱乐。`;

  try {
    const raw = await callGemini(sys, q);
    let parsed;
    try { parsed = JSON.parse(raw.replace(/```json|```/g,'').trim()); }
    catch { parsed = { verdict:'NEUTRAL', confidence:50, short:raw, full:'', risk:'未知' }; }

    const verdictColor = parsed.verdict === 'BULLISH' ? '#16a34a' : parsed.verdict === 'BEARISH' ? '#dc2626' : '#d97706';
    const verdictText = parsed.verdict === 'BULLISH' ? '📈 看涨' : parsed.verdict === 'BEARISH' ? '📉 看跌' : '⚖️ 中立';
    const lines = (parsed.short || '').split('\n').filter(Boolean);
    const shortHTML = lines.map((l,i) => i === lines.length-1 ? `<strong>${l}</strong>` : l).join('<br>');

    // 检查是否有相关的开庭案件
    const qLower = q.toLowerCase();
    const relatedCase = courtData.live.find(c =>
      qLower.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(qLower.split(' ')[0])
    );

    const caseLink = relatedCase ? `
      <div style="margin-top:12px;padding:10px 14px;background:var(--accent-bg);border-radius:8px;border:1px solid var(--accent-dim)">
        <div style="font-size:11px;color:var(--accent);font-weight:700;margin-bottom:4px">⚖️ 该案件正在开庭</div>
        <div style="font-size:13px;color:var(--text);margin-bottom:6px">${relatedCase.icon} ${relatedCase.name} · 奖池 ${relatedCase.pool.toLocaleString()} $GAVEL</div>
        <button onclick="showPage('court');setTimeout(()=>openCourtDetail('${relatedCase.id}'),300)" style="font-size:12px;padding:5px 14px;background:var(--accent);color:#fff;border:none;border-radius:6px;cursor:pointer">参与押注 →</button>
      </div>` : '';

    jpBody.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <span style="font-size:13px;font-weight:700;color:${verdictColor}">${verdictText}</span>
        <span style="font-size:11px;color:var(--text3)">置信度 ${parsed.confidence}%</span>
        <span style="font-size:11px;padding:2px 8px;border-radius:4px;background:var(--amber-bg);color:var(--amber)">${parsed.risk || '未知'}</span>
      </div>
      <div class="jp-verdict-short">${shortHTML}</div>
      ${parsed.full ? `<button class="jp-expand-btn" onclick="toggleExpand(this)">▾ 展开完整裁定</button><div class="jp-verdict-full">${parsed.full.replace(/\n/g,'<br>')}</div>` : ''}
      ${caseLink}`;

    // ── 链上裁定存证（改为手动触发，不自动弹 MetaMask）──
    if (walletConnected) {
      const proofBtn = document.createElement('div');
      proofBtn.style.cssText = 'margin-top:10px';
      // 把数据挂在 window 上避免引号嵌套问题
      window._lastVerdictQ = q;
      window._lastVerdictParsed = parsed;
      proofBtn.innerHTML = `<button id="verdictProofBtn" onclick="doStoreVerdict(this)" style="font-size:11px;padding:4px 12px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;cursor:pointer;color:var(--text2);font-family:var(--sans)">🔒 上链存证</button>`;
      jpBody.appendChild(proofBtn);
    }

  } catch(e) {
    jpBody.innerHTML = `<div class="jp-verdict-short"><strong>本庭暂时无法审理此案。</strong><br>网络异常，请稍后再试。</div>`;
  }

  btn.classList.remove('loading'); btn.innerHTML = '⚖️ 提请裁决';
}
function toggleExpand(btn){const f=btn.nextElementSibling;f.classList.toggle('open');btn.textContent=f.classList.contains('open')?'▴ 收起':'▾ 展开完整裁定'}
function closePanel(){document.getElementById('judgePanel').classList.remove('open')}
function shareVerdict(){
  const q=document.getElementById('jpQuestion').textContent,body=document.getElementById('jpBody').innerText;
  navigator.clipboard.writeText(`【Meme 法庭 · AI 法官裁定】\n${q}\n\n${body}\n\nMeme 法庭 · four.meme · 仅供娱乐`).then(()=>{event.target.textContent='已复制 ✓';setTimeout(()=>event.target.textContent='复制分享',2000)});
}
function copyVerdict(){
  navigator.clipboard.writeText(`【Meme 法庭 · 第一期判决书】CASE NO. 2026-001\n🐶DOGE—持有 🐸PEPE—谨慎 🎩WIF—观望 🔨BONK—小仓 🪙FLOKI—等待\nMeme法庭·AI法官·2026.04.07·仅供娱乐`).then(()=>{const e=document.getElementById('copyOk');e.style.display='inline';setTimeout(()=>e.style.display='none',2500)});
}

/* ── 气泡图 ── */
// 每个coin补充雷达维度数据和流动性数据
const coinExtra={
  'DOGE': {liq:95, radar:{community:95,onchain:88,whale:72,narrative:90,liquidity:95}},
  'PEPE': {liq:70, radar:{community:80,onchain:55,whale:35,narrative:70,liquidity:70}},
  'TURBO':{liq:40, radar:{community:60,onchain:72,whale:80,narrative:85,liquidity:40}},
  'WIF':  {liq:60, radar:{community:65,onchain:58,whale:50,narrative:62,liquidity:60}},
  'MAGA': {liq:35, radar:{community:55,onchain:65,whale:45,narrative:78,liquidity:35}},
  'BONK': {liq:55, radar:{community:58,onchain:60,whale:75,narrative:50,liquidity:55}},
  'GIGA': {liq:30, radar:{community:45,onchain:55,whale:40,narrative:65,liquidity:30}},
  'FLOKI':{liq:45, radar:{community:42,onchain:35,whale:28,narrative:40,liquidity:45}},
  'NEIRO':{liq:25, radar:{community:38,onchain:42,whale:35,narrative:48,liquidity:25}},
  'MOCHI':{liq:20, radar:{community:28,onchain:25,whale:22,narrative:35,liquidity:20}},
};
// 风险颜色映射：score >= 75 持有绿, 60-74 观望蓝, 45-59 谨慎橙, <45 风险红
function riskColor(score){
  if(score>=75)return '#16a34a';
  if(score>=60)return '#2563eb';
  if(score>=45)return '#d97706';
  return '#dc2626';
}
function changeToNum(ch){return parseFloat(ch.replace('%',''));}

let bubbleHovered=null;
function initBubbleChart(){
  const canvas=document.getElementById('bubbleChart');
  if(!canvas)return;
  drawBubbleChart();
  canvas.addEventListener('mousemove',onBubbleMouseMove);
  canvas.addEventListener('mouseleave',()=>{
    document.getElementById('bubbleTooltip').style.display='none';
    bubbleHovered=null;drawBubbleChart();
  });
}

function drawBubbleChart(){
  const canvas=document.getElementById('bubbleChart');
  if(!canvas)return;
  const dpr=window.devicePixelRatio||1;
  const w=canvas.offsetWidth,h=220;
  canvas.width=w*dpr;canvas.height=h*dpr;
  const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
  const pad={top:16,right:20,bottom:24,left:44};
  const iw=w-pad.left-pad.right,ih=h-pad.top-pad.bottom;
  ctx.clearRect(0,0,w,h);
  // 网格 & 轴
  ctx.strokeStyle='#e8e8e4';ctx.lineWidth=1;
  // 水平线
  [0,25,50,75,100].forEach(v=>{
    const y=pad.top+ih*(1-v/100);
    ctx.beginPath();ctx.moveTo(pad.left,y);ctx.lineTo(pad.left+iw,y);ctx.stroke();
    ctx.fillStyle='#a8a8a4';ctx.font='9px monospace';ctx.textAlign='right';
    ctx.fillText(v,pad.left-5,y+3);
  });
  // 垂直线 (0在中间)
  const changes=allCoins.map(c=>changeToNum(c.change));
  const minC=Math.min(...changes)-5,maxC=Math.max(...changes)+5;
  const xZero=pad.left+iw*(-minC/(maxC-minC));
  ctx.strokeStyle='#d4d4ce';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(xZero,pad.top);ctx.lineTo(xZero,pad.top+ih);ctx.stroke();
  // Y轴标签
  ctx.fillStyle='#a8a8a4';ctx.font='9px monospace';ctx.textAlign='center';
  ctx.fillText('社区热度',pad.left-30,pad.top+ih/2);
  // 气泡
  allCoins.forEach(c=>{
    const cx=pad.left+iw*((changeToNum(c.change)-minC)/(maxC-minC));
    const cy=pad.top+ih*(1-c.heat/100);
    const liq=(coinExtra[c.name]?.liq||40);
    const r=Math.max(8,Math.min(26,liq*0.22));
    const color=riskColor(c.score);
    const isHov=bubbleHovered===c.name;
    ctx.beginPath();ctx.arc(cx,cy,r+(isHov?3:0),0,Math.PI*2);
    ctx.fillStyle=color+(isHov?'dd':'88');
    ctx.fill();
    ctx.strokeStyle=color;ctx.lineWidth=isHov?2.5:1.5;
    ctx.stroke();
    // emoji label
    ctx.font=`${isHov?13:11}px serif`;ctx.textAlign='center';
    ctx.fillText(c.icon,cx,cy+4);
  });
}

function onBubbleMouseMove(e){
  const canvas=document.getElementById('bubbleChart');
  const rect=canvas.getBoundingClientRect();
  const mx=e.clientX-rect.left,my=e.clientY-rect.top;
  const dpr=window.devicePixelRatio||1;
  const w=canvas.offsetWidth,h=220;
  const pad={top:16,right:20,bottom:24,left:44};
  const iw=w-pad.left-pad.right,ih=h-pad.top-pad.bottom;
  const changes=allCoins.map(c=>changeToNum(c.change));
  const minC=Math.min(...changes)-5,maxC=Math.max(...changes)+5;
  const tt=document.getElementById('bubbleTooltip');
  let found=null;
  allCoins.forEach(c=>{
    const cx=pad.left+iw*((changeToNum(c.change)-minC)/(maxC-minC));
    const cy=pad.top+ih*(1-c.heat/100);
    const liq=(coinExtra[c.name]?.liq||40);
    const r=Math.max(8,Math.min(26,liq*0.22))+4;
    if(Math.sqrt((mx-cx)**2+(my-cy)**2)<r)found=c;
  });
  if(found){
    bubbleHovered=found.name;
    tt.style.display='block';
    tt.style.left=Math.min(e.offsetX+14,canvas.offsetWidth-160)+'px';
    tt.style.top=Math.max(e.offsetY-70,4)+'px';
    document.getElementById('btName').textContent=`${found.icon} ${found.name}`;
    document.getElementById('btChange').textContent=`周涨跌：${found.change}`;
    document.getElementById('btVotes').textContent=`社区票：${found.votes.toLocaleString()}`;
    document.getElementById('btScore').textContent=`综合评分：${found.score}/100`;
    tt.style.background=riskColor(found.score);
  }else{
    bubbleHovered=null;
    tt.style.display='none';
  }
  drawBubbleChart();
}

/* ── 雷达图 ── */
const radarDims=['社区热度','链上健康','巨鲸动向','叙事强度','流动性'];
let radarCoin='DOGE';
function initRadarChart(){
  // 渲染币种选择按钮
  const sel=document.getElementById('radarCoinSelector');
  if(!sel)return;
  sel.innerHTML=allCoins.map(c=>`
    <button class="radar-coin-btn ${c.name===radarCoin?'active':''}" onclick="selectRadarCoin('${c.name}',this)">
      ${c.icon}${c.name}
    </button>`).join('');
  drawRadarChart();
}
function selectRadarCoin(name,el){
  radarCoin=name;
  document.querySelectorAll('.radar-coin-btn').forEach(b=>b.classList.remove('active'));
  el.classList.add('active');
  drawRadarChart();
}
function drawRadarChart(){
  const canvas=document.getElementById('radarChart');
  if(!canvas)return;
  const dpr=window.devicePixelRatio||1;
  const size=260;
  canvas.width=size*dpr;canvas.height=220*dpr;
  canvas.style.width=size+'px';canvas.style.height='220px';
  const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
  const cx=size/2,cy=115,r=85;
  const n=radarDims.length;
  const coin=allCoins.find(c=>c.name===radarCoin);
  const extra=coinExtra[radarCoin]||{radar:{community:50,onchain:50,whale:50,narrative:50,liquidity:50}};
  const vals=[extra.radar.community,extra.radar.onchain,extra.radar.whale,extra.radar.narrative,extra.radar.liquidity];
  const color=riskColor(coin?.score||50);
  ctx.clearRect(0,0,size,220);
  // 背景蛛网
  [20,40,60,80,100].forEach((v,li)=>{
    ctx.beginPath();
    for(let i=0;i<n;i++){
      const angle=-Math.PI/2+(2*Math.PI/n)*i;
      const pr=r*(v/100);
      const px=cx+pr*Math.cos(angle),py=cy+pr*Math.sin(angle);
      i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
    }
    ctx.closePath();
    ctx.strokeStyle=li===4?'#d4d4ce':'#e8e8e4';
    ctx.lineWidth=li===4?1.5:1;ctx.stroke();
    if(v===100){ctx.fillStyle='#a8a8a4';ctx.font='8px monospace';ctx.textAlign='center';ctx.fillText('100',cx,cy-r-5);}
    if(v===50){ctx.fillStyle='#c8c8c4';ctx.font='8px monospace';ctx.textAlign='center';ctx.fillText('50',cx,cy-r*0.5-4);}
  });
  // 轴线 & 标签
  for(let i=0;i<n;i++){
    const angle=-Math.PI/2+(2*Math.PI/n)*i;
    const ex=cx+r*Math.cos(angle),ey=cy+r*Math.sin(angle);
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(ex,ey);
    ctx.strokeStyle='#d4d4ce';ctx.lineWidth=1;ctx.stroke();
    // 标签
    const lx=cx+(r+18)*Math.cos(angle),ly=cy+(r+18)*Math.sin(angle);
    ctx.fillStyle='#6b6b68';ctx.font='bold 10px Inter,sans-serif';
    ctx.textAlign=lx<cx-5?'right':lx>cx+5?'left':'center';
    ctx.textBaseline=ly<cy-5?'bottom':ly>cy+5?'top':'middle';
    ctx.fillText(radarDims[i],lx,ly);
  }
  // 数据多边形
  ctx.beginPath();
  for(let i=0;i<n;i++){
    const angle=-Math.PI/2+(2*Math.PI/n)*i;
    const pr=r*(vals[i]/100);
    const px=cx+pr*Math.cos(angle),py=cy+pr*Math.sin(angle);
    i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
  }
  ctx.closePath();
  ctx.fillStyle=color+'28';ctx.fill();
  ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();
  // 数据点
  for(let i=0;i<n;i++){
    const angle=-Math.PI/2+(2*Math.PI/n)*i;
    const pr=r*(vals[i]/100);
    const px=cx+pr*Math.cos(angle),py=cy+pr*Math.sin(angle);
    ctx.beginPath();ctx.arc(px,py,4,0,Math.PI*2);
    ctx.fillStyle=color;ctx.fill();
    ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();
  }
  // 中心 emoji + 评分
  ctx.font='22px serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(coin?.icon||'',cx,cy-8);
  ctx.font='bold 11px Inter,sans-serif';ctx.fillStyle=color;ctx.textBaseline='top';
  ctx.fillText(`${coin?.score||0}/100`,cx,cy+10);
}

/* ── 历史档案数据 ── */
// ── 打脸数据：AI 法官裁错的历史案件 ──
const slapData = [
  {
    id: 'SLAP-001',
    coin: 'LUNA', icon: '🌕',
    judgeVerdict: 'BULLISH', judgeLine: '链上数据稳健，生态建设有序，本庭裁定：看涨。',
    actualResult: '归零', actualChange: '-99.9%',
    date: '2022.05.09',
    slapLine: '法官跌落神坛：裁定看涨后 3 天，LUNA 直接归零。本庭深感痛惜，同时提醒：AI 也会打脸。',
    memeText: '链上数据稳健？稳健个屁，直接归零了。',
    lossPool: 2840000,
    witnesses: 12483,
  },
  {
    id: 'SLAP-002',
    coin: 'SQUID', icon: '🦑',
    judgeVerdict: 'BULLISH', judgeLine: '短期热度极高，社区参与活跃，本庭裁定：看涨，建议小仓参与。',
    actualResult: '归零', actualChange: '-99.99%',
    date: '2021.11.01',
    slapLine: '法官再度打脸：热度确实高，但项目方直接跑路。本庭提醒：热度不等于价值。',
    memeText: '社区参与活跃？是活跃在跑路前夕。',
    lossPool: 3300000,
    witnesses: 8821,
  },
  {
    id: 'SLAP-003',
    coin: 'PEPE', icon: '🐸',
    judgeVerdict: 'BEARISH', judgeLine: '流动性不足，持仓地址数偏低，本庭裁定：看跌，建议规避。',
    actualResult: '暴涨 7000%', actualChange: '+7000%',
    date: '2023.04.18',
    slapLine: '法官被暴打：裁定看跌后 PEPE 直接拉了 7000%。本庭低头认错，市场永远比模型更疯。',
    memeText: '流动性不足？不足以阻止它涨 7000%。',
    lossPool: 892000,
    witnesses: 31204,
  },
];

const archiveData=[
  {
    id:'2026-000', period:'第 0 期（试运营）', date:'2026.03.31',
    summary:'法庭试运营期，AI 法官首次开庭，发现散户对 DOGE 的信仰远比预期坚定。',
    verdicts:[
      {icon:'🐶',name:'DOGE',verdict:'持有',cls:'dc-hold'},
      {icon:'🐸',name:'PEPE',verdict:'谨慎',cls:'dc-caution'},
      {icon:'🎩',name:'WIF', verdict:'观望',cls:'dc-watch'},
      {icon:'🔨',name:'BONK',verdict:'小仓',cls:'dc-hold'},
      {icon:'🪙',name:'FLOKI',verdict:'等待',cls:'dc-wait'},
    ],
    topQuote:'以为找到了下一个 DOGE，但那个 "下一个" 还没出现。',
    topQuoteAuthor:'0 期散户 · 亏损 43%', topQuoteType:'rip',
    allNotes:[
      {text:'以为找到了下一个 DOGE，但那个 "下一个" 还没出现。',author:'0 期散户 · 亏损 43%',type:'rip'},
      {text:'满仓 PEPE，结果巨鲸比我先跑。这届巨鲸不行，太不讲武德了。',author:'PEPE 信仰者 · 亏损 31%',type:'rip'},
      {text:'DOGE 小仓参与，平稳持有中，感谢试运营期的保守判决。',author:'理性用户 · 盈利 8%',type:'win'},
    ],
    totalVotes:3842, projects:7,
    settlement:{
      pool:12400, winDir:'up', winDirLabel:'📈 看涨方向胜出',
      winners:[
        {addr:'0x7a3f…e2d6', reward:3840},
        {addr:'0xb91c…a4f2', reward:2210},
        {addr:'0x0fe8…77bc', reward:1560},
      ],
      totalBettors:89, winRate:61,
    },
  },
  {
    id:'2025-052', period:'第 52 期', date:'2025.12.30',
    summary:'年末最后一期，市场情绪两极分化。DOGE 在圣诞行情中独树一帜，FLOKI 项目方的沉默令人忧虑。',
    verdicts:[
      {icon:'🐶',name:'DOGE',verdict:'强烈持有',cls:'dc-hold'},
      {icon:'🐸',name:'PEPE',verdict:'谨慎',cls:'dc-caution'},
      {icon:'🎩',name:'WIF', verdict:'观望',cls:'dc-watch'},
      {icon:'🔨',name:'BONK',verdict:'小仓',cls:'dc-hold'},
      {icon:'🪙',name:'FLOKI',verdict:'警告',cls:'dc-wait'},
    ],
    topQuote:'年末了，我的钱包比我还瘦。新年愿望：别再相信群主推荐的币。',
    topQuoteAuthor:'年末散户 · 综合亏损 67%', topQuoteType:'rip',
    allNotes:[
      {text:'年末了，我的钱包比我还瘦。新年愿望：别再相信群主推荐的币。',author:'年末散户 · 亏损 67%',type:'rip'},
      {text:'DOGE 圣诞涨了 22%。感谢马斯克，感谢法庭第 52 期的判决。',author:'DOGE 持仓者 · 盈利 22%',type:'win'},
      {text:'年底最后一把梭哈 FLOKI，项目方直接沉默了。Happy New Year。',author:'FLOKI 站岗者 · 亏损 55%',type:'rip'},
    ],
    totalVotes:6231, projects:9,
    settlement:{
      pool:28600, winDir:'up', winDirLabel:'📈 看涨方向胜出',
      winners:[
        {addr:'0x3c9d…f1a8', reward:7420},
        {addr:'0xa72e…c305', reward:4890},
        {addr:'0x6b1f…8e94', reward:3210},
      ],
      totalBettors:241, winRate:58,
    },
  },
  {
    id:'2025-040', period:'第 40 期', date:'2025.10.07',
    summary:'牛市预期升温，链上数据全面向好。本期涌现多个高质量 DEX 新项目，社区参与度创历史新高。',
    verdicts:[
      {icon:'🐶',name:'DOGE', verdict:'持有',cls:'dc-hold'},
      {icon:'⚡',name:'TURBO',verdict:'建仓',cls:'dc-hold'},
      {icon:'🦅',name:'MAGA', verdict:'观望',cls:'dc-watch'},
      {icon:'🔨',name:'BONK', verdict:'持有',cls:'dc-hold'},
      {icon:'🐸',name:'PEPE', verdict:'谨慎',cls:'dc-caution'},
    ],
    topQuote:'第一次听法庭的话，TURBO 小仓进了。现在翻了三倍，法官说的是对的。',
    topQuoteAuthor:'理性新人 · 盈利 +210%', topQuoteType:'win',
    allNotes:[
      {text:'第一次听法庭的话，TURBO 小仓进了。现在翻了三倍，法官说的是对的。',author:'理性新人 · 盈利 +210%',type:'win'},
      {text:'牛市来了还在观望，等我决定进场的时候它已经涨了 80%。',author:'错失行情者 · 踏空',type:'rip'},
      {text:'MAGA 在选举行情里涨了 45%，但我忘记止盈，又跌回去了。',author:'MAGA 持仓者 · 最终持平',type:'rip'},
    ],
    totalVotes:8847, projects:12,
    settlement:{
      pool:51200, winDir:'up', winDirLabel:'📈 看涨方向胜出',
      winners:[
        {addr:'0xf4a2…b7c1', reward:14380},
        {addr:'0x22d8…9e5f', reward:8920},
        {addr:'0x8c3b…d104', reward:6240},
      ],
      totalBettors:418, winRate:64,
    },
  },
];

function renderArchiveHistory(){
  const grid=document.getElementById('archiveHistoryGrid');
  if(!grid)return;
  grid.innerHTML = slapData.map(d => `
    <div onclick="openSlapModal('${d.id}')" style="background:var(--white);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;cursor:pointer;transition:all .18s;box-shadow:var(--shadow-sm)" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='var(--shadow)'" onmouseout="this.style.transform='';this.style.boxShadow='var(--shadow-sm)'">
      <div style="padding:14px 16px 10px;background:linear-gradient(135deg,#fff1f1,#fef2f2);border-bottom:1px solid #fecaca;position:relative;overflow:hidden">
        <div style="position:absolute;right:10px;top:50%;transform:translateY(-50%) rotate(15deg);font-size:40px;opacity:0.07;pointer-events:none">🥊</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <span style="font-size:10px;font-weight:700;color:#ef4444;letter-spacing:.06em">${d.id} · ${d.date}</span>
          <span style="font-size:10px;font-weight:800;padding:2px 8px;border-radius:3px;border:1.5px solid #ef4444;color:#ef4444;letter-spacing:.06em">打脸</span>
        </div>
        <div style="font-size:16px;font-weight:800;color:var(--text)">${d.icon} ${d.coin}</div>
      </div>
      <div style="padding:12px 16px">
        <div style="display:flex;gap:8px;margin-bottom:10px">
          <div style="flex:1;padding:8px;background:var(--accent-bg);border-radius:8px;text-align:center">
            <div style="font-size:9px;color:var(--accent);font-weight:700;margin-bottom:3px">法官裁定</div>
            <div style="font-size:12px;font-weight:700;color:var(--accent)">${d.judgeVerdict === 'BULLISH' ? '📈 看涨' : '📉 看跌'}</div>
          </div>
          <div style="flex:1;padding:8px;background:#fef2f2;border-radius:8px;text-align:center">
            <div style="font-size:9px;color:#ef4444;font-weight:700;margin-bottom:3px">实际结果</div>
            <div style="font-size:12px;font-weight:700;color:#ef4444">${d.actualChange}</div>
          </div>
        </div>
        <div style="font-size:11px;color:var(--text2);line-height:1.5;font-style:italic">"${d.memeText}"</div>
      </div>
      <div style="padding:8px 16px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:11px;color:var(--text3)">${d.witnesses.toLocaleString()} 人围观</span>
        <span style="font-size:11px;color:#ef4444;font-weight:600">查看打脸现场 →</span>
      </div>
    </div>`).join('');
}

// 旧档案弹窗保留（archiveData 卷宗用）
function openDossier(id){
  const d=archiveData.find(x=>x.id===id);if(!d)return;
  document.getElementById('dossierModalCase').textContent=`CASE NO. ${d.id}`;
  document.getElementById('dossierModalTitle').textContent=d.period;
  document.getElementById('dossierModalMeta').textContent=`${d.date} · 总投票 ${d.totalVotes.toLocaleString()} · ${d.projects} 个项目受审`;
  document.getElementById('dossierModalVerdicts').innerHTML=d.verdicts.map(v=>`
    <div class="dmv-item">
      <div class="dmv-icon">${v.icon}</div>
      <div class="dmv-name">${v.name}</div>
      <div class="dmv-verdict ${v.cls}">${v.verdict}</div>
    </div>`).join('');
  document.getElementById('dossierModalNotes').innerHTML=d.allNotes.map(n=>`
    <div class="dmn-item ${n.type}">
      <div class="dmn-text">"${n.text}"</div>
      <div class="dmn-author">${n.author}</div>
    </div>`).join('');
  document.getElementById('dossierModalSummary').textContent=d.summary;
  document.getElementById('dossierOverlay').classList.add('open');
}
function closeDossier(e){if(e.target===document.getElementById('dossierOverlay'))closeDossierDirect();}
function closeDossierDirect(){document.getElementById('dossierOverlay').classList.remove('open');}

// ── 打脸弹窗 ──
function openSlapModal(id) {
  const d = slapData.find(x => x.id === id);
  if (!d) return;
  document.getElementById('slapOverlay').classList.add('open');
  // 重置动效
  const judge = document.getElementById('slapJudge');
  judge.style.animation = 'none';
  judge.offsetHeight; // reflow
  judge.style.animation = 'slap-hit 0.5s cubic-bezier(.36,.07,.19,.97) both';
  // 填数据
  document.getElementById('slapCoin').textContent = d.icon + ' ' + d.coin;
  document.getElementById('slapDate').textContent = d.date;
  document.getElementById('slapJudgeLine').textContent = '"' + d.judgeLine + '"';
  document.getElementById('slapJudgeVerdict').textContent = d.judgeVerdict === 'BULLISH' ? '📈 裁定看涨' : '📉 裁定看跌';
  document.getElementById('slapActual').textContent = d.actualChange;
  document.getElementById('slapActual').style.color = d.actualChange.startsWith('+') ? '#16a34a' : '#ef4444';
  document.getElementById('slapLine').textContent = d.slapLine;
  document.getElementById('slapMemeText').textContent = '"' + d.memeText + '"';
  document.getElementById('slapWitnesses').textContent = d.witnesses.toLocaleString() + ' 人围观';
}
function closeSlapModal(e) {
  if (!e || e.target === document.getElementById('slapOverlay')) {
    document.getElementById('slapOverlay').classList.remove('open');
  }
}
async function copySlapCard() {
  const btn = document.getElementById('slapCopyBtn');
  btn.textContent = '⏳ 生成中…';
  btn.disabled = true;

  try {
    // 确保 html2canvas 已加载
    if (!window.html2canvas) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    // 截图打脸弹窗的卡片主体（不含按钮）
    const card = document.querySelector('.slap-modal');
    const actionsEl = card.querySelector('.slap-actions');
    if (actionsEl) actionsEl.style.display = 'none';

    const canvas = await html2canvas(card, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });

    if (actionsEl) actionsEl.style.display = '';

    // 优先复制到剪贴板，降级为下载
    try {
      canvas.toBlob(async blob => {
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          btn.textContent = '✅ 图片已复制';
        } catch(e) {
          // 剪贴板不支持，改为下载
          const a = document.createElement('a');
          a.href = canvas.toDataURL('image/png');
          a.download = 'meme-court-slap.png';
          a.click();
          btn.textContent = '✅ 图片已下载';
        }
        btn.disabled = false;
        setTimeout(() => { btn.textContent = '📸 保存打脸图片'; }, 2500);
      });
    } catch(e) {
      btn.textContent = '❌ 失败，请重试';
      btn.disabled = false;
    }
  } catch(e) {
    btn.textContent = '❌ 失败，请重试';
    btn.disabled = false;
  }
}

/* ══ 合约配置 ══ */

const GAVEL_TOKEN_ADDRESS = '0x5f9D91603accD8aA5a3ef73F611e229C463dd702';
const MEME_COURT_ADDRESS  = '0x9F0081A3E98f30F3B8e1B43FA965F590f23b5906';
const BSC_TESTNET_CHAIN_ID = '0x61'; // 97

const GAVEL_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
  'function allowance(address,address) view returns (uint256)',
  'function transfer(address,uint256) returns (bool)',
];

const COURT_ABI = [
  'function createCase(string,uint8) payable',
  'function betWithBNB(string,uint8) payable',
  'function betWithGavel(string,uint8,uint256)',
  'function settle(string,uint8)',
  'function claimBNB(string)',
  'function claimGavel(string)',
  'function claimNewbie()',
  'function getCase(string) view returns (tuple(address creator,uint8 tier,uint256 bnbPool,uint256 gavelPool,uint256 upBNB,uint256 downBNB,uint256 upGavel,uint256 downGavel,uint8 status,uint8 result,uint256 createdAt,uint256 settledAt))',
  'function getBet(string,address) view returns (tuple(uint256 bnbAmount,uint256 gavelAmount,uint8 direction,bool bnbClaimed,bool gavelClaimed))',
  'function newbieClaimed(address) view returns (bool)',
  'function tierMinFee(uint256) view returns (uint256)',
];

// 简易 ABI encoder（不依赖 ethers.js）
function encodeCall(fnSig, ...args) {
  const selector = keccak256(fnSig).slice(0, 10);
  return selector + args.map(encodeArg).join('');
}
function encodeArg(v) {
  if (typeof v === 'string' && v.startsWith('0x') && v.length === 42) {
    return v.slice(2).toLowerCase().padStart(64, '0');
  }
  if (typeof v === 'number' || typeof v === 'bigint') {
    return BigInt(v).toString(16).padStart(64, '0');
  }
  return String(v).padStart(64, '0');
}
function keccak256(str) {
  // 使用 window.ethereum 的 RPC 来计算，或者直接内联常用 selector
  return str; // placeholder，实际用预计算的 selector
}

// 预计算的函数 selector
const SELECTORS = {
  claimNewbie:   '0x04c58d28',
  betWithBNB:    '0x8a52b4c6',
  betWithGavel:  '0x7b9a3706',
  gavelBalance:  '0x70a08231', // balanceOf
  approve:       '0x095ea7b3',
};

/* ── 合约调用工具函数 ── */
async function callContract(to, data, value = '0x0') {
  if (!walletConnected || !window.ethereum?.isMetaMask) return null;
  try {
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{ from: walletAddress, to, data, value, gas: '0x493E0' }]
    });
    return txHash;
  } catch(e) {
    if (e.code !== 4001) showToast('交易失败：' + (e.message || '未知错误'));
    return null;
  }
}

async function readContract(to, data) {
  try {
    const result = await window.ethereum.request({
      method: 'eth_call',
      params: [{ to, data }, 'latest']
    });
    return result;
  } catch(e) { return null; }
}

// 读取真实 $GAVEL 余额
async function fetchRealGavelBalance(addr) {
  if (!window.ethereum?.isMetaMask || !addr) return 0;
  try {
    // balanceOf(address) selector + padded address
    const data = '0x70a08231' + addr.slice(2).toLowerCase().padStart(64, '0');
    const result = await readContract(GAVEL_TOKEN_ADDRESS, data);
    if (result && result !== '0x') {
      return parseInt(result, 16) / 1e18;
    }
  } catch(e) {}
  return 0;
}

// 链上领取新人礼包
async function claimNewbieOnChain() {
  if (!walletConnected) { showToast('请先连接钱包'); return; }
  showToast('⏳ 正在链上领取新人礼包…');
  const txHash = await callContract(MEME_COURT_ADDRESS, '0x04c58d28');
  if (txHash) {
    showToast('🎁 新人礼包领取成功！500 $GAVEL 已到账');
    // 刷新余额
    setTimeout(async () => {
      const bal = await fetchRealGavelBalance(walletAddress);
      if (bal > 0) {
        gavelBalance = Math.floor(bal);
        const el = document.getElementById('gavelBalNum');
        if (el) el.textContent = gavelBalance.toLocaleString();
      }
    }, 3000);
  }
}

// 链上开庭
async function createCaseOnChain(caseId, tier, bnbAmount) {
  if (!walletConnected) { showToast('请先连接钱包'); return null; }
  // createCase(string caseId, uint8 tier)
  // 手动编码：selector + string offset + uint8 + string data
  const tierHex = tier.toString(16).padStart(64, '0');
  const cidBytes = new TextEncoder().encode(caseId);
  const cidHex = Array.from(cidBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const cidLen = cidBytes.length.toString(16).padStart(64, '0');
  const cidPadded = cidHex.padEnd(Math.ceil(cidHex.length / 64) * 64, '0');
  // string offset = 0x40 (64), tier after string
  const data = '0x' + 'e942b516' // createCase selector
    + '0000000000000000000000000000000000000000000000000000000000000040' // string offset
    + tierHex
    + cidLen
    + cidPadded;
  const valueWei = '0x' + BigInt(Math.round(bnbAmount * 1e18)).toString(16);
  return await callContract(MEME_COURT_ADDRESS, data, valueWei);
}

// 链上 BNB 押注
async function betWithBNBOnChain(caseId, direction, bnbAmount) {
  if (!walletConnected) { showToast('请先连接钱包'); return null; }
  const dirHex = direction.toString(16).padStart(64, '0');
  const cidBytes = new TextEncoder().encode(caseId);
  const cidHex = Array.from(cidBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const cidLen = cidBytes.length.toString(16).padStart(64, '0');
  const cidPadded = cidHex.padEnd(Math.ceil(cidHex.length / 64) * 64, '0');
  const data = '0x' + 'a3b3e5c2' // betWithBNB selector
    + '0000000000000000000000000000000000000000000000000000000000000040'
    + dirHex
    + cidLen
    + cidPadded;
  const valueWei = '0x' + BigInt(Math.round(bnbAmount * 1e18)).toString(16);
  return await callContract(MEME_COURT_ADDRESS, data, valueWei);
}

let walletConnected = false;
let walletAddress = '';
let walletBnbBalance = 0;
let gavelBalance = 0;

/* ── MetaMask 工具函数 ── */
function shortAddr(addr) {
  return addr.slice(0,6) + '…' + addr.slice(-4);
}

function hexToEth(hex) {
  return parseFloat(parseInt(hex, 16) / 1e18).toFixed(4);
}

async function switchToBsc() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: BSC_TESTNET_CHAIN_ID }],
    });
    return true;
  } catch(e) {
    if (e.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: BSC_TESTNET_CHAIN_ID,
            chainName: 'BNB Smart Chain Testnet',
            nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
            rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
            blockExplorerUrls: ['https://testnet.bscscan.com'],
          }]
        });
        return true;
      } catch(e2) { return false; }
    }
    return false;
  }
}

async function fetchBnbBalance(addr) {
  try {
    const hex = await window.ethereum.request({
      method: 'eth_getBalance',
      params: [addr, 'latest']
    });
    return parseFloat(hexToEth(hex));
  } catch(e) { return 0; }
}

function onWalletConnected(addr, bnbBal) {
  walletConnected = true;
  walletAddress = addr;
  walletBnbBalance = bnbBal;

  const addrText = document.getElementById('walletAddrText');
  if (addrText) addrText.textContent = shortAddr(addr);
  const dot = document.getElementById('walletDot');
  if (dot) dot.classList.add('connected');
  const capsule = document.getElementById('walletCapsule');
  if (capsule) capsule.classList.add('connected');

  // 连接成功提示（不再赠送新人礼包）
  showToast('✅ 钱包已连接：' + shortAddr(addr) + ' · BNB: ' + bnbBal.toFixed(4));

  const gavelEl = document.getElementById('gavelBal');
  if (gavelEl) gavelEl.classList.add('show');
  const gavelNum = document.getElementById('gavelBalNum');
  if (gavelNum) gavelNum.textContent = gavelBalance.toLocaleString();
  const betBal = document.getElementById('betBalanceNum');
  if (betBal) betBal.textContent = gavelBalance.toLocaleString();

  renderProfilePage();
}

async function connectWallet() {
  if (walletConnected) return;

  const addrText = document.getElementById('walletAddrText');

  // 严格只允许 MetaMask，拒绝 Phantom 等其他钱包
  if (!window.ethereum) {
    const go = confirm('未检测到钱包插件。\n\n点击确定前往安装 MetaMask。');
    if (go) window.open('https://metamask.io/download/', '_blank');
    return;
  }
  if (!window.ethereum.isMetaMask) {
    showToast('⚠️ 请使用 MetaMask 钱包，检测到其他钱包插件');
    // 尝试找 MetaMask provider（多钱包环境）
    if (window.ethereum.providers) {
      const mm = window.ethereum.providers.find(p => p.isMetaMask && !p.isPhantom);
      if (!mm) { showToast('未找到 MetaMask，请禁用其他钱包插件后重试'); return; }
      window.ethereum = mm;
    } else {
      return;
    }
  }

  if (addrText) addrText.textContent = '连接中…';

  try {
    // 如果用户之前主动退出，强制重新弹出 MetaMask 账户选择窗口
    const wasDisconnected = localStorage.getItem('memecourt_disconnected');
    if (wasDisconnected) {
      localStorage.removeItem('memecourt_disconnected');
      try {
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
      } catch(pe) {
        if (pe.code === 4001) { if(addrText) addrText.textContent = '连接钱包'; return; }
      }
    }

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts.length) { if(addrText) addrText.textContent = '连接钱包'; return; }

    const addr = accounts[0];
    await switchToBsc();

    const bnb = await fetchBnbBalance(addr);

    // 读取链上真实 $GAVEL 余额
    const realGavel = await fetchRealGavelBalance(addr);
    if (realGavel > 0) gavelBalance = Math.floor(realGavel);

    onWalletConnected(addr, bnb);

    // 检查是否已领过新人礼包，没领过则提示
    checkNewbieClaim(addr);

    window.ethereum.removeAllListeners?.('accountsChanged');
    window.ethereum.on('accountsChanged', async (accs) => {
      if (!accs.length) {
        walletConnected = false; walletAddress = ''; walletBnbBalance = 0;
        if (addrText) addrText.textContent = '连接钱包';
        document.getElementById('walletDot')?.classList.remove('connected');
        document.getElementById('walletCapsule')?.classList.remove('connected');
        showToast('钱包已断开连接');
        return;
      }
      const newAddr = accs[0];
      const newBnb = await fetchBnbBalance(newAddr);
      const newGavel = await fetchRealGavelBalance(newAddr);
      if (newGavel > 0) gavelBalance = Math.floor(newGavel);
      onWalletConnected(newAddr, newBnb);
    });

    window.ethereum.on('chainChanged', async (chainId) => {
      if (chainId !== BSC_TESTNET_CHAIN_ID && chainId !== '0x38') {
        showToast('⚠️ 请切换到 BNB Smart Chain');
      } else {
        const bnb = await fetchBnbBalance(walletAddress);
        walletBnbBalance = bnb;
      }
    });

  } catch(e) {
    if (e.code === 4001) showToast('用户取消了连接');
    else showToast('连接失败：' + (e.message || '未知错误'));
    if (addrText) addrText.textContent = '连接钱包';
  }
}

// checkNewbieClaim 已废弃，新人礼包取消

function disconnectWallet() {
  if (!confirm('确认退出钱包？退出后需要重新连接。')) return;
  walletConnected = false;
  walletAddress = '';
  walletBnbBalance = 0;
  gavelBalance = 0;
  localStorage.setItem('memecourt_disconnected', '1');
  const addrText = document.getElementById('walletAddrText');
  if (addrText) addrText.textContent = '连接钱包';
  document.getElementById('walletDot')?.classList.remove('connected');
  document.getElementById('walletCapsule')?.classList.remove('connected');
  document.getElementById('gavelBal')?.classList.remove('show');
  window.ethereum?.removeAllListeners?.('accountsChanged');
  window.ethereum?.removeAllListeners?.('chainChanged');
  const empty = document.getElementById('profileEmpty');
  const content = document.getElementById('profileContent');
  if (empty) empty.style.display = 'block';
  if (content) content.style.display = 'none';
  showToast('已退出钱包，可重新连接切换账户');
}
function useDemoWallet() {
  const demoAddr = '0xdemo' + Math.random().toString(16).slice(2,8) + '…cafe';
  onWalletConnected(demoAddr, 0);
  showToast('🎭 演示模式：使用虚拟钱包体验');
}

// 页面加载时检查是否已连接过（MetaMask 记住授权）
async function checkExistingConnection() {
  if (!window.ethereum?.isMetaMask) return;
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts.length) {
      await switchToBsc();
      const bnb = await fetchBnbBalance(accounts[0]);
      onWalletConnected(accounts[0], bnb);
    }
  } catch(e) {}
}

/* ── $GAVEL 权益弹窗 ── */
function openGavelModal() {
  // 更新余额显示
  const bal = gavelBalance;
  document.getElementById('gavelModalBal').textContent = bal.toLocaleString();
  // 判断当前等级
  let tierLabel = '尚未持有';
  if (!walletConnected) tierLabel = '未连接钱包';
  else if (bal >= 2000) tierLabel = '👑 首席陪审员';
  else if (bal >= 500) tierLabel = '🔵 资深陪审员';
  else if (bal >= 100) tierLabel = '⚖️ 陪审员';
  else tierLabel = '持有不足 · 参与押注获取';
  document.getElementById('gavelTierBadge').textContent = tierLabel;
  // 解锁状态
  [1,2,3].forEach(i => {
    const lock = document.getElementById('gtcLock'+i);
    const card = document.getElementById('gtc-'+i);
    const thresholds = [100, 500, 2000];
    if (walletConnected && bal >= thresholds[i-1]) {
      lock.style.display = 'none';
      card.classList.add('unlocked');
      // 加已解锁badge
      if (!card.querySelector('.gtc-unlocked-badge')) {
        const b = document.createElement('div');
        b.className = 'gtc-unlocked-badge';
        b.textContent = '已解锁';
        card.appendChild(b);
      }
    } else {
      lock.style.display = 'flex';
      card.classList.remove('unlocked');
    }
  });
  document.getElementById('gavelOverlay').classList.add('open');
}
function closeGavelModal(e) { if (e.target === document.getElementById('gavelOverlay')) closeGavelDirect(); }
function closeGavelDirect() { document.getElementById('gavelOverlay').classList.remove('open'); }

function showToast(msg) {
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#111;color:#fff;padding:10px 20px;border-radius:99px;font-size:13px;font-weight:600;z-index:9999;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,0.2);animation:panel-in .3s ease';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

/* ── 申请开庭弹窗 ── */
let applyStep = 1;
let selectedIdentity = null; // 'project' | 'retail'
let selectedTier = 'fast';

const tierPrices = { basic:0.1, fast:0.5, featured:2 };
const tierNames  = { basic:'快审', fast:'标准', featured:'深审' };
const retailTierPrices = { 'retail-basic':100, 'retail-standard':300, 'retail-deep':1000 };
const retailTierNames  = { 'retail-basic':'快审', 'retail-standard':'标准', 'retail-deep':'深审' };

function openApplyModal() {
  applyStep = 1; selectedIdentity = null; selectedTier = 'fast';
  resetApplySteps();
  document.getElementById('applyOverlay').classList.add('open');
}
function closeApplyModal(e) { if (e.target===document.getElementById('applyOverlay')) closeApplyDirect(); }
function closeApplyDirect() {
  document.getElementById('applyOverlay').classList.remove('open');
  setTimeout(resetApplySteps, 300);
}
function resetApplySteps() {
  applyStep = 1; selectedIdentity = null;
  ['applyStep1','applyStep2','applyStep3','applyStep4','applySuccess'].forEach((id,i)=>{
    const el = document.getElementById(id);
    if(el) el.style.display = i===0 ? 'block' : 'none';
  });
  document.getElementById('applyFooter').style.display = 'flex';
  const nextBtn = document.getElementById('applyNextBtn');
  nextBtn.textContent = '下一步 →';
  nextBtn.disabled = true;
  document.getElementById('applyBackBtn').style.display = 'none';
  // reset identity cards
  document.getElementById('identityProject').style.borderColor = 'var(--border)';
  document.getElementById('identityRetail').style.borderColor = 'var(--border)';
  document.getElementById('identityProject').style.background = '';
  document.getElementById('identityRetail').style.background = '';
  document.getElementById('identityHint').textContent = '请选择你的身份';
  updateApplyStepUI();
}

function selectIdentity(id) {
  selectedIdentity = id;
  const pEl = document.getElementById('identityProject');
  const rEl = document.getElementById('identityRetail');
  pEl.style.borderColor = id==='project' ? 'var(--accent)' : 'var(--border)';
  pEl.style.background  = id==='project' ? 'var(--accent-bg)' : '';
  rEl.style.borderColor = id==='retail'  ? 'var(--blue)' : 'var(--border)';
  rEl.style.background  = id==='retail'  ? 'var(--blue-bg)' : '';
  document.getElementById('identityHint').textContent =
    id==='project' ? '✅ 项目方：用 BNB 开庭，获得曝光与 AI 背书' : '✅ 散户：用 $GAVEL 发起，做多或做空任意 Meme';
  const nextBtn = document.getElementById('applyNextBtn');
  nextBtn.disabled = false;
  nextBtn.textContent = '下一步 →';
}

function selectTier(t) {
  selectedTier = t;
  const isRetail = t.startsWith('retail-');
  if (isRetail) {
    ['retail-basic','retail-standard','retail-deep'].forEach(k=>{
      const el = document.getElementById('tier-'+k);
      if(el) el.classList.toggle('selected', k===t);
    });
  } else {
    ['basic','fast','featured'].forEach(k=>{
      const el = document.getElementById('tier-'+k);
      if(el) el.classList.toggle('selected', k===t);
    });
  }
}

async function applyNext() {
  if (applyStep===1) {
    if (!selectedIdentity) { showToast('请先选择身份'); return; }
    applyStep = 2;
    document.getElementById('applyStep1').style.display = 'none';
    document.getElementById('applyStep2').style.display = 'block';
    document.getElementById('applyBackBtn').style.display = 'block';
    // 根据身份切换档位显示
    if (selectedIdentity === 'project') {
      document.getElementById('tierProject').style.display = 'block';
      document.getElementById('tierRetail').style.display = 'none';
      selectedTier = 'fast';
      selectTier('fast');
    } else {
      document.getElementById('tierProject').style.display = 'none';
      document.getElementById('tierRetail').style.display = 'block';
      selectedTier = 'retail-standard';
      selectTier('retail-standard');
    }
    updateApplyStepUI();
  } else if (applyStep===2) {
    applyStep = 3;
    document.getElementById('applyStep2').style.display = 'none';
    document.getElementById('applyStep3').style.display = 'block';
    updateApplyStepUI();
  } else if (applyStep===3) {
    const name = document.getElementById('applyName').value.trim();
    if (!name) { showToast('请填写项目名称'); return; }

    // 合约地址验证（项目方必填，散户选填）
    const contractAddr = document.getElementById('applyContract').value.trim();
    if (selectedIdentity === 'project' && !contractAddr) {
      showToast('项目方请填写合约地址'); return;
    }
    if (contractAddr) {
      // 如果还没验证过，先验证
      if (!contractValidResult) {
        const ok = await validateContractInput();
        if (!ok) { showToast('合约地址验证未通过，请检查后重试'); return; }
      } else if (!contractValidResult.valid) {
        showToast('合约地址验证未通过：' + contractValidResult.reason); return;
      }
    }

    applyStep = 4;
    // 构建支付摘要
    const isRetail = selectedIdentity === 'retail';
    let price, priceFmt, payPoolTxt, payPlatTxt;
    if (isRetail) {
      price = retailTierPrices[selectedTier] || 300;
      priceFmt = price.toLocaleString() + ' $GAVEL';
      payPoolTxt = priceFmt + ' → 全额进奖池';
      payPlatTxt = '0 $GAVEL（散户开庭平台不抽成）';
    } else {
      price = tierPrices[selectedTier] || 0.5;
      priceFmt = price + ' BNB';
      payPoolTxt = (price*0.7).toFixed(2) + ' BNB → 社区押注奖池';
      payPlatTxt = (price*0.3).toFixed(2) + ' BNB';
    }
    const tierLabel = isRetail ? retailTierNames[selectedTier] : tierNames[selectedTier];
    document.getElementById('paySummary').innerHTML = `
      <div class="pay-row"><span class="pay-label">身份</span><span class="pay-val">${isRetail?'👤 散户':'🏛️ 项目方'}</span></div>
      <div class="pay-row"><span class="pay-label">项目名称</span><span class="pay-val">${name}</span></div>
      <div class="pay-row"><span class="pay-label">开庭档位</span><span class="pay-val">${tierLabel}</span></div>
      <div class="pay-row"><span class="pay-label">支付金额</span><span class="pay-val total">${priceFmt}</span></div>`;
    document.getElementById('payPoolAmt').textContent = payPoolTxt;
    document.getElementById('payPlatAmt').textContent = payPlatTxt;
    document.getElementById('applyStep3').style.display = 'none';
    document.getElementById('applyStep4').style.display = 'block';
    document.getElementById('applyNextBtn').style.display = 'none';
    // 更新支付按钮文字
    document.getElementById('payBtn').innerHTML = selectedIdentity==='retail'
      ? `<span>⚖️ 支付 ${priceFmt}</span>`
      : `<span>🦊 MetaMask 支付 ${priceFmt}</span>`;
    updateApplyStepUI();
  }
}

function applyBack() {
  if (applyStep===2) {
    applyStep=1;
    document.getElementById('applyStep2').style.display='none';
    document.getElementById('applyStep1').style.display='block';
    document.getElementById('applyBackBtn').style.display='none';
  } else if (applyStep===3) {
    applyStep=2;
    document.getElementById('applyStep3').style.display='none';
    document.getElementById('applyStep2').style.display='block';
  } else if (applyStep===4) {
    applyStep=3;
    document.getElementById('applyStep4').style.display='none';
    document.getElementById('applyStep3').style.display='block';
    document.getElementById('applyNextBtn').style.display='block';
  }
  updateApplyStepUI();
}

function updateApplyStepUI() {
  [1,2,3,4].forEach(i=>{
    const num = document.getElementById('stepNum'+i);
    const lbl = document.getElementById('stepLbl'+i);
    if (!num) return;
    if (i < applyStep) { num.className='apply-step-num done'; num.textContent='✓'; lbl.classList.add('active'); }
    else if (i===applyStep) { num.className='apply-step-num active'; num.textContent=i; lbl.classList.add('active'); }
    else { num.className='apply-step-num pending'; num.textContent=i; lbl.classList.remove('active'); }
  });
}

async function simulatePay() {
  const btn = document.getElementById('payBtn');
  btn.classList.add('simulating');
  btn.innerHTML = '<span>⏳ 等待 MetaMask 确认…</span>';

  const name = document.getElementById('applyName').value.trim();
  const caseNo = 'C-' + new Date().getFullYear() + '-' + (Math.floor(Math.random()*900)+100);

  if (selectedIdentity === 'project' && walletConnected) {
    // 真实链上开庭
    const tierIndex = selectedTier === 'fast' ? 0 : selectedTier === 'standard' ? 1 : 2;
    const price = tierPrices[selectedTier] || 0.1;
    const txHash = await createCaseOnChain(caseNo, tierIndex, price);
    if (txHash) {
      showSuccess(caseNo, txHash);
      // 记录收益历史
      saveGavelHistory({
        type: 'court', icon: '🏛️',
        title: `开庭申请 · ${name}`,
        sub: `${caseNo} · 链上确认`,
        amount: `-${price} BNB`,
        rawAmount: 0,
        date: new Date().toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit'}),
        positive: false
      });
    } else {
      btn.classList.remove('simulating');
      btn.innerHTML = '<span>🦊 MetaMask 支付</span>';
    }
  } else {
    // 散户开庭或未连接钱包 — 模拟流程
    btn.innerHTML = '<span>📡 广播中…</span>';
    setTimeout(() => {
      if (selectedIdentity === 'retail') {
        const cost = retailTierPrices[selectedTier] || 300;
        gavelBalance = Math.max(0, gavelBalance - cost);
        const gn = document.getElementById('gavelBalNum');
        if (gn) gn.textContent = gavelBalance.toLocaleString();
      }
      showSuccess(caseNo, null);
    }, 1800);
  }
}

function showSuccess(caseNo, txHash) {
  document.getElementById('applyStep4').style.display = 'none';
  document.getElementById('applySuccess').style.display = 'block';
  document.getElementById('applyFooter').style.display = 'none';
  document.getElementById('payCaseNo').textContent = caseNo;
  const txEl = document.getElementById('payTxHash');
  if (txEl && txHash) {
    txEl.innerHTML = `<a href="https://testnet.bscscan.com/tx/${txHash}" target="_blank" style="color:var(--accent);font-size:11px;word-break:break-all">查看链上交易 ↗</a>`;
  }
  showToast('🏛️ 开庭申请已提交！' + caseNo);

  // ── 注入案件到进行中列表 ──
  const name = document.getElementById('applyName')?.value?.trim() || '新案件';
  const contract = document.getElementById('applyContract')?.value?.trim() || '';
  const tierLabel = selectedTier === 'fast' ? '快审' : selectedTier === 'standard' ? '标准' : '深审';
  const tierCls = selectedTier === 'fast' ? 'cc-tier-fast' : selectedTier === 'standard' ? 'cc-tier-standard' : 'cc-tier-deep';
  const timer = selectedTier === 'fast' ? '23:59' : selectedTier === 'standard' ? '7天 00:00' : '30天 00:00';

  const newCase = {
    id: caseNo,
    icon: guessIcon(name, name),
    name: name,
    source: contract ? `four.meme · 刚刚上线` : `散户发起 · 刚刚`,
    tier: selectedTier,
    tierLabel,
    tierCls,
    timer,
    urgent: selectedTier === 'fast',
    betUp: 50, betDown: 50,
    pool: selectedTier === 'fast' ? 320 : selectedTier === 'standard' ? 1600 : 6400,
    participants: 0,
    liq: '—', holders: '—', change: '+—%', changeUp: true, whale: '—',
    initiator: selectedIdentity === 'project' ? '项目方' : '散户发起',
    contract,
    isNew: true,
  };

  // 插入进行中列表头部
  courtData.live.unshift(newCase);

  // 持久化到 localStorage，刷新后不丢失
  try {
    const saved = JSON.parse(localStorage.getItem('mc_live_cases') || '[]');
    saved.unshift(newCase);
    localStorage.setItem('mc_live_cases', JSON.stringify(saved.slice(0, 10)));
  } catch(e) {}

  // 刷新开庭广场
  if (typeof updateCourtTabCounts === 'function') updateCourtTabCounts();
  if (typeof renderHotCourtCards === 'function') renderHotCourtCards();
  if (typeof mRenderCourtList === 'function') mRenderCourtList();
}

/* ── 押注系统 ── */
let betCoin = null;
let betDirection = null;
const coinBets = {}; // { coinName: { upTotal, downTotal, myDir, myAmt } }

// 初始化随机押注数据
function initBetData() {
  allCoins.forEach(c => {
    coinBets[c.name] = {
      upTotal: Math.floor(Math.random() * 3000) + 500,
      downTotal: Math.floor(Math.random() * 2000) + 200,
      myDir: null,
      myAmt: 0
    };
  });
}

function openBetModal(name) {
  if (!walletConnected) {
    showToast('请先连接钱包再参与押注');
    return;
  }
  betCoin = allCoins.find(c => c.name === name);
  if (!betCoin) return;
  betDirection = null;
  document.getElementById('betBody').style.display = 'block';
  document.getElementById('betSuccess').style.display = 'none';
  document.getElementById('betCoinIcon').textContent = betCoin.icon;
  document.getElementById('betCoinName').textContent = betCoin.name;
  document.getElementById('betAmountInput').value = '';
  document.getElementById('betRewardEst').textContent = '— $GAVEL';
  document.getElementById('betSubmitBtn').textContent = '选择方向后押注';
  document.getElementById('betSubmitBtn').disabled = true;
  document.getElementById('betDirUp').classList.remove('selected');
  document.getElementById('betDirDown').classList.remove('selected');
  document.getElementById('betBalanceNum').textContent = gavelBalance.toLocaleString();
  updateBetPoolDisplay();
  document.getElementById('betOverlay').classList.add('open');
}

function updateBetPoolDisplay() {
  if (!betCoin) return;
  const d = coinBets[betCoin.name];
  document.getElementById('betUpTotal').textContent = d.upTotal.toLocaleString() + ' $GAVEL';
  document.getElementById('betDownTotal').textContent = d.downTotal.toLocaleString() + ' $GAVEL';
}

function selectBetDir(dir) {
  betDirection = dir;
  document.getElementById('betDirUp').classList.toggle('selected', dir === 'up');
  document.getElementById('betDirDown').classList.toggle('selected', dir === 'down');
  updateBetReward();
  const btn = document.getElementById('betSubmitBtn');
  btn.disabled = false;
  btn.textContent = dir === 'up' ? '📈 押注看涨' : '📉 押注看跌';
}

function setBetPreset(v) {
  document.getElementById('betAmountInput').value = Math.min(v, gavelBalance);
  updateBetReward();
}
function setBetPresetMax() {
  document.getElementById('betAmountInput').value = gavelBalance;
  updateBetReward();
}

function updateBetReward() {
  const amt = parseInt(document.getElementById('betAmountInput').value) || 0;
  if (!amt || !betCoin || !betDirection) { document.getElementById('betRewardEst').textContent = '— $GAVEL'; return; }
  const d = coinBets[betCoin.name];
  const sideTotal = betDirection === 'up' ? d.upTotal : d.downTotal;
  const poolTotal = 48200;
  const est = Math.floor((amt / (sideTotal + amt)) * poolTotal * 0.85);
  document.getElementById('betRewardEst').textContent = est.toLocaleString() + ' $GAVEL';
}

async function submitBet() {
  const amt = parseInt(document.getElementById('betAmountInput').value) || 0;
  if (!amt || amt < 10) { showToast('最少押注 10 $GAVEL'); return; }
  if (amt > gavelBalance) { showToast('余额不足'); return; }
  if (!betDirection) { showToast('请选择押注方向'); return; }
  if (!betCoin) return;

  const btn = document.getElementById('betSubmitBtn');
  btn.textContent = '⏳ 等待授权…';
  btn.disabled = true;

  // caseId：用 betCoin.name 对应的链上案件 ID
  const caseId = betCoin.caseId || ('CASE-' + betCoin.name.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8));
  const dirCode = betDirection === 'up' ? 1 : 0; // 合约：1=BULLISH, 0=BEARISH
  const amtWei = BigInt(amt) * BigInt('1000000000000000000'); // 18 decimals

  try {
    // ── Step 1：approve GAVEL token ──
    const approveData = encodeApprove(MEME_COURT_ADDRESS, amtWei);
    showToast('Step 1/2：授权 $GAVEL 额度…');
    const approveTx = await callContract(GAVEL_TOKEN_ADDRESS, approveData);
    if (!approveTx) {
      btn.textContent = betDirection === 'up' ? '📈 押注看涨' : '📉 押注看跌';
      btn.disabled = false;
      return;
    }
    // 等 approve 确认（简单等待）
    await new Promise(r => setTimeout(r, 2000));

    // ── Step 2：betWithGavel(string caseId, uint8 direction, uint256 amount) ──
    btn.textContent = '⏳ 链上押注中…';
    showToast('Step 2/2：链上押注…');
    const betData = encodeBetWithGavel(caseId, dirCode, amtWei);
    const betTx = await callContract(MEME_COURT_ADDRESS, betData);
    if (!betTx) {
      btn.textContent = betDirection === 'up' ? '📈 押注看涨' : '📉 押注看跌';
      btn.disabled = false;
      return;
    }

    // ── 成功后更新 UI ──
    gavelBalance -= amt;
    document.getElementById('gavelBalNum').textContent = gavelBalance.toLocaleString();
    document.getElementById('betBalanceNum').textContent = gavelBalance.toLocaleString();
    const d = coinBets[betCoin.name];
    d.myDir = betDirection; d.myAmt = amt;
    if (betDirection === 'up') d.upTotal += amt; else d.downTotal += amt;
    const bets = parseInt(document.getElementById('poolBets').textContent) + 1;
    document.getElementById('poolBets').textContent = bets;

    // 保存链上押注记录
    saveBetRecord({
      coin: betCoin.name, dir: betDirection, amt,
      caseId, txHash: betTx,
      date: new Date().toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit'})
    });

    document.getElementById('betBody').style.display = 'none';
    document.getElementById('betSuccess').style.display = 'block';
    document.getElementById('betSuccessChip').textContent =
      `已押注 ${amt.toLocaleString()} $GAVEL · ${betDirection === 'up' ? '📈 看涨' : '📉 看跌'} ${betCoin.name}`;

    // 在成功页展示 BSCScan 链接
    const txLinkEl = document.getElementById('betTxLink');
    if (txLinkEl) {
      txLinkEl.innerHTML = `<a href="https://testnet.bscscan.com/tx/${betTx}" target="_blank"
        style="color:var(--accent);font-size:11px">查看链上交易 ↗</a>`;
    }

    renderRankList();
    showToast('✅ 链上押注成功！');

  } catch(e) {
    showToast('押注失败：' + (e.message || '未知错误'));
    btn.textContent = betDirection === 'up' ? '📈 押注看涨' : '📉 押注看跌';
    btn.disabled = false;
  }
}

// ── ABI 编码辅助（无 ethers.js）──
function encodeStringParam(str) {
  const bytes = new TextEncoder().encode(str);
  const lenHex = bytes.length.toString(16).padStart(64, '0');
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2,'0')).join('');
  const padded = hex.padEnd(Math.ceil(hex.length / 64) * 64, '0');
  return lenHex + padded;
}

function encodeApprove(spender, amountWei) {
  // approve(address,uint256) selector = 0x095ea7b3
  const sel = '095ea7b3';
  const addr = spender.slice(2).toLowerCase().padStart(64,'0');
  const amt  = amountWei.toString(16).padStart(64,'0');
  return '0x' + sel + addr + amt;
}

function encodeBetWithGavel(caseId, direction, amountWei) {
  // betWithGavel(string,uint8,uint256)
  // selector precomputed: keccak256("betWithGavel(string,uint8,uint256)") -> 首4字节
  const sel = '7b9a3706'; // SELECTORS.betWithGavel
  // ABI encoding: (string, uint8, uint256)
  // offsets: string @ 0x60, uint8, uint256, then string data
  const strOffset = '0000000000000000000000000000000000000000000000000000000000000060';
  const dirHex    = direction.toString(16).padStart(64,'0');
  const amtHex    = amountWei.toString(16).padStart(64,'0');
  const strData   = encodeStringParam(caseId);
  return '0x' + sel + strOffset + dirHex + amtHex + strData;
}

function closeBetModal(e) { if (e.target === document.getElementById('betOverlay')) closeBetDirect(); }
function closeBetDirect() { document.getElementById('betOverlay').classList.remove('open'); }

/* ── 押注封盘倒计时 ── */
function updateBetDeadline() {
  const deadline = new Date('2026-04-14T20:00:00');
  const diff = deadline - new Date();
  const setText = (id, val) => { const el=document.getElementById(id); if(el) el.textContent=val; };
  if (diff <= 0) {
    setText('betDeadline','已封盘'); setText('betCountdown','已封盘'); setText('bpDeadline','已封盘');
    return;
  }
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const str = `${h}h ${m}m ${s}s`;
  setText('betDeadline', str); setText('betCountdown', str); setText('bpDeadline', str);
}

/* ══ 档位临界标准（快审3h / 标准24h / 深审7天） ══ */

const TIER_THRESHOLDS = {
  fast:     { minCapUsd:1000,    maxCapUsd:100000,  minHolders:0,    minChange:20, duration:3*3600000 },
  standard: { minCapUsd:100000,  maxCapUsd:1000000, minHolders:300,  minChange:0,  duration:24*3600000 },
  deep:     { minCapUsd:1000000, maxCapUsd:Infinity, minHolders:2000, minChange:0, duration:7*24*3600000 },
};

function classifyTier(cap, holders, change24h) {
  const capN  = parseFloat(cap)     || 0;
  const holdN = parseInt(holders)   || 0;
  const chgN  = parseFloat(change24h)|| 0;
  if (capN >= 1000000 && holdN >= 2000) return 'deep';
  if (capN >= 100000  && holdN >= 300)  return 'standard';
  if (capN >= 1000    || chgN  >= 20)   return 'fast';
  return null;
}

function autoTier(capUsd, holders, change24h) {
  const t = classifyTier(capUsd, holders, change24h);
  if (t === 'deep')     return { tier:'deep',     tierLabel:'深审', tierCls:'cc-tier-deep' };
  if (t === 'standard') return { tier:'standard', tierLabel:'标准', tierCls:'cc-tier-standard' };
  return { tier:'fast', tierLabel:'快审', tierCls:'cc-tier-fast' };
}

function switchCourtTab(tab) {
  currentCourtTab = tab;
  document.querySelectorAll('.court-tab').forEach(t => t.classList.remove('active'));
  const el = document.getElementById('courtTab-' + tab);
  if (el) el.classList.add('active');
  renderCourtCards();
}

function switchCourtFilter(filter, btn) {
  currentCourtFilter = filter;
  document.querySelectorAll('.court-filter-pill').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderCourtCards();
}

function updateCourtTabCounts() {
  const total = courtData.live.length + courtData.pending.length;
  const setC = (id, n) => { const el = document.getElementById(id); if (el) el.textContent = n; };
  setC('courtTabCount-all',     total);
  setC('courtTabCount-live',    courtData.live.length);
  setC('courtTabCount-pending', courtData.pending.length);
}

function calcPendingProgress(c) {
  const capN  = parseFloat((c.cap || c.liq || '0').replace(/[^0-9.]/g,'')) || 0;
  const holdN = parseInt(c.holders) || 0;
  const chgN  = Math.abs(parseFloat(c.change) || 0);
  const tier  = c.tier || 'fast';
  const thr   = TIER_THRESHOLDS[tier];
  if (!thr) return { pct:0, hint:'—', color:'#d97706' };
  const capPct  = thr.minCapUsd  > 0 ? Math.min(100,(capN /thr.minCapUsd )*100) : 0;
  const chgPct  = thr.minChange  > 0 ? Math.min(100,(chgN /thr.minChange )*100) : 0;
  const holdPct = thr.minHolders > 0 ? Math.min(100,(holdN/thr.minHolders)*100) : 0;
  const pct = Math.round(Math.max(capPct, chgPct, holdPct));
  const left = thr.minCapUsd - capN;
  const hint = pct >= 100
    ? '✅ 达标，等待 AI 开庭'
    : left > 0
      ? `还差 $${left>=1000?(left/1000).toFixed(0)+'K':left.toFixed(0)} 市值开庭`
      : `已达涨幅/持仓标准，等待确认`;
  const color = pct>=80?'#16a34a':pct>=50?'#d97706':'#6b6b68';
  return { pct, hint, color };
}

function formatCountdown(endTime) {
  const diff = endTime - Date.now();
  if (diff <= 0) return '⏰ 已到期';
  const h = Math.floor(diff/3600000);
  const m = Math.floor((diff%3600000)/60000);
  if (h >= 24) return `${Math.floor(h/24)}天${h%24}h`;
  if (h > 0)   return `${h}h ${m}m`;
  return `${m}m`;
}

function renderCourtCards() {
  const grid = document.getElementById('courtCardsGrid');
  if (!grid) return;
  updateCourtTabCounts();

  let liveData    = [...courtData.live];
  let pendingData = [...courtData.pending];
  if (currentCourtTab === 'live')    pendingData = [];
  if (currentCourtTab === 'pending') liveData    = [];
  if (currentCourtFilter !== 'all') {
    liveData    = liveData.filter(c => c.tier === currentCourtFilter);
    pendingData = pendingData.filter(c => c.tier === currentCourtFilter);
  }

  const totalShown = liveData.length + pendingData.length;
  const countEl = document.getElementById('courtFilterCount');
  if (countEl) countEl.textContent = `共 ${totalShown} 个案件`;

  if (!totalShown) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text3);font-size:14px">暂无案件</div>`;
    return;
  }

  let html = '';

  // ── 进行中 ──
  if (liveData.length) {
    if (currentCourtTab === 'all') {
      html += `<div class="court-group-label">
        <span class="court-group-label-text">🔴 进行中 · ${liveData.length} 个</span>
        <div class="court-group-label-line"></div>
      </div>`;
    }
    liveData.forEach(c => {
      const timerDisplay = c.endTime ? formatCountdown(c.endTime) : c.timer;
      const isUrgent = c.endTime ? (c.endTime - Date.now()) < 30*60000 : c.urgent;
      html += `
      <div class="court-card status-live" onclick="openCourtDetail('${c.id}')">
        <div class="cc-top">
          <div class="cc-header">
            <div class="cc-coin">
              <div class="cc-icon">${c.iconImg?`<img src="${c.iconImg}" style="width:100%;height:100%;object-fit:cover;border-radius:10px" onerror="this.parentElement.textContent='${c.icon}'">`:`${c.icon}`}</div>
              <div><div class="cc-name">${c.name}</div><div class="cc-source">${c.source}</div></div>
            </div>
            <div class="cc-status-wrap">
              <span class="cc-status cc-status-live"><span class="live-dot"></span>开庭中</span>
              <span class="cc-tier-badge ${c.tierCls}">${c.tierLabel}</span>
              ${c.aiVerdict?.risk==='高风险'||c.aiVerdict?.risk==='极高风险'?`<span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:99px;background:#fef2f2;color:#dc2626;border:1px solid #fecaca">⚠️ ${c.aiVerdict.risk}</span>`:''}
              <span class="cc-timer${isUrgent?' urgent':''}">${timerDisplay}</span>
            </div>
          </div>
          <div class="cc-bet-bar-wrap">
            <div class="cc-bet-labels">
              <span class="cc-bet-up">📈 看涨 ${c.betUp}%</span>
              <span class="cc-bet-down">📉 看跌 ${c.betDown}%</span>
            </div>
            <div class="cc-bet-bar"><div class="cc-bet-fill" style="width:${c.betUp}%"></div></div>
          </div>
        </div>
        <div class="cc-mid">
          <div class="cc-metrics">
            <div class="cc-metric"><div class="cc-metric-val">${c.liq}</div><div class="cc-metric-lbl">流动性</div></div>
            <div class="cc-metric"><div class="cc-metric-val ${c.changeUp?'up':'down'}">${c.change}</div><div class="cc-metric-lbl">涨跌幅</div></div>
            <div class="cc-metric"><div class="cc-metric-val">${c.whale}</div><div class="cc-metric-lbl">巨鲸动向</div></div>
          </div>
        </div>
        <div class="cc-bottom">
          <div class="cc-pool">
            <div class="cc-pool-val" style="display:flex;align-items:baseline;gap:5px">
              <span style="color:${(c.bnbPool||0)>0?'#f97316':'#c2732b'};font-weight:800;transition:color .2s">${(c.bnbPool||0)>0?(c.bnbPool).toFixed(3)+' BNB':'0 BNB'}</span>
              <span style="color:var(--text3);font-size:11px;font-weight:700">+</span>
              <span style="font-size:10px;font-weight:700;color:#16a34a;font-family:var(--mono)">${c.pool.toLocaleString()} $GAVEL</span>
            </div>
            <div class="cc-pool-lbl">奖池 · ${c.initiator}${(c.injectedBnb||0)>0?' · 已注入 '+(c.injectedBnb).toFixed(3)+' BNB':''}</div>
          </div>
          <div class="cc-bottom-right">
            <span class="cc-participants">${c.participants>0?c.participants+'人参与':'等待中'}</span>
            <div style="display:flex;gap:5px">
              <button class="cc-inject-btn" onclick="event.stopPropagation();openInjectModal('${c.id}')">💉 注入</button>
              <button class="cc-join-btn" onclick="event.stopPropagation();openCourtDetail('${c.id}')">参与开庭</button>
            </div>
          </div>
        </div>
      </div>`;
    });
  }

  // ── 候审 ──
  if (pendingData.length) {
    if (currentCourtTab === 'all') {
      html += `<div class="court-group-label" style="margin-top:${liveData.length?'12px':'0'}">
        <span class="court-group-label-text">⏳ 候审中 · ${pendingData.length} 个</span>
        <div class="court-group-label-line"></div>
      </div>`;
    }
    html += `<div style="grid-column:1/-1;margin-bottom:4px;padding:8px 12px;background:rgba(22,163,74,0.06);border:1px solid rgba(22,163,74,0.15);border-radius:10px;display:flex;align-items:center;gap:8px">
      <span style="width:6px;height:6px;border-radius:50%;background:#16a34a;display:inline-block;flex-shrink:0"></span>
      <span style="font-size:11px;color:var(--text2)">⚡ <strong>真实数据</strong> · 自动拉取 four.meme 热度/涨幅/新币三榜 · 每 5 分钟刷新</span>
    </div>`;
    pendingData.forEach(c => {
      const prog = calcPendingProgress(c);
      html += `
      <div class="court-card status-pending" onclick="openCourtDetail('${c.id}')">
        <div class="cc-top">
          <div class="cc-header">
            <div class="cc-coin">
              <div class="cc-icon">${c.iconImg?`<img src="${c.iconImg}" style="width:100%;height:100%;object-fit:cover;border-radius:10px" onerror="this.parentElement.textContent='${c.icon}'">`:`${c.icon}`}</div>
              <div><div class="cc-name">${c.name}</div><div class="cc-source">${c.source}</div></div>
            </div>
            <div class="cc-status-wrap">
              <span class="cc-status cc-status-pending">⏳ 候审中</span>
              <span class="cc-tier-badge ${c.tierCls}">${c.tierLabel}</span>
            </div>
          </div>
          <div style="font-size:11px;color:var(--text3);text-align:center;padding:4px 0">开庭后可参与押注</div>
        </div>
        <div class="cc-mid">
          <div class="cc-metrics">
            <div class="cc-metric"><div class="cc-metric-val">${c.liq}</div><div class="cc-metric-lbl">流动性</div></div>
            <div class="cc-metric"><div class="cc-metric-val ${c.changeUp?'up':'down'}">${c.change}</div><div class="cc-metric-lbl">涨跌幅</div></div>
            <div class="cc-metric"><div class="cc-metric-val">${c.holders}</div><div class="cc-metric-lbl">持仓地址</div></div>
          </div>
        </div>
        <div class="cc-pending-progress">
          <div class="cc-pending-progress-label">
            <span class="cc-pending-progress-title">📡 距开庭进度</span>
            <span class="cc-pending-progress-pct" style="color:${prog.color}">${prog.pct}%</span>
          </div>
          <div class="cc-pending-progress-track">
            <div class="cc-pending-progress-fill" style="width:${prog.pct}%;background:${prog.color}"></div>
          </div>
          <div class="cc-pending-progress-hint">${prog.hint}</div>
        </div>
        <div class="cc-bottom">
          <div class="cc-pool">
            <div class="cc-pool-val" style="display:flex;align-items:baseline;gap:5px">
              <span style="color:#c2732b;font-weight:800">0 BNB</span>
              <span style="color:var(--text3);font-size:11px;font-weight:700">+</span>
              <span style="font-size:10px;font-weight:700;color:#16a34a;font-family:var(--mono)">${c.pool.toLocaleString()} $GAVEL</span>
            </div>
            <div class="cc-pool-lbl">平台代币奖池 · ${c.initiator}</div>
          </div>
          <div class="cc-bottom-right">
            <span class="cc-participants">等待开庭</span>
            <button class="cc-join-btn" style="background:var(--amber);opacity:.85;cursor:default">等待开庭</button>
          </div>
        </div>
      </div>`;
    });
  }

  grid.innerHTML = html;
}

function openCourtDetail(id) {
  // 找到案件数据
  const allCases = [...courtData.live, ...courtData.pending, ...courtData.closed];
  const c = allCases.find(x => x.id === id);
  if (!c) return;

  currentDetailCase = c;
  detailBetDir = null;
  detailDanmakuDir = null;
  danmakuUpCount = 0;
  danmakuDownCount = 0;
  _highRiskVerdict = null;
  _riskConfirmed = false;
  // 清除旧的赔率和风险警告
  const bpAiOdds = document.getElementById('bpAiOdds');
  if (bpAiOdds) bpAiOdds.style.display = 'none';
  const bpRiskWarn = document.getElementById('bpRiskWarning');
  if (bpRiskWarn) bpRiskWarn.remove();

  const isLive = courtData.live.includes(c);
  const isPending = courtData.pending.includes(c);
  const isClosed = courtData.closed.includes(c);

  // 填充顶栏
  document.getElementById('detailTbIcon').textContent = c.icon;
  document.getElementById('detailTbName').textContent = c.name;
  document.getElementById('detailTbCase').textContent = c.id;
  document.getElementById('detailTbPool').textContent = c.pool.toLocaleString();
  document.getElementById('detailTbTimer').textContent = c.timer;
  document.getElementById('detailTbTimer').className = 'detail-tb-timer-val' + (c.urgent?' urgent':'');
  document.getElementById('detailTbTimerLbl').textContent = isLive ? '距封盘' : isPending ? '候审中' : '已结案';
  document.getElementById('detailTbUpPct').textContent = `📈 ${c.betUp||0}%`;
  document.getElementById('detailTbDownPct').textContent = `📉 ${c.betDown||0}%`;
  document.getElementById('detailTbBarFill').style.width = (c.betUp||50) + '%';
  document.getElementById('detailTbStatus').innerHTML = isLive
    ? `<div class="detail-tb-status live"><span class="live-dot"></span>开庭中</div>`
    : isPending ? `<div class="detail-tb-status pending">⏳ 候审中</div>`
    : `<div class="detail-tb-status closed">✅ 已结案</div>`;
  document.getElementById('detailTbTier').innerHTML = `<span class="cc-tier-badge ${c.tierCls}">${c.tierLabel}</span>`;

  // 链上数据横排
  document.getElementById('detailMetricsBar').innerHTML = [
    {val:c.liq, lbl:'初始流动性'},
    {val:c.holders, lbl:'持仓地址'},
    {val:c.change, lbl:'涨跌幅', cls:c.changeUp?'up':'down'},
    {val:c.whale||'—', lbl:'巨鲸动向'},
    {val:c.participants+'人', lbl:'参与押注'},
  ].map(m=>`<div class="detail-metric-item">
    <div class="detail-metric-val ${m.cls||''}">${m.val}</div>
    <div class="detail-metric-lbl">${m.lbl}</div>
  </div>`).join('');

  // 押注台
  const bnbPool = (c.pool * 0.7 / 320).toFixed(3);
  document.getElementById('bpBnbPool').textContent = bnbPool;
  document.getElementById('bpBnbUsd').textContent = '≈ $' + Math.round(parseFloat(bnbPool) * 300);
  document.getElementById('bpPoolVal').textContent = c.pool.toLocaleString();
  document.getElementById('bpDeadline').textContent = c.timer;
  document.getElementById('bpUpPct').textContent = `📈 看涨 ${c.betUp||0}%`;
  document.getElementById('bpDownPct').textContent = `📉 看跌 ${c.betDown||0}%`;
  document.getElementById('bpBarFill').style.width = (c.betUp||50) + '%';
  document.getElementById('bpUpOdds').textContent = Math.floor((c.participants||0)*0.62) + ' 人押注';
  document.getElementById('bpDownOdds').textContent = Math.floor((c.participants||0)*0.38) + ' 人押注';
  document.getElementById('bpBalance').textContent = gavelBalance.toLocaleString();
  document.getElementById('bpAmountInput').value = '';
  document.getElementById('bpEstReward').textContent = '— $GAVEL';
  document.getElementById('bpSubmitBtn').textContent = '选择方向后押注';
  document.getElementById('bpSubmitBtn').disabled = true;
  document.getElementById('bpDirUp').classList.remove('selected');
  document.getElementById('bpDirDown').classList.remove('selected');

  // 弹幕区状态
  const canBet = isLive && walletConnected;
  document.getElementById('dcwLocked').style.display = canBet ? 'none' : 'block';
  document.getElementById('dcwInputRow').style.display = canBet ? 'flex' : 'none';
  document.getElementById('dcwUpCount').textContent = `📈 看涨 0 条`;
  document.getElementById('dcwDownCount').textContent = `📉 看跌 0 条`;

  // AI 裁定 / 结案页
  if (isClosed && c.verdict) {
    document.getElementById('dvsSubTitle').textContent = '裁定已出 · 案件已结案';
    const isWinUp = c.verdictResult?.includes('看涨');
    const winColor = isWinUp ? '#4ade80' : '#f87171';
    const winLabel = isWinUp ? '📈 看涨方胜出' : '📉 看跌方胜出';
    const verdictColor = c.verdict === '持有' || c.verdict === '小仓' ? '#4ade80' : c.verdict === '等待' || c.verdict === '观望' ? '#fbbf24' : '#f87171';

    document.getElementById('dvsBody').innerHTML = `
      <!-- 结案 Banner -->
      <div style="background:rgba(22,163,74,0.08);border:1px solid rgba(22,163,74,0.2);border-radius:12px;padding:14px 16px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:22px">✅</span>
          <div>
            <div style="font-size:13px;font-weight:800;color:#4ade80">庭审已结案</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.4)">${c.id} · ${c.tierLabel} · ${c.participants} 人参与押注</div>
          </div>
        </div>
        <div style="font-size:13px;font-weight:800;padding:6px 16px;border-radius:99px;background:rgba(22,163,74,0.15);color:#4ade80;border:1px solid rgba(22,163,74,0.3)">${winLabel}</div>
      </div>

      <!-- AI 裁定结果 -->
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:14px 16px;margin-bottom:14px">
        <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.3);letter-spacing:.08em;margin-bottom:10px">⚖️ AI 法官最终裁定</div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap">
          <span style="font-size:16px;font-weight:900;color:${verdictColor}">${c.verdict}</span>
          <span style="font-size:11px;padding:3px 10px;border-radius:99px;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.5)">置信度 ${c.confidence || 82}%</span>
          <span style="font-size:11px;padding:3px 10px;border-radius:99px;background:rgba(217,119,6,0.15);color:#fbbf24">${c.risk || '中风险'}</span>
        </div>
        <div style="font-size:12px;color:rgba(255,255,255,0.5);line-height:1.7">${c.verdictFull || '本庭综合链上数据与社区投票，对 ' + c.name + ' 作出最终裁定。押对方向的陪审员已按比例分配 $GAVEL 奖励。'}</div>
      </div>

      <!-- 押注结算 -->
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:14px 16px;margin-bottom:14px">
        <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.3);letter-spacing:.08em;margin-bottom:10px">💰 押注结算</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
          <div style="padding:10px;background:rgba(255,255,255,0.04);border-radius:8px;text-align:center">
            <div style="font-size:9px;color:rgba(255,255,255,0.3);margin-bottom:4px">本期奖池</div>
            <div style="font-size:16px;font-weight:800;color:var(--accent);font-family:var(--mono)">${c.pool.toLocaleString()}</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.25)">$GAVEL</div>
          </div>
          <div style="padding:10px;background:rgba(255,255,255,0.04);border-radius:8px;text-align:center">
            <div style="font-size:9px;color:rgba(255,255,255,0.3);margin-bottom:4px">参与押注</div>
            <div style="font-size:16px;font-weight:800;color:#fff;font-family:var(--mono)">${c.participants}</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.25)">人</div>
          </div>
        </div>
        ${walletConnected ? `
        <div style="padding:10px 12px;background:rgba(255,99,64,0.08);border:1px solid rgba(255,99,64,0.2);border-radius:8px;margin-bottom:10px;font-size:12px;color:rgba(255,255,255,0.5)">
          🔍 检测钱包中的押注记录…<br>
          <span style="font-size:11px;color:rgba(255,255,255,0.3)">如有获胜押注，领取按钮将在下方出现</span>
        </div>
        <button onclick="claimGavelReward('${c.id}')" style="width:100%;background:var(--accent);color:#fff;border:none;border-radius:10px;padding:11px;font-size:13px;font-weight:700;cursor:pointer;font-family:var(--sans)">🎁 领取 $GAVEL 奖励</button>
        ` : `
        <div style="font-size:12px;color:rgba(255,255,255,0.3);text-align:center;padding:8px">连接钱包后可查看并领取押注奖励</div>
        `}
      </div>

      <!-- 链上存证 -->
      <div style="display:flex;align-items:center;gap:8px;font-size:11px;color:rgba(255,255,255,0.25)">
        <span style="width:5px;height:5px;border-radius:50%;background:#4ade80;display:inline-block"></span>
        裁定已上链存证 ·
        <a href="https://testnet.bscscan.com/address/${MEME_COURT_ADDRESS}" target="_blank" style="color:rgba(255,99,64,0.6)">BSCScan ↗</a>
        · 不可篡改
      </div>
    `;
  } else if (isLive) {
    document.getElementById('dvsSubTitle').textContent = 'AI 法官分析中…';
    document.getElementById('dvsBody').innerHTML = `<div class="dvs-loading"><div class="jp-dots"><span></span><span></span><span></span></div>AI 法官正在综合链上数据…</div>`;
    // 调用真实 Gemini AI 分析
    requestAIVerdict(c);
  } else {
    document.getElementById('dvsSubTitle').textContent = '候审中，开庭后裁定';
    document.getElementById('dvsBody').innerHTML = `<div class="dvs-loading"><div class="jp-dots"><span></span><span></span><span></span></div>候审中，开庭后裁定…</div>`;
  }

  // 尝试加载真实链上数据
  refreshDetailMetrics(c);
  clearDanmakuBattlefield();
  if (isLive) startCourtDanmaku(c);

  showPage('court-detail');
}

async function requestAIVerdict(c) {
  const sys = `你是 Meme 法庭的 AI 法官「链上包公」，在 BNB Chain 的 four.meme 平台工作。
根据以下链上数据对一个 Meme 币案件作出裁定。
严格按以下 JSON 格式输出，不输出任何其他内容，不加 markdown 代码块：
{"verdict":"BULLISH或BEARISH","confidence":0到100的数字,"short":"3-4句精简裁定，法庭语气，幽默毒舌，用换行分隔。","full":"2-3段详细分析，包含数据解读+风险提示+押注建议，段间用\\n\\n分隔。","risk":"低风险或中风险或高风险或极高风险"}
不构成投资建议，纯娱乐。`;

  const userMsg = `案件信息：
- 币种：${c.name}（${c.id}）
- 档位：${c.tierLabel}
- 流动性：${c.liq}
- 24h涨跌：${c.change}
- 持仓地址：${c.holders}
- 巨鲸动向：${c.whale || '无异常'}
- 社区押注：看涨 ${c.betUp||50}% vs 看跌 ${c.betDown||50}%
- 参与押注人数：${c.participants}
- 奖池规模：${c.pool.toLocaleString()} $GAVEL
- 项目来源：${c.source || 'four.meme'}
请给出正式裁定。`;

  try {
    const raw = await callGemini(sys, userMsg);
    let parsed;
    try { parsed = JSON.parse(raw.replace(/```json|```/g,'').trim()); }
    catch { parsed = { verdict:'NEUTRAL', confidence:50, short:raw, full:'', risk:'未知' }; }

    const verdictColor = parsed.verdict === 'BULLISH' ? '#16a34a' : '#dc2626';
    const verdictText = parsed.verdict === 'BULLISH' ? '📈 看涨' : '📉 看跌';
    const verdictLabel = parsed.verdict === 'BULLISH' ? '看涨' : '看跌';
    const lines = (parsed.short || '').split('\n').filter(Boolean);
    const shortHTML = lines.map((l,i) => i === lines.length-1 ? `<strong>${l}</strong>` : l).join('<br>');

    const dvsBody = document.getElementById('dvsBody');
    const dvsSubTitle = document.getElementById('dvsSubTitle');
    if (!dvsBody) return;

    dvsSubTitle.textContent = `AI 裁定：${verdictLabel} · 置信度 ${parsed.confidence}% · ${parsed.risk}`;

    dvsBody.innerHTML = `<div class="dvs-result">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
        <span style="font-size:18px;font-weight:800;color:${verdictColor}">${verdictText}</span>
        <span style="font-size:12px;color:rgba(255,255,255,0.5)">置信度 ${parsed.confidence}%</span>
        <span style="font-size:11px;padding:2px 8px;border-radius:4px;background:rgba(255,99,64,0.15);color:var(--accent)">${parsed.risk}</span>
      </div>
      <div style="font-size:13px;line-height:1.7;color:rgba(255,255,255,0.85);margin-bottom:12px">${shortHTML}</div>
      ${parsed.full ? `
        <div style="border-top:1px solid rgba(255,255,255,0.1);margin:12px 0;padding-top:12px;font-size:12px;line-height:1.7;color:rgba(255,255,255,0.6)">
          ${parsed.full.replace(/\n/g,'<br>')}
        </div>` : ''}
      <div style="font-size:10px;color:rgba(255,255,255,0.25);margin-top:10px">本裁定由 AI 法官生成 · 仅供娱乐参考 · 不构成投资建议</div>
    </div>`;

    // 缓存裁定结果到案件数据（避免重复请求）
    c.aiVerdict = parsed;

    // ── AI 裁定影响押注赔率 ──
    updateBpOdds(parsed);

    // ── 高风险标记 ──
    if (parsed.risk === '高风险' || parsed.risk === '极高风险') {
      markHighRisk(parsed.risk, parsed.short);
    }

  } catch(e) {
    const dvsBody = document.getElementById('dvsBody');
    if (dvsBody) dvsBody.innerHTML = `<div class="dvs-result"><strong>⚖️ 本庭暂时无法审理此案。</strong><br>网络异常，请稍后再试。</div>`;
  }
}

// ── AI 裁定影响赔率 ──
function updateBpOdds(verdict) {
  const el = document.getElementById('bpAiOdds');
  if (!el) return;
  el.style.display = 'block';

  const v = verdict.verdict;
  const conf = (verdict.confidence || 50) / 100;

  // 赔率算法：AI 看涨且置信度高 → 看涨方赔率低（竞争激烈），看跌赔率高（冷门）
  // 基础赔率 2.0x，根据 AI 方向和置信度偏移最多 ±1.2x
  const shift = conf * 1.2;
  let upMult, downMult;
  if (v === 'BULLISH') {
    upMult = Math.max(1.1, (2.0 - shift)).toFixed(1);
    downMult = Math.min(5.0, (2.0 + shift)).toFixed(1);
  } else if (v === 'BEARISH') {
    upMult = Math.min(5.0, (2.0 + shift)).toFixed(1);
    downMult = Math.max(1.1, (2.0 - shift)).toFixed(1);
  } else {
    upMult = '2.0'; downMult = '2.0';
  }

  document.getElementById('bpUpMultiplier').textContent = upMult + 'x';
  document.getElementById('bpDownMultiplier').textContent = downMult + 'x';

  const badge = document.getElementById('bpAiVerdictBadge');
  if (v === 'BULLISH') {
    badge.textContent = `📈 AI 看涨 ${verdict.confidence}%`;
    badge.style.cssText = 'font-size:11px;font-weight:700;padding:4px 12px;border-radius:99px;background:rgba(74,222,128,0.12);color:#4ade80;border:1px solid rgba(74,222,128,0.25)';
  } else if (v === 'BEARISH') {
    badge.textContent = `📉 AI 看跌 ${verdict.confidence}%`;
    badge.style.cssText = 'font-size:11px;font-weight:700;padding:4px 12px;border-radius:99px;background:rgba(248,113,113,0.12);color:#f87171;border:1px solid rgba(248,113,113,0.25)';
  } else {
    badge.textContent = `⚖️ AI 中立 ${verdict.confidence}%`;
    badge.style.cssText = 'font-size:11px;font-weight:700;padding:4px 12px;border-radius:99px;background:rgba(251,191,36,0.12);color:#fbbf24;border:1px solid rgba(251,191,36,0.25)';
  }

  // 同步存到案件数据，押注时用
  if (currentDetailCase) {
    currentDetailCase._upMult = parseFloat(upMult);
    currentDetailCase._downMult = parseFloat(downMult);
  }
}

// ── 高风险标记 ──
let _highRiskVerdict = null;
function markHighRisk(riskLevel, shortText) {
  _highRiskVerdict = { riskLevel, shortText };
  // 在押注面板顶部加红色警告条
  const existing = document.getElementById('bpRiskWarning');
  if (existing) existing.remove();
  const warn = document.createElement('div');
  warn.id = 'bpRiskWarning';
  warn.style.cssText = 'margin-bottom:10px;padding:8px 12px;background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.25);border-radius:10px';
  warn.innerHTML = `<div style="font-size:11px;font-weight:700;color:#f87171;margin-bottom:3px">⚠️ AI 法官标记：${riskLevel}</div><div style="font-size:10px;color:rgba(255,255,255,0.4);line-height:1.5">${(shortText||'').split('\n').pop()}</div>`;
  const bpBody = document.querySelector('.bp-body');
  if (bpBody) bpBody.insertBefore(warn, bpBody.firstChild);
}

// ── 押注前高风险确认拦截（注入到 submitDetailBet 前） ──
let _riskConfirmed = false;
function checkRiskBeforeBet() {
  if (!_highRiskVerdict || _riskConfirmed) return true;
  // 弹确认框
  const ok = confirm(`⚠️ 高风险警告\n\nAI 法官将此案件标记为「${_highRiskVerdict.riskLevel}」\n\n${(_highRiskVerdict.shortText||'').split('\n').pop()}\n\n押注即表示你已了解并接受相关风险。确认继续？`);
  if (ok) _riskConfirmed = true;
  return ok;
}


let danmakuTimer = null;
let danmakuUpCount = 0;
let danmakuDownCount = 0;
let detailBetDir = null;
let detailDanmakuDir = null;
let currentDetailCase = null;

const mockDanmakus = {
  up: ['必涨🚀','信仰无敌！','社区最强','HODL！','看好这个','要飞了','冲冲冲','马斯克要发推了','链上数据健康'],
  down: ['要跑路了💀','止损止损','项目方已跑','流动性不够','大户在撤','危险信号','别接刀','谨慎谨慎','已经跑了']
};

function clearDanmakuBattlefield() {
  if (danmakuTimer) { clearInterval(danmakuTimer); danmakuTimer = null; }
  const bf = document.getElementById('danmakuBattlefield');
  if (bf) {
    const items = bf.querySelectorAll('.court-danmaku-item');
    items.forEach(el => el.remove());
  }
}

function startCourtDanmaku(c) {
  const bf = document.getElementById('danmakuBattlefield');
  if (!bf) return;
  // 发射初始弹幕
  for (let i = 0; i < 6; i++) {
    setTimeout(() => spawnDanmaku(bf, Math.random() > 0.5 ? 'up' : 'down', false), i * 600);
  }
  danmakuTimer = setInterval(() => {
    if (Math.random() > 0.4) spawnDanmaku(bf, Math.random() > 0.5 ? 'up' : 'down', false);
  }, 1200);
}

function spawnDanmaku(bf, dir, isBig, text) {
  const el = document.createElement('div');
  const msgs = mockDanmakus[dir];
  const msg = text || msgs[Math.floor(Math.random() * msgs.length)];
  el.className = `court-danmaku-item cdi-${dir}${isBig?' cdi-big':''}`;
  el.textContent = msg;
  const topPct = 10 + Math.random() * 75;
  el.style.top = topPct + '%';
  const duration = 4 + Math.random() * 3;
  if (dir === 'up') {
    el.style.left = '0';
    el.style.animation = `fly-right ${duration}s linear forwards`;
  } else {
    el.style.right = '0';
    el.style.animation = `fly-left ${duration}s linear forwards`;
  }
  bf.appendChild(el);
  setTimeout(() => el.remove(), (duration + 0.5) * 1000);
  // 更新计数
  if (dir === 'up') { danmakuUpCount++; document.getElementById('dcwUpCount').textContent = `📈 看涨 ${danmakuUpCount} 条`; }
  else { danmakuDownCount++; document.getElementById('dcwDownCount').textContent = `📉 看跌 ${danmakuDownCount} 条`; }
}

function sendPreset(text, dir) {
  if (!detailDanmakuDir) { showToast('请先完成押注才能发送弹幕'); return; }
  if (dir !== detailDanmakuDir) { showToast(`你押注了${detailDanmakuDir==='up'?'看涨':'看跌'}，只能发${detailDanmakuDir==='up'?'绿色':'红色'}弹幕`); return; }
  const bf = document.getElementById('danmakuBattlefield');
  if (bf) spawnDanmaku(bf, dir, true, text);
}

function sendDanmaku(dir) {
  const input = document.getElementById('dcwInput');
  const text = input.value.trim();
  if (!text) { showToast('请输入弹幕内容'); return; }
  if (!detailDanmakuDir) { showToast('请先完成押注才能发送弹幕'); return; }
  if (dir !== detailDanmakuDir) { showToast(`你押注了${detailDanmakuDir==='up'?'看涨':'看跌'}，只能发对应方向的弹幕`); return; }
  const bf = document.getElementById('danmakuBattlefield');
  if (bf) spawnDanmaku(bf, dir, true, text);
  input.value = '';
}

/* ── 详情页押注 ── */
function selectDetailDir(dir) {
  detailBetDir = dir;
  document.getElementById('bpDirUp').classList.toggle('selected', dir === 'up');
  document.getElementById('bpDirDown').classList.toggle('selected', dir === 'down');
  updateDetailReward();
  const btn = document.getElementById('bpSubmitBtn');
  btn.disabled = false;
  btn.textContent = dir === 'up' ? '📈 押注看涨' : '📉 押注看跌';
}

function setBpPreset(v) {
  document.getElementById('bpAmountInput').value = Math.min(v, gavelBalance);
  updateDetailReward();
}
function setBpPresetMax() {
  document.getElementById('bpAmountInput').value = gavelBalance;
  updateDetailReward();
}

function updateDetailReward() {
  const amt = parseInt(document.getElementById('bpAmountInput').value) || 0;
  if (!amt || !currentDetailCase || !detailBetDir) {
    document.getElementById('bpEstBnb').textContent = '— BNB';
    document.getElementById('bpEstReward').textContent = '— $GAVEL';
    return;
  }
  const pool = currentDetailCase.pool;
  const bnbPool = pool * 0.7 / 320;
  const sideTotal = detailBetDir === 'up' ? Math.floor(pool*0.62) : Math.floor(pool*0.38);
  const ratio = amt / (sideTotal + amt);
  const estBnb = (ratio * bnbPool * 0.8).toFixed(4);
  const estGavel = Math.floor(ratio * pool * 0.8);
  document.getElementById('bpEstBnb').textContent = '+' + estBnb + ' BNB';
  document.getElementById('bpEstReward').textContent = '+' + estGavel.toLocaleString() + ' $GAVEL';
}

async function submitDetailBet() {
  if (!walletConnected) { showToast('请先连接钱包'); return; }
  const amt = parseInt(document.getElementById('bpAmountInput').value) || 0;
  if (!amt || amt < 10) { showToast('最少押注 10 $GAVEL'); return; }
  if (amt > 5000) { showToast('单次押注上限 5,000 $GAVEL'); return; }
  if (amt > gavelBalance) { showToast('余额不足'); return; }
  if (!detailBetDir) { showToast('请选择押注方向'); return; }
  if (!currentDetailCase) return;

  // 高风险确认拦截
  if (!checkRiskBeforeBet()) return;

  const btn = document.getElementById('bpSubmitBtn');
  btn.textContent = '⏳ 等待授权…'; btn.disabled = true;

  const caseId = currentDetailCase.caseId || currentDetailCase.id || ('CASE-' + currentDetailCase.name.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8));
  const dirCode = detailBetDir === 'up' ? 1 : 0;
  const amtWei = BigInt(amt) * BigInt('1000000000000000000');

  try {
    // Step 1: approve
    showToast('Step 1/2：授权 $GAVEL 额度…');
    const approveData = encodeApprove(MEME_COURT_ADDRESS, amtWei);
    const approveTx = await callContract(GAVEL_TOKEN_ADDRESS, approveData);
    if (!approveTx) {
      btn.textContent = '确认押注'; btn.disabled = false; return;
    }
    await new Promise(r => setTimeout(r, 2000));

    // Step 2: betWithGavel
    btn.textContent = '⏳ 链上押注中…';
    showToast('Step 2/2：链上押注…');
    const betData = encodeBetWithGavel(caseId, dirCode, amtWei);
    const betTx = await callContract(MEME_COURT_ADDRESS, betData);
    if (!betTx) {
      btn.textContent = '确认押注'; btn.disabled = false; return;
    }

    // 成功：更新 UI
    gavelBalance -= amt;
    document.getElementById('gavelBalNum').textContent = gavelBalance.toLocaleString();
    document.getElementById('bpBalance').textContent = gavelBalance.toLocaleString();

    detailDanmakuDir = detailBetDir;
    document.getElementById('dcwLocked').style.display = 'none';
    document.getElementById('dcwInputRow').style.display = 'flex';
    const sendUp = document.getElementById('dcwSendUp');
    const sendDown = document.getElementById('dcwSendDown');
    if (sendUp) sendUp.style.display = detailBetDir === 'up' ? 'block' : 'none';
    if (sendDown) sendDown.style.display = detailBetDir === 'down' ? 'block' : 'none';

    currentDetailCase.pool += amt;
    document.getElementById('bpPoolVal').textContent = currentDetailCase.pool.toLocaleString();
    const newBnb = (currentDetailCase.pool * 0.7 / 320).toFixed(3);
    document.getElementById('bpBnbPool').textContent = newBnb;
    document.getElementById('bpBnbUsd').textContent = '≈ $' + Math.round(parseFloat(newBnb) * 300);

    btn.textContent = `✅ 已押注 ${amt.toLocaleString()} $GAVEL`;

    // 保存记录
    const today = new Date().toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit'});
    saveBetRecord({
      coin: currentDetailCase.name, icon: currentDetailCase.icon || '⚖️',
      caseId, dir: detailBetDir,
      dirLabel: detailBetDir === 'up' ? '📈 看涨' : '📉 看跌',
      amount: amt, status: 'pending', reward: '待结算', date: today,
      txHash: betTx, txType: 'gavel',
    });
    saveGavelHistory({
      type: 'bet', icon: detailBetDir === 'up' ? '📈' : '📉',
      title: `押注 ${detailBetDir === 'up' ? '看涨' : '看跌'} · ${currentDetailCase.name}`,
      sub: `${caseId} · <a href="https://testnet.bscscan.com/tx/${betTx}" target="_blank" style="color:var(--accent)">链上已确认 ↗</a>`,
      amount: `-${amt.toLocaleString()}`, rawAmount: -amt, date: today, positive: false
    });

    // 弹幕
    const bf = document.getElementById('danmakuBattlefield');
    if (bf) spawnDanmaku(bf, detailBetDir, true, detailBetDir==='up'?'我押涨！🚀':'我押跌！💀');

    showToast('✅ 链上押注成功！');
    // 弹出陪审员卡片（附带 tx hash）
    setTimeout(() => openJurorCard(currentDetailCase, detailBetDir, amt, betTx), 400);

  } catch(e) {
    showToast('押注失败：' + (e.message || '未知错误'));
    btn.textContent = '确认押注'; btn.disabled = false;
  }
}
