let globalData = [];

async function fetchData() {
    const response = await fetch('data.json');
    const data = await response.json();
    return data;
}

function createCard(item) {
    // Extract Tid variable
    const tidVariable = item.variables.find(v => v.id === 'Tid');
    const periodsCount = tidVariable ? tidVariable.values.length : 0;
    
    // Get first and last periods
    let firstPeriod = '';
    let lastPeriod = '';
    if (tidVariable && tidVariable.values.length > 0) {
        firstPeriod = tidVariable.values[0].id;
        lastPeriod = tidVariable.values[tidVariable.values.length - 1].id;
    }
    
    // Filter out Tid from variables
    const filteredVariables = item.variables.filter(v => v.id !== 'Tid');

    const card = document.createElement('div');
    card.className = 'flex items-center text-sm border-b border-gray-200 hover:bg-gray-50';
    card.innerHTML = `
        <span class="w-1/12 px-4 py-3 break-words">${item.id}</span>
        <div class="w-6/12 px-4 py-3">
            <div class="flex items-center gap-2">
                <strong class="text-gray-900 break-words">${item.title}</strong>
                <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">${item.unit}</span>
            </div>
            <div class="text-xs text-gray-400 flex flex-wrap gap-1 mt-2">
                ${filteredVariables.map((v, index) => `
                    <button class="variable-click bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs cursor-pointer relative" data-variable='${JSON.stringify(v)}' data-index="${index + 1}">
                        ${v.text} (${v.values.length})
                    </button>
                `).join('')}
            </div>
        </div>
        <div class="w-2/12 px-4 py-3">
            <button class="variable-click tid-click bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs mt-1 cursor-pointer relative" data-variable='${JSON.stringify(tidVariable)}'>
                ${periodsCount} periods
            </button>
            <div class="text-xs mt-2">${firstPeriod} - ${lastPeriod}</div>
        </div>
        <div class="w-2/12 px-4 py-3">
            <span class="text-gray-900">${item.updated.split('T')[0]}</span>
        </div>
        <div class="w-1/12 px-4 py-3 text-right">
            <a href="https://statbank.dk/${item.id}" target="_blank" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-xs">View</a>
        </div>
    `;

    // Add event listeners for variable click
    const variableClickElements = card.querySelectorAll('.variable-click');
    variableClickElements.forEach(element => {
        element.addEventListener('click', toggleVariableDropdown);
    });

    return card;
}

function toggleVariableDropdown(event) {
    const existingDropdown = document.querySelector('.variable-dropdown');
    if (existingDropdown) {
        document.body.removeChild(existingDropdown);
    }

    if (event.target.dropdown && event.target.dropdown === existingDropdown) {
        event.target.dropdown = null;
        return;
    }

    const variable = JSON.parse(event.target.dataset.variable);
    const dropdown = document.createElement('div');
    dropdown.className = 'variable-dropdown absolute bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto mt-2 min-w-[200px] max-w-[300px]';
    
    dropdown.innerHTML = `
        <div class="px-4 py-2 font-medium text-sm text-gray-500">${variable.text.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</div>
        <div>
            ${variable.values.map((value, index) => `
                <div class="flex items-center gap-x-2 border-t border-gray-200 px-4 py-2 text-sm">
                    <span class="text-gray-500 w-[3ch] block">${index + 1}</span>
                    <span class="block">${value.text}</span>
                </div>
            `).join('')}
        </div>
    `;

    // Position the dropdown
    const rect = event.target.getBoundingClientRect();
    dropdown.style.left = `${rect.left + window.scrollX}px`;
    dropdown.style.top = `${rect.bottom + window.scrollY}px`;

    // Add the dropdown to the body
    document.body.appendChild(dropdown);
    event.target.dropdown = dropdown;

    // Add event listener to close dropdown when clicking outside
    document.addEventListener('click', closeDropdownOutside);
}

function closeDropdownOutside(event) {
    const dropdown = document.querySelector('.variable-dropdown');
    if (dropdown && !dropdown.contains(event.target) && !event.target.classList.contains('variable-click')) {
        document.body.removeChild(dropdown);
        document.removeEventListener('click', closeDropdownOutside);
    }
}

function hideVariableDropdown(event) {
    if (event.target.dropdown) {
        document.body.removeChild(event.target.dropdown);
        event.target.dropdown = null;
    }
}

function sortData(data, sortBy) {
    switch (sortBy) {
        case 'updatedDesc':
            return data.sort((a, b) => new Date(b.updated) - new Date(a.updated));
        case 'updatedAsc':
            return data.sort((a, b) => new Date(a.updated) - new Date(b.updated));
        case 'title':
            return data.sort((a, b) => a.title.localeCompare(b.title));
        default:
            return data;
    }
}

function renderCards(data) {
    const cardsContainer = document.getElementById('cardsContainer');
    cardsContainer.innerHTML = ''; // Clear existing cards

    const resultsCount = document.getElementById('resultsCount');
    resultsCount.textContent = `Number of tables with municipality-level data: ${data.length}`;

    // Update header row
    const headerRow = document.createElement('div');
    headerRow.className = 'flex items-center text-sm font-medium text-gray-700 bg-gray-50 border-b border-gray-200';
    headerRow.innerHTML = `
        <span class="w-1/12 px-4 py-3">ID</span>
        <span class="w-6/12 px-4 py-3">Title</span>
        <span class="w-2/12 px-4 py-3">Periods</span>
        <span class="w-2/12 px-4 py-3">Updated</span>
        <span class="w-1/12 px-4 py-3"></span>
    `;
    cardsContainer.appendChild(headerRow);

    data.forEach(item => {
        const card = createCard(item);
        cardsContainer.appendChild(card);
    });
}

async function initializeApp() {
    globalData = await fetchData();
    const orderBySelect = document.getElementById('orderBy');
    
    // Initial render
    renderCards(sortData(globalData, orderBySelect.value));

    // Add event listener for select changes
    orderBySelect.addEventListener('change', (event) => {
        const sortedData = sortData(globalData, event.target.value);
        renderCards(sortedData);
    });
}

document.addEventListener('DOMContentLoaded', initializeApp);