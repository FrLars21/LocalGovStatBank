let globalData = [];
let uniqueTimeGrains = new Set();
let uniqueUnits = new Set();

async function fetchData() {
    const response = await fetch('data.json');
    const data = await response.json();
    return data;
}

function createCard(item) {
    // Extract Tid variable
    const tidVariable = item.timeDim;
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

    // Find the municipality dimension
    const muniDim = item.muniDim;
    const muniCount = muniDim ? muniDim.values.length : 0;

    const card = document.createElement('div');
    card.className = 'flex items-center text-sm border-b border-gray-200 hover:bg-gray-50';
    card.innerHTML = `
        <div class="w-5/12 px-4 py-3">
            <a href="https://statbank.dk/${item.id}" target="_blank" class="hover:underline">
                <div class="flex flex-col">
                    <div class="flex items-center gap-2">
                        <strong class="text-gray-900 break-words">${item.id}</strong>
                        <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">${item.unit}</span>
                    </div>
                    <span class="text-sm text-gray-600 break-words">${item.title}</span>
                </div>
            </a>
        </div>
        <div class="w-3/12 px-4 py-3">
            <div class="text-xs text-gray-400 flex flex-wrap gap-1">
                ${filteredVariables.map((v, index) => `
                    <button class="variable-click bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs cursor-pointer relative" data-variable='${JSON.stringify(v)}' data-index="${index + 1}">
                        ${v.text} (${v.values.length})
                    </button>
                `).join('')}
            </div>
        </div>
        <div class="w-1/12 px-4 py-3">
            <button class="variable-click muni-click bg-yellow-100 hover:bg-yellow-200 text-gray-700 px-2 py-1 rounded-full text-xs mt-1 cursor-pointer relative" data-variable='${JSON.stringify(muniDim)}'>
                ${item.n_municipalities}/98
            </button>
        </div>
        <div class="w-2/12 px-4 py-3">
            <button class="variable-click tid-click bg-green-100 hover:bg-green-200 text-gray-700 px-2 py-1 rounded-full text-xs mt-1 cursor-pointer relative" data-variable='${JSON.stringify(tidVariable)}'>
                ${item.timeGrain} (${periodsCount})
            </button>
            <div class="text-xs mt-2">${firstPeriod} - ${lastPeriod}</div>
        </div>
        <div class="w-2/12 px-4 py-3">
            <span class="text-gray-900">${item.updated.split('T')[0]}</span>
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
        case 'municipalitiesDesc':
            return data.sort((a, b) => b.n_municipalities - a.n_municipalities);
        case 'municipalitiesAsc':
            return data.sort((a, b) => a.n_municipalities - b.n_municipalities);
        default:
            return data;
    }
}

function renderCards(data) {
    const cardsContainer = document.getElementById('cardsContainer');
    cardsContainer.innerHTML = ''; // Clear existing cards

    const filteredData = applyFilters(data);

    const resultsCount = document.getElementById('resultsCount');
    resultsCount.textContent = `Number of tables with municipality-level data: ${filteredData.length}`;

    // Update header row
    const headerRow = document.createElement('div');
    headerRow.className = 'flex items-center text-sm font-medium text-gray-700 bg-gray-50 border-b border-gray-200';
    headerRow.innerHTML = `
        <span class="w-5/12 px-4 py-3">Table</span>
        <span class="w-3/12 px-4 py-3">Variables</span>
        <span class="w-1/12 px-4 py-3">Muni Dim</span>
        <span class="w-2/12 px-4 py-3">Time Grain</span>
        <span class="w-2/12 px-4 py-3">Updated</span>
    `;
    cardsContainer.appendChild(headerRow);

    filteredData.forEach(item => {
        const card = createCard(item);
        cardsContainer.appendChild(card);
    });
}

function createFilterGroup(name, options, defaultValue = 'all') {
    const container = document.createElement('div');
    container.className = 'bg-gray-200 p-4 rounded-md';
    container.innerHTML = `
        <h4 class="font-medium mb-2">Filter by ${name}</h4>
        <div class="">
            ${options.map(option => `
                <label class="inline-flex items-center bg-gray-300 rounded-md py-1 px-2 mb-2 mr-1">
                    <input type="radio" name="${name}" value="${option}" ${option === defaultValue ? 'checked' : ''} class="form-radio">
                    <span class="ml-2">${option}</span>
                </label>
            `).join('')}
        </div>
    `;
    return container;
}

function applyFilters(data) {
    const timeGrainFilter = document.querySelector('input[name="timeGrain"]:checked').value;
    const unitFilter = document.querySelector('input[name="unit"]:checked').value;

    return data.filter(item => 
        (timeGrainFilter === 'all' || item.timeGrain === timeGrainFilter) &&
        (unitFilter === 'all' || item.unit === unitFilter)
    );
}

async function initializeApp() {
    globalData = await fetchData();
    
    // Extract unique timeGrains and units
    globalData.forEach(item => {
        uniqueTimeGrains.add(item.timeGrain);
        uniqueUnits.add(item.unit);
    });

    const filterContainer = document.createElement('div');
    filterContainer.className = 'mb-6 flex gap-x-6';
    filterContainer.appendChild(createFilterGroup('timeGrain', ['all', ...uniqueTimeGrains]));
    filterContainer.appendChild(createFilterGroup('unit', ['all', ...uniqueUnits]));

    const resultsMeta = document.getElementById('results-meta');
    resultsMeta.parentNode.insertBefore(filterContainer, resultsMeta);

    const orderBySelect = document.getElementById('orderBy');

    // Initial render
    renderCards(sortData(globalData, orderBySelect.value));

    // Add event listeners for select and radio button changes
    orderBySelect.addEventListener('change', updateResults);
    filterContainer.addEventListener('change', updateResults);
}

function updateResults() {
    const orderBySelect = document.getElementById('orderBy');
    const sortedData = sortData(globalData, orderBySelect.value);
    renderCards(sortedData);
}

document.addEventListener('DOMContentLoaded', initializeApp);