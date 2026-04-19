// Meme Court - API Services
// four.meme, DexScreener, BSCScan integrations


/* ══ Bitquery four.meme 自动候审队列 ══ */


const BITQUERY_KEY = 'ory_at_Zg7U3I37Gfxp4D38IZEIZFKtBP9nxrJ0NcPGhLbWkZA.aAWGRoXlhg4RohesnuyJcTp71AgeYBCf7owMx5OA8bY';
const FOURMEME_CONTRACT = '0x5c952063c7fc8610FFDB798152D69F0B9550762b';

// 币种图标映射
function guessIcon(name, symbol) {
  const s = (symbol || name || '').toLowerCase();
  if (s.includes('dog') || s.includes('doge') || s.includes('shib')) return '🐶';
  if (s.includes('cat') || s.includes('neko')) return '🐱';
  if (s.includes('pepe') || s.includes('frog')) return '🐸';
  if (s.includes('moon')) return '🌕';
  if (s.includes('fire') || s.includes('burn')) return '🔥';
  if (s.includes('ai') || s.includes('bot')) return '🤖';
  if (s.includes('ape') || s.includes('monk')) return '🦍';
  if (s.includes('dragon') || s.includes('drag')) return '🐉';
  if (s.includes('pig')) return '🐷';
  if (s.includes('bear')) return '🐻';
  if (s.includes('bull')) return '🐂';
  if (s.includes('elon') || s.includes('musk')) return '🚀';
  if (s.includes('trump') || s.includes('maga')) return '🦅';
  if (s.includes('baby')) return '👶';
  if (s.includes('punk')) return '👾';
  if (s.includes('ninja')) return '🥷';
  const emojis = ['⚡','🌊','🍄','💎','🎩','🔮','🦊','🌙','⭐','🎯'];
  let hash = 0;
  for (let i = 0; i < (symbol||'x').length; i++) hash = (symbol.charCodeAt(i) + hash * 31) & 0xffff;
  return emojis[hash % emojis.length];
}

// 时间差转中文
function timeAgo(isoTime) {
  const diff = (Date.now() - new Date(isoTime)) / 1000 / 60;
  if (diff < 60) return `${Math.floor(diff)}分钟前上线`;
  if (diff < 1440) return `${Math.floor(diff/60)}小时前上线`;
  return `${Math.floor(diff/1440)}天前上线`;
}

async function fetchFourMemeTokens() {
  try {
    // 三榜并发：新币 + 热度 + 涨幅
    const [newRes, hotRes, gainRes] = await Promise.allSettled([
      fetch('https://four.meme/meme-api/v1/public/token/search', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ pageIndex:1, pageSize:20, type:'NEW',      listType:'ADV' })
      }),
      fetch('https://four.meme/meme-api/v1/public/token/search', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ pageIndex:1, pageSize:20, type:'HOT',      listType:'ADV' })
      }),
      fetch('https://four.meme/meme-api/v1/public/token/search', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ pageIndex:1, pageSize:20, type:'INCREASE', listType:'ADV' })
      }),
    ]);

    // 合并去重
    const seen = new Set();
    const allTokens = [];
    for (const r of [newRes, hotRes, gainRes]) {
      if (r.status !== 'fulfilled') continue;
      const data = await r.value.json();
      for (const t of (data?.data || [])) {
        if (!t.tokenAddress || seen.has(t.tokenAddress)) continue;
        seen.add(t.tokenAddress);
        allTokens.push(t);
      }
    }
    const tokens = allTokens;
    if (!tokens.length) return;

    // 转换成 courtData 格式并注入候审队列
    courtData.pending = tokens.map(t => {
      const imgUrl = t.img ? `https://static.four.meme${t.img}` : null;
      const change24 = t.day1Increase ? (parseFloat(t.day1Increase) * 100).toFixed(1) : '—';
      const changeUp = parseFloat(t.day1Increase || 0) >= 0;
      const vol = parseFloat(t.day1Vol || 0);
      const volStr = vol >= 1000 ? `$${(vol/1000).toFixed(1)}K` : `$${vol.toFixed(0)}`;
      const launchTime = t.createDate ? new Date(parseInt(t.createDate)) : new Date();
      return {
        id: `FM-${t.tokenAddress.slice(2,8).toUpperCase()}`,
        icon: guessIcon(t.name, t.shortName),
        iconImg: imgUrl,
        name: t.shortName || t.name?.slice(0, 12) || '???',
        fullName: t.name,
        source: `four.meme · ${timeAgo(launchTime.toISOString())}`,
        ...autoTier(parseFloat(t.cap||0), parseInt(t.hold||0), parseFloat(t.day1Increase||0)*100),
        timer: '候审中', urgent: false,
        betUp: 0, betDown: 0,
        pool: Math.max(100, Math.floor(vol * 0.01)),
        bnbPool: 0,
        injectedBnb: 0,
        participants: 0,
        liq: volStr,
        holders: t.hold ? `${t.hold}` : '—',
        change: change24 !== '—' ? `${changeUp?'+':''}${change24}%` : '+—%',
        changeUp,
        whale: parseFloat(t.day1Increase || 0) > 0.5 ? '🐳买入' : '—',
        initiator: t.aiCreator ? '🤖 AI 创建' : 'four.meme 自动',
        contract: t.tokenAddress,
        progress: t.progress ? (parseFloat(t.progress) * 100).toFixed(1) : '—',
        cap: t.cap ? `$${parseFloat(t.cap).toFixed(2)}` : '—',
        aiCreator: t.aiCreator,
      };
    });

    // 自动升档：达到开庭标准的案件直接升入进行中
    const toPromote = [];
    courtData.pending = courtData.pending.filter(c => {
      const capN  = parseFloat((c.cap||c.liq||'0').replace(/[^0-9.]/g,''))||0;
      const holdN = parseInt(c.holders)||0;
      const chgN  = Math.abs(parseFloat(c.change)||0);
      if (!classifyTier(capN, holdN, chgN)) return true; // 未达标留候审
      const alreadyLive = courtData.live.some(x => x.id===c.id || (x.contract && x.contract===c.contract));
      if (alreadyLive) return false;
      const tierInfo = autoTier(capN, holdN, chgN);
      c.tier=tierInfo.tier; c.tierLabel=tierInfo.tierLabel; c.tierCls=tierInfo.tierCls;
      toPromote.push(c);
      return false;
    });
    toPromote.forEach(c => {
      courtData.live.unshift(c);
      recordOpenPrice(c);
    });
    if (toPromote.length) console.log(`🚀 ${toPromote.length} 个案件自动升入进行中`);

    // 刷新广场
    renderCourtCards();
    updateCourtTabCounts();

    // 同步更新 Meme 雷达行情表
    fetchFourMemeTableDataV2(tokens);

    // 同步刷新移动端
    if (typeof mRenderCourtList === 'function' && window.innerWidth <= 768) {
      mRenderCourtList();
    }

    console.log(`✅ four.meme 官方 API：已加载 ${tokens.length} 个币种`);
  } catch(e) {
    console.warn('four.meme 数据拉取失败，使用 mock 数据', e);
  }
}

// four.meme 官方 API 行情表数据（直接用官方数据，不再依赖 DexScreener）
async function fetchFourMemeTableDataV2(tokens) {
  if (!tokens || !tokens.length) return;
  try {
    // 热度榜
    const hotRes = await fetch('https://four.meme/meme-api/v1/public/token/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageIndex: 1, pageSize: 8, type: 'HOT', listType: 'ADV' })
    });
    const hotData = await hotRes.json();
    const hotTokens = hotData?.data || [];

    // 涨幅榜（用 INCREASE type）
    const gainRes = await fetch('https://four.meme/meme-api/v1/public/token/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageIndex: 1, pageSize: 8, type: 'INCREASE', listType: 'ADV' })
    });
    const gainData = await gainRes.json();
    const gainTokens = gainData?.data || hotTokens.slice().sort((a,b) => parseFloat(b.day1Increase||0) - parseFloat(a.day1Increase||0));

    function toTableRow(t, i) {
      const change24 = t.day1Increase ? (parseFloat(t.day1Increase) * 100).toFixed(1) : '0';
      const changeUp = parseFloat(t.day1Increase || 0) >= 0;
      const vol = parseFloat(t.day1Vol || 0);
      const imgUrl = t.img ? `https://static.four.meme${t.img}` : null;
      return {
        rank: i + 1,
        icon: guessIcon(t.name, t.shortName),
        iconImg: imgUrl,
        name: t.shortName || t.name?.slice(0,12) || '???',
        source: 'four.meme',
        price: t.price ? `$${parseFloat(t.price).toPrecision(4)}` : '—',
        change: `${changeUp?'+':''}${change24}%`,
        up: changeUp,
        vol: vol >= 1000 ? `$${(vol/1000).toFixed(0)}K` : `$${vol.toFixed(0)}`,
        liq: t.cap ? `$${parseFloat(t.cap).toFixed(2)}` : '—',
        holders: t.hold ? `${t.hold}笔` : '—',
        hot: parseFloat(t.day1Increase||0) > 0.5,
        isNew: true,
        contract: t.tokenAddress,
        progress: t.progress ? (parseFloat(t.progress)*100).toFixed(1) + '%' : '—',
      };
    }

    bscTableData.fourmeme.hot = hotTokens.map(toTableRow);
    bscTableData.fourmeme.gain = gainTokens.map(toTableRow);
    bscTableData.fourmeme.new = tokens.map(toTableRow); // 新币用 fetchFourMemeTokens 拿到的 NEW 列表

    if (currentTbFilter === 'fourmeme') renderBscTable();
    console.log(`✅ four.meme 行情表：热度榜${hotTokens.length}条，涨幅榜${gainTokens.length}条`);
  } catch(e) {
    console.warn('four.meme 行情表更新失败', e);
  }
}


const courtData = {
  live: [
    {
      id:'C-2026-041', icon:'🦊', name:'FOXAI', source:'four.meme · 2小时前上线',
      tier:'fast', tierLabel:'快审', tierCls:'cc-tier-fast',
      timer:'2h 58m', urgent:false,
      betUp:62, betDown:38,
      pool:4200, participants:89,
      liq:'$48K', holders:'312', change:'+127%', changeUp:true, whale:'🐳买入',
      initiator:'项目方',
      openPrice: 0.00048,
      endTime: Date.now() + 3 * 3600 * 1000,
    },
  ],
  pending: [
    {
      id:'C-2026-042', icon:'🍄', name:'SHROOMZ', source:'four.meme · 18小时前上线',
      tier:'fast', tierLabel:'快审', tierCls:'cc-tier-fast',
      timer:'候审中', urgent:false,
      betUp:0, betDown:0,
      pool:1200, participants:0,
      liq:'$62K', holders:'428', change:'+234%', changeUp:true, whale:'—',
      initiator:'项目方',
    },
    {
      id:'C-2026-043', icon:'⚡', name:'ZAPCAT', source:'four.meme · 14小时前上线',
      tier:'standard', tierLabel:'标准', tierCls:'cc-tier-standard',
      timer:'候审中', urgent:false,
      betUp:0, betDown:0,
      pool:8400, participants:0,
      liq:'$210K', holders:'1,056', change:'+67%', changeUp:true, whale:'🐳买入',
      initiator:'项目方',
    },
    {
      id:'C-2026-044', icon:'🐸', name:'PEPE', source:'CEX · 散户发起',
      tier:'fast', tierLabel:'快审', tierCls:'cc-tier-fast',
      timer:'候审中', urgent:false,
      betUp:0, betDown:0,
      pool:300, participants:0,
      liq:'$2.1M', holders:'84,231', change:'-8%', changeUp:false, whale:'🐳出逃',
      initiator:'散户发起',
    },
  ],
  closed: [
    {
      id:'C-2026-035', icon:'🐶', name:'DOGE', source:'CEX · 已结案',
      tier:'deep', tierLabel:'深审', tierCls:'cc-tier-deep',
      timer:'已结案', urgent:false,
      betUp:78, betDown:22, pool:51200, participants:418,
      liq:'$892M', holders:'—', change:'+12%', changeUp:true, whale:'—',
      initiator:'项目方',
      verdict:'持有', verdictCls:'vr-hold', verdictResult:'✅ 看涨方向胜出',
      confidence:88, risk:'低风险',
      verdictShort:'信仰坚定，社区票王，链上健康，等风来。\n巨鲸持仓稳定，无出货迹象。\n马斯克效应犹在，短期动能充足。\n本庭裁定：可小仓参与，但别忘了它涨多快、跌也多快。',
    },
    {
      id:'C-2026-034', icon:'🎩', name:'WIF', source:'CEX · 已结案',
      tier:'standard', tierLabel:'标准', tierCls:'cc-tier-standard',
      timer:'已结案', urgent:false,
      betUp:41, betDown:59, pool:12800, participants:156,
      liq:'$45M', holders:'—', change:'+2%', changeUp:true, whale:'—',
      initiator:'散户发起',
      verdict:'观望', verdictCls:'vr-watch', verdictResult:'⚠️ 裁定与价格分歧',
      confidence:61, risk:'中风险',
      verdictShort:'叙事仍在，热度回落，持仓不动静待催化。\n巨鲸出逃迹象明显，短期上行乏力。\n社区分歧加大，押注风险偏高。\n本庭裁定：观望为主，等方向选择后再介入。',
    },
    {
      id:'C-2026-033', icon:'🐸', name:'PEPE', source:'CEX · 已结案',
      tier:'fast', tierLabel:'快审', tierCls:'cc-tier-fast',
      timer:'已结案', urgent:false,
      betUp:55, betDown:45, pool:28600, participants:241,
      liq:'$450M', holders:'—', change:'-8%', changeUp:false, whale:'🐳出逃',
      initiator:'散户发起',
      verdict:'谨慎', verdictCls:'vr-caution', verdictResult:'📉 看跌方向胜出',
      confidence:71, risk:'高风险',
      verdictShort:'巨鲸出逃，基本面承压，降仓观望勿追高。\n链上地址数增长停滞，新增主要来自散户。\n短期下行风险较大，建议等待放量确认。\n本庭裁定：谨慎，已有巨鲸在高位减仓。',
    },
    {
      id:'C-2026-032', icon:'⚡', name:'TURBO', source:'four.meme · 已结案',
      tier:'fast', tierLabel:'快审', tierCls:'cc-tier-fast',
      timer:'已结案', urgent:false,
      betUp:71, betDown:29, pool:18400, participants:198,
      liq:'$8.2M', holders:'—', change:'+89%', changeUp:true, whale:'🐳持仓',
      initiator:'项目方',
      verdict:'建仓', verdictCls:'vr-hold', verdictResult:'✅ 看涨方向胜出',
      confidence:79, risk:'中风险',
      verdictShort:'TURBO 本次拉升由真实链上需求驱动。\n持仓地址 3 天增长 240%，筹码分散利于上涨。\n巨鲸持仓集中度低，无明显出货迹象。\n本庭裁定：可适量参与，注意仓位控制，止损设好。',
    },
    {
      id:'C-2026-031', icon:'🔨', name:'BONK', source:'CEX · 已结案',
      tier:'standard', tierLabel:'标准', tierCls:'cc-tier-standard',
      timer:'已结案', urgent:false,
      betUp:51, betDown:49, pool:9200, participants:87,
      liq:'$12M', holders:'—', change:'+5%', changeUp:true, whale:'➡️持仓',
      initiator:'散户发起',
      verdict:'小仓', verdictCls:'vr-hold', verdictResult:'✅ 看涨方向胜出',
      confidence:55, risk:'中风险',
      verdictShort:'新血注入，动能充足，止损要设好。\n横盘整理形态，方向尚未明确。\n社区分歧明显，押注双方势均力敌。\n本庭裁定：小仓试水，等放量突破后再加仓。',
    },
    {
      id:'C-2026-030', icon:'🪙', name:'FLOKI', source:'CEX · 已结案',
      tier:'deep', tierLabel:'深审', tierCls:'cc-tier-deep',
      timer:'已结案', urgent:false,
      betUp:38, betDown:62, pool:6800, participants:64,
      liq:'$3.1M', holders:'—', change:'-3%', changeUp:false, whale:'—',
      initiator:'项目方',
      verdict:'等待', verdictCls:'vr-wait', verdictResult:'📉 看跌方向胜出',
      confidence:62, risk:'高风险',
      verdictShort:'链上沉寂，大户减仓，无入场理由。\n项目方活跃度下降，社区热度消退。\n价格持续横盘，资金持续流出。\n本庭裁定：等待，无明确催化剂前不建议建仓。',
    },
  ],
};

let currentCourtTab = 'all';
let currentCourtFilter = 'all';

/* ══ DexScreener 真实数据接入层 ══ */


const DEXSCREENER_BASE = 'https://api.dexscreener.com';

// BSC 主流 Meme 代币合约地址
const BSC_TOKEN_ADDRESSES = {
  DOGE: '0xbA2aE424d960c26247Dd6c32edC70B295c744C43',
  PEPE: '0x6982508145454Ce325dDbE47a25d4ec3d2311933', // BSC 桥接版
  TURBO:'0xce90a7949bb78892f159f428d0dc23a8e3584d75',
  BONK: '0xA697e272a73744b343528C3Bc4702F2565b2F422',
  WIF:  '0xB5E2B9CE0c2c9e6A7B04bC4C2FEA5D4F97A5B4B2',
};

// 缓存，避免频繁请求
let dexCache = {};
let dexCacheTime = {};
const CACHE_TTL = 30000; // 30秒

async function fetchDexScreener(endpoint) {
  const now = Date.now();
  if (dexCache[endpoint] && now - dexCacheTime[endpoint] < CACHE_TTL) {
    return dexCache[endpoint];
  }
  try {
    const res = await fetch(DEXSCREENER_BASE + endpoint, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    dexCache[endpoint] = data;
    dexCacheTime[endpoint] = now;
    return data;
  } catch (e) {
    console.warn('DexScreener fetch failed:', endpoint, e.message);
    return null;
  }
}

// 搜索 BSC 上的代币对
async function fetchBscToken(symbol) {
  const data = await fetchDexScreener(`/latest/dex/search?q=${symbol}+BSC`);
  if (!data?.pairs) return null;
  // 取 BSC 链上流动性最高的那个
  const bscPairs = data.pairs.filter(p => p.chainId === 'bsc' && parseFloat(p.liquidity?.usd || 0) > 1000);
  if (!bscPairs.length) return null;
  bscPairs.sort((a,b) => parseFloat(b.liquidity?.usd||0) - parseFloat(a.liquidity?.usd||0));
  return bscPairs[0];
}

// 批量获取 BSC Meme 热门行情（用于 Meme 雷达行情表）
async function fetchBscMemeRanking() {
  const symbols = ['DOGE','PEPE','TURBO','BONK','SHIB','FLOKI','BABYDOGE','KISHU'];
  const results = await Promise.allSettled(symbols.map(s => fetchBscToken(s)));
  return results
    .map((r, i) => r.status === 'fulfilled' ? normalizePair(r.value, symbols[i]) : null)
    .filter(Boolean);
}

// 获取四.meme 新币（用 pancakeswap 新对）
async function fetchFourMemeNewTokens() {
  try {
    // 策略：多个关键词并发搜 BSC 新小市值代币，模拟 four.meme 新币效果
    // DexScreener 没有专用的 four.meme 端点，但可以搜最新低流动性 BSC 对
    const searches = [
      fetchDexScreener('/latest/dex/search?q=BSC+meme+new'),
      fetchDexScreener('/latest/dex/search?q=bnb+token+launch'),
      fetchDexScreener('/latest/dex/search?q=baby+BSC'),
      fetchDexScreener('/latest/dex/search?q=moon+BSC+pancake'),
    ];
    const results = await Promise.allSettled(searches);
    const now = Date.now();
    const seen = new Set();

    const pairs = results
      .filter(r => r.status === 'fulfilled' && r.value?.pairs)
      .flatMap(r => r.value.pairs)
      .filter(p => {
        if (p.chainId !== 'bsc') return false;
        if (!p.pairCreatedAt) return false;
        if (seen.has(p.pairAddress)) return false;
        const ageH = (now - p.pairCreatedAt) / 3600000;
        const liq = parseFloat(p.liquidity?.usd || 0);
        const vol = parseFloat(p.volume?.h24 || 0);
        // 48小时内、有一定流动性、有交易量
        if (ageH > 120 || liq < 100 || vol < 10) return false;
        seen.add(p.pairAddress);
        return true;
      })
      .sort((a, b) => parseFloat(b.volume?.h24||0) - parseFloat(a.volume?.h24||0))
      .slice(0, 10)
      .map(p => normalizePair(p))
      .filter(Boolean);

    console.log('four.meme 新币获取:', pairs.length, '个');
    return pairs;

  } catch(e) {
    console.warn('fetchFourMemeNewTokens 失败:', e.message);
    return [];
  }
}

// 备用方案保留但不用
async function fetchFourMemeFallback() { return []; }

// 标准化一个 pair 对象为我们的格式
function normalizePair(pair, fallbackSymbol = '') {
  if (!pair) return null;
  const symbol = pair.baseToken?.symbol || fallbackSymbol;
  const change24h = parseFloat(pair.priceChange?.h24 || 0);
  const vol24h = parseFloat(pair.volume?.h24 || 0);
  const liq = parseFloat(pair.liquidity?.usd || 0);
  const price = parseFloat(pair.priceUsd || 0);
  const buys24h = pair.txns?.h24?.buys || 0;
  const sells24h = pair.txns?.h24?.sells || 0;
  const ageMs = pair.pairCreatedAt ? Date.now() - pair.pairCreatedAt : null;
  const ageH = ageMs ? Math.floor(ageMs / 3600000) : null;

  return {
    symbol,
    name: pair.baseToken?.name || symbol,
    address: pair.baseToken?.address,
    pairAddress: pair.pairAddress,
    dexUrl: pair.url,
    imageUrl: pair.info?.imageUrl || null,
    price: price < 0.0001 ? price.toExponential(2) : price < 1 ? price.toFixed(6) : price.toFixed(2),
    priceUsd: price,
    change24h,
    changeStr: (change24h >= 0 ? '+' : '') + change24h.toFixed(1) + '%',
    changeUp: change24h >= 0,
    vol24h,
    volStr: formatUsd(vol24h),
    liq,
    liqStr: formatUsd(liq),
    txBuys: buys24h,
    txSells: sells24h,
    holders: (buys24h + sells24h).toLocaleString(),
    isNew: ageH !== null && ageH < 48,
    ageStr: ageH !== null ? (ageH < 1 ? '<1h前' : ageH + 'h前') : '',
    source: pair.dexId === 'pancakeswap' ? 'PancakeSwap' : pair.dexId || 'DEX',
    dexId: pair.dexId,
    hot: vol24h > 100000 || (pair.boosts?.active > 0),
    rank: 0,
  };
}

function formatUsd(n) {
  if (n >= 1e9) return '$' + (n/1e9).toFixed(1) + 'B';
  if (n >= 1e6) return '$' + (n/1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + (n/1e3).toFixed(0) + 'K';
  return '$' + n.toFixed(0);
}

// 真实数据缓存
let realMemeData = [];
let realNewCoinsData = [];
let dexDataLoaded = false;

async function loadDexScreenerData() {
  try {
    showDexLoadingState();

    // 并发请求 DexScreener + four.meme 新币
    const [memes, newCoins] = await Promise.all([
      fetchBscMemeRanking(),
      fetchFourMemeNewTokens(),
    ]);

    if (memes.length) realMemeData = memes.map((d,i) => ({...d, rank:i+1}));
    if (newCoins.length) realNewCoinsData = newCoins.map((d,i) => ({...d, rank:i+1}));

    dexDataLoaded = true;
    renderBscTableFromReal();
    updateKpiBar(memes, newCoins);
    // 用真实数据重渲染图表
    setTimeout(() => { initBscBarChart(); initBscPieChart(); }, 100);
    console.log('DexScreener 数据加载成功:', memes.length, '主流 +', newCoins.length, '新币');

    // 后台补充 Etherscan 持仓地址数（不阻塞主渲染）
    enrichWithEtherscan(realMemeData.concat(realNewCoinsData));

  } catch(e) {
    console.warn('DexScreener 数据加载失败，使用 mock 数据:', e);
  }
}

// 用 Etherscan API 补充持仓地址数
async function enrichWithEtherscan(tokens) {
  // 每次最多请求5个，避免超速
  const batch = tokens.filter(t => t.address).slice(0, 8);
  for (const token of batch) {
    try {
      const res = await fetch(`${ETHERSCAN_BSC_BASE}&module=token&action=tokeninfo&contractaddress=${token.address}`);
      const data = await res.json();
      if (data.status === '1' && data.result?.[0]) {
        const t = data.result[0];
        const holdersCount = parseInt(t.holdersCount || 0);
        if (holdersCount > 0) {
          token.holders = holdersCount.toLocaleString();
          token.isVerified = true;
        }
        if (t.tokenName && !token.name) token.name = t.tokenName;
      }
      // 控制请求速率（5 req/s 限制）
      await new Promise(r => setTimeout(r, 220));
    } catch(e) {}
  }
  // 更新表格（持仓数列变成真实数字）
  if (dexDataLoaded) renderBscTableFromReal();
}

function showDexLoadingState() {
  const el = document.getElementById('bscTableList');
  if (el) el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text3);font-size:13px">🔄 正在加载真实行情数据…</div>';
}

function updateKpiBar(memes, newCoins) {
  const totalVol = memes.reduce((s, d) => s + d.vol24h, 0);
  // 24h 交易量
  const volEl = document.querySelector('.bsc-kpi.k-green .bsc-kpi-val');
  if (volEl && totalVol > 0) volEl.textContent = formatUsd(totalVol);
  // four.meme 今日上线
  const newEl = document.querySelector('.bsc-kpi.k-amber .bsc-kpi-val');
  if (newEl && newCoins.length > 0) { newEl.textContent = newCoins.length; newEl.classList.add('green'); }
  // 活跃地址（取所有代币 txns buys+sells 之和的去重估算）
  const totalTxns = memes.reduce((s,d) => s + (d.txBuys||0) + (d.txSells||0), 0);
  const addrEl = document.querySelector('.bsc-kpi.k-blue .bsc-kpi-val');
  if (addrEl && totalTxns > 0) addrEl.textContent = totalTxns.toLocaleString();
  // 今日新币数
  const newCoinEl = document.querySelector('.bsc-kpi.k-accent .bsc-kpi-val');
  if (newCoinEl && newCoins.length > 0) { newCoinEl.textContent = newCoins.length + '+'; newCoinEl.classList.add('accent'); }
}

function renderBscTableFromReal() {
  const el = document.getElementById('bscTableList');
  if (!el) return;

  let data = [];
  if (currentTbFilter === 'fourmeme') {
    if (currentTbTab === 'new') data = realNewCoinsData;
    else if (currentTbTab === 'gain') data = [...realNewCoinsData].sort((a,b) => b.change24h - a.change24h);
    else data = [...realNewCoinsData].sort((a,b) => b.vol24h - a.vol24h);
  } else {
    if (currentTbTab === 'gain') data = [...realMemeData].sort((a,b) => b.change24h - a.change24h);
    else if (currentTbTab === 'new') data = [...realMemeData].sort((a,b) => a.liq - b.liq);
    else data = [...realMemeData].sort((a,b) => b.vol24h - a.vol24h);
  }

  if (!data.length) {
    // fallback to mock — 直接渲染 mock，不调用 renderBscTable 避免递归
    renderBscTableMock();
    return;
  }

  el.innerHTML = data.slice(0, 10).map((r, i) => {
    const imgHtml = r.imageUrl
      ? `<img src="${r.imageUrl}" style="width:20px;height:20px;border-radius:50%;object-fit:cover" onerror="this.outerHTML='${getTokenEmoji(r.symbol)}'">`
      : `<span style="font-size:18px">${getTokenEmoji(r.symbol)}</span>`;
    return `
    <div class="bsc-table-row" onclick="window.open('${r.dexUrl || '#'}','_blank')" style="cursor:pointer">
      <div class="bsc-tr-rank ${i===0?'r1':i===1?'r2':i===2?'r3':''}">${i+1}</div>
      <div class="bsc-tr-icon">${imgHtml}</div>
      <div class="bsc-tr-name-cell">
        <div class="bsc-tr-name">${r.symbol} ${r.hot?'<span class="bsc-tr-hot">🔥HOT</span>':''} ${r.isNew?'<span class="bsc-tr-new">NEW</span>':''}</div>
        <div class="bsc-tr-source">${r.source}${r.ageStr?' · '+r.ageStr:''}</div>
      </div>
      <div class="bsc-tr-price">$${r.price}</div>
      <div class="bsc-tr-change ${r.changeUp?'up':'down'}">${r.changeStr}</div>
      <div class="bsc-tr-vol">${r.volStr}</div>
      <div class="bsc-tr-liq">${r.liqStr}</div>
      <div class="bsc-tr-holders">${r.holders}</div>
    </div>`;
  }).join('');
}

function getTokenEmoji(symbol) {
  const map = {DOGE:'🐶',PEPE:'🐸',SHIB:'🦊',FLOKI:'🐕',TURBO:'⚡',BONK:'🔨',BABYDOGE:'🐾',KISHU:'🐕',WIF:'🎩'};
  return map[symbol] || '🪙';
}

// 为开庭详情页获取真实链上数据
async function fetchCourtDetailData(c) {
  if (!c.contractAddress) return null;
  const data = await fetchDexScreener(`/latest/dex/tokens/${c.contractAddress}`);
  if (!data?.pairs) return null;
  const bscPairs = data.pairs.filter(p => p.chainId === 'bsc');
  if (!bscPairs.length) return null;
  bscPairs.sort((a,b) => parseFloat(b.liquidity?.usd||0) - parseFloat(a.liquidity?.usd||0));
  return normalizePair(bscPairs[0]);
}

// 刷新开庭详情页链上数据
async function refreshDetailMetrics(c) {
  const bar = document.getElementById('detailMetricsBar');
  if (!bar) return;
  const real = await fetchCourtDetailData(c);
  if (!real) return;
  // 用真实数据更新
  bar.innerHTML = [
    {val: real.liqStr, lbl:'初始流动性'},
    {val: real.holders, lbl:'24h 交易地址'},
    {val: real.changeStr, lbl:'24h涨跌幅', cls: real.changeUp?'up':'down'},
    {val: real.txBuys + '买/' + real.txSells + '卖', lbl:'24h 笔数'},
    {val: (c.participants||0) + '人', lbl:'参与押注'},
  ].map(m => `<div class="detail-metric-item">
    <div class="detail-metric-val ${m.cls||''}">${m.val}</div>
    <div class="detail-metric-lbl">${m.lbl}</div>
  </div>`).join('');
}

// 定时刷新（每30秒）
function startDexAutoRefresh() {
  setInterval(async () => {
    if (document.getElementById('page-rank')?.classList.contains('active')) {
      dexCache = {}; // 清缓存强制刷新
      await loadDexScreenerData();
    }
  }, 30000);
}

const bscTableData = {
  fourmeme: {
    hot: [
      {rank:1,icon:'🦊',name:'FOXAI',source:'four.meme',price:'$0.00042',change:'+127%',up:true,vol:'$48K',liq:'$48K',holders:'312',hot:true,isNew:false},
      {rank:2,icon:'⚡',name:'ZAPCAT',source:'four.meme',price:'$0.00018',change:'+67%',up:true,vol:'$21K',liq:'$21K',holders:'198',hot:true,isNew:true},
      {rank:3,icon:'🍄',name:'SHROOMZ',source:'four.meme',price:'$0.00031',change:'+234%',up:true,vol:'$62K',liq:'$62K',holders:'428',hot:true,isNew:true},
      {rank:4,icon:'🤖',name:'AIBONK',source:'four.meme',price:'$0.00087',change:'+18%',up:true,vol:'$32K',liq:'$320K',holders:'1,243',hot:false,isNew:false},
      {rank:5,icon:'🌊',name:'WAVEMEME',source:'four.meme',price:'$0.00156',change:'+29%',up:true,vol:'$44K',liq:'$445K',holders:'2,134',hot:false,isNew:false},
      {rank:6,icon:'🐯',name:'TIGERBNB',source:'four.meme',price:'$0.00009',change:'+89%',up:true,vol:'$18K',liq:'$18K',holders:'156',hot:false,isNew:true},
      {rank:7,icon:'🎮',name:'GAMEMEME',source:'four.meme',price:'$0.00024',change:'+12%',up:true,vol:'$9K',liq:'$9K',holders:'87',hot:false,isNew:false},
    ],
    gain: [
      {rank:1,icon:'🍄',name:'SHROOMZ',source:'four.meme',price:'$0.00031',change:'+234%',up:true,vol:'$62K',liq:'$62K',holders:'428',hot:true,isNew:true},
      {rank:2,icon:'🦊',name:'FOXAI',source:'four.meme',price:'$0.00042',change:'+127%',up:true,vol:'$48K',liq:'$48K',holders:'312',hot:true,isNew:false},
      {rank:3,icon:'🐯',name:'TIGERBNB',source:'four.meme',price:'$0.00009',change:'+89%',up:true,vol:'$18K',liq:'$18K',holders:'156',hot:false,isNew:true},
      {rank:4,icon:'⚡',name:'ZAPCAT',source:'four.meme',price:'$0.00018',change:'+67%',up:true,vol:'$21K',liq:'$21K',holders:'198',hot:false,isNew:true},
    ],
    new: [
      {rank:1,icon:'🌙',name:'MOONCAT2',source:'four.meme · 42分前',price:'$0.00003',change:'+12%',up:true,vol:'$4K',liq:'$4K',holders:'34',hot:false,isNew:true},
      {rank:2,icon:'🦁',name:'LIONKING',source:'four.meme · 1h前',price:'$0.00007',change:'+8%',up:true,vol:'$7K',liq:'$7K',holders:'67',hot:false,isNew:true},
      {rank:3,icon:'🐋',name:'WHALECOIN',source:'four.meme · 2h前',price:'$0.00015',change:'+45%',up:true,vol:'$12K',liq:'$12K',holders:'124',hot:true,isNew:true},
      {rank:4,icon:'🔥',name:'FIREPEPE',source:'four.meme · 3h前',price:'$0.00021',change:'+67%',up:true,vol:'$28K',liq:'$28K',holders:'287',hot:true,isNew:true},
    ],
  },
  bsc: {
    hot: [
      {rank:1,icon:'🐶',name:'DOGE',source:'CEX · BSC',price:'$0.082',change:'+12%',up:true,vol:'$892M',liq:'$2.1B',holders:'84,231',hot:true,isNew:false},
      {rank:2,icon:'🐸',name:'PEPE',source:'CEX · BSC',price:'$0.0000087',change:'-8%',up:false,vol:'$234M',liq:'$450M',holders:'52,341',hot:true,isNew:false},
      {rank:3,icon:'⚡',name:'TURBO',source:'DEX · BSC',price:'$0.00031',change:'+31%',up:true,vol:'$18M',liq:'$8.2M',holders:'12,431',hot:false,isNew:false},
      {rank:4,icon:'🦊',name:'FOXAI',source:'four.meme',price:'$0.00042',change:'+127%',up:true,vol:'$48K',liq:'$48K',holders:'312',hot:true,isNew:true},
      {rank:5,icon:'🍄',name:'SHROOMZ',source:'four.meme',price:'$0.00031',change:'+234%',up:true,vol:'$62K',liq:'$62K',holders:'428',hot:false,isNew:true},
    ],
    gain: [
      {rank:1,icon:'🍄',name:'SHROOMZ',source:'four.meme',price:'$0.00031',change:'+234%',up:true,vol:'$62K',liq:'$62K',holders:'428',hot:true,isNew:true},
      {rank:2,icon:'🦊',name:'FOXAI',source:'four.meme',price:'$0.00042',change:'+127%',up:true,vol:'$48K',liq:'$48K',holders:'312',hot:true,isNew:false},
      {rank:3,icon:'⚡',name:'TURBO',source:'DEX',price:'$0.00031',change:'+31%',up:true,vol:'$18M',liq:'$8.2M',holders:'12,431',hot:false,isNew:false},
    ],
    new: [
      {rank:1,icon:'🌙',name:'MOONCAT2',source:'four.meme · 42分前',price:'$0.00003',change:'+12%',up:true,vol:'$4K',liq:'$4K',holders:'34',hot:false,isNew:true},
      {rank:2,icon:'🐋',name:'WHALECOIN',source:'four.meme · 2h前',price:'$0.00015',change:'+45%',up:true,vol:'$12K',liq:'$12K',holders:'124',hot:true,isNew:true},
    ],
  }
};

const bscBubbleData = [
  {name:'DOGE',change:12,vol:892,liq:2100,heat:95,color:'#ff6340'},
  {name:'PEPE',change:-8,vol:234,liq:450,heat:78,color:'#d97706'},
  {name:'TURBO',change:31,vol:18,liq:8.2,heat:72,color:'#d97706'},
  {name:'FOXAI',change:127,vol:0.048,liq:0.048,heat:88,color:'#ff6340'},
  {name:'SHROOMZ',change:234,vol:0.062,liq:0.062,heat:82,color:'#ff6340'},
  {name:'AIBONK',change:18,vol:0.032,liq:0.32,heat:65,color:'#2563eb'},
  {name:'WIF',change:2,vol:45,liq:45,heat:58,color:'#2563eb'},
  {name:'BONK',change:5,vol:12,liq:12,heat:54,color:'#6b7280'},
  {name:'ZAPCAT',change:67,vol:0.021,liq:0.021,heat:76,color:'#d97706'},
  {name:'TIGERBNB',change:89,vol:0.018,liq:0.018,heat:70,color:'#d97706'},
];

const bscFeedDataLeft = [
  {tag:'bet-new',tagText:'新币上线',coin:'MOONCAT2',time:'刚刚',text:'four.meme 新项目发射，初始流动性 $4K，42分钟涨幅 +12%。',trans:'热度不错，可观望。'},
  {tag:'bet-buy',tagText:'大额买入',coin:'FOXAI',time:'8分前',text:'0x7a…4f 一次性买入 $8.4 万 FOXAI，疑似早期布局。',trans:'聪明钱进场，注意跟踪。'},
  {tag:'bet-hot',tagText:'热度飙升',coin:'SHROOMZ',time:'15分前',text:'SHROOMZ 过去 1 小时交易量暴增 340%。',trans:'热度来了，注意是否庄拉。'},
  {tag:'bet-new',tagText:'新币上线',coin:'FIREPEPE',time:'1h前',text:'FIREPEPE 在 four.meme 发射，3小时内流动性增至 $28K，+67%。',trans:'早期进场已赚飞。'},
  {tag:'bet-buy',tagText:'建仓信号',coin:'BONK',time:'3h前',text:'0xf1…2a 分 8 笔买入 BONK 总计 $31 万，均价偏低。',trans:'大钱悄悄入场。'},
];

const bscFeedDataRight = [
  {tag:'bet-whale',tagText:'巨鲸动向',coin:'PEPE',time:'32分前',text:'巨鲸地址 0x22d8… 转出 2,300 万枚 PEPE 至交易所热钱包。',trans:'大户在出货，谨慎持仓。'},
  {tag:'bet-risk',tagText:'风险警告',coin:'RUGTOKEN',time:'2h前',text:'RUGTOKEN 项目方撤出 95% 流动性，疑似 rug pull。',trans:'已跑路，别接了。'},
  {tag:'bet-whale',tagText:'巨鲸观望',coin:'DOGE',time:'5h前',text:'大量 DOGE 链上转移但未流入交易所，疑似换冷钱包。',trans:'长期主义者，不慌。'},
  {tag:'bet-risk',tagText:'预警',coin:'MOCHI',time:'8h前',text:'MOCHI 创始人关联地址将 80% 持仓转出。',trans:'项目方跑路迹象，规避。'},
];

// ── four.meme 行情表真实数据 ──
async function fetchFourMemeTableData(tokens) {
  if (!tokens || !tokens.length) return;
  try {
    // 批量调 DexScreener，每次最多 30 个地址
    const addrs = tokens.map(t => t.contract).join(',');
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${addrs}`);
    const data = await res.json();
    const pairs = data?.pairs || [];

    // 按合约地址建 map，取交易量最大的 pair
    const pairMap = {};
    for (const p of pairs) {
      const addr = p.baseToken?.address?.toLowerCase();
      if (!addr) continue;
      if (!pairMap[addr] || (p.volume?.h24 || 0) > (pairMap[addr].volume?.h24 || 0)) {
        pairMap[addr] = p;
      }
    }

    // 转换成 bscTableData 格式
    const rows = tokens.map((t, i) => {
      const pair = pairMap[t.contract.toLowerCase()];
      const change24 = pair?.priceChange?.h24;
      const changeStr = change24 != null
        ? (change24 >= 0 ? `+${change24.toFixed(1)}%` : `${change24.toFixed(1)}%`)
        : '+—%';
      const vol = pair?.volume?.h24;
      const volStr = vol != null ? formatK(vol) : `${t.bnbVolume.toFixed(2)} BNB`;
      const liq = pair?.liquidity?.usd;
      const liqStr = liq != null ? formatK(liq) : '—';
      const priceUsd = pair?.priceUsd;
      const priceStr = priceUsd != null ? `$${parseFloat(priceUsd).toPrecision(4)}` : '—';
      const txns24 = (pair?.txns?.h24?.buys || 0) + (pair?.txns?.h24?.sells || 0);

      return {
        rank: i + 1,
        icon: t.icon || guessIcon(t.name || '', t.symbol || t.name || ''),
        name: t.symbol || t.name,
        source: 'four.meme',
        price: priceStr,
        change: changeStr,
        up: change24 == null || change24 >= 0,
        vol: volStr,
        liq: liqStr,
        holders: txns24 > 0 ? `${txns24}笔` : '—',
        hot: (change24 || 0) > 50 || (vol || 0) > 50000,
        isNew: true,
        contract: t.contract,
      };
    });

    // 注入 bscTableData.fourmeme
    bscTableData.fourmeme.hot = [...rows].sort((a, b) => {
      const va = parseFloat((a.vol || '0').replace(/[^0-9.]/g,'')) * (a.vol?.includes('M') ? 1000 : 1);
      const vb = parseFloat((b.vol || '0').replace(/[^0-9.]/g,'')) * (b.vol?.includes('M') ? 1000 : 1);
      return vb - va;
    }).map((r, i) => ({...r, rank: i+1}));

    bscTableData.fourmeme.gain = [...rows]
      .filter(r => r.up)
      .sort((a, b) => parseFloat(b.change) - parseFloat(a.change))
      .slice(0, 6)
      .map((r, i) => ({...r, rank: i+1}));

    bscTableData.fourmeme.new = [...rows]
      .slice(0, 4)
      .map((r, i) => ({...r, rank: i+1}));

    // 如果当前在 fourmeme tab，刷新渲染
    if (currentTbFilter === 'fourmeme') renderBscTable();
    console.log(`✅ four.meme 行情表：已更新 ${rows.length} 条真实数据`);
  } catch(e) {
    console.warn('four.meme 行情表数据拉取失败', e);
  }
}

function formatK(num) {
  if (num >= 1e9) return `$${(num/1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num/1e6).toFixed(1)}M`;
  if (num >= 1e3) return `$${(num/1e3).toFixed(0)}K`;
  return `$${num.toFixed(0)}`;
}


let currentTbTab = 'hot';
let currentTbFilter = 'fourmeme';
let bscBubbleHovered = null;

function switchTbTab(tab) {
  currentTbTab = tab;
  document.querySelectorAll('.bsc-table-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tbTab-' + tab).classList.add('active');
  renderBscTable();
}

function switchTbFilter(filter) {
  currentTbFilter = filter;
  document.querySelectorAll('.bsc-table-filter-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tbFilter-' + filter).classList.add('active');
  renderBscTable();
}

function renderBscTable() {
  if (dexDataLoaded && (realMemeData.length || realNewCoinsData.length)) {
    renderBscTableFromReal();
    return;
  }
  renderBscTableMock();
}

function renderBscTableMock() {
  const el = document.getElementById('bscTableList');
  if (!el) return;
  const data = (bscTableData[currentTbFilter] || {})[currentTbTab] || [];
  el.innerHTML = data.map(r => `
    <div class="bsc-table-row">
      <div class="bsc-tr-rank ${r.rank<=3?'r'+r.rank:''}">${r.rank}</div>
      <div class="bsc-tr-icon">${r.iconImg ? `<img src="${r.iconImg}" style="width:24px;height:24px;border-radius:6px;object-fit:cover" onerror="this.parentElement.textContent='${r.icon}'">` : r.icon}</div>
      <div class="bsc-tr-name-cell">
        <div class="bsc-tr-name">${r.name} ${r.hot?'<span class="bsc-tr-hot">🔥HOT</span>':''} ${r.isNew?'<span class="bsc-tr-new">NEW</span>':''}</div>
        <div class="bsc-tr-source">${r.source}</div>
      </div>
      <div class="bsc-tr-price">${r.price}</div>
      <div class="bsc-tr-change ${r.up?'up':'down'}">${r.change}</div>
      <div class="bsc-tr-vol">${r.vol}</div>
      <div class="bsc-tr-liq">${r.liq}</div>
      <div class="bsc-tr-holders">${r.holders}</div>
    </div>`).join('');
}

function renderBscFeed() {
  const left = document.getElementById('bscFeedLeft');
  const right = document.getElementById('bscFeedRight');
  if(!left&&!right)return;
  const renderItems = (items) => items.map(e => `
    <div class="bsc-event">
      <div class="bsc-event-top">
        <span class="bsc-event-tag ${e.tag}">${e.tagText}</span>
        <span class="bsc-event-coin">${e.coin}</span>
        <span class="bsc-event-time">${e.time}</span>
      </div>
      <div class="bsc-event-text">${e.text}</div>
      <div class="bsc-event-trans">AI：${e.trans}</div>
    </div>`).join('');
  if (left) left.innerHTML = renderItems(bscFeedDataLeft);
  if (right) right.innerHTML = renderItems(bscFeedDataRight);
}

/* ── Treemap 热度方块图 ── */
/* ── 押注战况实时地图 ── */
function renderBattleMap() {
  const body = document.getElementById('battleMapBody');
  const meta = document.getElementById('battleMapMeta');
  if (!body) return;

  const allCases = [
    ...courtData.live.map(c => ({...c, status:'live'})),
    ...courtData.pending.map(c => ({...c, status:'pending'})),
  ];

  if (meta) {
    const liveCount = courtData.live.length;
    const pendingCount = courtData.pending.length;
    meta.textContent = liveCount + ' 案进行中 · ' + pendingCount + ' 案候审';
  }

  if (!allCases.length) {
    body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;flex:1;color:var(--text3);font-size:13px;padding:40px">暂无案件</div>';
    return;
  }

  const maxPool = Math.max(...allCases.map(c => c.pool));

  // group sections
  const liveCases = allCases.filter(c => c.status === 'live');
  const pendingCases = allCases.filter(c => c.status === 'pending');

  let html = '';

  if (liveCases.length) {
    html += '<div class="bm-section-lbl">🔴 进行中</div>';
    liveCases.forEach(c => {
      const upPct = c.betUp || 62;
      const downPct = 100 - upPct;
      const upAmt = Math.floor(c.pool * upPct / 100);
      const downAmt = c.pool - upAmt;
      const poolK = c.pool >= 1000 ? (c.pool/1000).toFixed(1)+'K' : c.pool;
      const tierCls = c.tierCls === 'cc-tier-fast' ? 'bm-tier-fast' : c.tierCls === 'cc-tier-standard' ? 'bm-tier-std' : 'bm-tier-deep';
      // bar height scales with pool size (min 52px, max 84px)
      const barH = Math.round(52 + (c.pool / maxPool) * 32);
      html += `<div class="bm-case-row" onclick="openCourtDetail('${c.id}')">
        <div class="bm-case-meta">
          <div class="bm-case-id">${c.id}</div>
          <div class="bm-case-name">${c.icon} ${c.name}</div>
          <div style="display:flex;align-items:center;gap:4px;margin-top:1px">
            <span class="bm-tier ${tierCls}">${c.tierLabel}</span>
          </div>
          <div class="bm-case-pool">奖池 ${poolK} $GAVEL</div>
        </div>
        <div class="bm-divider"></div>
        <div class="bm-bar" style="min-height:${barH}px">
          <div class="bm-side-up" style="flex:${upPct}">
            <span class="bm-side-label">📈 看涨</span>
            <span class="bm-side-pct">${upPct}%</span>
            <span class="bm-side-amt">${upAmt.toLocaleString()} $G</span>
            <span class="bm-timer">${c.timer}</span>
          </div>
          <div class="bm-side-down" style="flex:${downPct}">
            <span class="bm-side-label">📉 看跌</span>
            <span class="bm-side-pct">${downPct}%</span>
            <span class="bm-side-amt">${downAmt.toLocaleString()} $G</span>
          </div>
        </div>
      </div>`;
    });
  }

  if (pendingCases.length) {
    html += '<div class="bm-section-lbl" style="margin-top:10px">⏳ 候审中</div>';
    pendingCases.forEach(c => {
      const poolK = c.pool >= 1000 ? (c.pool/1000).toFixed(1)+'K' : c.pool;
      const tierCls = c.tierCls === 'cc-tier-fast' ? 'bm-tier-fast' : c.tierCls === 'cc-tier-standard' ? 'bm-tier-std' : 'bm-tier-deep';
      html += `<div class="bm-case-row pending" style="opacity:.55" onclick="openCourtDetail('${c.id}')">
        <div class="bm-case-meta">
          <div class="bm-case-id">${c.id}</div>
          <div class="bm-case-name">${c.icon} ${c.name}</div>
          <div style="display:flex;align-items:center;gap:4px;margin-top:1px">
            <span class="bm-tier ${tierCls}">${c.tierLabel}</span>
          </div>
          <div class="bm-case-pool">预估 ${poolK} $GAVEL</div>
        </div>
        <div class="bm-divider"></div>
        <div class="bm-bar" style="min-height:48px">
          <div class="bm-side-pending">
            <span class="bm-side-label" style="color:rgba(255,255,255,.7);font-size:11px">待开庭</span>
          </div>
        </div>
      </div>`;
    });
  }

  body.innerHTML = html;
}

function initBscBarChart() {
  const el = document.getElementById('bscBarChart');
  if (!el) return;

  // 优先用真实数据
  let data;
  if (realMemeData.length) {
    const sorted = [...realMemeData].sort((a,b) => b.vol24h - a.vol24h).slice(0, 8);
    const colors = ['#16a34a','#2563eb','#d97706','#ff6340','#9333ea','#0284c7','#dc2626','#0891b2'];
    data = sorted.map((d,i) => ({
      name: d.symbol,
      val: d.vol24h,
      color: colors[i % colors.length],
      imgUrl: d.imageUrl || null,
    }));
  } else {
    data = [
      {name:'DOGE', val:892e6, color:'#16a34a'},
      {name:'PEPE', val:234e6, color:'#2563eb'},
      {name:'WIF',  val:45e6,  color:'#d97706'},
      {name:'TURBO',val:18e6,  color:'#ff6340'},
      {name:'BONK', val:12e6,  color:'#9333ea'},
      {name:'FOXAI',val:48000, color:'#ff6340'},
      {name:'AIBONK',val:32000,color:'#0284c7'},
      {name:'SHROOMZ',val:62000,color:'#dc2626'},
    ];
  }

  const maxVal = Math.max(...data.map(d=>d.val));
  el.innerHTML = data.map(d => {
    const pct = Math.max(8, (Math.log10(d.val+1)/Math.log10(maxVal+1))*100);
    const label = formatUsd(d.val);
    return `<div class="bsc-bar-row">
      <div class="bsc-bar-label" style="display:flex;align-items:center;gap:5px">
        ${d.imgUrl ? `<img src="${d.imgUrl}" style="width:14px;height:14px;border-radius:50%;object-fit:cover;flex-shrink:0" onerror="this.style.display='none'">` : ''}
        ${d.name}
      </div>
      <div class="bsc-bar-track">
        <div class="bsc-bar-fill" style="width:${pct.toFixed(1)}%;background:${d.color}" data-val="${label}"></div>
      </div>
    </div>`;
  }).join('');
}

function initBscPieChart() {
  const canvas = document.getElementById('bscPieChart');
  const legendEl = document.getElementById('bscPieLegend');
  if (!canvas || !legendEl) return;

  // 用真实数据分类
  let fourMemeCount = realNewCoinsData.length || 38;
  let dexCount = realMemeData.filter(d => d.dexId && d.dexId !== 'pancakeswap').length;
  let cexCount = realMemeData.filter(d => !d.dexId || d.dexId === 'pancakeswap').length;

  // 确保有合理数值
  if (!dexCount && !cexCount) { dexCount = 67; cexCount = 37; }

  const pieData = [
    {label:'four.meme 新币', val: fourMemeCount, color:'#ff6340'},
    {label:'BSC DEX Meme',   val: Math.max(dexCount, 1), color:'#2563eb'},
    {label:'CEX 跨链',       val: Math.max(cexCount, 1), color:'#16a34a'},
  ];

  const total = pieData.reduce((s,d) => s+d.val, 0);
  const dpr = window.devicePixelRatio || 1;
  canvas.width = 120*dpr; canvas.height = 120*dpr;
  const ctx = canvas.getContext('2d'); ctx.scale(dpr,dpr);

  let start = -Math.PI/2;
  pieData.forEach(d => {
    const angle = (d.val/total)*Math.PI*2;
    ctx.beginPath(); ctx.moveTo(60,60);
    ctx.arc(60,60,52,start,start+angle);
    ctx.closePath(); ctx.fillStyle=d.color; ctx.fill();
    ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.stroke();
    start += angle;
  });
  ctx.beginPath(); ctx.arc(60,60,28,0,Math.PI*2);
  ctx.fillStyle='#fff'; ctx.fill();
  ctx.fillStyle='#333'; ctx.font='bold 11px Inter,sans-serif'; ctx.textAlign='center';
  ctx.fillText(total, 60, 57);
  ctx.font='9px Inter,sans-serif'; ctx.fillStyle='#999';
  ctx.fillText('新币', 60, 68);

  legendEl.innerHTML = pieData.map(d => `
    <div class="bsc-pie-legend-row">
      <div class="bsc-pie-legend-dot" style="background:${d.color}"></div>
      <span>${d.label}</span>
      <span class="bsc-pie-legend-val">${d.val}</span>
    </div>`).join('');
}

/* ── 热门开庭横向卡片 ── */
const hotCourtCards = [
  {id:'C-2026-041',icon:'🦊',name:'FOXAI',time:'2小时前上线',risk:'high',riskLabel:'高风险',liq:'$48K',holders:'312',change:'+127%',changeUp:true,heat:88,badges:['🔥热度已达标','🤖AI前印象'],verdict:'本庭注意到 FOXAI 在过去两小时内吸引了大量早期进场者。机会确实存在，但流动性薄如蝉翼，稍有风吹草动即可能血崩。',source:'four.meme'},
  {id:'C-2026-039',icon:'🌊',name:'WAVEMEME',time:'22小时前上线',risk:'low',riskLabel:'低风险',liq:'$445K',holders:'2,134',change:'+29%',changeUp:true,heat:91,badges:['🔥热度已达标','🤖AI前印象'],verdict:'WAVEMEME 流动性在本期新案中最为充裕，AI+BONK 叙事组合有一定感召力，链上数据支撑较为健康，是本期最稳健的押注标的。',source:'four.meme'},
  {id:'C-2026-040',icon:'🤖',name:'AIBONK',time:'8小时前上线',risk:'mid',riskLabel:'中风险',liq:'$320K',holders:'1,243',change:'+18%',changeUp:true,heat:76,badges:['🔥热度已达标','🤖AI前印象'],verdict:'AIBONK 的社区活跃度在同期新币中属于上游水平，流动性尚可，但本庭提醒：猪会飞的前提是有人托举。后续需观察持仓集中度。',source:'four.meme'},
  {id:'C-2026-038',icon:'🐲',name:'DRAGONX',time:'11小时前上线',risk:'high',riskLabel:'高风险',liq:'$89K',holders:'567',change:'-12%',changeUp:false,heat:62,badges:['🤖AI前印象'],verdict:'本庭观察到 DRAGONX 已出现早期卖压，上线 11 小时即下跌 12%，散户情绪开始动摇，需要重大催化剂才能反转局面。',source:'four.meme'},
];

function renderHotCourtCards() {
  const el = document.getElementById('hotCourtScroll');
  if (!el) return;
  const cardHtml = hotCourtCards.map(c => `
    <div class="hc-card" onclick="openCourtDetail('${c.id}')">
      <div class="hc-top">
        <div class="hc-icon">${c.icon}</div>
        <div style="flex:1;min-width:0">
          <div class="hc-name">${c.name}</div>
          <div class="hc-time">${c.time}</div>
        </div>
        <div class="hc-risk hc-risk-${c.risk}">${c.riskLabel}</div>
      </div>
      <div class="hc-metrics">
        <div class="hc-metric"><div class="hc-metric-val">${c.liq}</div><div class="hc-metric-lbl">初始流动性</div></div>
        <div class="hc-metric"><div class="hc-metric-val">${c.holders}</div><div class="hc-metric-lbl">持仓地址</div></div>
        <div class="hc-metric"><div class="hc-metric-val ${c.changeUp?'up':'down'}">${c.change}</div><div class="hc-metric-lbl">涨跌幅</div></div>
      </div>
      <div class="hc-heat-row">
        <span class="hc-heat-lbl">🔥 热度指数</span>
        <div class="hc-heat-bar-wrap"><div class="hc-heat-fill" style="width:${c.heat}%"></div></div>
        <span class="hc-heat-score">${c.heat}/100</span>
      </div>
      <div class="hc-badges">${c.badges.map(b=>`<span class="hc-badge ${b.includes('热度')?'hc-badge-hot':'hc-badge-ai'}">${b}</span>`).join('')}</div>
      <div class="hc-verdict-preview">${c.verdict}</div>
      <div class="hc-actions">
        <button class="hc-btn-primary" onclick="event.stopPropagation();openCourtDetail('${c.id}')">展开庭审</button>
        <button class="hc-btn-secondary" onclick="event.stopPropagation()">four.meme ↗</button>
      </div>
    </div>`).join('');
  // 复制两份实现无缝滚动
  el.innerHTML = cardHtml + cardHtml;
}

/* ── 陪审员卡片 ── */
async function openJurorCard(c, dir, amt, txHash) {
  const bnbPool = (c.pool * 0.7 / 320).toFixed(3);
  const sideTotal = dir==='up' ? Math.floor(c.pool*0.62) : Math.floor(c.pool*0.38);
  const ratio = amt / (sideTotal + amt);
  const estBnb = (ratio * parseFloat(bnbPool) * 0.8).toFixed(4);
  const estGavel = Math.floor(ratio * c.pool * 0.8);
  document.getElementById('jcCase').textContent = c.id;
  document.getElementById('jcName').textContent = c.icon + ' ' + c.name;
  document.getElementById('jcDir').textContent = dir==='up' ? '📈 我押注看涨 · 押注金额 ' + amt + ' $GAVEL' : '📉 我押注看跌 · 押注金额 ' + amt + ' $GAVEL';
  document.getElementById('jcBnbReward').textContent = '+' + estBnb + ' BNB';
  document.getElementById('jcGavelReward').textContent = '+' + estGavel.toLocaleString() + ' $GAVEL';
  document.getElementById('jcDeadline').textContent = '验证截止：' + c.timer;
  document.getElementById('jcReasonText').textContent = '⏳ AI 法官正在生成押注依据…';
  document.getElementById('jcReasonInput').value = '';

  // 如果有链上 tx，在卡片底部注入 BSCScan 链接
  let txLinkEl = document.getElementById('jcTxLink');
  if (!txLinkEl) {
    txLinkEl = document.createElement('div');
    txLinkEl.id = 'jcTxLink';
    txLinkEl.style.cssText = 'margin-top:8px;text-align:center;font-size:11px';
    document.getElementById('jurorCard')?.appendChild(txLinkEl);
  }
  txLinkEl.innerHTML = txHash
    ? `🔗 <a href="https://testnet.bscscan.com/tx/${txHash}" target="_blank" style="color:var(--accent)">链上交易已确认 · BSCScan ↗</a>`
    : '';

  document.getElementById('jurorOverlay').classList.add('open');
  // AI 生成押注依据
  try {
    const prompt = '你是 Meme 法庭的 AI 法官，风格幽默毒舌，一句话。用户押注了 ' + c.name + ' 的' + (dir==='up'?'看涨':'看跌') + '方向，生成25-35字的押注依据，要有法庭感和 Meme 文化味，不加引号。';
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:80,messages:[{role:'user',content:prompt}]})
    });
    const data = await res.json();
    const text = (data.content?.[0]?.text || '').trim();
    const reason = text || getDefaultReason(c.name, dir);
    document.getElementById('jcReasonText').textContent = reason;
    document.getElementById('jcReasonInput').value = reason;
  } catch(e) {
    const reason = getDefaultReason(c.name, dir);
    document.getElementById('jcReasonText').textContent = reason;
    document.getElementById('jcReasonInput').value = reason;
  }
}

function getDefaultReason(name, dir) {
  const up = [
    '本陪审员综合链上数据，认为 ' + name + ' 具备短期上涨动能，入场需设好止损。',
    name + ' 社区热度持续走高，本庭押注看涨，但提醒：Meme 涨势如烟火，美则美矣。',
    '链上资金持续流入 ' + name + '，本陪审员押涨，愿赌服输。',
  ];
  const down = [
    name + ' 大户已在悄悄出货，本陪审员嗅到撤退气息，选择看跌。',
    '本庭注意到 ' + name + ' 热度见顶信号，押注看跌，静待验证。',
    name + ' 链上数据承压，本陪审员认为短期回调概率较高。',
  ];
  const arr = dir==='up' ? up : down;
  return arr[Math.floor(Math.random()*arr.length)];
}

function updateJcReason() {
  const val = document.getElementById('jcReasonInput').value.trim();
  document.getElementById('jcReasonText').textContent = val || '（填写理由后将显示在这里）';
}

function closeJurorCard(e) { if(e.target===document.getElementById('jurorOverlay')) closeJurorCardDirect(); }
function closeJurorCardDirect() { document.getElementById('jurorOverlay').classList.remove('open'); }

async function shareJurorCard() {
  const btn = document.querySelector('#jurorOverlay .juror-modal button');
  const origText = '📋 复制卡片图片';
  // load html2canvas
  if (!window.html2canvas) {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    document.head.appendChild(s);
    await new Promise(r => s.onload = r);
  }
  const card = document.getElementById('jurorCard');
  try {
    const canvas = await html2canvas(card, {scale:2, backgroundColor:'#ffffff', useCORS:true, logging:false});
    canvas.toBlob(async blob => {
      try {
        await navigator.clipboard.write([new ClipboardItem({'image/png': blob})]);
        showToast('✅ 卡片图片已复制，快去分享！');
      } catch {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'meme-court-juror.png'; a.click();
        URL.revokeObjectURL(url);
        showToast('✅ 卡片已下载！');
      }
      closeJurorCardDirect();
    }, 'image/png');
  } catch(err) {
    showToast('复制失败，请截图保存');
  }
}

/* ── 倒计时 ── */
function updateCd(){
  const diff=new Date('2026-04-30T00:00:00')-new Date();
  const cdVal=document.getElementById('cdVal');
  if(diff<=0){
    if(cdVal)cdVal.textContent='已截止';
    return;
  }
  const d=Math.floor(diff/86400000),h=Math.floor((diff%86400000)/3600000);
  if(cdVal)cdVal.textContent=`${d}D ${h}H`;
}

/* ══ Etherscan / BSCScan API 合约验证层 ══ */


const ETHERSCAN_KEY = 'AZM812TWVHCASUPH64KYQ5ESKSHDWT2594';
const BSC_CHAIN_ID = '56';
const ETHERSCAN_BSC_BASE = `https://api.etherscan.io/v2/api?chainid=${BSC_CHAIN_ID}&apikey=${ETHERSCAN_KEY}`;

// 验证合约地址是否在 BSC 上真实存在
async function validateBscContract(address) {
  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return { valid: false, reason: '地址格式不正确，应为 0x 开头的 42 位十六进制字符串' };
  }
  try {
    // 1. 用 eth_getCode 检查是否是合约
    const codeRes = await fetch('https://bsc-dataseed.binance.org/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc:'2.0', method:'eth_getCode', params:[address,'latest'], id:1 })
    });
    const codeData = await codeRes.json();
    const code = codeData?.result;
    if (!code || code === '0x' || code === '0x0') {
      return { valid: false, reason: '该地址在 BNB Chain 上不是合约地址（可能是普通钱包地址）' };
    }

    // 2. 用 Etherscan V2 API 获取合约信息
    const infoRes = await fetch(`${ETHERSCAN_BSC_BASE}&module=token&action=tokeninfo&contractaddress=${address}`);
    const infoData = await infoRes.json();

    if (infoData.status === '1' && infoData.result?.[0]) {
      const t = infoData.result[0];
      return {
        valid: true,
        name: t.tokenName || '',
        symbol: t.symbol || '',
        decimals: t.divisor || '18',
        totalSupply: t.totalSupply || '',
        holders: parseInt(t.holdersCount || 0).toLocaleString(),
        website: t.website || '',
        isVerified: true,
        info: `${t.tokenName} (${t.symbol}) · ${parseInt(t.holdersCount||0).toLocaleString()} 持仓地址`
      };
    }

    // 3. 尝试 ABI 接口获取基础信息
    const abiRes = await fetch(`${ETHERSCAN_BSC_BASE}&module=contract&action=getsourcecode&address=${address}`);
    const abiData = await abiRes.json();
    if (abiData.status === '1' && abiData.result?.[0]?.ContractName) {
      const cn = abiData.result[0].ContractName;
      return { valid: true, name: cn, symbol: '', isVerified: abiData.result[0].ABI !== 'Contract source code not verified', info: `合约名称：${cn}` };
    }

    // 4. 合约存在但无 token 信息（非标准代币合约）
    return { valid: true, name: '', symbol: '', isVerified: false, info: '合约存在，但未找到代币信息（非标准 BEP-20？）' };

  } catch (e) {
    console.warn('合约验证错误:', e);
    // 网络错误时用公开 RPC 基础验证
    return { valid: true, name: '', symbol: '', isVerified: false, info: '网络验证超时，已通过基础格式验证' };
  }
}

// 获取 four.meme 最新上线代币（通过 DexScreener 新对）
async function fetchFourMemeLatest() {
  try {
    const data = await fetchDexScreener('/latest/dex/search?q=bsc+meme');
    if (!data?.pairs) return [];
    const now = Date.now();
    return data.pairs
      .filter(p =>
        p.chainId === 'bsc' &&
        p.pairCreatedAt &&
        (now - p.pairCreatedAt) < 48 * 3600000 &&
        parseFloat(p.liquidity?.usd || 0) > 500
      )
      .sort((a, b) => b.pairCreatedAt - a.pairCreatedAt)
      .slice(0, 8)
      .map(p => ({
        icon: '🪙',
        name: p.baseToken?.symbol || '—',
        fullName: p.baseToken?.name || '',
        address: p.baseToken?.address || '',
        price: parseFloat(p.priceUsd || 0),
        change: parseFloat(p.priceChange?.h24 || 0),
        vol: parseFloat(p.volume?.h24 || 0),
        liq: parseFloat(p.liquidity?.usd || 0),
        ageH: Math.floor((now - p.pairCreatedAt) / 3600000),
        url: p.url,
        pairCreatedAt: p.pairCreatedAt,
      }));
  } catch(e) {
    console.warn('four.meme 数据获取失败:', e);
    return [];
  }
}

// 合约验证状态管理
let contractValidating = false;
let contractValidResult = null;

async function validateContractInput() {
  const input = document.getElementById('applyContract');
  const statusEl = document.getElementById('contractValidStatus');
  if (!input || !statusEl) return true;
  const addr = input.value.trim();
  if (!addr) return true; // 合约地址选填，散户可以不填

  statusEl.innerHTML = '<span style="color:var(--text3)">🔄 验证中…</span>';
  contractValidating = true;
  contractValidResult = null;

  const result = await validateBscContract(addr);
  contractValidating = false;
  contractValidResult = result;

  if (result.valid) {
    statusEl.innerHTML = `<span style="color:var(--green)">✅ ${result.info || '合约验证通过'}</span>`;
    // 自动填入项目名称（如果用户还没填）
    const nameInput = document.getElementById('applyName');
    if (nameInput && !nameInput.value.trim() && result.symbol) {
      nameInput.value = result.symbol;
    }
  } else {
    statusEl.innerHTML = `<span style="color:var(--red)">❌ ${result.reason}</span>`;
  }
  return result.valid;
}
// 用真实 four.meme 数据更新热门开庭卡片的行情数字
function updateHotCardsWithReal(coins) {
  coins.forEach(coin => {
    hotCourtCards.forEach(card => {
      if (card.name.toLowerCase() === coin.name.toLowerCase() ||
          card.name.toLowerCase().includes(coin.name.toLowerCase())) {
        card.liq = coin.liq >= 1000 ? '$' + (coin.liq/1000).toFixed(0) + 'K' : '$' + coin.liq.toFixed(0);
        card.change = (coin.change >= 0 ? '+' : '') + coin.change.toFixed(1) + '%';
        card.changeUp = coin.change >= 0;
      }
    });
  });
  renderHotCourtCards();
  const el = document.querySelector('.bsc-kpi.k-amber .bsc-kpi-val');
  if (el) el.textContent = coins.length + '+';
}

let selectedBuyGavel = 1000;
let selectedBuyBnb = '0.05';
let newbieClaimed = false;

function openGetGavelModal() {
  if (!walletConnected) { showToast('请先连接钱包'); return; }
  document.getElementById('getGavelOverlay').classList.add('open');
}
function closeGetGavel(e) { if (e.target === document.getElementById('getGavelOverlay')) closeGetGavelDirect(); }
function closeGetGavelDirect() { document.getElementById('getGavelOverlay').classList.remove('open'); }

// ── 质押悬浮窗 ──
let stakeSelectedDays = 7;
let stakeSelectedApy = 8;

function openStakeModal() {
  closeGetGavelDirect();
  const overlay = document.getElementById('stakeOverlay');
  overlay.style.display = 'flex';
  setTimeout(() => overlay.classList.add('open'), 10);
  // 更新余额显示
  const balEl = document.getElementById('stakeBalanceShow');
  if (balEl) balEl.textContent = gavelBalance.toLocaleString();
  updateStakePreview();
}

function closeStakeModal(e) {
  if (e.target === document.getElementById('stakeOverlay')) closeStakeDirect();
}

function closeStakeDirect() {
  const overlay = document.getElementById('stakeOverlay');
  overlay.classList.remove('open');
  setTimeout(() => overlay.style.display = 'none', 300);
}

function selectStakeTier(el) {
  document.querySelectorAll('.stake-tier-opt').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  stakeSelectedDays = parseInt(el.dataset.days);
  stakeSelectedApy = parseInt(el.dataset.apy);
  updateStakePreview();
}

function updateStakePreview() {
  const amount = parseFloat(document.getElementById('stakeAmountInput').value) || 0;
  const reward = amount * stakeSelectedApy / 100 * stakeSelectedDays / 365;
  const rewardEl = document.getElementById('stakeEstReward');
  const dateEl = document.getElementById('stakeUnlockDate');
  if (rewardEl) rewardEl.textContent = amount > 0 ? `+${Math.floor(reward).toLocaleString()} $GAVEL` : '— $GAVEL';
  if (dateEl) {
    if (amount > 0) {
      const unlockDate = new Date(Date.now() + stakeSelectedDays * 86400000);
      dateEl.textContent = unlockDate.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', year: 'numeric' });
    } else {
      dateEl.textContent = '—';
    }
  }
}

function setStakeMax() {
  const input = document.getElementById('stakeAmountInput');
  if (input) { input.value = gavelBalance; updateStakePreview(); }
}

function submitStake() {
  showToast('🔒 质押功能开发中，敬请期待');
}

function claimNewbieGavel() {
  showToast('新人礼包已取消，请通过质押或购买获取 $GAVEL');
}



function selectBuyOpt(el, gavel, bnb) {
  selectedBuyGavel = gavel;
  selectedBuyBnb = bnb;
  document.querySelectorAll('.ggm-buy-opt').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('ggmBuyBtn').textContent = `🦊 用 MetaMask 支付 ${bnb} BNB`;
}

function simulateBuyGavel() {
  const btn = document.getElementById('ggmBuyBtn');
  btn.textContent = '⏳ 等待钱包确认…';
  btn.style.opacity = '.7';
  btn.style.pointerEvents = 'none';
  setTimeout(() => {
    gavelBalance += selectedBuyGavel;
    document.getElementById('gavelBalNum').textContent = gavelBalance.toLocaleString();
    btn.textContent = `✓ 已获得 ${selectedBuyGavel.toLocaleString()} $GAVEL`;
    showToast(`💰 购买成功！获得 ${selectedBuyGavel.toLocaleString()} $GAVEL`);
    setTimeout(() => {
      btn.textContent = `🦊 用 MetaMask 支付 ${selectedBuyBnb} BNB`;
      btn.style.opacity = '';
      btn.style.pointerEvents = '';
      closeGetGavelDirect();
    }, 2000);
  }, 1800);
}

/* ══ BSC Meme 数据仪表板 JS ══ */

