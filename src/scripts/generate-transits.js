
const { EclipticLongitude, Body } = require('astronomy-engine');
const fs = require('fs');
const path = require('path');

const ZODIAC = ["牡羊座", "金牛座", "雙子座", "巨蟹座", "獅子座", "處女座", "天秤座", "天蠍座", "射手座", "摩羯座", "水瓶座", "雙魚座"];

// Note: In astronomy-engine, Sun's longitude is actually Earth's heliocentric longitude + 180
const BODIES = [
  { id: Body.Mercury, name: "水星" },
  { id: Body.Venus, name: "金星" },
  { id: Body.Mars, name: "火星" },
  { id: Body.Jupiter, name: "木星" },
  { id: Body.Saturn, name: "土星" },
  { id: Body.Uranus, name: "天王星" },
  { id: Body.Neptune, name: "海王星" },
  { id: Body.Pluto, name: "冥王星" }
];

function getSign(lon) {
  return Math.floor(lon / 30) % 12;
}

async function run() {
  console.log("🚀 Starting AI-Astro Ephemeris Scan (2026-2027)...");
  const transitData = {};
  
  const start = new Date('2026-01-01T00:00:00Z');
  const end = new Date('2027-12-31T23:59:59Z');

  // Helper to record events
  const addEvent = (date, text) => {
    const key = `${date.getUTCFullYear()}/${date.getUTCMonth() + 1}`;
    if (!transitData[key]) transitData[key] = [];
    transitData[key].push(`${date.getUTCDate()}日 ${text}`);
  };

  let lastSigns = {};

  // Initial positions
  for (const b of BODIES) {
    const lon = EclipticLongitude(b.id, start);
    lastSigns[b.name] = getSign(lon);
  }
  
  // Handle Sun separately (use Earth heliocentric)
  const getSunLon = (date) => (EclipticLongitude(Body.Earth, date) + 180) % 360;
  lastSigns["太陽"] = getSign(getSunLon(start));

  // Scan day by day for ingresses
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    // 1. Check Sun
    const sunLon = getSunLon(d);
    const sunSign = getSign(sunLon);
    if (lastSigns["太陽"] !== sunSign) {
      addEvent(d, `太陽進入${ZODIAC[sunSign]}（${ZODIAC[sunSign]}月開始）`);
      lastSigns["太陽"] = sunSign;
    }

    // 2. Check Others
    for (const b of BODIES) {
      const lon = EclipticLongitude(b.id, d);
      const currentSign = getSign(lon);

      if (lastSigns[b.name] !== currentSign) {
        addEvent(d, `${b.name}進入${ZODIAC[currentSign]}`);
        lastSigns[b.name] = currentSign;
      }
    }
  }

  // Add Eclipses & Key Retrogrades manually for professional depth
  const manualAdditions = {
    "2026/2": ["17日 日食（水瓶座）", "26日 水星開始逆行（雙魚座）"],
    "2026/3": ["3日 月食（處女座）", "20日 水星逆行結束"],
    "2026/6": ["29日 水星開始逆行（巨蟹座）"],
    "2026/7": ["23日 水星逆行結束", "26日 土星開始逆行"],
    "2026/8": ["12日 全日食（獅子座）", "28日 月食（雙魚座）"],
    "2026/10": ["3日 金星開始逆行", "24日 水星開始逆行"],
    "2026/11": ["13日 水星逆行結束", "13日 金星逆行結束"],
    "2027/2": ["6日 日食（水瓶座）", "9日 水星開始逆行", "20日 月食（處女座）"],
    "2027/3": ["3日 水星逆行結束"],
    "2027/6": ["10日 水星開始逆行"],
    "2027/7": ["4日 水星逆行結束", "18日 月食（摩羯座）"],
    "2027/8": ["2日 全日食（獅子座）", "9日 土星開始逆行", "17日 月食（水瓶座）"],
    "2027/10": ["7日 水星開始逆行", "28日 水星逆行結束"]
  };

  for (const k in manualAdditions) {
    if (!transitData[k]) transitData[k] = [];
    transitData[k].push(...manualAdditions[k]);
  }

  // Sort and deduplicate
  for (const k in transitData) {
    transitData[k] = [...new Set(transitData[k])].sort((a, b) => parseInt(a) - parseInt(b));
  }

  const output = `export const TRANSIT_DATA: Record<string, string[]> = ${JSON.stringify(transitData, null, 2)};`;
  fs.writeFileSync(path.join(__dirname, '../lib/transit-data.ts'), output);
  console.log("✨ TRANSIT DATABASE UPDATED SUCCESSFULLY! (Detailed Ingresses included)");
}

run().catch(console.error);
