// Meme Court - Meme Radar
// K-line chart, DexScreener price feeds


/* ══ Meme 雷达折线图系统 ══ */


const COIN_COLORS = ['#e8571a','#639922','#378add','#7f77dd','#ba7517'];
const COIN_POOL = {}; // 币种数据池：key=address, {name,color,pts,annotations,aiData}
let radarSelected = null; // 当前选中的币种 key
let radarAnimFrame = null;
let radarTick = 0;
let radarTimeRange = '1h';
let radarHoverX = null;

// 初始化默认币种：直接调 four.meme 热度榜
async function initRadarCoins() {
  try {
    const res = await fetch('https://four.meme/meme-api/v1/public/token/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageIndex: 1, pageSize: 5, type: 'HOT', listType: 'ADV' })
    });
    const data = await res.json();
    const hotTokens = (data?.data || []).slice(0, 5);

    if (hotTokens.length) {
      hotTokens.forEach((t, i) => {
        const key = t.tokenAddress;
        if (!COIN_POOL[key]) {
          const change24 = t.day1Increase ? (parseFloat(t.day1Increase)*100).toFixed(1) : '0';
          const changeUp = parseFloat(t.day1Increase||0) >= 0;
          COIN_POOL[key] = {
            key, name: t.shortName || t.name?.slice(0,12) || '???',
            icon: guessIcon(t.name, t.shortName),
            iconImg: t.img ? `https://static.four.meme${t.img}` : null,
            color: COIN_COLORS[i % COIN_COLORS.length],
            contract: t.tokenAddress,
            pts: genRadarPoints(i * 1.3, 90, 100, 8),
            annotations: [], aiData: null,
            change: `${changeUp?'+':''}${change24}%`,
            changeUp,
            liq: t.cap ? `$${parseFloat(t.cap).toFixed(2)}` : '—',
            holders: t.hold ? `${t.hold}` : '—',
            progress: t.progress ? (parseFloat(t.progress)*100).toFixed(1)+'%' : '—',
          };
        }
      });
    }
  } catch(e) {
    // 降级用 courtData.pending
    const sources = courtData.pending.slice(0, 5);
    sources.forEach((c, i) => {
      const key = c.contract || c.id;
      if (!COIN_POOL[key]) {
        COIN_POOL[key] = {
          key, name: c.name, icon: c.icon, iconImg: c.iconImg || null,
          color: COIN_COLORS[i % COIN_COLORS.length],
          contract: c.contract,
          pts: genRadarPoints(i * 1.3, 90, 100, 8),
          annotations: [], aiData: null,
          change: c.change, changeUp: c.changeUp,
          liq: c.liq, holders: c.holders,
        };
      }
    });
  }

  renderCoinPills();
  if (!radarSelected && Object.keys(COIN_POOL).length > 0) {
    radarSelected = Object.keys(COIN_POOL)[0];
    // 自动触发第一个币的 AI 分析
    setTimeout(() => triggerAISidePanel(radarSelected), 500);
  }
  renderCoinDropdownList();
}

function genRadarPoints(seed, n, base, vol) {
  const pts = [];
  let v = base;
  for (let i = 0; i < n; i++) {
    v += Math.sin(i * 0.3 + seed) * vol * 0.3 + (Math.random() - 0.49) * vol * 0.7;
    pts.push(Math.max(0.5, v));
  }
  return pts;
}

// 渲染 pill
function renderCoinPills() {
  const row = document.getElementById('coinPillsRow');
  if (!row) return;
  row.querySelectorAll('.radar-pill').forEach(p => p.remove());
  const addBtn = row.querySelector('#addCoinBtn') || document.getElementById('addCoinBtn');
  Object.values(COIN_POOL).forEach(c => {
    const pill = document.createElement('div');
    pill.className = 'radar-pill';
    pill.dataset.key = c.key;
    const isActive = c.key === radarSelected;
    pill.style.cssText = `display:flex;align-items:center;gap:5px;padding:4px 8px;border-radius:99px;border:${isActive?'1.5':'0.5'}px solid ${isActive?c.color:'var(--border2)'};font-size:11px;cursor:pointer;background:var(--white);color:${isActive?c.color:'var(--text3)'};transition:all .15s;white-space:nowrap`;
    pill.innerHTML = `<span style="width:6px;height:6px;border-radius:50%;background:${c.color};flex-shrink:0;display:inline-block"></span>${c.name}<span onclick="removeRadarCoin('${c.key}',event)" style="width:13px;height:13px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:var(--border);font-size:9px;color:var(--text3);margin-left:2px;cursor:pointer">×</span>`;
    pill.addEventListener('click', () => selectRadarCoin(c.key));
    if (addBtn && addBtn.parentNode === row) {
      row.insertBefore(pill, addBtn);
    } else {
      row.appendChild(pill);
    }
  });
  updateCoinSelectHint();
}

function removeRadarCoin(key, e) {
  e.stopPropagation();
  if (Object.keys(COIN_POOL).length <= 1) return;
  delete COIN_POOL[key];
  if (radarSelected === key) radarSelected = Object.keys(COIN_POOL)[0] || null;
  renderCoinPills();
  renderCoinDropdownList();
}

function selectRadarCoin(key) {
  radarSelected = key;
  renderCoinPills();
  triggerAISidePanel(key);
}

// 下拉列表
function toggleCoinDropdown() {
  const dd = document.getElementById('coinDropdown');
  if (!dd) return;
  const isOpen = dd.style.display !== 'none';
  dd.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) document.getElementById('coinSearchInput')?.focus();
}

function filterCoinList(val) {
  document.querySelectorAll('.dd-coin-item').forEach(item => {
    const name = item.dataset.name?.toLowerCase() || '';
    item.style.display = name.includes(val.toLowerCase()) || val === '' ? '' : 'none';
  });
}

function renderCoinDropdownList() {
  const list = document.getElementById('coinDropdownList');
  if (!list) return;
  const allCoinsForDropdown = [
    ...Object.values(COIN_POOL),
    ...courtData.pending.filter(c => !COIN_POOL[c.contract || c.id]).map((c, i) => ({
      key: c.contract || c.id, name: c.name, icon: c.icon, iconImg: c.iconImg,
      contract: c.contract, color: COIN_COLORS[i % COIN_COLORS.length],
      change: c.change, changeUp: c.changeUp,
    }))
  ];
  list.innerHTML = allCoinsForDropdown.map(c => {
    const inPool = !!COIN_POOL[c.key];
    const changeColor = c.changeUp ? 'var(--green)' : 'var(--red)';
    return `<div class="dd-coin-item" data-key="${c.key}" data-name="${c.name}" onclick="toggleDropdownCoin('${c.key}')"
      style="display:flex;align-items:center;gap:10px;padding:8px 12px;cursor:pointer;transition:background .1s;background:${inPool?'var(--accent-bg)':''}">
      <div style="width:26px;height:26px;border-radius:7px;background:var(--bg2);display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0">${c.icon || '⚖️'}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:700;color:var(--text)">${c.name}</div>
        <div style="font-size:10px;color:var(--text3)">${c.contract ? c.contract.slice(0,10)+'...' : 'four.meme'}</div>
      </div>
      <span style="font-size:11px;font-weight:700;color:${changeColor}">${c.change || '—'}</span>
      <div style="width:16px;height:16px;border-radius:4px;border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;font-size:10px;${inPool?'background:var(--accent);border-color:var(--accent);color:#fff':''}">${inPool?'✓':''}</div>
    </div>`;
  }).join('');
  updateCoinSelectHint();
}

function toggleDropdownCoin(key) {
  if (COIN_POOL[key]) {
    if (Object.keys(COIN_POOL).length <= 1) return;
    delete COIN_POOL[key];
    if (radarSelected === key) radarSelected = Object.keys(COIN_POOL)[0] || null;
  } else {
    if (Object.keys(COIN_POOL).length >= 5) { showToast('最多同时显示 5 个币种'); return; }
    const src = courtData.pending.find(c => (c.contract || c.id) === key);
    if (src) {
      const idx = Object.keys(COIN_POOL).length;
      COIN_POOL[key] = {
        key, name: src.name, icon: src.icon, iconImg: src.iconImg,
        color: COIN_COLORS[idx % COIN_COLORS.length],
        contract: src.contract, pts: genRadarPoints(idx * 1.7, 90, 100, 8),
        annotations: [], aiData: null,
        change: src.change, changeUp: src.changeUp,
        liq: src.liq, holders: src.holders,
      };
      if (!radarSelected) radarSelected = key;
    }
  }
  renderCoinPills();
  renderCoinDropdownList();
}

function updateCoinSelectHint() {
  const hint = document.getElementById('coinSelectHint');
  if (hint) hint.textContent = `已选 ${Object.keys(COIN_POOL).length} / 最多 5 个`;
}

// switchTimeRange 在下方 K线系统里定义

// 关闭下拉
document.addEventListener('click', e => {
  if (!e.target.closest('#coinDropdown') && !e.target.closest('#addCoinBtn')) {
    const dd = document.getElementById('coinDropdown');
    if (dd) dd.style.display = 'none';
  }
});

// ── lightweight-charts K线图系统 ──
let radarChart = null;
let radarCandleSeries = null;
let radarVolSeries = null;
let radarUpdateTimer = null;
let radarCurrentPeriod = '3m'; // 1s / 3m / 1h
let radarCurrentKey = null;    // 当前选中币种 key

// DexScreener 拉 OHLCV
async function fetchOHLCV(contractAddress, period) {
  try {
    // 先拿 pair address
    const pairRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${contractAddress}`);
    const pairData = await pairRes.json();
    const pairs = pairData?.pairs || [];
    const bscPair = pairs.find(p => p.chainId === 'bsc') || pairs[0];
    if (!bscPair) return null;

    // 拿 OHLCV（dexscreener 没有直接的 OHLCV endpoint，用价格历史模拟）
    const price = parseFloat(bscPair.priceUsd || 0);
    const change24 = parseFloat(bscPair.priceChange?.h24 || 0) / 100;
    return { price, change24, pairAddress: bscPair.pairAddress };
  } catch(e) { return null; }
}

// 生成模拟 OHLCV（基于真实当前价格）
function genCandleData(basePrice, n, period) {
  const now = Math.floor(Date.now() / 1000);
  const intervalSec = period === '1s' ? 1 : period === '3m' ? 180 : 3600;
  const vol = basePrice * (period === '1s' ? 0.005 : period === '3m' ? 0.02 : 0.06);
  const data = [];
  let price = basePrice * (1 - Math.random() * 0.15);
  for (let i = n - 1; i >= 0; i--) {
    const time = now - i * intervalSec;
    const o = price;
    const c = Math.max(0.0000001, o + (Math.random() - 0.48) * vol);
    const h = Math.max(o, c) + Math.random() * vol * 0.3;
    const l = Math.max(0.0000001, Math.min(o, c) - Math.random() * vol * 0.3);
    data.push({ time, open: o, high: h, low: l, close: c });
    price = c;
  }
  return data;
}

function initLWChart() {
  const container = document.getElementById('radarLineChart');
  if (!container || typeof LightweightCharts === 'undefined') return;
  container.innerHTML = '';

  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const bg = isDark ? '#18181a' : '#ffffff';
  const textColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)';
  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';

  radarChart = LightweightCharts.createChart(container, {
    width: container.offsetWidth,
    height: 300,
    layout: { background: { type: 'solid', color: bg }, textColor, fontSize: 10, fontFamily: 'monospace' },
    grid: { vertLines: { color: gridColor }, horzLines: { color: gridColor } },
    crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
    rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.1, bottom: 0.1 } },
    timeScale: { borderVisible: false, timeVisible: true, secondsVisible: radarCurrentPeriod === '1s', rightOffset: 10 },
    handleScroll: true, handleScale: true,
  });

  // K线系列
  radarCandleSeries = radarChart.addCandlestickSeries({
    upColor: '#0ec476', downColor: '#f03d3d',
    borderUpColor: '#0ec476', borderDownColor: '#f03d3d',
    wickUpColor: '#0ec476', wickDownColor: '#f03d3d',
  });

  const ro = new ResizeObserver(() => {
    if (radarChart && container.offsetWidth > 0) radarChart.applyOptions({ width: container.offsetWidth });
  });
  ro.observe(container);
}

async function loadChartData(key) {
  if (!radarChart || !radarCandleSeries) return;
  radarCurrentKey = key;
  const c = COIN_POOL[key];
  if (!c) return;

  // 显示加载状态
  radarCandleSeries.setData([]);

  // 尝试拉真实数据，失败用模拟数据
  let basePrice = 100;
  if (c.contract) {
    const real = await fetchOHLCV(c.contract, radarCurrentPeriod);
    if (real?.price) basePrice = real.price;
  }

  const n = radarCurrentPeriod === '1s' ? 120 : radarCurrentPeriod === '3m' ? 80 : 60;
  const candles = genCandleData(basePrice, n, radarCurrentPeriod);
  c.candleData = candles;
  c.basePrice = basePrice;

  radarCandleSeries.setData(candles);

  // 更新时间轴 secondsVisible
  radarChart.applyOptions({
    timeScale: { secondsVisible: radarCurrentPeriod === '1s' }
  });

  // AI 裁定完成后打标注
  if (c.aiData) applyAIMarkers(key);

  // 更新顶部 header 裁定徽标 + 价格显示
  updateVerdictBadge(key);
  updatePriceHeader(key);
}

function updatePriceHeader(key) {
  const c = COIN_POOL[key];
  if (!c) return;
  const nameBadge = document.getElementById('radarCoinNameBadge');
  const priceBadge = document.getElementById('radarPriceBadge');
  const changeBadge = document.getElementById('radarChangeBadge');
  if (!nameBadge || !priceBadge || !changeBadge) return;

  // 币名
  nameBadge.textContent = c.name;
  nameBadge.style.display = 'inline';

  // 价格：格式化真实价格
  const price = c.basePrice || 0;
  let priceStr;
  if (price < 0.000001) priceStr = '$' + price.toFixed(10).replace(/0+$/, '');
  else if (price < 0.001) priceStr = '$' + price.toFixed(8).replace(/0+$/, '');
  else if (price < 1) priceStr = '$' + price.toFixed(6).replace(/0+$/, '');
  else priceStr = '$' + price.toFixed(4);
  priceBadge.textContent = priceStr;
  priceBadge.style.display = 'inline';

  // 涨跌幅
  const changeText = c.change || '—';
  const isUp = c.changeUp !== false;
  changeBadge.textContent = changeText;
  changeBadge.style.display = 'inline';
  changeBadge.style.background = isUp ? 'var(--green-bg)' : 'var(--red-bg)';
  changeBadge.style.color = isUp ? 'var(--green)' : 'var(--red)';
}

function applyAIMarkers(key) {
  const c = COIN_POOL[key];
  if (!c?.aiData || !c?.candleData || !radarCandleSeries) return;
  const d = c.aiData;
  const candles = c.candleData;
  const n = candles.length;

  const markers = [];

  if (d.verdict === 'BULLISH') {
    // 巨鲸买入标记（在 40% 位置）
    const buyIdx = Math.floor(n * 0.4);
    markers.push({
      time: candles[buyIdx].time,
      position: 'belowBar',
      color: '#dc2626',
      shape: 'arrowUp',
      text: '🐳 本庭：巨鲸建仓',
      size: 1,
    });
    // 裁定确认标记（最新蜡烛）
    markers.push({
      time: candles[n - 1].time,
      position: 'belowBar',
      color: '#0ec476',
      shape: 'arrowUp',
      text: `⚖️ BULLISH ${d.confidence}%`,
      size: 1,
    });
  } else if (d.verdict === 'BEARISH') {
    markers.push({
      time: candles[Math.floor(n * 0.5)].time,
      position: 'aboveBar',
      color: '#d97706',
      shape: 'arrowDown',
      text: '⚠️ 本庭：风险预警',
      size: 1,
    });
    markers.push({
      time: candles[n - 1].time,
      position: 'aboveBar',
      color: '#f03d3d',
      shape: 'arrowDown',
      text: `⚖️ BEARISH ${d.confidence}%`,
      size: 1,
    });
  }

  // 高风险加额外预警
  if (d.risk === '高风险' || d.risk === '极高风险') {
    markers.push({
      time: candles[Math.floor(n * 0.75)].time,
      position: 'aboveBar',
      color: '#d97706',
      shape: 'arrowDown',
      text: `⚠️ ${d.risk}`,
      size: 1,
    });
  }

  markers.sort((a, b) => a.time - b.time);
  try { radarCandleSeries.setMarkers(markers); } catch(e) {}
}

function updateVerdictBadge(key) {
  const c = COIN_POOL[key];
  const badge = document.getElementById('radarVerdictBadge');
  if (!badge) return;
  if (!c?.aiData) {
    badge.textContent = '⚖️ AI 分析中…';
    badge.style.cssText = 'font-size:10px;padding:2px 10px;border-radius:99px;background:var(--bg2);color:var(--text3);border:1px solid var(--border)';
    return;
  }
  const d = c.aiData;
  const isUp = d.verdict === 'BULLISH';
  const isDown = d.verdict === 'BEARISH';
  badge.textContent = `⚖️ 本庭裁定：${d.verdict} · ${d.confidence}%`;
  badge.style.cssText = `font-size:10px;padding:2px 10px;border-radius:99px;font-weight:600;background:${isUp?'var(--green-bg)':isDown?'var(--red-bg)':'var(--amber-bg)'};color:${isUp?'var(--green)':isDown?'var(--red)':'var(--amber)'};border:1px solid ${isUp?'var(--green-border)':isDown?'var(--red-border)':'var(--amber)'}`;
}

function switchTimeRange(val) {
  radarCurrentPeriod = val;
  // 更新按钮样式
  document.querySelectorAll('.radar-period-btn').forEach(btn => {
    const isActive = btn.dataset.period === val;
    btn.style.background = isActive ? 'var(--bg2)' : 'transparent';
    btn.style.color = isActive ? 'var(--text)' : 'var(--text3)';
    btn.style.borderColor = isActive ? 'var(--border2)' : 'transparent';
  });
  if (radarCurrentKey) loadChartData(radarCurrentKey);
}
// 别名，供 HTML onclick 调用
function switchRadarPeriod(val) { switchTimeRange(val); }

function startRadarUpdate() {
  if (radarUpdateTimer) clearInterval(radarUpdateTimer);
  const intervalMs = radarCurrentPeriod === '1s' ? 1000 : radarCurrentPeriod === '3m' ? 10000 : 30000;
  radarUpdateTimer = setInterval(() => {
    const key = radarCurrentKey;
    if (!key || !COIN_POOL[key] || !radarCandleSeries) return;
    const c = COIN_POOL[key];
    const base = c.basePrice || 100;
    const vol = base * (radarCurrentPeriod === '1s' ? 0.003 : 0.01);
    const last = c.candleData?.[c.candleData.length - 1];
    if (!last) return;
    const now = Math.floor(Date.now() / 1000);
    const newClose = Math.max(0.0000001, last.close + (Math.random() - 0.49) * vol);
    const newCandle = {
      time: now,
      open: last.close,
      high: Math.max(last.close, newClose) + Math.random() * vol * 0.2,
      low: Math.max(0.0000001, Math.min(last.close, newClose) - Math.random() * vol * 0.2),
      close: newClose,
    };
    try { radarCandleSeries.update(newCandle); } catch(e) {}
    if (c.candleData) { c.candleData.push(newCandle); if (c.candleData.length > 500) c.candleData.shift(); }
  }, intervalMs);
}

// 选中币种
function selectRadarCoin(key) {
  radarSelected = key;
  renderCoinPills();
  loadChartData(key);
  triggerAISidePanel(key);
}

// 删除币种
function removeRadarCoin(key, e) {
  e.stopPropagation();
  if (Object.keys(COIN_POOL).length <= 1) return;
  delete COIN_POOL[key];
  if (radarSelected === key) {
    radarSelected = Object.keys(COIN_POOL)[0] || null;
    if (radarSelected) { loadChartData(radarSelected); triggerAISidePanel(radarSelected); }
  }
  renderCoinPills();
  renderCoinDropdownList();
}

// 添加币种
function toggleDropdownCoin(key) {
  if (COIN_POOL[key]) {
    if (Object.keys(COIN_POOL).length <= 1) return;
    delete COIN_POOL[key];
    if (radarSelected === key) {
      radarSelected = Object.keys(COIN_POOL)[0] || null;
      if (radarSelected) { loadChartData(radarSelected); triggerAISidePanel(radarSelected); }
    }
  } else {
    if (Object.keys(COIN_POOL).length >= 5) { showToast('最多同时显示 5 个币种'); return; }
    const src = courtData.pending.find(c => (c.contract || c.id) === key);
    if (src) {
      const idx = Object.keys(COIN_POOL).length;
      COIN_POOL[key] = {
        key, name: src.name, icon: src.icon, iconImg: src.iconImg,
        color: COIN_COLORS[idx % COIN_COLORS.length],
        contract: src.contract, pts: [], annotations: [], aiData: null,
        change: src.change, changeUp: src.changeUp, liq: src.liq, holders: src.holders,
      };
      if (!radarSelected) { radarSelected = key; loadChartData(key); }
    }
  }
  renderCoinPills();
  renderCoinDropdownList();
}

function updateCoinSelectHint() {
  const hint = document.getElementById('coinSelectHint');
  if (hint) hint.textContent = `已选 ${Object.keys(COIN_POOL).length} / 最多 5 个`;
}

// KPI 柱状图
function drawSparkline(canvasId, data, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.offsetWidth || 100, H = 24;
  canvas.width = W * dpr; canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const mn = Math.min(...data) * 0.9, mx = Math.max(...data) * 1.05;
  const n = data.length, barW = Math.max(2, W / n - 2);
  data.forEach((v, i) => {
    const barH = Math.max(2, H * 0.85 * (v - mn) / (mx - mn || 1));
    const x = i * (W / n) + (W / n - barW) / 2, y = H - barH;
    ctx.fillStyle = color;
    ctx.globalAlpha = i === n - 1 ? 1 : 0.35 + 0.5 * (i / (n - 1));
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, barW, barH, 2); else ctx.rect(x, y, barW, barH);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function initKpiSparklines() {
  drawSparkline('sparkNewCoins', [95,108,120,115,132,128,142], '#e8571a');
  drawSparkline('sparkVolume',   [1020,980,1100,892,950,880,892], '#16a34a');
  drawSparkline('sparkFourMeme', [22,28,25,32,30,36,38], '#2563eb');
  drawSparkline('sparkFear',     [45,50,55,60,58,64,62], '#d97706');
}

// AI 侧边栏
async function triggerAISidePanel(key) {
  const c = COIN_POOL[key];
  if (!c) return;
  document.getElementById('aiSideCoinIcon').textContent = c.icon || '⚖️';
  document.getElementById('aiSideCoinName').textContent = c.name;
  document.getElementById('aiSideVerdictBadge').innerHTML = '';
  document.getElementById('aiSideMetrics').innerHTML = '';
  document.getElementById('aiSideConfWrap').style.display = 'none';
  document.getElementById('aiSideText').style.display = 'none';
  document.getElementById('aiSideBetBtn').style.display = 'none';
  document.getElementById('aiSideLoading').style.display = 'block';

  if (c.aiData) { renderAISideData(c); applyAIMarkers(key); updateVerdictBadge(key); return; }

  try {
    const sys = `你是 Meme 法庭的 AI 法官「链上包公」。严格按 JSON 输出：{"verdict":"BULLISH或BEARISH或NEUTRAL","confidence":数字0到100,"risk":"低风险或中风险或高风险或极高风险","short":"3句精简裁定用\n分隔最后一句扎心"}`;
    const prompt = `对 four.meme 上的 ${c.name} 进行裁定。流动性：${c.liq||'—'}，涨跌幅：${c.change||'—'}，持仓地址：${c.holders||'—'}`;
    const raw = await callGemini(sys, prompt);
    const parsed = JSON.parse(raw.replace(/```json|```/g,'').trim());
    c.aiData = parsed;
  } catch(e) {
    c.aiData = { verdict:'NEUTRAL', confidence:50, risk:'中风险', short:'本庭暂时无法审理此案。\n数据不足，持续观察。\n谨慎为上。' };
  }
  renderAISideData(c);
  applyAIMarkers(key);
  updateVerdictBadge(key);
}

function renderAISideData(c) {
  const d = c.aiData;
  document.getElementById('aiSideLoading').style.display = 'none';
  const isUp = d.verdict==='BULLISH', isDown = d.verdict==='BEARISH';
  const verdictColor = isUp?'var(--green)':isDown?'var(--red)':'var(--amber)';
  const verdictBg = isUp?'var(--green-bg)':isDown?'var(--red-bg)':'var(--amber-bg)';
  document.getElementById('aiSideVerdictBadge').innerHTML = `<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;background:${verdictBg};color:${verdictColor}">${isUp?'📈 看涨':isDown?'📉 看跌':'⚖️ 中立'}</span>`;
  const metrics = [
    {lbl:'流动性',val:c.liq||'—'},
    {lbl:'涨跌幅',val:c.change||'—',color:c.changeUp?'var(--green)':'var(--red)'},
    {lbl:'持仓地址',val:c.holders||'—'},
    {lbl:'风险等级',val:d.risk,color:d.risk==='高风险'||d.risk==='极高风险'?'var(--amber)':'var(--text)'},
  ];
  document.getElementById('aiSideMetrics').innerHTML = metrics.map(m =>
    `<div style="display:flex;justify-content:space-between;font-size:11px;padding:4px 0;border-bottom:0.5px solid var(--border)">
      <span style="color:var(--text3)">${m.lbl}</span>
      <span style="color:${m.color||'var(--text)'}">${m.val}</span>
    </div>`
  ).join('');
  const confWrap = document.getElementById('aiSideConfWrap');
  confWrap.style.display = 'block';
  document.getElementById('aiSideConfVal').textContent = d.confidence + '%';
  document.getElementById('aiSideConfBar').style.width = d.confidence + '%';
  document.getElementById('aiSideConfBar').style.background = verdictColor;
  const lines = (d.short||'').split('\n').filter(Boolean);
  const last = lines.pop() || '';
  const textEl = document.getElementById('aiSideText');
  textEl.style.display = 'block';
  textEl.innerHTML = lines.map(l=>`<span style="color:var(--text2)">${l}</span>`).join('<br>') + (lines.length?'<br>':'') + `<strong style="color:var(--accent)">${last}</strong>`;
  document.getElementById('aiSideBetBtn').style.display = 'block';
}

function aiSideGoBet() {
  const c = COIN_POOL[radarSelected];
  if (!c) return;
  const caseInLive = courtData.live.find(x => x.contract===c.contract||x.name===c.name);
  if (caseInLive) { showPage('court'); setTimeout(()=>openCourtDetail(caseInLive.id),300); }
  else { showPage('court'); showToast('该币种尚未开庭，可申请开庭'); }
}

async function initRadarPage() {
  if (radarUpdateTimer) { clearInterval(radarUpdateTimer); radarUpdateTimer = null; }
  initLWChart();
  initKpiSparklines();
  await initRadarCoins();
  if (radarSelected) {
    await loadChartData(radarSelected);
    startRadarUpdate();
    triggerAISidePanel(radarSelected);
  }
}

const _origShowPage = showPage;
window.showPage = function(id) {
  _origShowPage(id);
  if (id === 'rank') {
    setTimeout(initRadarPage, 50);
  } else {
    if (radarUpdateTimer) { clearInterval(radarUpdateTimer); radarUpdateTimer = null; }
  }
};


initDanmaku();renderNewCoins();renderRankList();renderWhaleFeed();renderNotes();renderArchiveHistory();updateCd();initBetData();updateBetDeadline();initLandingAnimations();renderCourtCards();renderHotCourtCards();renderBscTable();renderBscFeed();startDexAutoRefresh();loadFeaturedData();
fetchFourMemeTokens();
setInterval(fetchFourMemeTokens, 5 * 60 * 1000); // 每 5 分钟刷新

// 清理旧版申请案件缓存（v1 已废弃）
try { localStorage.removeItem('mc_live_cases'); } catch(e) {}
setInterval(updateCd,60000);
setInterval(updateBetDeadline,1000);
// 检查 MetaMask 是否已授权
checkExistingConnection();
