const Astro = require('astronomy-engine');

// 測試案例：1990-01-01 12:00 Taipei (UTC+8) -> UTC 04:00
const year = 1990, month = 1, day = 1, hour = 12, minute = 0;
const utcOffset = 8;
const lat = 25.033, lon = 121.5654;

const localDate = new Date(year, month - 1, day, hour, minute);
const utcTimestamp = localDate.getTime() - (utcOffset * 3600 * 1000);
const dateUTC = new Date(utcTimestamp);
const astroTime = Astro.MakeTime(dateUTC);

console.log("Input Local:", localDate.toISOString());
console.log("Calculated UTC:", dateUTC.toISOString());

// Planets
const sunLon = Astro.SunPosition(astroTime).elon;
const moonLon = Astro.EclipticLongitude("Moon", astroTime);

console.log("\n--- Planetary Positions ---");
console.log("Sun Longitude:", sunLon, " (Expect ~280.5 for Capricorn 10°)");
console.log("Moon Longitude:", moonLon, " (Expect ~325.5 for Aquarius 25°)");

// Sidereal Time and ASC
const gmst = Astro.SiderealTime(astroTime);
const lst = (gmst + (lon / 15.0) + 24) % 24;
const ramc = (lst * 15.0) % 360;
const tilt = Astro.e_tilt(astroTime);
const eps = tilt.tobl;

const rad = Math.PI / 180;
const epsRad = eps * rad;
const ramcRad = ramc * rad;
const latRad = lat * rad;

let asc = Math.atan2(-Math.cos(ramcRad), Math.sin(ramcRad) * Math.cos(epsRad) + Math.tan(latRad) * Math.sin(epsRad)) / rad;
asc = (asc + 360) % 360;

console.log("\n--- Houses ---");
console.log("GMST (hours):", gmst);
console.log("LST (hours):", lst);
console.log("Ascendant:", asc, " (Expect ~15.9 for Aries 15°)");
