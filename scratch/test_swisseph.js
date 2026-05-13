const swisseph = require("swisseph-wasm");
console.log("Swisseph Object Keys:", Object.keys(swisseph));
if (swisseph.default) {
  console.log("Default Export Keys:", Object.keys(swisseph.default));
}
