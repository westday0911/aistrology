const Astro = require('astronomy-engine');

try {
    const t = Astro.MakeTime(new Date());
    console.log("Testing SunPosition(t)...");
    console.log("Sun:", Astro.SunPosition(t));
    
    console.log("\nTesting EclipticGeoMoon(t)...");
    console.log("Moon:", Astro.EclipticGeoMoon(t));

    // Check Body enum or string for planets
    const bodies = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
    console.log("\nTesting planets with EclipticLongitude...");
    bodies.forEach(b => {
        try {
            const lon = Astro.EclipticLongitude(b, t);
            console.log(`${b}: ${lon}`);
        } catch (e) {
            console.log(`${b} failed: ${e.message}`);
        }
    });
} catch (e) {
    console.error("General Error:", e.message);
}
