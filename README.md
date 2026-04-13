# ⚖️ Meme 法庭 · Meme Court

**链上 Meme 势力裁决所** — BNB Chain 上的 AI 裁判 + 社区押注平台（始终优先围绕 four.meme 进行生态打造）

🌐 **Live Demo**: https://zfu9751-a11y.github.io/meme-court/

---

## 今天你开庭了吗？

Meme 市场每天有几百个新币发射，没有人知道该信谁。  
Meme 法庭让 AI 法官来裁决——链上数据是证据，社区押注是陪审团。

---

## 核心功能

- **AI 法官「链上包公」** — 综合 DexScreener + Etherscan 真实链上数据，输出 BULLISH / BEARISH 裁定，裁定摘要哈希同步写入链上，不可篡改
- **双轨押注（链上真实交互）** — 用 BNB 或 $GAVEL 押注看涨/看跌，两步链上调用（approve + betWithGavel），胜方瓜分奖池，全程 BSCScan 可查
- **开庭广场** — 项目方支付 BNB 开庭费，AI 自动分析，社区参与裁决
- **$GAVEL 代币** — BEP-20，持有量决定陪审员等级和权益
- **Meme 雷达** — BSC 实时行情，押注战况可视化
- **🥊 打脸记录** — AI 法官历史裁错案例（LUNA 归零、SQUID 跑路、PEPE 涨 7000%），一键生成可分享的打脸 Meme 卡片

---

## 技术架构

| 层 | 技术 |
| --- | --- |
| 前端 | 原生 HTML/CSS/JS，零依赖单文件 |
| AI 引擎 | DeepSeek Chat API（链上包公主力引擎） |
| 智能合约 | Solidity 0.8.19，BSC Testnet |
| 链上数据 | DexScreener API + Etherscan V2 API |
| 钱包 | MetaMask 原生集成（window.ethereum，无 ethers.js 依赖） |
| 链上押注 | 手动 ABI 编码，approve + betWithGavel 两步调用 |
| 裁定存证 | AI 裁定哈希以 input data 形式写入链上，BSCScan 可验证 |

---

## 合约地址（BSC Testnet）

- **GavelToken**: `0x5f9D91603accD8aA5a3ef73F611e229C463dd702`
- **MemeCourtV1**: `0x9F0081A3E98f30F3B8e1B43FA965F590f23b5906`

---

## 经济模型

### 双轨奖池机制

**BNB 轨道（高价值押注）**

```
项目方开庭费
    ├── 70% → BNB 社区奖池
    └── 30% → 平台收益

用户 BNB 押注 → 全额进入奖池
庭审结束后 → 胜方按押注比例分配全部奖池
```

**$GAVEL 轨道（社区参与押注）**

```
用户 $GAVEL 押注
    ├── 胜方：本金全额返还 + 分得败方奖池 90%
    └── 败方：$GAVEL 全部进入奖池
              └── 平台抽成 10%
              └── 胜方按比例分配 90%
```

### $GAVEL 代币经济

| 指标 | 数值 |
| --- | --- |
| 总量 | 1,000,000,000 GAVEL（固定，不增发） |
| 合约标准 | BEP-20（BNB Smart Chain） |
| 当前阶段 | 平台功能代币（BSC Testnet） |
| 新人礼包 | 500 GAVEL（链上合约发放，每地址限一次） |

### $GAVEL 代币分配

| 分配方向 | 比例 | 数量 | 说明 |
| --- | --- | --- | --- |
| 社区奖励池 | 50% | 500M | 押注奖励 / 陪审员激励 |
| 新人礼包 & 生态推广 | 20% | 200M | claimNewbie 发放 + 活动激励 |
| 团队 & 开发 | 15% | 150M | 12 个月线性解锁 |
| 流动性做市 & CEX 上币 | 10% | 100M | TGE 后启用 |
| Hackathon 奖励 & 早期贡献者 | 5% | 50M | AI Sprint 黑客松期间 |

### 陪审员等级权益

| 等级 | 持有量 | 权益 |
| --- | --- | --- |
| 陪审员 | 100+ | 完整 AI 报告 · 投票权重 1.5x |
| 资深陪审员 | 500+ | 巨鲸地址追踪 · 投票权重 2x · 新币预警 |
| 首席陪审员 | 2000+ | 全部权益 · 投票权重 3x · 提名候审项目 |

---

## 可运行机制

### 完整运行流程

```
1. 项目方申请开庭
   └── 填写合约地址（Etherscan V2 实时验证）
   └── 选择档位：快审 0.1 BNB / 标准 0.5 BNB / 深审 2 BNB
   └── MetaMask 签名 → createCase() 上链 → 记录开庭价 P0

2. 开庭期间
   └── AI 法官自动分析链上数据，生成裁定报告
   └── 裁定摘要哈希写入链上（0x4d454d45 前缀，BSCScan 可查）
   └── 社区用户押注：approve GAVEL → betWithGavel() 两步链上调用
   └── 实时更新押注战况可视化地图

3. 庭审结束
   └── 拉取当前价格 P1
   └── P1 > P0 → 看涨方胜 / P1 < P0 → 看跌方胜
   └── Owner 调用 settle(caseId, result) 上链（V1 过渡方案，见下方说明）
   └── 胜方调用 claimBNB() / claimGavel() 领取奖励

4. 新用户激励
   └── 连接钱包后调用 claimNewbie()
   └── 合约自动转账 500 $GAVEL，每地址限一次
```

### V1 结算透明度说明

当前版本（V1）由平台在庭审结束后调用 `settle()`，以 DexScreener 实时价格为基准（开庭价 vs 结算价）。每次结算均公开上链，全程可在 BSCScan 验证。

**为什么 V1 是中心化结算？** 这是工程权衡：Chainlink Price Feed 集成需要额外的预言机费用和合约升级，我们选择先跑通完整产品闭环，V2 再接入自动化结算。

V2 将接入 Chainlink Price Feed，由合约自动读取价格完成结算，彻底去中心化。

### 三档庭审周期设计

| 档位 | 费用 | 周期 | 适合场景 |
| --- | --- | --- | --- |
| 快审 | 0.1 BNB | 24 小时 | four.meme 新上线代币，快速验证早期走势 |
| 标准审 | 0.5 BNB | 7 天 | 有一定历史数据的 Meme 币，社区参与度验证 |
| 深审 | 2 BNB | 30 天 | 长期持有判断，综合评估项目基本面 |

### AI 裁定数据流

```
输入（真实链上数据）
├── 流动性 (DexScreener)
├── 24h 涨跌幅 / 交易量 (DexScreener)
├── 持仓地址数 (Etherscan V2)
├── 巨鲸动向 (DexScreener txns)
└── 社区押注比例（链上合约数据）
          ↓
   DeepSeek Chat API
          ↓
输出（结构化 JSON）
├── verdict: BULLISH | BEARISH
├── confidence: 0–100
├── risk: 低风险 | 中风险 | 高风险 | 极高风险
├── short: 3-4 句精简裁定（法庭语气）
└── full: 2-3 段详细分析
          ↓
裁定摘要哈希写入链上（BSCScan 可查）
```

---

## 🥊 法官打脸机制

Meme 法庭不掩盖 AI 的错误，反而把它做成内容：

- **打脸记录**：侧边栏展示 AI 历史裁错案例（LUNA 归零、SQUID 跑路、PEPE 涨 7000%）
- **打脸动效**：点开任意打脸记录，法官头像触发抖动动画
- **一键分享**：生成结构化打脸文本，直接发推 / 发群
- **病毒传播**：AI 裁定看跌但实际大涨，反差越大越有传播价值

---

## 未来发展路线图

### V1（当前）— BSC Testnet

- ✅ AI 法官链上数据分析（DeepSeek）
- ✅ 双轨押注真实链上调用（approve + betWithGavel）
- ✅ 裁定哈希链上存证
- ✅ claimNewbie 新人礼包
- ✅ createCase 链上开庭
- ✅ $GAVEL 陪审员等级体系
- ✅ 打脸记录 + 分享 Meme 卡片

### V1.5（2026 Q2）— 主网上线

- 部署至 BSC 主网
- four.meme 毕业新币自动进入候审队列
- 开庭时自动记录 `openingPrice`，结算时链上对比

### V2（2026 Q3）— 去中心化升级

- **Chainlink Price Feed 集成** — 合约自动读取价格，无需 Owner 手动结算
- **AI 裁定上链** — 裁定报告完整哈希写入合约，不可篡改，公开可验证
- **数据 API 开放** — 向第三方提供平台裁定数据和押注行为数据

### V3（2026 Q4）— 生态扩展

- **$GAVEL TGE** — 代币上线交易所，从平台积分升级为可交易资产
- **社区治理** — $GAVEL 持有者投票决定候审案件优先级
- **多链扩展** — 支持 Solana、Base 上的 Meme 币开庭
- **VIP 会员体系** — 订阅制高级功能（深度报告、定制裁定、优先开庭）

---

## 本地运行

```bash
# 下载 index.html 后直接运行
python3 -m http.server 8080
# 访问 http://localhost:8080
```

需要 MetaMask 浏览器扩展，连接到 BSC Testnet（Chain ID: 97）。

获取测试币：https://testnet.bnbchain.org/faucet-smart

---

*four.meme AI Sprint Hackathon 2026 · 仅供娱乐，不构成投资建议*
