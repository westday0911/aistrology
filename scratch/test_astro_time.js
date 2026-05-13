const Astro = require('astronomy-engine');

try {
    const date = new Date();
    console.log("Testing Astro.MakeTime(date)...");
    const t1 = Astro.MakeTime(date);
    console.log("t1:", t1);
    
    console.log("\nTesting Astro.Ecliptic(t1)...");
    const ecl = Astro.Ecliptic(t1);
    console.log("Ecliptic Result:", ecl);
} catch (e) {
    console.error("Error with MakeTime:", e.message);
}

try {
    const date = new Date();
    console.log("\nTesting new Astro.AstroTime(date)...");
    const t2 = new Astro.AstroTime(date);
    console.log("t2:", t2);
} catch (e) {
    console.error("Error with new AstroTime:", e.message);
}
