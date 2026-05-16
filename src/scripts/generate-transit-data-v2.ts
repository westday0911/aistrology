
import SwissEph from 'sweph-wasm';
import fs from 'fs';
import path from 'path';

const ZODIAC = [
  "牡羊座", "金牛座", "雙子座", "巨蟹座", "獅子座", "處女座",
  "天秤座", "天蠍座", "射手座", "摩羯座", "水瓶座", "雙魚座"
];

const PLANETS = [
  { id: 0, name: "太陽" },
  // { id: 1, name: "月亮" }, // 移除月亮以減少噪音
  { id: 2, name: "水星" },
  { id: 3, name: "金星" },
  { id: 4, name: "火星" },
  { id: 5, name: "木星" },
  { id: 6, name: "土星" },
  { id: 7, name: "天王星" },
  { id: 8, name: "海王星" },
  { id: 9, name: "冥王星" }
];

async function run() {
  console.log("🚀 初始化 Swiss Ephemeris (WASM) - 專業時區校準版...");
  
  const wasmPath = path.join(process.cwd(), 'node_modules/sweph-wasm/dist/wasm/swisseph.wasm');
  const wasmBuffer = fs.readFileSync(wasmPath);
  const wasmBase64 = wasmBuffer.toString('base64');
  const wasmDataUrl = `data:application/wasm;base64,${wasmBase64}`;
  const swe = await (SwissEph as any).init(wasmDataUrl);

  const transitData: Record<string, string[]> = {};
  const startYear = 2026;
  const endYear = 2027;

  // 設定掃描範圍：加上時區校準 (UTC+8)
  const TZ_OFFSET_MS = 8 * 60 * 60 * 1000;
  
  const startTime = Date.UTC(startYear, 0, 1, 0, 0, 0);
  const endTime = Date.UTC(endYear, 11, 31, 23, 59, 59);
  
  // 以「1 小時」為步進單位，確保跨越午夜的判斷極度精確
  const step = 1000 * 60 * 60; 

  let lastSigns: Record<number, number> = {};
  let lastSpeeds: Record<number, number> = {};

  console.log(`📅 開始精確掃描 ${startYear} - ${endYear} (時區: UTC+8)...`);

  for (let t = startTime; t <= endTime; t += step) {
    const dUTC = new Date(t);
    const dLocal = new Date(t + TZ_OFFSET_MS); // 校準後的當地日期
    
    const jd = swe.swe_julday(
      dUTC.getUTCFullYear(), 
      dUTC.getUTCMonth() + 1, 
      dUTC.getUTCDate(), 
      dUTC.getUTCHours() + dUTC.getUTCMinutes()/60, 
      1
    );
    
    for (const p of PLANETS) {
      const res = swe.swe_calc_ut(jd, p.id, 256 | 2);
      const lon = res[0];
      const speed = res[3];
      const currentSign = Math.floor(lon / 30);

      const year = dLocal.getUTCFullYear();
      const month = dLocal.getUTCMonth() + 1;
      const day = dLocal.getUTCDate();
      const key = `${year}/${month}`;

      const addEvent = (text: string) => {
        if (!transitData[key]) transitData[key] = [];
        const entry = `${day}日 ${text}`;
        if (!transitData[key].includes(entry)) {
          transitData[key].push(entry);
        }
      };

      // 1. 偵測進座 (Ingress)
      if (lastSigns[p.id] !== undefined && lastSigns[p.id] !== currentSign) {
        const suffix = p.name === "太陽" ? `（${ZODIAC[currentSign]}月開始）` : "";
        addEvent(`${p.name}進入${ZODIAC[currentSign]}${suffix}`);
      }
      lastSigns[p.id] = currentSign;

      // 2. 偵測逆行 (速度正負切換)
      if (p.id !== 0 && p.id !== 1) {
        if (lastSpeeds[p.id] !== undefined) {
          if (lastSpeeds[p.id] > 0 && speed < 0) {
            addEvent(`${p.name}開始逆行（${ZODIAC[currentSign]}）`);
          } else if (lastSpeeds[p.id] < 0 && speed > 0) {
            addEvent(`${p.name}逆行結束`);
          }
        }
        lastSpeeds[p.id] = speed;
      }
    }
  }

  // 排序並過濾重複
  for (const key in transitData) {
    transitData[key].sort((a, b) => {
      const dayA = parseInt(a);
      const dayB = parseInt(b);
      return dayA - dayB;
    });
  }

  const fileContent = `export const TRANSIT_DATA: Record<string, string[]> = ${JSON.stringify(transitData, null, 2)};\n`;
  const outputPath = path.join(process.cwd(), 'src/lib/transit-data.ts');
  fs.writeFileSync(outputPath, fileContent);

  console.log(`\n✨ 專業版更新成功！時區已設定為 UTC+8，並已過濾頻繁的月亮事件。`);
}

run().catch(err => console.error("❌ 執行失敗:", err));
