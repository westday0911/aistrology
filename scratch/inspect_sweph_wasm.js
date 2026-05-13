const sweph = require('sweph-wasm');
console.log("Exports of sweph-wasm:", Object.keys(sweph));
if (sweph.SwissEph) {
    console.log("Type of SwissEph:", typeof sweph.SwissEph);
}
