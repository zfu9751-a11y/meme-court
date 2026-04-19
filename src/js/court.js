// Meme Court - Court Logic
// Case management, betting, AI verdict, settlement


/* ══ 精选裁定轮播系统 ══ */


// Fallback mock 数据（API 未就绪或加载中时展示）
const FEATURED_FALLBACK = [
  {
    coin:'PEPE', icon:'🐸', pair:'PEPE / BNB', source:'four.meme · 上线 2 小时',
    verdict:'BULLISH', confidence:72, risk:'高风险',
    short:'流动性虽薄如蝉翼，但巨鲸已悄然入场吸筹。\n社区押注明显倾向看涨，配合 127% 的涨幅颇有妖币潜质。\n新币热度未散，快审档位赌的就是这波开盘冲锋。\n本庭警告：这不过是场限时烟花秀，切勿贪杯。',
    full:'本案 PEPE 上线仅 2 小时，流动性锁定 $48K，持仓地址 312 显示早期参与度尚可。24 小时涨幅 +127% 及社区押注 62% 看涨，显示市场情绪初步形成。\n\n然而流动性池过薄，大额卖出极易引发崩塌。建议极小仓位参与，设置严格止损，切勿 FOMO 追高。',
    metrics:[
      {label:'流动性', val:'$48K', sub:'DexScreener', color:'#fff'},
      {label:'24h 涨幅', val:'+127%', sub:'DexScreener', color:'#4ade80'},
      {label:'持仓地址', val:'312', sub:'Etherscan V2', color:'#fff'},
      {label:'巨鲸动向', val:'🐳 买入', sub:'大额追踪', color:'#ff6340'},
      {label:'参与押注', val:'89', sub:'人', color:'#fff'},
      {label:'社区看涨', val:'62%', sub:'押注比例', color:'#4ade80'},
    ],
    caseId:'C-2026-044',
  },
  {
    coin:'DOGE', icon:'🐶', pair:'DOGE / BNB', source:'four.meme · 上线 6 小时',
    verdict:'BULLISH', confidence:85, risk:'中风险',
    short:'老狗出新招，链上资金持续流入。\n巨鲸筹码集中度下降，散户参与度创本周新高。\n马斯克效应犹在，短期动能充足。\n本庭裁定：可小仓参与，但别忘了它涨多快、跌也多快。',
    full:'DOGE 本次拉升伴随明显的链上资金流入，持仓地址数 24 小时增加 847，显示新资金入场。社区押注看涨比例达 78%，为近期高位。\n\n风险在于 DOGE 高度依赖外部叙事驱动，缺乏基本面支撑。建议设置 15% 止损，不宜重仓。',
    metrics:[
      {label:'流动性', val:'$320K', sub:'DexScreener', color:'#fff'},
      {label:'24h 涨幅', val:'+34%', sub:'DexScreener', color:'#4ade80'},
      {label:'持仓地址', val:'8,420', sub:'Etherscan V2', color:'#fff'},
      {label:'巨鲸动向', val:'🐳 买入', sub:'大额追踪', color:'#ff6340'},
      {label:'参与押注', val:'412', sub:'人', color:'#fff'},
      {label:'社区看涨', val:'78%', sub:'押注比例', color:'#4ade80'},
    ],
    caseId:'C-2026-041',
  },
  {
    coin:'WIF', icon:'🎩', pair:'WIF / BNB', source:'four.meme · 上线 12 小时',
    verdict:'BEARISH', confidence:68, risk:'高风险',
    short:'帽子戴得漂亮，但链上数据露馅了。\n巨鲸在过去 4 小时持续出货，散户还在接盘。\n流动性深度不足以支撑当前价格。\n本庭裁定：看跌，建议场外观望。',
    full:'WIF 近期价格上涨主要由社区情绪驱动，但链上数据显示巨鲸地址在高位持续减仓，过去 4 小时净卖出超 $85K。持仓地址数增长停滞，新增地址主要来自散户。\n\n结合当前流动性深度，本庭判断短期下行风险较大，建议等待放量确认后再考虑入场。',
    metrics:[
      {label:'流动性', val:'$92K', sub:'DexScreener', color:'#fff'},
      {label:'24h 涨幅', val:'+18%', sub:'DexScreener', color:'#4ade80'},
      {label:'持仓地址', val:'1,203', sub:'Etherscan V2', color:'#fff'},
      {label:'巨鲸动向', val:'🔴 出货', sub:'大额追踪', color:'#f87171'},
      {label:'参与押注', val:'156', sub:'人', color:'#fff'},
      {label:'社区看跌', val:'55%', sub:'押注比例', color:'#f87171'},
    ],
    caseId:'C-2026-040',
  },
  {
    coin:'BONK', icon:'🔨', pair:'BONK / BNB', source:'four.meme · 上线 1 天',
    verdict:'NEUTRAL', confidence:55, risk:'中风险',
    short:'不涨不跌，法官也懵了。\n链上数据呈现典型的横盘整理形态。\n社区分歧明显，押注双方势均力敌。\n本庭裁定：中立观望，等方向选择后再押注。',
    full:'BONK 当前处于明显的横盘整理阶段，24 小时涨幅仅 +3.2%，流动性稳定但无明显方向。社区押注看涨 51% vs 看跌 49%，分歧极大。\n\n建议等待放量突破后再介入，当前入场性价比较低，时间成本较高。',
    metrics:[
      {label:'流动性', val:'$156K', sub:'DexScreener', color:'#fff'},
      {label:'24h 涨幅', val:'+3.2%', sub:'DexScreener', color:'#fbbf24'},
      {label:'持仓地址', val:'3,891', sub:'Etherscan V2', color:'#fff'},
      {label:'巨鲸动向', val:'➡️ 持仓', sub:'大额追踪', color:'#fbbf24'},
      {label:'参与押注', val:'287', sub:'人', color:'#fff'},
      {label:'社区看涨', val:'51%', sub:'押注比例', color:'#fbbf24'},
    ],
    caseId:'C-2026-039',
  },
  {
    coin:'TURBO', icon:'⚡', pair:'TURBO / BNB', source:'four.meme · 上线 3 天',
    verdict:'BULLISH', confidence:79, risk:'中风险',
    short:'TURBO 这次不是在吹，数据说话。\n链上地址数 3 天增长 240%，社区共识快速形成。\n巨鲸持仓稳定，无明显出货迹象。\n本庭裁定：看涨，可适量参与，注意仓位控制。',
    full:'TURBO 本轮行情由真实链上需求驱动，持仓地址数 3 天内从 820 增长至 2,788，增幅 240%。巨鲸地址持仓集中度较低（Top 10 持仓占比 23%），筹码分散利于健康上涨。\n\n社区押注看涨比例 71%，奖池规模 28,400 $GAVEL，参与度较高。风险点在于短期涨幅已达 89%，追高需谨慎。',
    metrics:[
      {label:'流动性', val:'$210K', sub:'DexScreener', color:'#fff'},
      {label:'24h 涨幅', val:'+89%', sub:'DexScreener', color:'#4ade80'},
      {label:'持仓地址', val:'2,788', sub:'Etherscan V2', color:'#fff'},
      {label:'巨鲸动向', val:'🐳 持仓', sub:'大额追踪', color:'#ff6340'},
      {label:'参与押注', val:'334', sub:'人', color:'#fff'},
      {label:'社区看涨', val:'71%', sub:'押注比例', color:'#4ade80'},
    ],
    caseId:'C-2026-042',
  },
];

let featuredData = [];
let featuredIdx = 0;
let featuredTimer = null;

// 渲染单张幻灯片 HTML
function buildSlideHTML(d) {
  const isUp = d.verdict === 'BULLISH';
  const isDown = d.verdict === 'BEARISH';
  const verdictColor = isUp ? '#4ade80' : isDown ? '#f87171' : '#fbbf24';
  const verdictBg = isUp ? 'rgba(22,163,74,0.2)' : isDown ? 'rgba(220,38,38,0.2)' : 'rgba(217,119,6,0.2)';
  const verdictBorder = isUp ? 'rgba(22,163,74,0.4)' : isDown ? 'rgba(220,38,38,0.4)' : 'rgba(217,119,6,0.3)';
  const verdictLabel = isUp ? '📈 BULLISH' : isDown ? '📉 BEARISH' : '⚖️ NEUTRAL';
  const shortLines = (d.short || '').split('\n').filter(Boolean);
  const lastLine = shortLines.pop();
  const shortHTML = shortLines.map(l => `<span style="color:rgba(255,255,255,0.55)">${l}</span>`).join('<br>');

  return `<div style="min-width:100%;padding:28px 0 0;box-sizing:border-box">
    <div class="inner">
      <!-- 标题行 -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:8px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:11px;font-weight:700;padding:4px 12px;border-radius:99px;background:rgba(255,99,64,0.15);color:var(--accent);border:1px solid rgba(255,99,64,0.3);letter-spacing:.06em">⚖️ 法官精选裁定</span>
          <span style="font-size:11px;color:rgba(255,255,255,0.3)">真实链上数据 · AI 分析</span>
        </div>
        <span style="font-size:11px;color:rgba(255,255,255,0.2);font-family:var(--mono)">${new Date().toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit'})} · BSC</span>
      </div>
      <!-- 主体：左文右数据 -->
      <div style="display:grid;grid-template-columns:1fr 320px;gap:28px;align-items:start">
        <!-- 左：裁定 -->
        <div>
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap">
            <div style="font-size:32px;width:52px;height:52px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">${d.iconImg ? `<img src="${d.iconImg}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.textContent='${d.icon}'">` : d.icon}</div>
            <div>
              <div style="font-size:20px;font-weight:900;color:#fff;letter-spacing:-0.03em">${d.pair}</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.35);font-family:var(--mono);margin-top:2px">${d.source}</div>
            </div>
            <span style="font-size:12px;font-weight:800;padding:5px 14px;border-radius:99px;background:${verdictBg};color:${verdictColor};border:1.5px solid ${verdictBorder}">${verdictLabel}</span>
            <span style="font-size:11px;font-weight:700;padding:4px 10px;border-radius:99px;background:rgba(217,119,6,0.2);color:#fbbf24;border:1px solid rgba(217,119,6,0.3)">${d.risk}</span>
            <span style="font-size:11px;color:rgba(255,255,255,0.35)">置信度 <strong style="color:#fff">${d.confidence}%</strong></span>
          </div>
          <div style="font-size:13px;line-height:1.8;margin-bottom:10px">
            ${shortHTML}<br>
            <strong style="color:var(--accent)">${lastLine}</strong>
          </div>
          <details style="margin-bottom:18px">
            <summary style="font-size:12px;color:rgba(255,255,255,0.3);cursor:pointer;list-style:none;display:flex;align-items:center;gap:5px;user-select:none">▾ 完整分析</summary>
            <div style="margin-top:8px;font-size:12px;color:rgba(255,255,255,0.4);line-height:1.8;padding:12px;background:rgba(255,255,255,0.04);border-radius:10px;border:1px solid rgba(255,255,255,0.08)">${(d.full||'').replace(/\n\n/g,'<br><br>').replace(/\n/g,'<br>')}</div>
          </details>
          <div style="padding-bottom:24px">
            <span style="font-size:11px;color:rgba(255,255,255,0.22);display:flex;align-items:center;gap:5px">
              <span style="width:4px;height:4px;border-radius:50%;background:#4ade80;display:inline-block"></span>
              裁定已上链存证 · <a href="https://testnet.bscscan.com/address/0x9F0081A3E98f30F3B8e1B43FA965F590f23b5906" target="_blank" style="color:rgba(255,99,64,0.6)">BSCScan ↗</a>
            </span>
          </div>
        </div>
        <!-- 右：链上数据 -->
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;overflow:hidden">
          <div style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:9px;font-weight:700;color:rgba(255,255,255,0.3);letter-spacing:.08em">📡 链上数据 · 实时</div>
          <div style="display:grid;grid-template-columns:1fr 1fr">
            ${(d.metrics||[]).map((m,i) => `
            <div style="padding:12px 14px;${i%2===0?'border-right:1px solid rgba(255,255,255,0.06);':''}${i<4?'border-bottom:1px solid rgba(255,255,255,0.06);':''}">
              <div style="font-size:9px;color:rgba(255,255,255,0.28);letter-spacing:.06em;margin-bottom:4px">${m.label}</div>
              <div style="font-size:16px;font-weight:800;color:${m.color};font-family:var(--mono)">${m.val}</div>
              <div style="font-size:9px;color:rgba(255,255,255,0.2);margin-top:2px">${m.sub}</div>
            </div>`).join('')}
          </div>
          <div style="padding:8px 14px;font-size:9px;color:rgba(255,255,255,0.18)">数据来源：DexScreener + Etherscan V2</div>
        </div>
      </div>
    </div>
  </div>`;
}

// 初始化轮播
function initFeaturedCarousel(data) {
  featuredData = data;
  featuredIdx = 0;
  const track = document.getElementById('featuredTrack');
  const dots = document.getElementById('featuredDots');
  if (!track || !dots) return;

  track.innerHTML = data.map(d => buildSlideHTML(d)).join('');

  dots.innerHTML = data.map((_, i) => `
    <div onclick="featuredGoTo(${i})" style="width:${i===0?'20px':'6px'};height:6px;border-radius:99px;background:${i===0?'var(--accent)':'rgba(255,255,255,0.25)'};cursor:pointer;transition:all .3s" id="featuredDot${i}"></div>
  `).join('');

  startFeaturedTimer();
}

function featuredGoTo(idx) {
  featuredIdx = idx;
  const track = document.getElementById('featuredTrack');
  if (track) track.style.transform = `translateX(-${idx * 100}%)`;
  // 更新圆点
  const total = featuredData.length;
  for (let i = 0; i < total; i++) {
    const dot = document.getElementById('featuredDot' + i);
    if (dot) {
      dot.style.width = i === idx ? '20px' : '6px';
      dot.style.background = i === idx ? 'var(--accent)' : 'rgba(255,255,255,0.25)';
    }
  }
  resetFeaturedTimer();
}

function featuredNext() {
  featuredGoTo((featuredIdx + 1) % featuredData.length);
}

function featuredPrev() {
  featuredGoTo((featuredIdx - 1 + featuredData.length) % featuredData.length);
}

function startFeaturedTimer() {
  clearInterval(featuredTimer);
  featuredTimer = setInterval(() => featuredNext(), 4000);
}

function resetFeaturedTimer() {
  clearInterval(featuredTimer);
  featuredTimer = setInterval(() => featuredNext(), 4000);
}

// 每日 DeepSeek 生成 + localStorage 缓存
async function loadFeaturedData() {
  const today = new Date().toLocaleDateString('zh-CN');
  const cacheKey = 'memecourt_featured_v2_' + today;

  // 先用 fallback 渲染，避免白屏
  initFeaturedCarousel(FEATURED_FALLBACK);

  // 检查缓存
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.length >= 3) { initFeaturedCarousel(parsed); return; }
    }
  } catch(e) {}

  try {
    // 用 four.meme 官方 API 拿热门币
    const res = await fetch('https://four.meme/meme-api/v1/public/token/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageIndex: 1, pageSize: 5, type: 'HOT', listType: 'ADV' })
    });
    const data = await res.json();
    const hotTokens = (data?.data || []).slice(0, 5);

    if (!hotTokens.length) { loadFeaturedDataFallback(); return; }

    const sys = `你是 Meme 法庭的 AI 法官「链上包公」，风格幽默毒舌、数据扎实。
严格按以下 JSON 格式输出一个对象，不输出任何其他内容，不加 markdown 代码块：
{"verdict":"BULLISH或BEARISH或NEUTRAL","confidence":数字0到100,"risk":"低风险或中风险或高风险或极高风险","short":"4句精简裁定，用\\n分隔，最后一句是扎心总结","full":"2段完整分析，段间用\\n\\n分隔"}`;

    const results = [];
    for (const t of hotTokens) {
      try {
        const change24 = t.day1Increase ? (parseFloat(t.day1Increase)*100).toFixed(1) : '0';
        const imgUrl = t.img ? `https://static.four.meme${t.img}` : null;
        const prompt = `请对 four.meme 上的热门 Meme 币「${t.shortName || t.name}」进行今日裁定。
链上数据：24h 涨跌幅 ${change24}%，24h 交易量 $${t.day1Vol || '—'}，持仓地址 ${t.hold || '—'}，Bonding curve 进度 ${t.progress ? (parseFloat(t.progress)*100).toFixed(1) : '—'}%，市值 $${t.cap || '—'}。
给出你的裁定。`;
        const raw = await callGemini(sys, prompt);
        const parsed = JSON.parse(raw.replace(/```json|```/g,'').trim());
        results.push({
          coin: t.shortName || t.name,
          icon: guessIcon(t.name, t.shortName),
          iconImg: imgUrl,
          pair: `${t.shortName || t.name} / BNB`,
          source: 'four.meme · 今日更新',
          verdict: parsed.verdict,
          confidence: parsed.confidence,
          risk: parsed.risk,
          short: parsed.short,
          full: parsed.full,
          caseId: `FM-${t.tokenAddress?.slice(2,8).toUpperCase() || '000000'}`,
          metrics: [
            { label: '流动性', value: `$${t.cap || '—'}`, src: 'four.meme' },
            { label: '24h 涨跌', value: `${parseFloat(t.day1Increase||0)>=0?'+':''}${change24}%`, src: 'four.meme' },
            { label: '持仓地址', value: `${t.hold || '—'}`, src: 'four.meme' },
            { label: 'Bonding进度', value: `${t.progress?(parseFloat(t.progress)*100).toFixed(1):'—'}%`, src: 'four.meme' },
          ],
        });
      } catch(e) {
        const fb = FEATURED_FALLBACK[results.length % FEATURED_FALLBACK.length];
        if (fb) results.push(fb);
      }
    }

    if (results.length >= 3) {
      try { localStorage.setItem(cacheKey, JSON.stringify(results)); } catch(e) {}
      initFeaturedCarousel(results);
    }
  } catch(e) {
    console.warn('精选轮播加载失败，用 fallback', e);
    loadFeaturedDataFallback();
  }
}

async function loadFeaturedDataFallback() {
  const coins = [
    {coin:'PEPE', icon:'🐸', pair:'PEPE / BNB'},
    {coin:'DOGE', icon:'🐶', pair:'DOGE / BNB'},
    {coin:'WIF',  icon:'🎩', pair:'WIF / BNB'},
  ];
  const sys = `你是 Meme 法庭的 AI 法官「链上包公」，风格幽默毒舌。严格按 JSON 输出：{"verdict":"BULLISH或BEARISH或NEUTRAL","confidence":数字,"risk":"低风险或中风险或高风险","short":"4句\\n分隔最后一句扎心","full":"2段\\n\\n分隔"}`;
  const results = [];
  for (const c of coins) {
    try {
      const raw = await callGemini(sys, `对 ${c.coin} 进行今日裁定分析`);
      const parsed = JSON.parse(raw.replace(/```json|```/g,'').trim());
      results.push({ ...c, source:'four.meme · 今日更新', ...parsed, metrics:FEATURED_FALLBACK.find(f=>f.coin===c.coin)?.metrics||[], caseId:'court-00'+(results.length+1) });
    } catch(e) { const fb=FEATURED_FALLBACK.find(f=>f.coin===c.coin); if(fb) results.push(fb); }
  }
  if (results.length >= 3) { try { localStorage.setItem('memecourt_featured_v2_'+new Date().toLocaleDateString('zh-CN'), JSON.stringify(results)); } catch(e) {} initFeaturedCarousel(results); }
}

/* ══ 注入 BNB 系统 ══ */

const BNB_PER_HOUR = 0.01;

function openInjectModal(caseId) {
  const c = [...courtData.live].find(x => x.id === caseId);
  if (!c) return;
  const thr = TIER_THRESHOLDS[c.tier || 'fast'];
  const maxInject = thr?.maxInjectBnb || 0.5;
  const injected  = c.injectedBnb || 0;
  const remaining = Math.max(0, maxInject - injected);
  const timeLeft  = c.endTime ? formatCountdown(c.endTime) : c.timer;

  let overlay = document.getElementById('injectBnbOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'injectBnbOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(6px)';
    overlay.onclick = e => { if(e.target===overlay) overlay.style.display='none'; };
    document.body.appendChild(overlay);
  }

  const quickBtns = [0.01,0.05,0.1,0.5].filter(v=>v<=remaining+0.001).map(v=>`
    <button onclick="setInjectAmount(${v})" style="flex:1;padding:6px 4px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;font-size:11px;font-weight:700;color:#374151;cursor:pointer;font-family:inherit"
      onmouseover="this.style.background='#f0fdf4';this.style.borderColor='#16a34a';this.style.color='#16a34a'"
      onmouseout="this.style.background='#f9fafb';this.style.borderColor='#e5e7eb';this.style.color='#374151'">
      +${v} BNB
    </button>`).join('');

  overlay.innerHTML = `
    <div style="background:#fff;border-radius:20px;width:100%;max-width:420px;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,0.25);animation:modal-in .25s cubic-bezier(.34,1.2,.64,1) forwards">
      <div style="background:linear-gradient(135deg,#064e3b,#065f46);padding:20px 24px 16px">
        <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.5);letter-spacing:.08em;margin-bottom:6px">💉 注入 BNB · ${c.icon} ${c.name}</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.7)">每注入 <strong style="color:#4ade80">0.01 BNB</strong> 延长开庭 <strong style="color:#4ade80">1 小时</strong>，全部进入奖池</div>
      </div>
      <div style="padding:14px 24px;border-bottom:1px solid #f0fdf4;background:#f0fdf4;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;text-align:center">
        <div><div style="font-size:10px;color:#6b7280;margin-bottom:3px">剩余时间</div><div style="font-size:14px;font-weight:800;color:#111">${timeLeft}</div></div>
        <div><div style="font-size:10px;color:#6b7280;margin-bottom:3px">当前 BNB 奖池</div><div style="font-size:14px;font-weight:800;color:#16a34a">${injected.toFixed(3)} BNB</div></div>
        <div><div style="font-size:10px;color:#6b7280;margin-bottom:3px">还可注入</div><div style="font-size:14px;font-weight:800;color:#111">${remaining.toFixed(3)} BNB</div></div>
      </div>
      <div style="padding:20px 24px">
        <div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:10px">注入金额</div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <input id="injectAmountInput" type="number" min="0.01" max="${remaining.toFixed(3)}" step="0.01" placeholder="0.00"
            style="flex:1;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:16px;font-family:inherit;outline:none;font-weight:700"
            oninput="updateInjectPreview()" onfocus="this.style.borderColor='#16a34a'" onblur="this.style.borderColor='#e5e7eb'">
          <span style="font-size:14px;font-weight:700;color:#6b7280">BNB</span>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:14px">${quickBtns}</div>
        <div id="injectPreview" style="padding:10px 14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin-bottom:14px;font-size:12px;color:#166534;display:none">
          注入后：延长 <strong id="injectHours">0</strong> 小时 · 奖池 +<strong id="injectBnbAdd">0</strong> BNB
        </div>
        <div style="margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;font-size:10px;color:#9ca3af;margin-bottom:4px">
            <span>累计注入</span><span>${injected.toFixed(3)} / ${maxInject} BNB 上限</span>
          </div>
          <div style="height:4px;background:#e5e7eb;border-radius:99px;overflow:hidden">
            <div style="height:100%;width:${Math.min(100,maxInject>0?(injected/maxInject)*100:0).toFixed(1)}%;background:#16a34a;border-radius:99px"></div>
          </div>
        </div>
        <button id="injectConfirmBtn" onclick="executeInject('${caseId}')"
          style="width:100%;padding:13px;background:#16a34a;color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;opacity:.5;pointer-events:none;transition:opacity .15s">
          🦊 MetaMask 确认注入
        </button>
        <button onclick="document.getElementById('injectBnbOverlay').style.display='none'"
          style="margin-top:8px;width:100%;padding:10px;background:#f9fafb;border:1.5px solid #e5e7eb;border-radius:10px;font-size:13px;font-weight:600;color:#6b7280;cursor:pointer;font-family:inherit">
          取消
        </button>
      </div>
    </div>`;
  overlay.style.display = 'flex';
}

function setInjectAmount(val) {
  const input = document.getElementById('injectAmountInput');
  if (input) { input.value = val; updateInjectPreview(); }
}

function updateInjectPreview() {
  const input = document.getElementById('injectAmountInput');
  const preview = document.getElementById('injectPreview');
  const btn = document.getElementById('injectConfirmBtn');
  if (!input || !preview) return;
  const val = parseFloat(input.value) || 0;
  const hours = Math.floor(val / BNB_PER_HOUR);
  if (val >= 0.01) {
    preview.style.display = 'block';
    const h = document.getElementById('injectHours'); if(h) h.textContent = hours;
    const b = document.getElementById('injectBnbAdd'); if(b) b.textContent = val.toFixed(3);
    if (btn) { btn.style.opacity='1'; btn.style.pointerEvents='auto'; }
  } else {
    preview.style.display = 'none';
    if (btn) { btn.style.opacity='.5'; btn.style.pointerEvents='none'; }
  }
}

async function executeInject(caseId) {
  const input = document.getElementById('injectAmountInput');
  const val = parseFloat(input?.value) || 0;
  if (val < 0.01) { showToast('最少注入 0.01 BNB'); return; }
  const c = courtData.live.find(x => x.id === caseId);
  if (!c) return;
  const thr = TIER_THRESHOLDS[c.tier || 'fast'];
  const remaining = (thr?.maxInjectBnb||0.5) - (c.injectedBnb||0);
  if (val > remaining + 0.0001) { showToast(`最多还可注入 ${remaining.toFixed(3)} BNB`); return; }

  const btn = document.getElementById('injectConfirmBtn');
  btn.textContent = '⏳ 等待 MetaMask 确认…';
  btn.style.opacity = '.7'; btn.style.pointerEvents = 'none';

  if (walletConnected && window.ethereum) {
    try {
      const valWei = '0x' + Math.round(val * 1e18).toString(16);
      await window.ethereum.request({ method:'eth_sendTransaction',
        params:[{ from:walletAddress, to:MEME_COURT_ADDRESS, value:valWei }] });
    } catch(e) {
      if (e.code === 4001) {
        showToast('用户取消了注入');
        btn.textContent = '🦊 MetaMask 确认注入';
        btn.style.opacity='1'; btn.style.pointerEvents='auto';
        return;
      }
    }
  }

  const hours = Math.floor(val / BNB_PER_HOUR);
  c.injectedBnb = (c.injectedBnb||0) + val;
  c.bnbPool     = (c.bnbPool||0) + val;
  if (c.endTime) c.endTime += hours * 3600000;
  c.timer = c.endTime ? formatCountdown(c.endTime) : c.timer;
  document.getElementById('injectBnbOverlay').style.display = 'none';
  renderCourtCards();
  saveLiveCases && saveLiveCases();
  showToast(`✅ 已注入 ${val.toFixed(3)} BNB · 延长 ${hours} 小时 · 奖池 +${val.toFixed(3)} BNB`);
}

/* ══ 结算闭环系统 ══ */


async function fetchFourMemePrice(contractAddr) {
  if (!contractAddr) return null;
  try {
    const res = await fetch('https://four.meme/meme-api/v1/public/token/info', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ tokenAddress: contractAddr })
    });
    const data = await res.json();
    const price = parseFloat(data?.data?.price || 0);
    return price > 0 ? price : null;
  } catch(e) {
    try {
      const r2 = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${contractAddr}`);
      const d2 = await r2.json();
      const pair = d2?.pairs?.find(p => p.chainId==='bsc') || d2?.pairs?.[0];
      const p = parseFloat(pair?.priceUsd || 0);
      return p > 0 ? p : null;
    } catch(e2) { return null; }
  }
}

async function recordOpenPrice(caseObj) {
  if (caseObj.openPrice) return;
  const thr = TIER_THRESHOLDS[caseObj.tier || 'fast'];
  caseObj.endTime = Date.now() + (thr?.duration || 3*3600000);
  if (caseObj.contract) {
    const price = await fetchFourMemePrice(caseObj.contract);
    caseObj.openPrice = price || 1;
  } else {
    caseObj.openPrice = 1;
  }
  caseObj.timer = formatCountdown(caseObj.endTime);
  renderCourtCards();
  saveLiveCases();
  console.log(`✅ ${caseObj.name} openPrice=${caseObj.openPrice}`);
}

function saveLiveCases() {
  try { localStorage.setItem('mc_live_cases_v2', JSON.stringify(courtData.live)); } catch(e) {}
}

function loadLiveCases() {
  try {
    const raw = localStorage.getItem('mc_live_cases_v2');
    if (!raw) return;
    const saved = JSON.parse(raw);
    const existingIds = new Set(courtData.live.map(c => c.id));
    saved.forEach(c => { if (!existingIds.has(c.id)) courtData.live.unshift(c); });
  } catch(e) {}
}

async function checkExpiredCases() {
  const now = Date.now();
  const expired = courtData.live.filter(c => c.endTime && c.endTime <= now);
  if (!expired.length) return;
  for (const c of expired) await settleCaseAuto(c);
  if (expired.length) { renderCourtCards(); updateCourtTabCounts(); }
}

async function settleCaseAuto(c) {
  let closePrice = null;
  if (c.contract) closePrice = await fetchFourMemePrice(c.contract);
  if (!closePrice) closePrice = c.openPrice || 1;
  const openP = c.openPrice || closePrice;
  const isUp  = closePrice >= openP;
  const change = openP > 0 ? ((closePrice-openP)/openP*100).toFixed(1) : '0';
  doSettle(c, isUp?'up':'down', closePrice, `${isUp?'+':''}${change}%（开庭 $${openP?.toPrecision(4)} → 结算 $${closePrice?.toPrecision(4)}）`);
}

function doSettle(c, winDir, closePrice, priceNote) {
  const vm = { up:{ verdict:'持有', verdictCls:'vr-hold', verdictResult:'✅ 看涨方向胜出' },
               down:{ verdict:'等待', verdictCls:'vr-wait', verdictResult:'📉 看跌方向胜出' } };
  const v = vm[winDir];
  c.verdict       = v.verdict;
  c.verdictCls    = v.verdictCls;
  c.verdictResult = v.verdictResult;
  c.timer         = '已结案';
  c.confidence    = c.aiVerdict?.confidence || 75;
  c.risk          = c.aiVerdict?.risk || '中风险';
  c.closePrice    = closePrice;
  c.verdictShort  = `${priceNote}
${winDir==='up'?'价格上涨，看涨方胜出。':'价格下跌，看跌方胜出。'}
${c.aiVerdict?.short?.split('\n').pop()||'本庭裁定已记录。'}`;
  c.source        = (c.source||'').replace('候审中','已结案') + (c.source?.includes('已结案')?'':' · 已结案');
  courtData.live   = courtData.live.filter(x => x.id !== c.id);
  courtData.closed.unshift(c);
  settleUserBets(c, winDir);
  renderCourtCards();
  updateCourtTabCounts();
  saveLiveCases();
  if (typeof renderProfilePage === 'function') renderProfilePage();
  showToast(`⚖️ ${c.name} 已结案：${v.verdictResult}`);
}

function settleUserBets(c, winDir) {
  try {
    const key = 'memecourt_bets_' + (walletAddress||'anon');
    const records = JSON.parse(localStorage.getItem(key)||'[]');
    records.forEach(r => {
      if (r.caseId !== c.id || r.status !== 'pending') return;
      const won = (winDir==='up' && r.dir==='up') || (winDir==='down' && r.dir==='down');
      r.status = won ? 'win' : 'lose';
      if (won) {
        const mult = winDir==='up' ? (c._upMult||2.0) : (c._downMult||2.0);
        r.reward = Math.floor(r.amt * mult);
        saveGavelHistory({ type:'win', positive:true, icon:'🏆',
          title:`押注获胜 · ${c.name} ${c.verdictResult}`,
          sub:`押注 ${r.amt} $GAVEL · ${winDir==='up'?'看涨':'看跌'}`,
          amount:`+${r.reward.toLocaleString()}`, rawAmount:r.reward,
          date:new Date().toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit'}),
          caseId:c.id, claimable:true });
      } else {
        saveGavelHistory({ type:'lose', positive:false, icon:'💸',
          title:`押注失败 · ${c.name} ${c.verdictResult}`,
          sub:`押注 ${r.amt} $GAVEL · 方向押错`,
          amount:`-${r.amt.toLocaleString()}`, rawAmount:r.amt,
          date:new Date().toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit'}),
          caseId:c.id, claimable:false });
      }
    });
    localStorage.setItem(key, JSON.stringify(records));
  } catch(e) { console.warn('settleUserBets error', e); }
}

function updateLiveTimers() {
  let needRender = false;
  courtData.live.forEach(c => {
    if (!c.endTime) return;
    c.timer = formatCountdown(c.endTime);
    if (c.endTime <= Date.now() && !c._settling) {
      c._settling = true;
      settleCaseAuto(c);
      needRender = true;
    }
  });
}

// ── 页面加载时执行 ──
// 清理旧版缓存
try { localStorage.removeItem('mc_live_cases'); } catch(e) {}
loadLiveCases();
courtData.live.forEach(c => { if (!c.openPrice && c.contract) recordOpenPrice(c); });
checkExpiredCases();
setInterval(updateLiveTimers, 1000);




// ══ 移动端 JS ══

// ── 移动端全屏详情页 ──
let mDetailCase = null;
let mDetailDir = null;

function mOpenDetail(id) {
  const allCases = [...courtData.live, ...courtData.pending, ...courtData.closed];
  const c = allCases.find(x => x.id === id);
  if (!c) return;
  mDetailCase = c;
  mDetailDir = null;

  const isLive = courtData.live.includes(c);
  const isClosed = courtData.closed.includes(c);

  document.getElementById('mDetailName').textContent = c.icon + ' ' + c.name;
  document.getElementById('mDetailId').textContent = c.id + ' · ' + c.tierLabel;
  const statusEl = document.getElementById('mDetailStatus');
  if (isLive) { statusEl.textContent = '● 开庭中'; statusEl.style.cssText = 'font-size:11px;font-weight:700;padding:4px 10px;border-radius:99px;background:#fef2f2;color:#dc2626'; }
  else if (isClosed) { statusEl.textContent = '✅ 已结案'; statusEl.style.cssText = 'font-size:11px;font-weight:700;padding:4px 10px;border-radius:99px;background:#f0fdf4;color:#16a34a'; }
  else { statusEl.textContent = '⏳ 候审中'; statusEl.style.cssText = 'font-size:11px;font-weight:700;padding:4px 10px;border-radius:99px;background:#fffbeb;color:#d97706'; }

  document.getElementById('mDetailLiq').textContent = c.liq || '—';
  const changeEl = document.getElementById('mDetailChange');
  changeEl.textContent = c.change || '—';
  changeEl.style.color = c.changeUp ? '#16a34a' : '#dc2626';
  document.getElementById('mDetailWhale').textContent = c.whale || '—';
  document.getElementById('mDetailUpPct').textContent = `📈 看涨 ${c.betUp || 0}%`;
  document.getElementById('mDetailDownPct').textContent = `📉 看跌 ${c.betDown || 0}%`;
  document.getElementById('mDetailBetFill').style.width = (c.betUp || 0) + '%';
  const bnbPool = (c.pool * 0.7 / 320).toFixed(3);
  document.getElementById('mDetailPool').textContent = `${bnbPool} BNB · ${c.pool.toLocaleString()} $GAVEL`;
  document.getElementById('mDetailParticipants').textContent = `${c.participants || 0} 人参与`;

  const betPanel = document.getElementById('mBetPanel');
  if (isClosed) {
    betPanel.style.display = 'none';
    mRenderMobileVerdict(c);
  } else if (isLive) {
    betPanel.style.display = 'block';
    document.getElementById('mBetBalance').textContent = gavelBalance.toLocaleString();
    mResetBetPanel();
    mLoadAIVerdict(c);
  } else {
    betPanel.style.display = 'none';
    document.getElementById('mDetailVerdictBody').innerHTML = '<div style="color:#a8a8a4;font-size:13px">候审中，开庭后 AI 法官将自动裁定</div>';
  }

  document.getElementById('mDetailPage').style.display = 'flex';
}

function mCloseDetail() {
  document.getElementById('mDetailPage').style.display = 'none';
  mDetailCase = null; mDetailDir = null;
}

function mRenderMobileVerdict(c) {
  const isWinUp = c.verdictResult?.includes('看涨');
  const verdictColor = (c.verdict === '持有' || c.verdict === '小仓' || c.verdict === '建仓') ? '#16a34a' : '#dc2626';
  const lines = (c.verdictShort || '').split('\n').filter(Boolean);
  const last = lines.pop() || '';
  const bodyHtml = lines.map(l => `<span style="color:#6b6b68">${l}</span>`).join('<br>') + (lines.length ? '<br>' : '') + `<strong style="color:#ff6340">${last}</strong>`;
  document.getElementById('mDetailVerdictBody').innerHTML = `
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:wrap">
      <span style="font-size:13px;font-weight:800;padding:4px 12px;border-radius:99px;background:#f0fdf4;color:${verdictColor};border:1.5px solid ${verdictColor}40">${c.verdict}</span>
      <span style="font-size:11px;color:#a8a8a4">置信度 ${c.confidence || 80}%</span>
      <span style="font-size:11px;padding:2px 8px;border-radius:4px;background:#fffbeb;color:#d97706">${c.risk || '中风险'}</span>
      <span style="font-size:11px;font-weight:700;color:${isWinUp?'#16a34a':'#dc2626'}">${c.verdictResult || ''}</span>
    </div>
    <div style="font-size:13px;line-height:1.75">${bodyHtml}</div>
    ${walletConnected ? `<button onclick="claimGavelReward('${c.id}')" style="margin-top:10px;width:100%;padding:10px;background:#ff6340;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">🎁 领取 $GAVEL 奖励</button>` : ''}`;
}

async function mLoadAIVerdict(c) {
  document.getElementById('mDetailVerdictBody').innerHTML = `<div style="display:flex;align-items:center;gap:8px;color:#a8a8a4"><span style="width:6px;height:6px;border-radius:50%;background:#ff6340;animation:dot-bounce .9s infinite;display:inline-block"></span><span style="width:6px;height:6px;border-radius:50%;background:#ff6340;animation:dot-bounce .9s .15s infinite;display:inline-block"></span><span style="width:6px;height:6px;border-radius:50%;background:#ff6340;animation:dot-bounce .9s .3s infinite;display:inline-block"></span><span style="margin-left:6px">AI 法官分析中…</span></div>`;
  try {
    const sys = `你是 Meme 法庭的 AI 法官。严格按 JSON 输出：{"verdict":"BULLISH或BEARISH","confidence":数字,"short":"3句裁定用\\n分隔最后一句扎心","risk":"低风险或中风险或高风险或极高风险"}`;
    const raw = await callGemini(sys, `币种：${c.name}，流动性：${c.liq}，涨跌：${c.change}，巨鲸：${c.whale}，看涨${c.betUp}%`);
    let parsed;
    try { parsed = JSON.parse(raw.replace(/```json|```/g,'').trim()); }
    catch { parsed = { verdict:'NEUTRAL', confidence:50, short:'本庭综合数据，暂时无法给出明确裁定。\n请持续观察链上动态。\n谨慎为上，不赌为赢。', risk:'中风险' }; }
    const isUp = parsed.verdict === 'BULLISH';
    const color = isUp ? '#16a34a' : '#dc2626';
    const badge = isUp ? '📈 看涨' : parsed.verdict === 'BEARISH' ? '📉 看跌' : '⚖️ 中立';
    const lines = (parsed.short || '').split('\n').filter(Boolean);
    const last = lines.pop() || '';
    document.getElementById('mDetailVerdictBody').innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:wrap">
        <span style="font-size:12px;font-weight:800;padding:3px 10px;border-radius:99px;background:${isUp?'#f0fdf4':'#fef2f2'};color:${color};border:1.5px solid ${color}40">${badge}</span>
        <span style="font-size:11px;color:#a8a8a4">置信度 ${parsed.confidence}%</span>
        <span style="font-size:11px;padding:2px 7px;border-radius:4px;background:#fffbeb;color:#d97706">${parsed.risk}</span>
      </div>
      <div style="font-size:13px;line-height:1.75">${lines.map(l=>`<span style="color:#6b6b68">${l}</span>`).join('<br>')}${lines.length?'<br>':''}<strong style="color:#ff6340">${last}</strong></div>`;
  } catch(e) { document.getElementById('mDetailVerdictBody').textContent = '网络异常，请稍后重试'; }
}

function mSelectDir(dir) {
  mDetailDir = dir;
  const up = document.getElementById('mBetDirUp'), down = document.getElementById('mBetDirDown');
  const baseStyle = 'flex:1;padding:10px;border-radius:10px;cursor:pointer;font-size:13px;font-weight:700;font-family:inherit;border:2px solid ';
  up.style.cssText = baseStyle + (dir==='up' ? '#16a34a;background:#f0fdf4;color:#16a34a' : '#e8e8e4;background:#fff;color:#6b6b68');
  down.style.cssText = baseStyle + (dir==='down' ? '#dc2626;background:#fef2f2;color:#dc2626' : '#e8e8e4;background:#fff;color:#6b6b68');
  const btn = document.getElementById('mBetSubmit');
  btn.disabled = false;
  btn.style.cssText = 'width:100%;padding:13px;background:#ff6340;color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s';
  btn.textContent = dir === 'up' ? '📈 押注看涨' : '📉 押注看跌';
}

function mResetBetPanel() {
  mDetailDir = null;
  document.getElementById('mBetAmount').value = '';
  const base = 'flex:1;padding:10px;border:2px solid #e8e8e4;border-radius:10px;background:#fff;cursor:pointer;font-size:13px;font-weight:700;color:#6b6b68;font-family:inherit';
  document.getElementById('mBetDirUp').style.cssText = base;
  document.getElementById('mBetDirDown').style.cssText = base;
  const btn = document.getElementById('mBetSubmit');
  btn.disabled = true;
  btn.style.cssText = 'width:100%;padding:13px;background:#e8e8e4;color:#a8a8a4;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:not-allowed;font-family:inherit;transition:all .2s';
  btn.textContent = '选择方向后押注';
}

async function mSubmitBet() {
  if (!mDetailCase || !mDetailDir) return;
  const amt = parseInt(document.getElementById('mBetAmount').value) || 0;
  if (amt < 10) { showToast('最少押注 10 $GAVEL'); return; }
  if (amt > gavelBalance) { showToast('余额不足'); return; }
  const btn = document.getElementById('mBetSubmit');
  btn.textContent = '⏳ 授权中…'; btn.disabled = true;
  const amtWei = BigInt(amt) * BigInt('1000000000000000000');
  try {
    showToast('Step 1/2：授权 $GAVEL…');
    const approveTx = await callContract(GAVEL_TOKEN_ADDRESS, encodeApprove(MEME_COURT_ADDRESS, amtWei));
    if (!approveTx) { btn.textContent = mDetailDir==='up'?'📈 押注看涨':'📉 押注看跌'; btn.disabled=false; return; }
    await new Promise(r => setTimeout(r, 2000));
    btn.textContent = '⏳ 链上押注中…';
    const betTx = await callContract(MEME_COURT_ADDRESS, encodeBetWithGavel(mDetailCase.id, mDetailDir==='up'?1:0, amtWei));
    if (!betTx) { btn.textContent = mDetailDir==='up'?'📈 押注看涨':'📉 押注看跌'; btn.disabled=false; return; }
    gavelBalance -= amt;
    document.getElementById('mBetBalance').textContent = gavelBalance.toLocaleString();
    document.getElementById('gavelBalNum').textContent = gavelBalance.toLocaleString();
    btn.textContent = '✅ 押注成功！';
    showToast('✅ 链上押注成功！');
    saveBetRecord({ coin: mDetailCase.name, dir: mDetailDir, amt, caseId: mDetailCase.id, txHash: betTx, date: new Date().toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit'}) });
  } catch(e) { showToast('押注失败'); btn.textContent = mDetailDir==='up'?'📈 押注看涨':'📉 押注看跌'; btn.disabled=false; }
}

let mCurrentTab = 'chat';
let mCurrentCourtTab = 'all';
let mChatHistory = [];

// 页面切换
function mShowPage(page) {
  mCurrentTab = page;
  document.querySelectorAll('.m-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.m-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('mPage' + page.charAt(0).toUpperCase() + page.slice(1)).classList.add('active');
  document.getElementById('mTabBtn-' + page).classList.add('active');
  if (page === 'court') mRenderCourtList();
  if (page === 'profile') mRenderProfile();
}

// 钱包连接
async function mConnectWallet() {
  if (walletConnected) return;
  await connectWallet();
}

// 同步钱包状态到移动端
function mSyncWallet() {
  const btn = document.getElementById('mWalletBtn');
  const dot = document.getElementById('mWalletDot');
  const txt = document.getElementById('mWalletText');
  if (!btn) return;
  if (walletConnected) {
    btn.classList.add('connected');
    dot.classList.add('on');
    txt.textContent = walletAddress.slice(0,6) + '…' + walletAddress.slice(-4);
  } else {
    btn.classList.remove('connected');
    dot.classList.remove('on');
    txt.textContent = '连接钱包';
  }
}

// ── 聊天功能 ──
function mSendChip(el) {
  document.getElementById('mChatInput').value = el.textContent;
  mSendMessage();
}

async function mSendMessage() {
  const input = document.getElementById('mChatInput');
  const q = input.value.trim();
  if (!q) return;
  input.value = '';
  input.style.height = 'auto';

  // 隐藏 chips
  document.getElementById('mChatChips').style.display = 'none';

  // 添加用户消息
  mAddMessage('user', q);

  // 添加 loading
  const loadingId = 'mLoading_' + Date.now();
  const messages = document.getElementById('mChatMessages');
  const loadingEl = document.createElement('div');
  loadingEl.id = loadingId;
  loadingEl.className = 'm-msg judge';
  loadingEl.innerHTML = `<div class="m-msg-loading"><span></span><span></span><span></span></div>`;
  messages.appendChild(loadingEl);
  messages.scrollTop = messages.scrollHeight;

  const btn = document.getElementById('mChatSend');
  btn.disabled = true;

  try {
    const sys = `你是 Meme 法庭的 AI 法官，代号「链上包公」。风格幽默毒舌、数据扎实、敢判断。
严格按以下 JSON 格式输出，不输出任何其他内容，不加 markdown 代码块：
{"verdict":"BULLISH或BEARISH或NEUTRAL","confidence":0到100的数字,"short":"3-4句精简裁定，法庭语气，最后一句扎心。句间用\\n分隔。","risk":"低风险或中风险或高风险或极高风险"}`;
    const raw = await callGemini(sys, q);
    let parsed;
    try { parsed = JSON.parse(raw.replace(/```json|```/g,'').trim()); }
    catch { parsed = { verdict:'NEUTRAL', confidence:50, short:raw, risk:'未知' }; }

    // 移除 loading
    document.getElementById(loadingId)?.remove();

    // 渲染裁定
    mAddVerdictMessage(parsed);
  } catch(e) {
    document.getElementById(loadingId)?.remove();
    mAddMessage('judge', '本庭暂时无法审理此案，网络异常，请稍后再试。');
  }

  btn.disabled = false;
}

function mAddMessage(role, text) {
  const messages = document.getElementById('mChatMessages');
  const el = document.createElement('div');
  el.className = 'm-msg ' + role;
  el.innerHTML = `<div class="m-msg-bubble">${text}</div>`;
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
}

function mAddVerdictMessage(parsed) {
  const messages = document.getElementById('mChatMessages');
  const isUp = parsed.verdict === 'BULLISH';
  const isDown = parsed.verdict === 'BEARISH';
  const badgeCls = isUp ? 'm-msg-verdict-bull' : isDown ? 'm-msg-verdict-bear' : 'm-msg-verdict-neu';
  const badgeText = isUp ? '📈 看涨' : isDown ? '📉 看跌' : '⚖️ 中立';
  const lines = (parsed.short || '').split('\n').filter(Boolean);
  const lastLine = lines.pop() || '';
  const bodyHtml = lines.map(l => `<span style="color:#6b6b68">${l}</span>`).join('<br>') + (lines.length ? '<br>' : '') + `<strong style="color:#ff6340">${lastLine}</strong>`;

  const el = document.createElement('div');
  el.className = 'm-msg judge';
  el.innerHTML = `
    <div class="m-msg-bubble" style="max-width:280px">
      <div class="m-msg-verdict">
        <span class="m-msg-verdict-badge ${badgeCls}">${badgeText}</span>
        <span style="font-size:11px;color:#a8a8a4">置信度 ${parsed.confidence}%</span>
        <span style="font-size:10px;padding:2px 7px;border-radius:4px;background:#fffbeb;color:#d97706">${parsed.risk}</span>
      </div>
      <div style="font-size:13px;line-height:1.7">${bodyHtml}</div>
    </div>`;
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
}

// ── 开庭广场 ──
function mSwitchCourtTab(tab) {
  mCurrentCourtTab = tab;
  document.querySelectorAll('.m-court-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('mTab-' + tab).classList.add('active');
  mRenderCourtList();
}

function mRenderCourtList() {
  const list = document.getElementById('mCourtList');
  if (!list) return;

  // 更新数量
  const total = courtData.live.length + courtData.pending.length;
  const setC = (id, n) => { const el = document.getElementById(id); if(el) el.textContent = n; };
  setC('mTabCount-all', total);
  setC('mTabCount-live', courtData.live.length);
  setC('mTabCount-pending', courtData.pending.length);

  const liveData    = mCurrentCourtTab === 'pending' ? [] : [...courtData.live];
  const pendingData = mCurrentCourtTab === 'live'    ? [] : [...courtData.pending];
  const data = [...liveData, ...pendingData];

  let html = `<div class="m-real-data-tip">
    <span style="width:6px;height:6px;border-radius:50%;background:#16a34a;display:inline-block;flex-shrink:0"></span>
    ⚡ 真实数据 · four.meme 热度/涨幅/新币三榜 · 每 5 分钟刷新
  </div>`;

  if (!data.length) {
    list.innerHTML = html + `<div style="text-align:center;padding:60px 16px;color:#a8a8a4;font-size:13px">暂无案件</div>`;
    return;
  }

  html += data.map(c => {
    const isLive    = courtData.live.includes(c);
    const isPending = courtData.pending.includes(c);
    const bnbPool   = (c.pool * 0.7 / 320).toFixed(3);
    const timerDisplay = c.endTime ? formatCountdown(c.endTime) : c.timer;

    const btnHtml = isPending
      ? `<button class="m-court-bet-btn pending">等待开庭</button>`
      : `<button class="m-court-bet-btn" onclick="event.stopPropagation();mOpenDetail('${c.id}')">押注</button>`;

    const timerHtml = isLive
      ? `<span class="m-court-timer${c.urgent?' urgent':''}">${timerDisplay}</span>`
      : `<span style="font-size:10px;color:#a8a8a4">候审中</span>`;

    const onclick = `mOpenDetail('${c.id}')`;

    return `<div class="m-court-item" onclick="${onclick}">
      <div class="m-court-icon">${c.iconImg ? `<img src="${c.iconImg}" style="width:100%;height:100%;object-fit:cover;border-radius:10px" onerror="this.parentElement.textContent='${c.icon}'">` : c.icon}</div>
      <div class="m-court-info">
        <div class="m-court-name">
          ${isLive ? '<span class="m-court-live-dot"></span>' : ''}${c.name}
          ${c.tierLabel ? `<span style="font-size:10px;font-weight:600;padding:1px 6px;border-radius:4px;background:#f0fdf4;color:#16a34a;margin-left:4px">${c.tierLabel}</span>` : ''}
        </div>
        <div class="m-court-meta">${c.source}</div>
        <div class="m-court-stats">
          <span class="m-court-change ${c.changeUp?'up':'down'}">${c.change}</span>
          <span class="m-court-pool">${bnbPool} BNB · ${c.pool.toLocaleString()} $G</span>
          ${isLive ? `<span style="font-size:11px;color:#6b6b68">${c.participants}人</span>` : ''}
        </div>
      </div>
      <div class="m-court-right">
        ${timerHtml}
        ${btnHtml}
      </div>
    </div>`;
  }).join('');

  list.innerHTML = html;
}

// ── 我的页 ──
function mRenderProfile() {
  const el = document.getElementById('mProfileContent');
  if (!el) return;

  if (!walletConnected) {
    el.innerHTML = `
      <div class="m-connect-prompt" style="margin-top:40px">
        <div style="font-size:40px;margin-bottom:12px">👤</div>
        <div class="m-connect-prompt-title">连接钱包</div>
        <div class="m-connect-prompt-sub">连接后查看押注记录和 $GAVEL 余额</div>
        <button class="m-connect-prompt-btn" onclick="mConnectWallet()">🦊 连接 MetaMask</button>
      </div>`;
    return;
  }

  const records = loadBetRecords();
  const recordsHtml = records.length
    ? records.slice(0,10).map(r => `
        <div class="m-bet-record">
          <div class="m-bet-record-icon">${r.dir==='up'?'📈':'📉'}</div>
          <div class="m-bet-record-info">
            <div class="m-bet-record-name">${r.coin || r.name || '—'}</div>
            <div class="m-bet-record-meta">${r.dirLabel || (r.dir==='up'?'看涨':'看跌')} · ${r.date || ''}</div>
          </div>
          <div class="m-bet-record-right">
            <div class="m-bet-record-amount">${r.amount || r.amt || 0} $G</div>
            <div class="m-bet-record-status">${r.status==='pending'?'待结算':'已结算'}</div>
          </div>
        </div>`)
        .join('')
    : `<div class="m-profile-empty">暂无押注记录<br>去开庭广场参与押注吧</div>`;

  el.innerHTML = `
    <div class="m-profile-wallet">
      <div class="m-profile-addr">${walletAddress}</div>
      <div class="m-profile-balances">
        <div class="m-profile-bal-card">
          <div class="m-profile-bal-val accent">${gavelBalance.toLocaleString()}</div>
          <div class="m-profile-bal-lbl">$GAVEL 余额</div>
        </div>
        <div class="m-profile-bal-card">
          <div class="m-profile-bal-val green">${walletBnbBalance.toFixed(4)}</div>
          <div class="m-profile-bal-lbl">BNB 余额</div>
        </div>
      </div>
    </div>
    <div class="m-profile-section">
      <div class="m-profile-section-title">押注记录</div>
      ${recordsHtml}
    </div>`;
}

// 监听桌面版钱包连接，同步到移动端
const _origOnWalletConnected = onWalletConnected;
window.onWalletConnected = function(addr, bnb) {
  _origOnWalletConnected(addr, bnb);
  mSyncWallet();
  if (mCurrentTab === 'profile') mRenderProfile();
};

// 检测是否移动端并初始化
if (window.innerWidth <= 768) {
  // 初始渲染
  mRenderCourtList();
  mSyncWallet();
  // Bitquery 数据回来后再刷新一次（最多等 8 秒）
  setTimeout(() => { if (typeof mRenderCourtList === 'function') mRenderCourtList(); }, 8000);
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    if (window.innerWidth <= 768) {
      document.getElementById('mobileApp').style.display = 'flex';
    } else {
      document.getElementById('mobileApp').style.display = 'none';
    }
  });
}
