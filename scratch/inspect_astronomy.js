const Astro = require('astronomy-engine');
console.log("Available functions in astronomy-engine:");
console.log(Object.keys(Astro).filter(k => typeof Astro[k] === 'function').sort().join(', '));
