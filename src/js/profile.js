// Meme Court - Profile & Bet Records
// User betting history, rewards, stats


/* ══ 「我的」页面 JS ══ */


// 模拟押注记录
/* ══ 真实押注记录系统 ══ */


// 从 localStorage 读取押注记录
function loadBetRecords() {
  try {
    const raw = localStorage.getItem('memecourt_bets_' + (walletAddress || 'anon'));
    return raw ? JSON.parse(raw) : [];
  } catch(e) { return []; }
}

// 写入一条押注记录
function saveBetRecord(record) {
  try {
    const records = loadBetRecords();
    records.unshift(record); // 最新的排最前
    localStorage.setItem('memecourt_bets_' + walletAddress, JSON.stringify(records.slice(0, 50)));
  } catch(e) {}
}

// 从 localStorage 读取收益历史
function loadGavelHistory() {
  try {
    const raw = localStorage.getItem('memecourt_history_' + (walletAddress || 'anon'));
    return raw ? JSON.parse(raw) : [];
  } catch(e) { return []; }
}

// 写入一条收益历史
function saveGavelHistory(record) {
  try {
    const history = loadGavelHistory();
    history.unshift(record);
    localStorage.setItem('memecourt_history_' + walletAddress, JSON.stringify(history.slice(0, 100)));
  } catch(e) {}
}

const iconMap = {win:'gh-icon-win', vote:'gh-icon-vote', invite:'gh-icon-invite', lose:'gh-icon-lose', newbie:'gh-icon-vote'};

function renderProfilePage() {
  if (!walletConnected) return;

  document.getElementById('profileEmpty').style.display = 'none';
  document.getElementById('profileContent').style.display = 'block';

  // 地址
  document.getElementById('profileAddr').textContent = walletAddress;
  const bal = gavelBalance;
  document.getElementById('profileGavelBal').textContent = bal.toLocaleString();

  // BNB 余额
  const bnbEl = document.getElementById('profileBnbBal');
  if (bnbEl) bnbEl.textContent = walletBnbBalance.toFixed(4);
  if (walletAddress && window.ethereum) {
    fetchBnbBalance(walletAddress).then(bnb => {
      walletBnbBalance = bnb;
      if (bnbEl) bnbEl.textContent = bnb.toFixed(4);
    });
    fetchRealGavelBalance(walletAddress).then(g => {
      if (g > 0) {
        gavelBalance = Math.floor(g);
        document.getElementById('profileGavelBal').textContent = gavelBalance.toLocaleString();
        const gn = document.getElementById('gavelBalNum');
        if (gn) gn.textContent = gavelBalance.toLocaleString();
      }
    });
  }

  // 等级徽标
  let tierName = '未达等级';
  if (bal >= 2000) tierName = '👑 首席陪审员';
  else if (bal >= 500) tierName = '🔵 资深陪审员';
  else if (bal >= 100) tierName = '⚖️ 陪审员';
  const tb = document.getElementById('profileTierBadge');
  if (tb) tb.innerHTML = `<span style="width:5px;height:5px;border-radius:50%;background:#e8571a;display:inline-block"></span>${tierName}`;

  // 押注记录统计
  const betRecords = loadBetRecords();
  const wins = betRecords.filter(r => r.status === 'win').length;
  const loses = betRecords.filter(r => r.status === 'lose').length;
  const settled = wins + loses;
  const winRate = settled > 0 ? Math.round(wins / settled * 100) : null;
  const betCountEl = document.getElementById('profileBetCount');
  if (betCountEl) betCountEl.textContent = betRecords.length || '—';
  const winRateEl = document.getElementById('profileWinRate');
  if (winRateEl) winRateEl.textContent = winRate !== null ? winRate + '%' : '—';

  // 累计获得 $GAVEL
  const gavelHistory = loadGavelHistory();
  const totalEarned = gavelHistory.filter(h => h.positive).reduce((s, h) => s + (h.rawAmount || 0), 0);
  const earnedEl = document.getElementById('profileTotalEarned');
  if (earnedEl) earnedEl.textContent = totalEarned > 0 ? totalEarned.toLocaleString() : '—';

  // 今日变动
  const todayChange = gavelHistory.filter(h => h.positive && h.date === new Date().toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit'}))
    .reduce((s, h) => s + (h.rawAmount || 0), 0);
  const todayEl = document.getElementById('profileTodayChange');
  const todayDescEl = document.getElementById('profileTodayDesc');
  if (todayEl) todayEl.textContent = todayChange > 0 ? `今日 +${todayChange}` : '今日 +0';
  if (todayDescEl) todayDescEl.textContent = totalEarned > 0 ? '累计收益已入账' : '暂无变动';

  // $GAVEL 等级进度卡
  document.getElementById('gpcBalance').textContent = bal.toLocaleString();
  let curFloor=0, nextFloor=100, nextName='陪审员', tierLabel='未达等级', perks=[];
  if(bal>=2000){curFloor=2000;nextFloor=2000;nextName='已达顶级';tierLabel='👑 首席陪审员';
    perks=[{icon:'👑',text:'全部权益 + 投票权重 3x',active:true},{icon:'📋',text:'提名候审项目',active:true},{icon:'💰',text:'押注手续费减免 50%',active:true}];
  } else if(bal>=500){curFloor=500;nextFloor=2000;nextName='首席陪审员';tierLabel='🔵 资深陪审员';
    perks=[{icon:'🐳',text:'巨鲸地址明细追踪',active:true},{icon:'⚡',text:'投票权重 2x',active:true},{icon:'🔔',text:'新币预警优先推送',active:true},{icon:'👑',text:'首席：持有 2000+ 解锁',active:false}];
  } else if(bal>=100){curFloor=100;nextFloor=500;nextName='资深陪审员';tierLabel='⚖️ 陪审员';
    perks=[{icon:'📄',text:'AI 法官完整深度报告',active:true},{icon:'⚡',text:'投票权重 1.5x',active:true},{icon:'🐳',text:'资深：持有 500+ 解锁',active:false}];
  } else {curFloor=0;nextFloor=100;nextName='陪审员';tierLabel='未达等级';
    perks=[{icon:'📄',text:'陪审员：持有 100+ 解锁',active:false},{icon:'🐳',text:'资深：持有 500+ 解锁',active:false},{icon:'👑',text:'首席：持有 2000+ 解锁',active:false}];
  }
  document.getElementById('gpcTier').textContent = tierLabel;
  const progress = nextFloor===curFloor ? 100 : Math.min(100,Math.round((bal-curFloor)/(nextFloor-curFloor)*100));
  document.getElementById('gpcCurLabel').textContent = curFloor.toLocaleString();
  document.getElementById('gpcNextLabel').textContent = nextFloor===curFloor ? '已满级' : nextFloor.toLocaleString();
  document.getElementById('gpcProgressFill').style.width = progress + '%';
  document.getElementById('gpcNextDesc').textContent = nextFloor===curFloor ? '你已达到最高等级' : `再持有 ${(nextFloor-bal).toLocaleString()} $GAVEL 解锁${nextName}`;
  document.getElementById('gpcPerks').innerHTML = perks.map(p=>`
    <div class="gpc-perk ${p.active?'active':''}">
      <span class="gpc-perk-icon">${p.icon}</span>${p.text}
    </div>`).join('');

  // 战绩卡
  const rankBadgeEl = document.getElementById('verdictRankBadge');
  if (rankBadgeEl) rankBadgeEl.textContent = '⚖ ' + (tierName === '未达等级' ? '新晋陪审员' : tierName.replace(/[👑🔵⚖️]/g,'').trim());
  const wrEl = document.getElementById('verdictWinRate');
  if (wrEl) wrEl.innerHTML = (winRate !== null ? winRate : '—') + '<span style="font-size:16px;color:#c4c4be;font-weight:500">%</span>';
  const wdEl = document.getElementById('verdictWinDesc');
  if (wdEl) wdEl.textContent = `胜率 · ${wins} 胜 / ${settled} 场`;
  const winsEl = document.getElementById('verdictWins');
  if (winsEl) winsEl.textContent = wins;
  const losesEl = document.getElementById('verdictLoses');
  if (losesEl) losesEl.textContent = loses;

  // 连胜计算
  let streak = 0;
  for (let i = betRecords.length - 1; i >= 0; i--) {
    if (betRecords[i].status === 'win') streak++;
    else if (betRecords[i].status === 'lose') break;
  }
  const streakEl = document.getElementById('verdictStreak');
  if (streakEl) streakEl.textContent = streak;
  const streakBar = document.getElementById('streakBar');
  const streakText = document.getElementById('streakText');
  if (streakBar && streak >= 2) {
    streakBar.style.display = 'flex';
    streakText.textContent = `当前 ${streak} 连胜`;
  } else if (streakBar) {
    streakBar.style.display = 'none';
  }

  // 押注方块
  const blocksEl = document.getElementById('verdictBlocks');
  if (blocksEl) {
    const recent = betRecords.slice(-20);
    blocksEl.innerHTML = recent.map(r => {
      const cls = r.status === 'win' ? 'w' : r.status === 'lose' ? 'l' : 'p';
      const bg = cls === 'w' ? 'background:#bbf7d0;border:1px solid #86efac' : cls === 'l' ? 'background:#fecaca;border:1px solid #fca5a5' : 'background:#fde68a;border:1px solid #fcd34d';
      return `<div style="width:14px;height:14px;border-radius:3px;flex-shrink:0;${bg}" title="${r.coin} ${r.dirLabel}"></div>`;
    }).join('');
    if (recent.length === 0) blocksEl.innerHTML = '<div style="font-size:10px;color:#c4c4be">暂无押注记录</div>';
  }

  // 收益流水
  document.getElementById('historyCount').textContent = gavelHistory.length > 0 ? gavelHistory.length + ' 条' : '暂无';
  renderFlowList('all');
}

function renderFlowList(filter) {
  const gavelHistory = loadGavelHistory();
  const iconMap = { win:'gh-icon-win', vote:'gh-icon-vote', invite:'gh-icon-invite', lose:'gh-icon-lose', court:'gh-icon-vote' };
  const filtered = filter === 'all' ? gavelHistory :
    filter === 'bet' ? gavelHistory.filter(h => h.type === 'win' || h.type === 'lose' || h.title?.includes('押注')) :
    gavelHistory.filter(h => h.type !== 'win' && h.type !== 'lose' && !h.title?.includes('押注'));

  if (filtered.length === 0) {
    document.getElementById('gavelHistoryList').innerHTML = `
      <div style="padding:40px 20px;text-align:center;color:var(--text3)">
        <div style="font-size:28px;margin-bottom:10px">💰</div>
        <div style="font-size:13px;font-weight:600;margin-bottom:5px">暂无记录</div>
        <div style="font-size:11px">押注获胜、投票奖励将显示在这里</div>
      </div>`;
    return;
  }

  document.getElementById('gavelHistoryList').innerHTML = filtered.map(h => {
    const isPos = h.positive;
    const amtColor = isPos ? '#16a34a' : '#dc2626';
    const iconBg = isPos ? '#f0faf5' : '#fef2f2';
    return `<div style="display:flex;align-items:center;gap:10px;padding:11px 18px;border-bottom:0.5px solid #f7f6f3;cursor:pointer;transition:background .1s" onmouseover="this.style.background='#faf9f7'" onmouseout="this.style.background=''">
      <div style="width:30px;height:30px;border-radius:8px;background:${iconBg};display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">${h.icon}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:500;color:#1a1a18">${h.title}</div>
        <div style="font-size:10px;color:#c4c4be;margin-top:2px">${h.sub}</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:12px;font-weight:600;font-family:monospace;color:${amtColor}">${h.amount} $GAVEL</div>
        <div style="font-size:9px;color:#c4c4be;margin-top:2px">${h.date}</div>
      </div>
    </div>`;
  }).join('');
}

function switchFlowTab(filter, btn) {
  document.querySelectorAll('.flow-tab-btn').forEach(b => {
    b.style.background = 'transparent';
    b.style.color = '#a8a8a4';
    b.style.boxShadow = 'none';
  });
  btn.style.background = '#fff';
  btn.style.color = '#1a1a18';
  btn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
  renderFlowList(filter);
}

/* ── 档案抽屉 ── */
function openDrawer(){
  document.getElementById('archiveDrawer').classList.add('open');
  document.getElementById('drawerOverlay').classList.add('open');
  document.getElementById('archiveTrigger').style.display='none';
}
function closeDrawer(){
  document.getElementById('archiveDrawer').classList.remove('open');
  document.getElementById('drawerOverlay').classList.remove('open');
  document.getElementById('archiveTrigger').style.display='';
}

/* ── 落地页动画 ── */
function initLandingAnimations(){
  // 用 transform 而非 opacity，内容始终可见
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        // 结算赢家 stagger
        if (e.target.classList.contains('landing-visual')) {
          const winners = e.target.querySelectorAll('.saw-winner');
          winners.forEach((w, i) => {
            setTimeout(() => w.classList.add('show'), 300 + i * 180);
          });
        }
      }
    });
  }, {threshold: 0.12, rootMargin: '0px 0px -40px 0px'});

  // 观察所有 landing-text 和 landing-visual
  document.querySelectorAll('.landing-text, .landing-visual').forEach(el => {
    obs.observe(el);
    // 页面加载时已在视口内的直接触发
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight - 60) {
      el.classList.add('in-view');
      el.querySelectorAll('.saw-winner').forEach((w, i) => {
        setTimeout(() => w.classList.add('show'), 200 + i * 180);
      });
    }
  });

  // 档位轮播
  let tierIdx = 0;
  function rotateTier() {
    document.querySelectorAll('.cta-tier').forEach((el, i) => {
      el.classList.toggle('active', i === tierIdx);
    });
    tierIdx = (tierIdx + 1) % 3;
  }
  rotateTier();
  setInterval(rotateTier, 1800);

  // 押注方向交替脉冲
  let betUp = true;
  function pulseBet() {
    const up = document.getElementById('badUp');
    const dn = document.getElementById('badDown');
    if (!up || !dn) return;
    up.classList.remove('pulse-up', 'pulse-down');
    dn.classList.remove('pulse-up', 'pulse-down');
    if (betUp) up.classList.add('pulse-up');
    else dn.classList.add('pulse-down');
    betUp = !betUp;
  }
  pulseBet();
  setInterval(pulseBet, 2200);
}

function animateCount(el,from,to,duration){
  const start=performance.now();
  function step(now){
    const p=Math.min((now-start)/duration,1);
    const ease=1-Math.pow(1-p,3);
    el.textContent=Math.floor(from+(to-from)*ease).toLocaleString();
    if(p<1)requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
