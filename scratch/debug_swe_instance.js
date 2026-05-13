const SwissEph = require('sweph-wasm').default || require('sweph-wasm');

async function test() {
    try {
        const swe = new SwissEph();
        console.log("Instance created.");
        console.log("Available methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(swe)));
        console.log("Available keys on instance:", Object.keys(swe));
        
        if (typeof swe.init === 'function') {
            console.log("Attempting swe.init()...");
            await swe.init();
            console.log("Init successful.");
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

test();
