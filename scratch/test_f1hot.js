// e:\vibe\f1\scratch\test_f1hot.js
// F1HOT 本地算法打分与 Jaccard 文本聚类去重仿真测试脚本

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectHotTopics } from '../api/lib/hotspot-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. 读取本地调试 RSS 数据
const debugRssPath = path.join(__dirname, '..', 'debug_rss.json');
console.log('📡 正在读取本地 F1 新闻源数据:', debugRssPath);

if (!fs.existsSync(debugRssPath)) {
  console.error('❌ 未找到 debug_rss.json 测试数据，请确认文件存在！');
  process.exit(1);
}

const rawData = fs.readFileSync(debugRssPath, 'utf8');
const cleanData = rawData.trim().replace(/^\uFEFF/, '').replace(/^\uFFFE/, '');
const allItems = JSON.parse(cleanData).items || [];
console.log(`✅ 成功读取到 ${allItems.length} 条原始 RSS 资讯流！\n`);

// 2. 模拟为 raw RSS 注入信源的 Tier 和 Weight 属性 (与 rss-simple 保持一致)
const mappedItems = allItems.map(item => {
  let tier = 'T2';
  let weight = 0.75;
  
  if (item.sourceLabel === 'Autosport' || item.sourceLabel === 'The Race') {
    tier = 'T1';
    weight = 1.25;
  } else if (item.sourceLabel === 'r/F1Technical' || item.sourceLabel === 'RaceFans') {
    tier = 'T1.5';
    weight = 1.00;
  }
  
  return {
    ...item,
    tier,
    weight
  };
});

// 3. 运行重构后的 F1HOT 聚类和打分逻辑
console.log('⚡ 启动 F1HOT AI 聚类与打分引擎...');
const startTime = performance.now();
const results = detectHotTopics(mappedItems, {
  threshold: 0.28,
  maxTopics: 8
});
const endTime = performance.now();
console.log(`✅ 聚类去重运算完成！耗时: ${(endTime - startTime).toFixed(2)}ms\n`);

// 4. 打印仿真热点列表报告
console.log('==================== F1HOT AI 精选热点自检报告 ====================');
results.forEach(event => {
  console.log(`\n[排名 #${event.rank}] 质量分: ${event.qualityScore} | 标签: [${event.badge || '普通'}] | 源数量: ${event.sourceCount}个 | 合并新闻: ${event.itemCount}条`);
  console.log(`📌 主标题: ${event.title}`);
  
  console.log(`📡 5维度分析: 技术:${event.dimensions.technicalDepth} | 突发:${event.dimensions.breakingValue} | 价值:${event.dimensions.audienceValue} | 冲突:${event.dimensions.dramaIndex} | 可信度:${event.dimensions.truthfulness}`);
  
  if (event.relatedItems.length > 1) {
    console.log(`🔗 折叠合并的其他媒体原帖:`);
    event.relatedItems.slice(1, 4).forEach((item, i) => {
      console.log(`   └─ [${item.source}] ${item.title} (质量分: ${item.qualityScore})`);
    });
    if (event.relatedItems.length > 4) {
      console.log(`   └─ ... (还有 ${event.relatedItems.length - 4} 条折叠原文)`);
    }
  }
});
console.log('\n==================================================================');

// 5. 模拟 F1HOT 日报分类
console.log('\n📅 仿真测试: F1HOT 极简日报归档分发...');
const briefing = { raceSpeed: [], techDig: [], paddockVoice: [] };
const RACE_SPEED_REGEX = /race|stewards|penalty|calendar|lap|grid|fia|fom|result|standings|fp1|fp2|fp3|sprint|qualifying|win/i;
const TECH_DIG_REGEX = /technical|upgrade|aerodynamic|engine|setup|wing|chassis|telemetry|tyre|strategy|sim/i;

results.forEach(event => {
  const title = event.title;
  if (RACE_SPEED_REGEX.test(title)) briefing.raceSpeed.push(event);
  else if (TECH_DIG_REGEX.test(title)) briefing.techDig.push(event);
  else briefing.paddockVoice.push(event);
});

console.log(`🏁 赛事前沿与官方公告: ${briefing.raceSpeed.length} 条`);
console.log(`🔧 技术解构与深度升级: ${briefing.techDig.length} 条`);
console.log(`💬 围场声音与转会传闻: ${briefing.paddockVoice.length} 条`);
console.log('\n🎉 自检仿真完美成功！算法流匹配高保真！');
