const fs = require('fs');
const data = JSON.parse(fs.readFileSync('prices.json', 'utf8'));
const now = new Date("2026-05-02T17:20:00.000Z");

const currentIndex = data.prices.findIndex(p => {
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    return now >= start && now <= end;
});

console.log("Current Index:", currentIndex);
if (currentIndex !== -1) {
    console.log("Current Price Object:", data.prices[currentIndex]);
}

let sliceEnd = Math.min(data.prices.length, currentIndex + 1);
let sliceStart = Math.max(0, sliceEnd - 48);

if (sliceEnd - sliceStart < 48 && sliceEnd < data.prices.length) {
    sliceEnd = Math.min(data.prices.length, sliceStart + 48);
}

console.log("Slice:", sliceStart, "to", sliceEnd);

const recentPrices = data.prices.slice(sliceStart, sliceEnd).reverse();
const isFoundInSlice = recentPrices.some(p => {
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    return now >= start && now <= end;
});

console.log("Is current found in slice after reverse?", isFoundInSlice);
