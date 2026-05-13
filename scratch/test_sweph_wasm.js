const { SwissEph } = require('sweph-wasm');

async function test() {
    try {
        const swisseph = new SwissEph();
        console.log("SwissEph instance created successfully.");
        // Check for common methods
        const methods = [
            'swe_julday', 'swe_houses', 'swe_calc_ut', 'swe_set_ephe_path'
        ];
        methods.forEach(m => {
            console.log(`${m}: ${typeof swisseph[m]}`);
        });
    } catch (e) {
        console.error("Error creating SwissEph:", e.message);
    }
}

test();
