import { NextResponse } from "next/server";
import swissephLib from "swisseph-wasm";

const swisseph = swissephLib as any;

export async function POST(request: Request) {
  try {
    const { birthDate, birthTime, location } = await request.json();
    
    // 1. Geocoding (Simple Nominatim call)
    let lat = 25.0330, lon = 121.5654; // Default Taipei
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`, {
        headers: { "User-Agent": "Aistrology/1.0" }
      });
      const geoData = await geoRes.json();
      if (geoData && geoData[0]) {
        lat = parseFloat(geoData[0].lat);
        lon = parseFloat(geoData[0].lon);
      }
    } catch (e) {
      console.error("Geocoding failed, using default:", e);
    }

    // 2. Get Timezone Offset based on Coordinates
    let utcOffset = 8; // Default to Taipei (UTC+8) if lookup fails
    try {
      const tzRes = await fetch(`https://timeapi.io/api/TimeZone/coordinate?latitude=${lat}&longitude=${lon}`, {
        next: { revalidate: 86400 } // Cache for 24 hours
      });
      const tzData = await tzRes.json();
      if (tzData && typeof tzData.currentUtcOffset?.seconds === "number") {
        utcOffset = tzData.currentUtcOffset.seconds / 3600;
      }
    } catch (e) {
      console.error("Timezone lookup failed:", e);
    }

    // 3. Prepare Time & Convert to UTC
    const [year, month, day] = birthDate.split("-").map(Number);
    const [hour, minute] = birthTime.split(":").map(Number);
    
    // Adjust local time to UTC
    const localDecimalHour = hour + minute / 60;
    const utcDecimalHour = localDecimalHour - utcOffset;

    // Calculate Julian Day (Universal Time)
    // Note: swisseph-wasm API is synchronous
    const julDay = swisseph.swe_julday(year, month, day, utcDecimalHour, swisseph.SE_GREG_CAL);
    
    // 3. Calculate Houses & ASC/MC
    // In swisseph-wasm, swe_houses returns the result directly
    const houseData = swisseph.swe_houses(julDay, lat, lon, "P");

    // 4. Calculate Planets
    const bodies = [
      { name: "太陽", id: swisseph.SE_SUN },
      { name: "月亮", id: swisseph.SE_MOON },
      { name: "水星", id: swisseph.SE_MERCURY },
      { name: "金星", id: swisseph.SE_VENUS },
      { name: "火星", id: swisseph.SE_MARS },
      { name: "木星", id: swisseph.SE_JUPITER },
      { name: "土星", id: swisseph.SE_SATURN },
      { name: "天王星", id: swisseph.SE_URANUS },
      { name: "海王星", id: swisseph.SE_NEPTUNE },
      { name: "冥王星", id: swisseph.SE_PLUTO },
    ];

    const planetResults = bodies.map(body => {
      const res = swisseph.swe_calc_ut(julDay, body.id, swisseph.SEFLG_SPEED);
      const longitude = res.longitude;
      
      // Determine house
      let house = 0;
      for (let i = 0; i < 12; i++) {
        const start = houseData.house[i];
        const end = houseData.house[(i + 1) % 12];
        
        const isBetween = end > start 
          ? (longitude >= start && longitude < end)
          : (longitude >= start || longitude < end);
        
        if (isBetween) {
          house = i + 1;
          break;
        }
      }

      return {
        name: body.name,
        longitude,
        sign: getZodiacSign(longitude),
        degree: formatDegree(longitude),
        house: `${house} 宮`
      };
    });

    // 5. Add ASC and MC to results
    const results = [
      ...planetResults,
      {
        name: "上升星座",
        longitude: houseData.ascendant,
        sign: getZodiacSign(houseData.ascendant),
        degree: formatDegree(houseData.ascendant),
        house: "1 宮 (起點)"
      },
      {
        name: "天頂",
        longitude: houseData.mc,
        sign: getZodiacSign(houseData.mc),
        degree: formatDegree(houseData.mc),
        house: "10 宮 (起點)"
      }
    ];

    return NextResponse.json({ 
      success: true, 
      results,
      meta: {
        lat,
        lon,
        houses: houseData.house
      }
    });
  } catch (error) {
    console.error("Calculation error:", error);
    return NextResponse.json({ success: false, error: "Calculation failed" }, { status: 500 });
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
