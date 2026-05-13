import { NextResponse } from "next/server";
import SwissEph from 'sweph-wasm';

export async function POST(request: Request) {
  try {
    const { birthDate, birthTime, location } = await request.json();
    
    // 1. Geocoding
    let lat = 25.0330, lon = 121.5654;
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`, {
        headers: { "User-Agent": "Aistrology/1.0" }
      });
      const geoData = await geoRes.json();
      if (geoData && geoData[0]) {
        lat = parseFloat(geoData[0].lat);
        lon = parseFloat(geoData[0].lon);
      }
    } catch (e) { console.error("Geocoding error:", e); }

    // 2. Get Historical Timezone Offset
    let utcOffset = 8;
    try {
      const tzRes = await fetch(`https://timeapi.io/api/TimeZone/coordinate?latitude=${lat}&longitude=${lon}`);
      const tzData = await tzRes.json();
      if (tzData && tzData.timeZone) {
        const zoneName = tzData.timeZone;
        const testDate = new Date(`${birthDate}T${birthTime}:00`);
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: zoneName,
          timeZoneName: 'longOffset',
          year: 'numeric', month: 'numeric', day: 'numeric',
          hour: 'numeric', minute: 'numeric', second: 'numeric'
        }).formatToParts(testDate);
        const gmtOffset = parts.find(p => p.type === 'timeZoneName')?.value || "";
        const match = gmtOffset.match(/GMT([+-])(\d+):?(\d+)?/);
        if (match) {
          const sign = match[1] === '+' ? 1 : -1;
          const hours = parseInt(match[2]);
          const mins = parseInt(match[3] || "0");
          utcOffset = sign * (hours + mins / 60);
        }
      }
    } catch (e) { console.error("TZ lookup error:", e); }

    // 3. SECURE UTC CONVERSION
    const [year, month, day] = birthDate.split("-").map(Number);
    const [hour, minute] = birthTime.split(":").map(Number);
    const utcTimestamp = Date.UTC(year, month - 1, day, hour, minute) - (utcOffset * 3600 * 1000);
    const dateUTC = new Date(utcTimestamp);

    // 4. Initialize SwissEph Wasm
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const wasmUrl = `${baseUrl}/wasm/swisseph.wasm`;
    const swe = await (SwissEph as any).init(wasmUrl);

    // Time conversion
    const utcDecimalHour = dateUTC.getUTCHours() + dateUTC.getUTCMinutes() / 60 + dateUTC.getUTCSeconds() / 3600;
    const julDay = swe.swe_julday(
      dateUTC.getUTCFullYear(), 
      dateUTC.getUTCMonth() + 1, 
      dateUTC.getUTCDate(), 
      utcDecimalHour, 
      1 // SE_GREG_CAL
    );

    // 5. Calculate Houses (Placidus 'P')
    const houseData = swe.swe_houses(julDay, lat, lon, 'P');
    const houseCusps = houseData.cusps.length === 13 ? houseData.cusps.slice(1) : houseData.cusps;
    const ascendant = houseData.ascmc[0];
    const mc = houseData.ascmc[1];

    // 6. Calculate Planets
    const bodies = [
      { name: "太陽", id: 0 }, 
      { name: "月亮", id: 1 }, 
      { name: "水星", id: 2 }, 
      { name: "金星", id: 3 }, 
      { name: "火星", id: 4 }, 
      { name: "木星", id: 5 }, 
      { name: "土星", id: 6 }, 
      { name: "天王星", id: 7 }, 
      { name: "海王星", id: 8 }, 
      { name: "冥王星", id: 9 }, 
    ];

    const planetResults = bodies.map(body => {
      // res is an array: [longitude, latitude, distance, speed_long, speed_lat, speed_dist]
      const res = swe.swe_calc_ut(julDay, body.id, 256 | 2);
      const longitude = res[0]; // CORRECT: longitude is the first element
      
      let houseNum = 0;
      for (let i = 0; i < 12; i++) {
        const start = houseCusps[i];
        const end = houseCusps[(i + 1) % 12];
        let isBetween = end > start 
          ? (longitude >= start && longitude < end)
          : (longitude >= start || longitude < end);
        if (isBetween) { houseNum = i + 1; break; }
      }

      return {
        name: body.name,
        longitude,
        sign: getZodiacSign(longitude),
        degree: formatDegree(longitude),
        house: `${houseNum} 宮`
      };
    });

    return NextResponse.json({ 
      success: true, 
      results: [
        ...planetResults,
        {
          name: "上升星座",
          longitude: ascendant,
          sign: getZodiacSign(ascendant),
          degree: formatDegree(ascendant),
          house: "1 宮 (起點)"
        },
        {
          name: "天頂",
          longitude: mc,
          sign: getZodiacSign(mc),
          degree: formatDegree(mc),
          house: "10 宮 (起點)"
        }
      ],
      meta: {
        lat, lon,
        houses: houseCusps,
        utcTime: dateUTC.toISOString(),
        utcOffset
      }
    });

  } catch (error: any) {
    console.error("Calculation Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function getZodiacSign(longitude: number) {
  const signs = ["牡羊座", "金牛座", "雙子座", "巨蟹座", "獅子座", "處女座", "天秤座", "天蠍座", "射手座", "摩羯座", "水瓶座", "雙魚座"];
  const normalizedLon = ((longitude % 360) + 360) % 360;
  return signs[Math.floor(normalizedLon / 30)];
}

function formatDegree(longitude: number) {
  const normalizedLon = ((longitude % 360) + 360) % 360;
  const degree = Math.floor(normalizedLon % 30);
  const minutes = Math.floor(((normalizedLon % 30) - degree) * 60);
  return `${degree}°${minutes.toString().padStart(2, '0')}'`;
}
