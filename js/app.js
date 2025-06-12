// Game data and application state
let gamesData = [];
let filteredGames = [];
let currentCategory = 'all';
let searchQuery = '';
// DOM elements
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const menuToggle = document.getElementById('menuToggle');
const mainContent = document.getElementById('mainContent');
const searchInput = document.getElementById('searchInput');
const gamesContainer = document.getElementById('gamesContainer');
const loadingState = document.getElementById('loadingState');
const noResultsState = document.getElementById('noResultsState');
const categoryTitle = document.getElementById('categoryTitle');
const categoryDescription = document.getElementById('categoryDescription');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadGamesData();
    setupEventListeners();
    setupSidebarToggle();
});

// Load games data from CSV or embedded JavaScript
async function loadGamesData() {
    try {
        // Use embedded JavaScript data first (avoid CORS issues)
        if (window.GAMES_DATA && window.GAMES_DATA.length > 0) {
            console.log('✅ Using embedded JavaScript data');
            gamesData = window.GAMES_DATA;
            // Generate dynamic sidebar categories
            generateSidebarCategories();
            // Default to show all games
            currentCategory = 'all';
            updateCategoryHeader('all');
            displayGames();
            hideLoading();
            return;
        }
        
        // Fallback to CSV file (only works under HTTP server)
        console.log('🔄 Trying to load CSV file...');
        const response = await fetch('game.csv');
        const csvText = await response.text();
        gamesData = parseCSV(csvText);
        // Generate dynamic sidebar categories
        generateSidebarCategories();
        // Default to show all games
        currentCategory = 'all';
        updateCategoryHeader('all');
        displayGames();
        hideLoading();
    } catch (error) {
        console.error('❌ Error loading game data:', error);
        console.error('💡 Tip: If you are using file:// protocol, please:');
        console.error('   1. Include <script src="js/games-data.js"></script> in HTML');
        console.error('   2. Or start HTTP server: python3 -m http.server 8000');
        hideLoading();
        showNoResults();
    }
}

// Parse CSV data
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    const games = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = parseCSVLine(lines[i]);
            const game = {};
            
            headers.forEach((header, index) => {
                game[header.trim()] = values[index] ? values[index].trim() : '';
            });
            
            // Process categories
            if (game.categories) {
                game.categoriesArray = game.categories.split('|').map(cat => cat.trim());
            } else {
                game.categoriesArray = ['casual'];
            }
            
            // Generate game URL
            game.gameUrl = `games/${game.categoriesArray[0]}/${game.slug}.html`;
            
            games.push(game);
        }
    }
    
    return games;
}

// Parse CSV line handling quoted values
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"' && (i === 0 || line[i-1] === ',')) {
            inQuotes = true;
        } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
            inQuotes = false;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

// Generate sidebar categories dynamically based on available games
function generateSidebarCategories() {
    if (!gamesData || gamesData.length === 0) return;
    
    // Get all unique categories from games data
    const categoriesSet = new Set();
    const categoryCounts = {};
    
    gamesData.forEach(game => {
        if (game.categoriesArray && game.categoriesArray.length > 0) {
            game.categoriesArray.forEach(category => {
                categoriesSet.add(category);
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            });
        }
    });
    
    // Convert to array and sort
    const categories = Array.from(categoriesSet).sort();
    
    // Category icons mapping (using emoji icons)
    const categoryIcons = {
        'action': `<span class="text-lg mr-2">⚔️</span>`,
        'adventure': `<span class="text-lg mr-2">🗺️</span>`,
        'beauty': `<span class="text-lg mr-2">💄</span>`,
        'casual': `<span class="text-lg mr-2">🔴</span>`,
        'clicker': `<span class="text-lg mr-2">👆</span>`,
        'driving': `<span class="text-lg mr-2">🚗</span>`,
        'puzzle': `<span class="text-lg mr-2">🧩</span>`,
        'sports': `<span class="text-lg mr-2">⚽</span>`
    };
    
    // Category display names
    const categoryNames = {
        'action': 'Action Games',
        'adventure': 'Adventure Games',
        'beauty': 'Beauty Games',
        'casual': 'Casual Games',
        'driving': 'Driving Games',
        'puzzle': 'Puzzle Games',
        'sports': 'Sports Games'
    };
    
    // Find the category list container
    const categoryList = document.querySelector('.category-list');
    if (!categoryList) return;
    
    // Clear existing categories (except "All Games")
    const allGamesItem = categoryList.querySelector('[data-category="all"]');
    categoryList.innerHTML = '';
    
    // Add "All Games" first
    if (allGamesItem) {
        categoryList.appendChild(allGamesItem);
    } else {
        const allItem = document.createElement('li');
        allItem.className = 'category-item p-2 hover:bg-gray-100 rounded cursor-pointer';
        allItem.setAttribute('data-category', 'all');
        allItem.innerHTML = `
            <span class="flex items-center">
                <span class="text-lg mr-2">🎯</span>
                All Games
            </span>
        `;
        categoryList.appendChild(allItem);
    }
    
    // Add each category
    categories.forEach(category => {
        const listItem = document.createElement('li');
        listItem.className = 'category-item p-2 hover:bg-gray-100 rounded cursor-pointer';
        listItem.setAttribute('data-category', category);
        
        const icon = categoryIcons[category] || `<span class="text-lg mr-2">🎮</span>`;
        
        const displayName = categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1) + ' Games';
        
        listItem.innerHTML = `
            <span class="flex items-center">
                ${icon}
                ${displayName}
            </span>
        `;
        
        categoryList.appendChild(listItem);
    });
    
    // Re-setup event listeners for the new categories
    setupCategoryEventListeners();
    
    console.log('✅ Generated sidebar categories:', categories);
    console.log('📊 Category counts:', categoryCounts);
}

// Setup event listeners for category items
function setupCategoryEventListeners() {
    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', function() {
            // Remove active state from all categories
            document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
            // Add active state to current category
            this.classList.add('active');

            const category = this.getAttribute('data-category');
            currentCategory = category;
            updateCategoryHeader(category);
            filterAndDisplayGames();
        });
    });
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    // Category selection will be setup in setupCategoryEventListeners
    // after dynamic categories are generated
}

// Setup sidebar toggle for mobile
function setupSidebarToggle() {
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }
    
    // Handle escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !sidebar.classList.contains('-translate-x-full')) {
            closeSidebar();
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024) {
            closeSidebar();
            // Adjust main content margin
            if (sidebarCollapsed) {
                mainContent.style.marginLeft = '60px';
            } else {
                mainContent.style.marginLeft = '50px';
            }
        } else {
            mainContent.style.marginLeft = '0';
        }
    });
}

function toggleSidebar() {
    const isOpen = !sidebar.classList.contains('-translate-x-full');
    
    if (isOpen) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

function openSidebar() {
    sidebar.classList.remove('-translate-x-full');
    sidebarOverlay.classList.remove('hidden');
}

function closeSidebar() {
    sidebar.classList.add('-translate-x-full');
    sidebarOverlay.classList.add('hidden');
}

function setupGameCardEvents() {
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', () => {
            const gameUrl = card.dataset.gameUrl;
            const gameTitle = card.dataset.gameTitle;
            openGame(gameUrl);
        });
    });
}

function openGame(gameUrl) {
    console.log('Opening game:', gameUrl);
    // TODO: Implement game opening logic
}

function selectCategoryByName(categoryName) {
    const categoryButton = document.querySelector(`[data-category="${categoryName}"]`);
    if (categoryButton) {
        selectCategory(categoryName, categoryButton);
    }
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function hideLoading() {
    if (loadingState) loadingState.classList.add('hidden');
}

function showLoading() {
    if (loadingState) loadingState.classList.remove('hidden');
    hideNoResults();
}

function showNoResults() {
    if (noResultsState) noResultsState.classList.remove('hidden');
    if (gamesContainer) gamesContainer.classList.add('hidden');
}

function hideNoResults() {
    if (noResultsState) noResultsState.classList.add('hidden');
}

// Handle search input
function handleSearch(event) {
    searchQuery = event.target.value.toLowerCase();
    filterAndDisplayGames();
}

// Select category
function selectCategory(category, buttonElement) {
    currentCategory = category;
    
    // Update active button
    document.querySelectorAll('.sidebar-item').forEach(btn => {
        btn.classList.remove('active');
    });
    
    buttonElement.classList.add('active');
    
    // Update title and description
    updateCategoryHeader(category);
    
    // Filter and display games
    filterAndDisplayGames();
    
    // Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
        closeSidebar();
    }
}

// Update category header based on selected category
function updateCategoryHeader(category) {
    const categoryInfo = {
        'all': {
            title: 'All Games',
            description: 'Discover and play amazing games from all categories'
        },
        'action': {
            title: 'Action Games',
            description: 'Fast-paced games full of excitement and adrenaline'
        },
        'casual': {
            title: 'Casual Games',
            description: 'Fun and relaxing games perfect for any time'
        },
        'puzzle': {
            title: 'Puzzle Games',
            description: 'Challenge your mind with brain-teasing puzzles'
        },
        'adventure': {
            title: 'Adventure Games',
            description: 'Embark on epic journeys and exciting quests'
        },
        'driving': {
            title: 'Driving Games',
            description: 'Experience the thrill of racing and driving'
        },
        'sports': {
            title: 'Sports Games',
            description: 'Compete in various sports and athletic challenges'
        },
        'beauty': {
            title: 'Beauty Games',
            description: 'Fashion, makeup, and style games'
        }
    };
    
    const info = categoryInfo[category] || categoryInfo['all'];
    if (categoryTitle) categoryTitle.textContent = info.title;
    if (categoryDescription) categoryDescription.textContent = info.description;
}

// Update category counts
function updateCategoryCounts() {
    if (!gamesData || gamesData.length === 0) return;
    
    // Update the category title to show the total count
    const totalGames = gamesData.length;
    if (currentCategory === 'all' && categoryTitle) {
        categoryTitle.textContent = `All Games (${totalGames})`;
    }
}

// Filter and display games
function filterAndDisplayGames() {
    let games = gamesData;
    
    // Filter by category
    if (currentCategory !== 'all') {
        games = games.filter(game => 
            game.categoriesArray && game.categoriesArray.includes(currentCategory)
        );
    }
    
    // Filter by search query
    if (searchQuery) {
        games = games.filter(game => 
            (game.name && game.name.toLowerCase().includes(searchQuery)) ||
            (game.description && game.description.toLowerCase().includes(searchQuery)) ||
            (game.categoriesArray && game.categoriesArray.some(cat => 
                cat.toLowerCase().includes(searchQuery)
            ))
        );
    }
    
    filteredGames = games;
    displayGames();
}

// Display games
function displayGames() {
    if (currentCategory === 'all') {
        displayGamesByCategory();
    } else {
        displayGamesGrid();
    }
}

// Display games organized by category with horizontal scrolling
function displayGamesByCategory() {
    if (!gamesContainer) return;
    
    // Get all unique categories from games data
    const categoriesSet = new Set();
    gamesData.forEach(game => {
        if (game.categoriesArray && game.categoriesArray.length > 0) {
            game.categoriesArray.forEach(category => {
                categoriesSet.add(category);
            });
        }
    });
    
    // Convert to array and sort
    const categories = Array.from(categoriesSet).sort();
    let html = '';
    
    categories.forEach(category => {
        const categoryGames = gamesData.filter(game => 
            game.categoriesArray && game.categoriesArray.includes(category)
        );
        
        if (categoryGames.length > 0) {
            html += createCategorySection(category, categoryGames);
        }
    });
    
    gamesContainer.innerHTML = html;
    gamesContainer.classList.remove('hidden');
    setupGameCardEvents();
}

// Display games in grid format
function displayGamesGrid(returnHtml = false) {
    const games = filteredGames.length > 0 ? filteredGames : gamesData;
    
    if (games.length === 0) {
        if (!returnHtml) {
            showNoResults();
            return;
        }
        return '<div class="text-center py-8 text-gray-500">No games found</div>';
    }
    
    let html = '<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">';
    
    games.forEach(game => {
        html += createGameCard(game);
    });
    
    html += '</div>';
    
    if (returnHtml) {
        return html;
    }
    
    if (gamesContainer) {
        gamesContainer.innerHTML = html;
        gamesContainer.classList.remove('hidden');
        setupGameCardEvents();
    }
    
    hideNoResults();
}

// Create category section with horizontal scrolling
function createCategorySection(category, games) {
    const categoryInfo = {
        'action': { title: 'Action Games', color: 'red' },
        'casual': { title: 'Casual Games', color: 'green' },
        'puzzle': { title: 'Puzzle Games', color: 'blue' },
        'adventure': { title: 'Adventure Games', color: 'purple' },
        'driving': { title: 'Driving Games', color: 'orange' },
        'sports': { title: 'Sports Games', color: 'teal' },
        'beauty': { title: 'Beauty Games', color: 'pink' }
    };
    
    const info = categoryInfo[category];
    if (!info) return '';
    
    let html = `
        <div class="mb-6">
            <div class="flex items-center justify-between mb-3">
                <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                    <span class="w-3 h-3 rounded-full bg-${info.color}-500 mr-2"></span>
                    ${info.title}
                    <span class="ml-2 text-sm text-gray-500">(${games.length})</span>
                </h3>
                <button class="text-${info.color}-600 hover:text-${info.color}-800 text-sm font-medium" 
                        onclick="selectCategoryByName('${category}')">
                    View All →
                </button>
            </div>
            <div class="games-horizontal-scroll">
    `;
    
    games.slice(0, 10).forEach(game => {
        html += createGameCard(game, true);
    });
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

// Create game card
function createGameCard(game, isHorizontal = false) {
    const cardClass = isHorizontal ? 'game-card-horizontal' : '';
    const imageUrl = game.image_url || 'images/placeholder-game.svg';
    
    return `
        <div class="game-card ${cardClass} bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg"
             data-game-url="${game.gameUrl}" data-game-title="${game.title}">
            <div class="aspect-w-16 aspect-h-9 bg-gray-200">
                <img src="${imageUrl}" alt="${game.title}" 
                     class="w-full h-32 object-cover" 
                     onerror="this.src='images/placeholder-game.svg'">
            </div>
            <div class="p-3">
                <h3 class="font-medium text-gray-900 text-sm line-clamp-2 mb-1">${game.title}</h3>
                <p class="text-xs text-gray-600 line-clamp-2 mb-2">${game.description || 'Fun game to play'}</p>
                <div class="flex items-center justify-between">
                    <div class="flex flex-wrap gap-1">
                        ${game.categoriesArray ? game.categoriesArray.slice(0, 2).map(cat => 
                            `<span class="px-2 py-1 bg-primary bg-opacity-10 text-primary text-xs rounded-full">${cat}</span>`
                        ).join('') : ''}
                    </div>
                    <button class="text-primary hover:text-primary-dark transition-colors duration-200">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2 4H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Setup sidebar toggle for mobile
function setupSidebarToggle() {
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }
    
    // Handle escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('translate-x-0')) {
            closeSidebar();
        }
    });
}

// Toggle sidebar for mobile
function toggleSidebar() {
    if (sidebar.classList.contains('-translate-x-full')) {
        openSidebar();
    } else {
        closeSidebar();
    }
}

// Open sidebar for mobile
function openSidebar() {
    sidebar.classList.remove('-translate-x-full');
    sidebar.classList.add('translate-x-0');
    if (sidebarOverlay) sidebarOverlay.classList.remove('hidden');
}

// Close sidebar for mobile
function closeSidebar() {
    sidebar.classList.remove('translate-x-0');
    sidebar.classList.add('-translate-x-full');
    if (sidebarOverlay) sidebarOverlay.classList.add('hidden');
}

// Setup game card click events
function setupGameCardEvents() {
    const gameCards = document.querySelectorAll('.game-card');
    gameCards.forEach(card => {
        card.addEventListener('click', () => {
            const gameUrl = card.dataset.gameUrl;
            const gameTitle = card.dataset.gameTitle;
            if (gameUrl) {
                openGame(gameUrl, gameTitle);
            }
        });
    });
}

// Open game in new window/tab
function openGame(gameUrl, gameTitle) {
    console.log(`🎮 Opening game: ${gameTitle}`);
    window.open(gameUrl, '_blank');
}

// Select category by name (used by category buttons)
function selectCategoryByName(categoryName) {
    const categoryButton = document.querySelector(`[data-category="${categoryName}"]`);
    if (categoryButton) {
        selectCategory(categoryName, categoryButton);
    }
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Utility functions
function hideLoading() {
    if (loadingState) loadingState.classList.add('hidden');
}

function showLoading() {
    if (loadingState) loadingState.classList.remove('hidden');
}

function showNoResults() {
    if (noResultsState) noResultsState.classList.remove('hidden');
    if (gamesContainer) gamesContainer.classList.add('hidden');
}

function hideNoResults() {
    if (noResultsState) noResultsState.classList.add('hidden');
}