const Astro = require('astronomy-engine');

console.log("Ecliptic function definition:");
console.log(Astro.Ecliptic.toString());

try {
    const t = Astro.MakeTime(new Date());
    // Try calling it via the time object's context?
    console.log("\nAttempting alternative calls...");
    // Maybe it's not a top-level function but needs an instance? 
    // No, astronomy-engine is usually functional.
} catch (e) {}
