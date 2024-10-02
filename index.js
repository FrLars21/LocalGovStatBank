async function fetchData() {
    const response = await fetch('data.json');
    const data = await response.json();
    return data;
}

function createCard(item) {
    const card = document.createElement('div');
    card.className = 'border border-gray-300 rounded-md p-4 shadow-md flex justify-between items-center';
    card.innerHTML = `
        <span>${item.id}</span>
        <div class="flex flex-col gap-2">
            <strong>${item.title} (${item.unit})</strong>
            <span>${item.variables.join(', ')}</span>
        </div>
        <div class="flex flex-col gap-2">
            <span class="text-gray-500 text-sm">Last updated</span>
            <span>${item.updated}</span>
        </div>
        <span>${item.n_municipalities}/98</span>
        <a href="https://statbank.dk/${item.id}" target="_blank" class="bg-blue-500 text-white px-4 py-2 rounded-md">View</a>
    `;
    return card;
}

async function renderCards() {
    const data = await fetchData();
    const cardsContainer = document.getElementById('cardsContainer');

    data.forEach(item => {
        const card = createCard(item);
        cardsContainer.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', renderCards);
