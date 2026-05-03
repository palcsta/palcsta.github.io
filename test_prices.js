const fs = require('fs');
const data = JSON.parse(fs.readFileSync('prices.json', 'utf8'));
const now = new Date("2026-05-02T17:20:00.000Z");
const prices = [...data.prices].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

const currentIndex = prices.findIndex(p => {
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    return now >= start && now <= end;
});

console.log("Current Index:", currentIndex);
if (currentIndex !== -1) {
    console.log("Current Price Object:", prices[currentIndex]);
}

const upcomingPrices = prices.slice(0, currentIndex + 1).reverse().slice(0, 48);

console.log("Upcoming count:", upcomingPrices.length);
console.log("First price:", upcomingPrices[0]);
console.log("Last price:", upcomingPrices[upcomingPrices.length - 1]);

const isFoundInSlice = upcomingPrices.some(p => {
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    return now >= start && now <= end;
});

const isCurrentLeftmost = upcomingPrices.length > 0
    && now >= new Date(upcomingPrices[0].startDate)
    && now <= new Date(upcomingPrices[0].endDate);
const isAscending = upcomingPrices.every((p, index, prices) => {
    return index === 0 || new Date(prices[index - 1].startDate) < new Date(p.startDate);
});

console.log("Is current found in slice?", isFoundInSlice);
console.log("Is current leftmost?", isCurrentLeftmost);
console.log("Is upcoming sequence ascending?", isAscending);
