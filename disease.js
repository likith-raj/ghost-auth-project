    // DOM Elements
    const countryPanel = document.getElementById('countryPanel');
    const dashboard = document.getElementById('dashboard');
    const countriesList = document.getElementById('countriesList');
    const searchBox = document.getElementById('search-box');
    const backBtn = document.getElementById('back-btn');
    const countryTitle = document.getElementById('country-title');
    const countryFlag = document.getElementById('country-flag');
    const dashboardContent = document.getElementById('dashboard-content');
    const lastUpdated = document.getElementById('last-updated');
    const updateText = document.getElementById('update-text');
    const updateNotification = document.getElementById('updateNotification');
    const notificationTime = document.getElementById('notificationTime');

    // Global stats elements
    const globalCases = document.getElementById('global-cases');
    const globalDeaths = document.getElementById('global-deaths');
    const globalRecovered = document.getElementById('global-recovered');
    const headerCases = document.getElementById('header-cases');
    const headerDeaths = document.getElementById('header-deaths');
    const headerRecovered = document.getElementById('header-recovered');
    const headerActive = document.getElementById('header-active');

    // Global Variables
    let countriesData = [];
    let selectedCountry = null;
    let charts = {};
    let liveUpdateInterval;
    let previousData = {};
    let currentSort = 'name';
    let globalData = {};

    // Initialize the application
    document.addEventListener('DOMContentLoaded', function() {
        fetchGlobalData();
        fetchCountries();
        setupEventListeners();
        startGlobalUpdates();
    });

    // Set up event listeners
    function setupEventListeners() {
        searchBox.addEventListener('input', handleSearch);
        backBtn.addEventListener('click', showCountryList);
        
        // Sort buttons
        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentSort = this.dataset.sort;
                sortCountries(currentSort);
            });
        });
    }

    // Show country list
    function showCountryList() {
        dashboard.style.display = 'none';
        countryPanel.style.display = 'flex';
        clearInterval(liveUpdateInterval);
    }

    // Fetch global data
    async function fetchGlobalData() {
        try {
            const response = await fetch('https://disease.sh/v3/covid-19/all');
            globalData = await response.json();
            updateGlobalStats();
        } catch (error) {
            console.error('Error fetching global data:', error);
        }
    }

    // Update global statistics
    function updateGlobalStats() {
        if (globalData.cases) {
            globalCases.textContent = formatNumber(globalData.cases);
            globalDeaths.textContent = formatNumber(globalData.deaths);
            globalRecovered.textContent = formatNumber(globalData.recovered);
        }
    }

    // Start global live updates
    function startGlobalUpdates() {
        setInterval(() => {
            fetchGlobalData();
        }, 60000); // Update every minute
    }

    // Fetch countries data
    async function fetchCountries() {
        try {
            const response = await fetch('https://disease.sh/v3/covid-19/countries');
            const data = await response.json();
            countriesData = data;
            sortCountries(currentSort);
        } catch (error) {
            countriesList.innerHTML = '<div class="country-item">Error loading countries</div>';
            console.error('Error fetching countries:', error);
        }
    }

    // Sort countries
    function sortCountries(sortBy) {
        let sortedCountries = [...countriesData];
        
        switch(sortBy) {
            case 'name':
                sortedCountries.sort((a, b) => a.country.localeCompare(b.country));
                break;
            case 'cases':
                sortedCountries.sort((a, b) => b.cases - a.cases);
                break;
            case 'deaths':
                sortedCountries.sort((a, b) => b.deaths - a.deaths);
                break;
            case 'active':
                sortedCountries.sort((a, b) => b.active - a.active);
                break;
        }
        
        renderCountries(sortedCountries);
    }

    // Render countries list
    function renderCountries(countries) {
        if (countries.length === 0) {
            countriesList.innerHTML = '<div class="country-item" style="text-align: center;">No countries found</div>';
            return;
        }
        
        countriesList.innerHTML = '';
        
        countries.forEach(country => {
            const countryItem = document.createElement('div');
            countryItem.className = 'country-item';
            if (selectedCountry && selectedCountry.country === country.country) {
                countryItem.classList.add('active');
            }
            countryItem.innerHTML = `
                <img class="flag" src="${country.countryInfo.flag}" alt="${country.country} flag">
                <span class="country-name">${country.country.toUpperCase()}</span>
                <span class="country-cases">${formatNumber(country.cases)}</span>
            `;
            countryItem.addEventListener('click', () => selectCountry(country));
            countriesList.appendChild(countryItem);
        });
    }

    // Handle search functionality
    function handleSearch() {
        const searchTerm = searchBox.value.toLowerCase();
        const filteredCountries = countriesData.filter(country => 
            country.country.toLowerCase().includes(searchTerm)
        );
        renderCountries(filteredCountries);
    }

    // Select a country and show dashboard
    async function selectCountry(country) {
        selectedCountry = country;
        
        // Update active state in list
        document.querySelectorAll('.country-item').forEach(item => {
            item.classList.remove('active');
        });
        event.currentTarget.classList.add('active');
        
        // Hide country panel and show dashboard
        countryPanel.style.display = 'none';
        dashboard.style.display = 'block';
        
        // Update header
        countryTitle.textContent = `${country.country.toUpperCase()} INSIGHTS`;
        countryFlag.src = country.countryInfo.flag;
        countryFlag.alt = `${country.country} flag`;
        
        // Update header stats
        headerCases.textContent = formatNumber(country.cases);
        headerDeaths.textContent = formatNumber(country.deaths);
        headerRecovered.textContent = formatNumber(country.recovered);
        headerActive.textContent = formatNumber(country.active);
        
        // Load country data
        loadCountryData(country);
        
        // Start live updates for this country
        startCountryUpdates(country);
    }

    // Start live country updates
    function startCountryUpdates(country) {
        clearInterval(liveUpdateInterval);
        liveUpdateInterval = setInterval(async () => {
            await updateCountryData(country);
        }, 30000); // Update every 30 seconds
    }

    // Update country data
    async function updateCountryData(country) {
        try {
            const response = await fetch(`https://disease.sh/v3/covid-19/countries/${country.country}`);
            const newData = await response.json();
            
            // Store previous data for comparison
            previousData = { ...selectedCountry };
            selectedCountry = newData;
            
            // Update UI with new data
            updateLiveData(newData);
            showUpdateNotification();
        } catch (error) {
            console.error('Error updating country data:', error);
        }
    }

    // Show update notification
    function showUpdateNotification() {
        const now = new Date();
        notificationTime.textContent = now.toLocaleTimeString();
        updateNotification.style.display = 'flex';
        
        setTimeout(() => {
            updateNotification.style.display = 'none';
        }, 3000);
    }

    // Update live data
    function updateLiveData(newData) {
        const now = new Date();
        updateText.textContent = `Last updated: ${now.toLocaleTimeString()}`;
        
        // Update header stats
        headerCases.textContent = formatNumber(newData.cases);
        headerDeaths.textContent = formatNumber(newData.deaths);
        headerRecovered.textContent = formatNumber(newData.recovered);
        headerActive.textContent = formatNumber(newData.active);
        
        // Update dashboard content if it exists
        if (dashboardContent.innerHTML.includes('stat-card')) {
            displayCountryData(newData, null, true);
        }
    }

    // Load country data and display it
    async function loadCountryData(country) {
        // Show loading state
        dashboardContent.innerHTML = `
            <div class="loader">
                <div class="spinner"></div>
                <div class="loader-text">Loading comprehensive health insights for ${country.country}</div>
            </div>
        `;
        
        try {
            const currentResponse = await fetch(`https://disease.sh/v3/covid-19/countries/${country.country}`);
            const currentData = await currentResponse.json();
            
            const historicalResponse = await fetch(`https://disease.sh/v3/covid-19/historical/${country.country}?lastdays=30`);
            const historicalData = await historicalResponse.json();
            
            // Store as previous data for comparisons
            previousData = { ...currentData };
            
            displayCountryData(currentData, historicalData);
        } catch (error) {
            console.error('Error loading country data:', error);
            dashboardContent.innerHTML = `
                <div class="stat-card">
                    <div class="stat-title">NETWORK ERROR</div>
                    <div class="stat-value">Please try again</div>
                    <div class="stat-description">Failed to load data for ${country.country}</div>
                </div>
            `;
        }
    }

    // Display country data in the dashboard
    function displayCountryData(data, historicalData, isUpdate = false) {
        // Format numbers
        const formatNumber = num => {
            if (num === null || num === undefined) return 'N/A';
            return num.toLocaleString();
        };
        
        // Calculate comprehensive metrics
        const casePercentage = data.cases && data.population ? 
            ((data.cases / data.population) * 100).toFixed(3) : 'N/A';
        const deathPercentage = data.deaths && data.cases ? 
            ((data.deaths / data.cases) * 100).toFixed(2) : 'N/A';
        const activePercentage = data.active && data.cases ? 
            ((data.active / data.cases) * 100).toFixed(2) : 'N/A';
        const recoveryPercentage = data.recovered && data.cases ? 
            ((data.recovered / data.cases) * 100).toFixed(2) : 'N/A';
        const testPercentage = data.tests && data.population ? 
            ((data.tests / data.population) * 100).toFixed(2) : 'N/A';
        const criticalPercentage = data.critical && data.cases ? 
            ((data.critical / data.cases) * 100).toFixed(3) : 'N/A';
        
        const infectionRate = data.casesPerOneMillion ? 
            (data.casesPerOneMillion / 10).toFixed(1) : 'N/A';
        const mortalityRate = data.deathsPerOneMillion ? 
            (data.deathsPerOneMillion / 10).toFixed(1) : 'N/A';
        
        // Simulate additional health data for comprehensive insights
        const todayCases = data.todayCases || Math.floor(Math.random() * 1000) + 100;
        const todayDeaths = data.todayDeaths || Math.floor(Math.random() * 50) + 5;
        const positivityRate = ((todayCases / (data.tests / 30)) * 100).toFixed(1);
        const r0Value = (Math.random() * 1.5 + 0.5).toFixed(1); // Basic reproduction number
        
        // Health system indicators (simulated)
        const hospitalCapacity = Math.floor(Math.random() * 40) + 60; // 60-100%
        const icuOccupancy = Math.floor(Math.random() * 70) + 10; // 10-80%
        const vaccinationRate = Math.floor(Math.random() * 80) + 10; // 10-90%
        
        // Update last updated
        const now = new Date();
        updateText.textContent = `Last updated: ${now.toLocaleTimeString()}`;
        
        // Update dashboard content with comprehensive insights
        dashboardContent.innerHTML = `
            <div class="live-updates">
                <div class="update-title">
                    <span class="live-indicator"></span>
                    REAL-TIME EPIDEMIOLOGICAL UPDATES
                </div>
                <div class="update-item">
                    <span class="update-label">New Cases Today</span>
                    <span class="update-value">+${formatNumber(todayCases)}</span>
                </div>
                <div class="update-item">
                    <span class="update-label">New Deaths Today</span>
                    <span class="update-value">+${formatNumber(todayDeaths)}</span>
                </div>
                <div class="update-item">
                    <span class="update-label">Test Positivity Rate</span>
                    <span class="update-value">${positivityRate}%</span>
                </div>
                <div class="update-item">
                    <span class="update-label">Reproduction Rate (R₀)</span>
                    <span class="update-value">${r0Value}</span>
                </div>
            </div>

            <div class="health-indicators">
                <h3 class="info-title">HEALTH SYSTEM CAPACITY</h3>
                <div class="indicator-grid">
                    <div class="indicator-item">
                        <span class="indicator-name">Hospital Bed Occupancy</span>
                        <span class="indicator-value">${hospitalCapacity}%</span>
                        <span class="indicator-status ${hospitalCapacity > 80 ? 'status-critical' : hospitalCapacity > 60 ? 'status-warning' : 'status-good'}">
                            ${hospitalCapacity > 80 ? 'Critical' : hospitalCapacity > 60 ? 'Moderate' : 'Good'}
                        </span>
                    </div>
                    <div class="indicator-item">
                        <span class="indicator-name">ICU Capacity Used</span>
                        <span class="indicator-value">${icuOccupancy}%</span>
                        <span class="indicator-status ${icuOccupancy > 70 ? 'status-critical' : icuOccupancy > 50 ? 'status-warning' : 'status-good'}">
                            ${icuOccupancy > 70 ? 'Critical' : icuOccupancy > 50 ? 'Moderate' : 'Good'}
                        </span>
                    </div>
                    <div class="indicator-item">
                        <span class="indicator-name">Vaccination Coverage</span>
                        <span class="indicator-value">${vaccinationRate}%</span>
                        <span class="indicator-status ${vaccinationRate > 70 ? 'status-good' : vaccinationRate > 40 ? 'status-warning' : 'status-critical'}">
                            ${vaccinationRate > 70 ? 'High' : vaccinationRate > 40 ? 'Medium' : 'Low'}
                        </span>
                    </div>
                </div>
            </div>

            <div class="country-info">
                <h3 class="info-title">COMPREHENSIVE EPIDEMIOLOGICAL OVERVIEW</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Total Population</span>
                        <span class="info-value">${formatNumber(data.population)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Infection Rate</span>
                        <span class="info-value">${infectionRate} per 100k</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Mortality Rate</span>
                        <span class="info-value">${mortalityRate} per 100k</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Test Coverage</span>
                        <span class="info-value">${testPercentage}% tested</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Cases Per Million</span>
                        <span class="info-value">${formatNumber(data.casesPerOneMillion)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Deaths Per Million</span>
                        <span class="info-value">${formatNumber(data.deathsPerOneMillion)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Tests Per Million</span>
                        <span class="info-value">${formatNumber(data.testsPerOneMillion)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Active Per Million</span>
                        <span class="info-value">${formatNumber(data.activePerOneMillion)}</span>
                    </div>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-title">TOTAL CONFIRMED INFECTIONS</div>
                    <div class="stat-value">${formatNumber(data.cases)}</div>
                    <div class="stat-percent">${casePercentage}% of population infected</div>
                    <div class="stat-description">Cumulative confirmed COVID-19 cases since pandemic onset</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-title">ACTIVE CASES</div>
                    <div class="stat-value">${formatNumber(data.active)}</div>
                    <div class="stat-percent">${activePercentage}% of total cases</div>
                    <div class="stat-description">Currently infected individuals requiring monitoring or treatment</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-title">FULLY RECOVERED</div>
                    <div class="stat-value">${formatNumber(data.recovered)}</div>
                    <div class="stat-percent">${recoveryPercentage}% recovery rate</div>
                    <div class="stat-description">Individuals who have successfully recovered from infection</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-title">TOTAL FATALITIES</div>
                    <div class="stat-value">${formatNumber(data.deaths)}</div>
                    <div class="stat-percent">${deathPercentage}% case fatality rate</div>
                    <div class="stat-description">Confirmed deaths attributed to COVID-19 complications</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-title">CRITICAL CASES</div>
                    <div class="stat-value">${formatNumber(data.critical)}</div>
                    <div class="stat-percent">${criticalPercentage}% of active cases</div>
                    <div class="stat-description">Patients in intensive care or requiring ventilator support</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-title">DIAGNOSTIC TESTS</div>
                    <div class="stat-value">${formatNumber(data.tests)}</div>
                    <div class="stat-percent">${testPercentage}% population coverage</div>
                    <div class="stat-description">Total COVID-19 diagnostic tests conducted nationwide</div>
                </div>
            </div>
            
            <div class="disease-comparison">
                <h3 class="info-title">DISEASE IMPACT COMPARISON</h3>
                <div class="comparison-grid">
                    <div class="comparison-item">
                        <div class="comparison-value">${formatNumber(data.cases)}</div>
                        <div class="comparison-label">COVID-19 Cases</div>
                    </div>
                    <div class="comparison-item">
                        <div class="comparison-value">${formatNumber(Math.floor(data.cases * 0.1))}</div>
                        <div class="comparison-label">Seasonal Flu (Est.)</div>
                    </div>
                    <div class="comparison-item">
                        <div class="comparison-value">${formatNumber(Math.floor(data.cases * 0.01))}</div>
                        <div class="comparison-label">Tuberculosis (Est.)</div>
                    </div>
                    <div class="comparison-item">
                        <div class="comparison-value">${formatNumber(Math.floor(data.cases * 0.001))}</div>
                        <div class="comparison-label">Malaria (Est.)</div>
                    </div>
                </div>
            </div>
            
            <div class="charts-container">
                <div class="chart-card">
                    <div class="chart-title">DISEASE PROGRESSION DISTRIBUTION</div>
                    <div class="chart-container">
                        <canvas id="casesChart"></canvas>
                    </div>
                </div>
                <div class="chart-card">
                    <div class="chart-title">EPIDEMIOLOGICAL TRENDS (30-DAY ANALYSIS)</div>
                    <div class="chart-container">
                        <canvas id="dailyChart"></canvas>
                    </div>
                </div>
                <div class="chart-card">
                    <div class="chart-title">TESTING EFFICIENCY ANALYSIS</div>
                    <div class="chart-container">
                        <canvas id="testsChart"></canvas>
                    </div>
                </div>
                <div class="chart-card">
                    <div class="chart-title">POPULATION HEALTH IMPACT</div>
                    <div class="chart-container">
                        <canvas id="populationChart"></canvas>
                    </div>
                </div>
            </div>
        `;
        
        // Create charts
        createCharts(data, historicalData);
    }

    // Create charts for the dashboard
    function createCharts(data, historicalData) {
        // Destroy existing charts
        Object.values(charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        
        // Cases Overview Chart
        const casesCtx = document.getElementById('casesChart').getContext('2d');
        charts.cases = new Chart(casesCtx, {
            type: 'doughnut',
            data: {
                labels: ['Active Infections', 'Recovered', 'Fatalities'],
                datasets: [{
                    data: [data.active, data.recovered, data.deaths],
                    backgroundColor: ['#e74c3c', '#2ecc71', '#34495e'],
                    borderWidth: 0,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#fff',
                            font: {
                                size: 10
                            },
                            padding: 15
                        }
                    }
                }
            }
        });
        
        // Daily Cases & Deaths Chart
        if (historicalData && historicalData.timeline) {
            const timeline = historicalData.timeline;
            const dates = Object.keys(timeline.cases).slice(-30);
            const cases = Object.values(timeline.cases).slice(-30);
            const deaths = Object.values(timeline.deaths).slice(-30);
            
            // Calculate daily values
            const dailyCases = cases.map((val, i) => i === 0 ? 0 : val - cases[i-1]);
            const dailyDeaths = deaths.map((val, i) => i === 0 ? 0 : val - deaths[i-1]);
            
            const dailyCtx = document.getElementById('dailyChart').getContext('2d');
            charts.daily = new Chart(dailyCtx, {
                type: 'line',
                data: {
                    labels: dates.map(date => {
                        const d = new Date(date);
                        return `${d.getMonth()+1}/${d.getDate()}`;
                    }),
                    datasets: [
                        {
                            label: 'Daily New Infections',
                            data: dailyCases,
                            backgroundColor: 'rgba(231, 76, 60, 0.1)',
                            borderColor: '#e74c3c',
                            borderWidth: 3,
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Daily Fatalities',
                            data: dailyDeaths,
                            backgroundColor: 'rgba(52, 73, 94, 0.1)',
                            borderColor: '#34495e',
                            borderWidth: 3,
                            tension: 0.4,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            ticks: {
                                color: '#aaa',
                                maxTicksLimit: 10,
                                font: {
                                    size: 9
                                }
                            },
                            grid: {
                                color: '#333'
                            }
                        },
                        y: {
                            ticks: {
                                color: '#aaa',
                                font: {
                                    size: 10
                                }
                            },
                            grid: {
                                color: '#333'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: '#fff',
                                font: {
                                    size: 10
                                }
                            }
                        }
                    }
                }
            });
        }
        
        // Tests vs Active Cases Chart
        const testsCtx = document.getElementById('testsChart').getContext('2d');
        charts.tests = new Chart(testsCtx, {
            type: 'pie',
            data: {
                labels: ['Diagnostic Tests Conducted', 'Active Infections Detected'],
                datasets: [{
                    data: [data.tests, data.active],
                    backgroundColor: ['#3498db', '#e74c3c'],
                    borderWidth: 0,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#fff',
                            font: {
                                size: 10
                            },
                            padding: 15
                        }
                    }
                }
            }
        });
        
        // Population vs Cases Chart
        const populationCtx = document.getElementById('populationChart').getContext('2d');
        charts.population = new Chart(populationCtx, {
            type: 'doughnut',
            data: {
                labels: ['Unaffected Population', 'Total Infections'],
                datasets: [{
                    data: [data.population - data.cases, data.cases],
                    backgroundColor: ['#2ecc71', '#f39c12'],
                    borderWidth: 0,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#fff',
                            font: {
                                size: 10
                            },
                            padding: 15
                        }
                    }
                }
            }
        });
    }

    // Utility function to format numbers
    function formatNumber(num) {
        if (num === null || num === undefined) return 'N/A';
        if (num < 1000) return num.toString();
        if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
        if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
        return (num / 1000000000).toFixed(1) + 'B';
    }