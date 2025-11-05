let scene, camera, renderer, earth, controls;
let satellites = [];
let orbitLines = [];
let selectedSatellite = null;
let clock = new THREE.Clock();
let isAnimating = false;

// Control states
let autoRotation = true;
let showOrbits = false;
let realTimeMode = true;
let earthAxialTilt = 23.4;
let currentFilter = 'all';

// Global variables for countries and satellites
let allCountries = [];
let countrySatellitesMap = {};
let selectedCountry = null;

// Country Data with colors for major space-faring nations
const countryColors = {
    'United States': 0x1a75ff,
    'Russia': 0xff4444,
    'China': 0xff6b6b,
    'Japan': 0xff3333,
    'India': 0xff9933,
    'France': 0x0055ff,
    'Germany': 0xffcc00,
    'United Kingdom': 0x0052ff,
    'Canada': 0xff0000,
    'Italy': 0x00ff00,
    'Brazil': 0x00cc00,
    'South Korea': 0x0044cc,
    'Israel': 0x0066ff,
    'United Arab Emirates': 0xff3300,
    'Ukraine': 0x0055ff,
    'European Space Agency': 0x0044ff,
    'Australia': 0xcc00cc,
    'Mexico': 0x00cc99,
    'Argentina': 0x3399ff,
    'South Africa': 0xff6600,
    'Nigeria': 0x00cc66,
    'Egypt': 0xffcc00,
    'Turkey': 0xcc3333,
    'Iran': 0x6633ff,
    'Pakistan': 0x00ccff,
    'Indonesia': 0xff3366,
    'Malaysia': 0xccff00,
    'Thailand': 0xff66cc,
    'Vietnam': 0x33ccff,
    'Philippines': 0xff9933,
    'Saudi Arabia': 0x00ff99,
    'Chile': 0xff3399,
    'Peru': 0x66ff33,
    'Colombia': 0x33ffcc,
    'Venezuela': 0xff33cc,
    'Poland': 0xccff33,
    'Netherlands': 0x33cc99,
    'Sweden': 0x9933ff,
    'Norway': 0x33ff99,
    'Finland': 0xffcc33,
    'Denmark': 0x99ff33,
    'Switzerland': 0xff3333,
    'Austria': 0xff6633,
    'Belgium': 0x33ff66,
    'Portugal': 0xcc6633,
    'Greece': 0x3366ff,
    'Czech Republic': 0xff9966,
    'Romania': 0x66ccff,
    'Hungary': 0xcc3366,
    'Bulgaria': 0x66ffcc,
    'Croatia': 0xff66ff,
    'Slovakia': 0x33cccc,
    'Slovenia': 0xcc99ff,
    'Lithuania': 0x99ccff,
    'Latvia': 0xffcc66,
    'Estonia': 0x66cc99,
    'Luxembourg': 0xccff99,
    'Malta': 0xff99cc,
    'Cyprus': 0x99ffcc,
    'Iceland': 0xcc99cc,
    'Ireland': 0x33ff33,
    'New Zealand': 0xff33ff,
    'Singapore': 0x33ffff,
    'Taiwan': 0xffff33,
    'Hong Kong': 0xff3333,
    'Bangladesh': 0x33ff99,
    'Sri Lanka': 0x9933cc,
    'Nepal': 0xcc3333,
    'Myanmar': 0x33cc33,
    'Cambodia': 0xcc9933,
    'Laos': 0x3399cc,
    'Mongolia': 0xcc6633,
    'Kazakhstan': 0x33cc66,
    'Uzbekistan': 0xcc3366,
    'Turkmenistan': 0x6633cc,
    'Azerbaijan': 0xccff66,
    'Georgia': 0x66ff99,
    'Armenia': 0xff6699,
    'Belarus': 0x99ff66,
    'Moldova': 0x66cc66,
    'Kyrgyzstan': 0xcc6699,
    'Tajikistan': 0x6699cc
};

// Satellite Types
const satelliteTypes = [
    'GPS', 'Starlink', 'OneWeb', 'Iridium', 'Galileo', 'GLONASS', 'BeiDou', 
    'GOES', 'Meteosat', 'Sentinel', 'Terra', 'Aqua', 'CALIPSO', 'CloudSat',
    'Intelsat', 'SES', 'Eutelsat', 'Inmarsat', 'Thuraya', 'Globalstar',
    'Orbcomm', 'Planet', 'Spire', 'BlackSky', 'Capella', 'ICEYE',
    'COSMO-SkyMed', 'Radarsat', 'Kompsat', 'ALOS', 'Resourcesat', 'Cartosat'
];

// REAL SATELLITE DATA WITH COUNTRY INFORMATION
const satelliteData = [
    // UNITED STATES SATELLITES
    {
        id: 'iss',
        name: 'International Space Station',
        type: 'Space Station',
        country: 'United States',
        altitude: 408,
        inclination: 51.6,
        period: 92.9,
        color: 0x00ff00,
        size: 0.025,
        description: 'The International Space Station is a modular space station in low Earth orbit. It is a multinational collaborative project involving five participating space agencies: NASA, Roscosmos, JAXA, ESA, and CSA.',
        operator: 'International Partnership',
        image: 'https://images-assets.nasa.gov/image/iss066e137588/iss066e137588~large.jpg',
        launchDate: '1998-11-20',
        mass: '419,725 kg',
        dimensions: '109m × 73m × 20m',
        modelType: 'iss',
        status: 'operational'
    },
    {
        id: 'hubble',
        name: 'Hubble Space Telescope',
        type: 'Space Telescope',
        country: 'United States',
        altitude: 547,
        inclination: 28.5,
        period: 95.4,
        color: 0xaa00aa,
        size: 0.018,
        description: 'The Hubble Space Telescope is a large space telescope orbiting Earth. The telescope captures stunning images of faraway galaxies and has revolutionized astronomy.',
        operator: 'NASA/ESA',
        image: 'https://images-assets.nasa.gov/image/iss035e015472/iss035e015472~large.jpg',
        launchDate: '1990-04-24',
        mass: '11,110 kg',
        dimensions: '13.2m × 4.2m',
        modelType: 'hubble',
        status: 'operational'
    },
    {
        id: 'jwst',
        name: 'James Webb Space Telescope',
        type: 'Space Telescope',
        country: 'United States',
        altitude: 1500000,
        inclination: 0,
        period: 86400,
        color: 0xcc00cc,
        size: 0.020,
        description: 'The James Webb Space Telescope is the largest, most powerful space telescope ever built. It will allow scientists to look at what our universe was like about 200 million years after the Big Bang.',
        operator: 'NASA/ESA/CSA',
        image: 'https://images-assets.nasa.gov/image/PIA20063/PIA20063~large.jpg',
        launchDate: '2021-12-25',
        mass: '6,500 kg',
        dimensions: '21.2m × 14.2m',
        modelType: 'jwst',
        status: 'operational'
    },
    {
        id: 'gps-1',
        name: 'GPS IIF-1',
        type: 'Navigation',
        country: 'United States',
        altitude: 20200,
        inclination: 55,
        period: 720,
        color: 0xff4444,
        size: 0.008,
        description: 'Global Positioning System satellite with atomic clocks providing precise timing and navigation data worldwide.',
        operator: 'US Space Force',
        image: 'https://images-assets.nasa.gov/image/0202795/0202795~large.jpg',
        launchDate: '2010-05-28',
        mass: '1,630 kg',
        dimensions: '5.3m × 1.9m',
        modelType: 'gps',
        status: 'operational'
    },
    {
        id: 'starlink-1',
        name: 'Starlink Satellite',
        type: 'Communication',
        country: 'United States',
        altitude: 550,
        inclination: 53,
        period: 95,
        color: 0xffcc00,
        size: 0.006,
        description: 'Flat-panel broadband internet satellite providing global internet coverage with advanced phased array antennas.',
        operator: 'SpaceX',
        image: 'https://images-assets.nasa.gov/image/KSC-20190523-PH-SX01_0005/KSC-20190523-PH-SX01_0005~large.jpg',
        launchDate: '2019-05-23',
        mass: '260 kg',
        dimensions: '2.8m × 1.4m × 0.2m',
        modelType: 'starlink',
        status: 'operational'
    },
    {
        id: 'goes-18',
        name: 'GOES-18',
        type: 'Weather',
        country: 'United States',
        altitude: 35786,
        inclination: 0,
        period: 1440,
        color: 0x66b2ff,
        size: 0.014,
        description: 'GOES-18 is the third satellite in the GOES-R series of advanced weather monitoring satellites, providing critical weather data for North America.',
        operator: 'NOAA/NASA',
        image: 'https://images-assets.nasa.gov/image/KSC-20220301-PH-KLS01_0004/KSC-20220301-PH-KLS01_0004~large.jpg',
        launchDate: '2022-03-01',
        mass: '5,192 kg',
        dimensions: '6.1m × 5.6m × 3.9m',
        modelType: 'weather',
        status: 'operational'
    },

    // RUSSIAN SATELLITES
    {
        id: 'sputnik-1',
        name: 'Sputnik 1',
        type: 'Experimental',
        country: 'Russia',
        altitude: 577,
        inclination: 65,
        period: 96.2,
        color: 0xff4444,
        size: 0.005,
        description: 'The first artificial Earth satellite launched by the Soviet Union in 1957, marking the beginning of the space age.',
        operator: 'Roscosmos',
        image: 'https://images-assets.nasa.gov/image/S55-00371/S55-00371~large.jpg',
        launchDate: '1957-10-04',
        mass: '83.6 kg',
        dimensions: '0.58m diameter',
        modelType: 'generic',
        status: 'decommissioned'
    },
    {
        id: 'mir',
        name: 'Mir Space Station',
        type: 'Space Station',
        country: 'Russia',
        altitude: 354,
        inclination: 51.6,
        period: 91.9,
        color: 0xff6666,
        size: 0.020,
        description: 'Mir was a space station that operated in low Earth orbit from 1986 to 2001, owned by the Soviet Union and later by Russia.',
        operator: 'Roscosmos',
        image: 'https://images-assets.nasa.gov/image/STS091-725-063/STS091-725-063~large.jpg',
        launchDate: '1986-02-19',
        mass: '129,700 kg',
        dimensions: '19m × 31m × 27.5m',
        modelType: 'iss',
        status: 'decommissioned'
    },

    // CHINESE SATELLITES
    {
        id: 'tianhe',
        name: 'Tianhe Core Module',
        type: 'Space Station',
        country: 'China',
        altitude: 389,
        inclination: 41.5,
        period: 92.2,
        color: 0xff6b6b,
        size: 0.018,
        description: 'Core module of the Chinese Tiangong Space Station, providing living quarters and control center for the station.',
        operator: 'CNSA',
        image: 'https://images-assets.nasa.gov/image/iss065e081011/iss065e081011~large.jpg',
        launchDate: '2021-04-29',
        mass: '22,500 kg',
        dimensions: '16.6m × 4.2m',
        modelType: 'iss',
        status: 'operational'
    },

    // EUROPEAN SATELLITES
    {
        id: 'galileo-1',
        name: 'Galileo IOV-1',
        type: 'Navigation',
        country: 'European Space Agency',
        altitude: 23222,
        inclination: 56,
        period: 840,
        color: 0x0044ff,
        size: 0.009,
        description: 'European global navigation satellite system providing highly accurate global positioning service.',
        operator: 'European Space Agency',
        image: 'https://images-assets.nasa.gov/image/0202795/0202795~large.jpg',
        launchDate: '2011-10-21',
        mass: '700 kg',
        dimensions: '2.7m × 1.2m × 1.1m',
        modelType: 'gps',
        status: 'operational'
    },

    // JAPANESE SATELLITES
    {
        id: 'kibo',
        name: 'Kibo Laboratory',
        type: 'Space Station Module',
        country: 'Japan',
        altitude: 408,
        inclination: 51.6,
        period: 92.9,
        color: 0xff3333,
        size: 0.015,
        description: 'Japanese Experiment Module, the largest single ISS module, used for various scientific experiments.',
        operator: 'JAXA',
        image: 'https://images-assets.nasa.gov/image/iss016e027468/iss016e027468~large.jpg',
        launchDate: '2008-03-11',
        mass: '15,900 kg',
        dimensions: '11.2m × 4.4m',
        modelType: 'iss',
        status: 'operational'
    },

    // INDIAN SATELLITES
    {
        id: 'gsat-1',
        name: 'GSAT-1',
        type: 'Communication',
        country: 'India',
        altitude: 35786,
        inclination: 0,
        period: 1440,
        color: 0xff9933,
        size: 0.010,
        description: 'Indian communications satellite for telecommunications and broadcasting services.',
        operator: 'ISRO',
        image: 'https://images-assets.nasa.gov/image/0202795/0202795~large.jpg',
        launchDate: '2001-04-18',
        mass: '1,540 kg',
        dimensions: '2.0m × 1.8m × 2.2m',
        modelType: 'generic',
        status: 'degraded'
    }
];

// Add more satellites for various countries
const satelliteCountries = [
    'United States', 'Russia', 'China', 'European Space Agency', 'Japan', 'India', 
    'Canada', 'United Kingdom', 'Germany', 'France', 'Italy', 'Brazil', 'South Korea', 
    'Israel', 'Australia', 'Mexico', 'Argentina', 'South Africa', 'Nigeria', 'Egypt',
    'Turkey', 'Iran', 'Pakistan', 'Indonesia', 'Malaysia', 'Thailand', 'Vietnam',
    'Philippines', 'Saudi Arabia', 'Chile', 'Peru', 'Colombia', 'Venezuela', 'Poland',
    'Netherlands', 'Sweden', 'Norway', 'Finland', 'Denmark', 'Switzerland', 'Austria',
    'Belgium', 'Portugal', 'Greece', 'Czech Republic', 'Romania', 'Hungary', 'Bulgaria',
    'Croatia', 'Slovakia', 'Slovenia', 'Lithuania', 'Latvia', 'Estonia', 'Luxembourg',
    'Malta', 'Cyprus', 'Iceland', 'Ireland', 'New Zealand', 'Singapore', 'Taiwan',
    'Hong Kong', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Myanmar', 'Cambodia', 'Laos',
    'Mongolia', 'Kazakhstan', 'Uzbekistan', 'Turkmenistan', 'Azerbaijan', 'Georgia',
    'Armenia', 'Belarus', 'Moldova', 'Kyrgyzstan', 'Tajikistan'
];

// Generate 500+ satellites
for (let i = 1; i <= 500; i++) {
    const baseSat = satelliteData[i % satelliteData.length];
    const country = satelliteCountries[i % satelliteCountries.length];
    const type = satelliteTypes[i % satelliteTypes.length];
    const statuses = ['operational', 'degraded', 'failed', 'decommissioned'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    satelliteData.push({
        ...baseSat,
        id: `${baseSat.id}-${i}`,
        name: `${country} ${type} ${i}`,
        type: type,
        country: country,
        operator: `${country} Space Agency`,
        altitude: baseSat.altitude + (Math.random() - 0.5) * 1000,
        inclination: baseSat.inclination + (Math.random() - 0.5) * 10,
        color: countryColors[country] || 0x666666,
        size: baseSat.size * (0.7 + Math.random() * 0.6),
        modelType: baseSat.modelType,
        image: baseSat.image,
        status: status
    });
}

// Initialize country-satellite mapping
function initializeCountrySatellites() {
    satelliteData.forEach(satellite => {
        if (!countrySatellitesMap[satellite.country]) {
            countrySatellitesMap[satellite.country] = [];
        }
        countrySatellitesMap[satellite.country].push(satellite);
    });
}

// Fetch all countries from REST Countries API
async function fetchAllCountries() {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all');
        const countries = await response.json();
        
        // Sort countries alphabetically
        allCountries = countries.sort((a, b) => 
            a.name.common.localeCompare(b.name.common)
        );
        
        // Add major space organizations
        allCountries.push({
            name: { common: 'European Space Agency' },
            flags: { png: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/ESA_logo_2015.svg' }
        });
        
        displayAllCountries();
    } catch (error) {
        console.error('Error fetching countries:', error);
        // Fallback to basic country list
        loadFallbackCountries();
    }
}

// Fallback countries in case API fails
function loadFallbackCountries() {
    const fallbackCountries = [
        'United States', 'Russia', 'China', 'Japan', 'India', 'France', 'Germany', 
        'United Kingdom', 'Canada', 'Italy', 'Brazil', 'South Korea', 'Israel',
        'Ukraine', 'Spain', 'Australia', 'Mexico', 'Argentina', 'South Africa',
        'Nigeria', 'Egypt', 'Turkey', 'Iran', 'Pakistan', 'Indonesia', 'Malaysia',
        'Thailand', 'Vietnam', 'Philippines', 'European Space Agency', 'Saudi Arabia',
        'Chile', 'Peru', 'Colombia', 'Venezuela', 'Poland', 'Netherlands', 'Sweden',
        'Norway', 'Finland', 'Denmark', 'Switzerland', 'Austria', 'Belgium', 'Portugal',
        'Greece', 'Czech Republic', 'Romania', 'Hungary', 'Bulgaria', 'Croatia',
        'Slovakia', 'Slovenia', 'Lithuania', 'Latvia', 'Estonia', 'Luxembourg',
        'Malta', 'Cyprus', 'Iceland', 'Ireland', 'New Zealand', 'Singapore', 'Taiwan',
        'Hong Kong', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Myanmar', 'Cambodia', 'Laos',
        'Mongolia', 'Kazakhstan', 'Uzbekistan', 'Turkmenistan', 'Azerbaijan', 'Georgia',
        'Armenia', 'Belarus', 'Moldova', 'Kyrgyzstan', 'Tajikistan'
    ];
    
    allCountries = fallbackCountries.map(country => ({
        name: { common: country },
        flags: { png: `https://flagcdn.com/w320/${getCountryCode(country).toLowerCase()}.png` }
    }));
    
    displayAllCountries();
}

// Helper function to get country codes for flags
function getCountryCode(countryName) {
    const countryCodes = {
        'United States': 'US',
        'Russia': 'RU',
        'China': 'CN',
        'Japan': 'JP',
        'India': 'IN',
        'France': 'FR',
        'Germany': 'DE',
        'United Kingdom': 'GB',
        'Canada': 'CA',
        'Italy': 'IT',
        'Brazil': 'BR',
        'South Korea': 'KR',
        'Israel': 'IL',
        'Ukraine': 'UA',
        'Spain': 'ES',
        'Australia': 'AU',
        'Mexico': 'MX',
        'Argentina': 'AR',
        'South Africa': 'ZA',
        'Nigeria': 'NG',
        'Egypt': 'EG',
        'Turkey': 'TR',
        'Iran': 'IR',
        'Pakistan': 'PK',
        'Indonesia': 'ID',
        'Malaysia': 'MY',
        'Thailand': 'TH',
        'Vietnam': 'VN',
        'Philippines': 'PH',
        'European Space Agency': 'EU',
        'Saudi Arabia': 'SA',
        'Chile': 'CL',
        'Peru': 'PE',
        'Colombia': 'CO',
        'Venezuela': 'VE',
        'Poland': 'PL',
        'Netherlands': 'NL',
        'Sweden': 'SE',
        'Norway': 'NO',
        'Finland': 'FI',
        'Denmark': 'DK',
        'Switzerland': 'CH',
        'Austria': 'AT',
        'Belgium': 'BE',
        'Portugal': 'PT',
        'Greece': 'GR',
        'Czech Republic': 'CZ',
        'Romania': 'RO',
        'Hungary': 'HU',
        'Bulgaria': 'BG',
        'Croatia': 'HR',
        'Slovakia': 'SK',
        'Slovenia': 'SI',
        'Lithuania': 'LT',
        'Latvia': 'LV',
        'Estonia': 'EE',
        'Luxembourg': 'LU',
        'Malta': 'MT',
        'Cyprus': 'CY',
        'Iceland': 'IS',
        'Ireland': 'IE',
        'New Zealand': 'NZ',
        'Singapore': 'SG',
        'Taiwan': 'TW',
        'Hong Kong': 'HK',
        'Bangladesh': 'BD',
        'Sri Lanka': 'LK',
        'Nepal': 'NP',
        'Myanmar': 'MM',
        'Cambodia': 'KH',
        'Laos': 'LA',
        'Mongolia': 'MN',
        'Kazakhstan': 'KZ',
        'Uzbekistan': 'UZ',
        'Turkmenistan': 'TM',
        'Azerbaijan': 'AZ',
        'Georgia': 'GE',
        'Armenia': 'AM',
        'Belarus': 'BY',
        'Moldova': 'MD',
        'Kyrgyzstan': 'KG',
        'Tajikistan': 'TJ'
    };
    
    return countryCodes[countryName] || 'UN';
}

// Display all countries in the search results
function displayAllCountries() {
    const countryResults = document.getElementById('countryResults');
    countryResults.innerHTML = '';

    allCountries.forEach(country => {
        const countryItem = document.createElement('div');
        countryItem.className = 'country-item';
        
        const countryName = country.name.common;
        const flagUrl = country.flags?.png || `https://flagcdn.com/w320/${getCountryCode(countryName).toLowerCase()}.png`;
        const satelliteCount = countrySatellitesMap[countryName] ? countrySatellitesMap[countryName].length : 0;
        
        countryItem.innerHTML = `
            <img src="${flagUrl}" alt="${countryName}" class="country-flag" onerror="this.style.display='none'">
            <div class="satellite-text">
                <strong>${countryName}</strong>
                <small>${satelliteCount} satellite${satelliteCount !== 1 ? 's' : ''}</small>
            </div>
        `;
        
        countryItem.onclick = () => selectCountry(countryName);
        countryResults.appendChild(countryItem);
    });
}

// Search countries based on input
function searchCountries() {
    const searchTerm = document.getElementById('countrySearch').value.toLowerCase();
    const countryResults = document.getElementById('countryResults');
    
    if (searchTerm === '') {
        displayAllCountries();
        return;
    }
    
    const filteredCountries = allCountries.filter(country => 
        country.name.common.toLowerCase().includes(searchTerm)
    );
    
    countryResults.innerHTML = '';
    
    if (filteredCountries.length === 0) {
        // Search in satellite names if no countries found
        searchSatellitesByName(searchTerm);
        return;
    }
    
    filteredCountries.forEach(country => {
        const countryItem = document.createElement('div');
        countryItem.className = 'country-item';
        
        const countryName = country.name.common;
        const flagUrl = country.flags?.png || `https://flagcdn.com/w320/${getCountryCode(countryName).toLowerCase()}.png`;
        const satelliteCount = countrySatellitesMap[countryName] ? countrySatellitesMap[countryName].length : 0;
        
        countryItem.innerHTML = `
            <img src="${flagUrl}" alt="${countryName}" class="country-flag" onerror="this.style.display='none'">
            <div class="satellite-text">
                <strong>${countryName}</strong>
                <small>${satelliteCount} satellite${satelliteCount !== 1 ? 's' : ''}</small>
            </div>
        `;
        
        countryItem.onclick = () => selectCountry(countryName);
        countryResults.appendChild(countryItem);
    });
}

// Search satellites by name
function searchSatellitesByName(searchTerm) {
    const countryResults = document.getElementById('countryResults');
    const filteredSatellites = satelliteData.filter(satellite => 
        satellite.name.toLowerCase().includes(searchTerm) ||
        satellite.type.toLowerCase().includes(searchTerm) ||
        satellite.operator.toLowerCase().includes(searchTerm)
    );
    
    countryResults.innerHTML = '';
    
    if (filteredSatellites.length === 0) {
        countryResults.innerHTML = `
            <div class="detail-item" style="text-align: center; color: #666; font-style: italic;">
                No countries or satellites found for "${searchTerm}"
            </div>
        `;
        return;
    }
    
    // Group satellites by country
    const satellitesByCountry = {};
    filteredSatellites.forEach(satellite => {
        if (!satellitesByCountry[satellite.country]) {
            satellitesByCountry[satellite.country] = [];
        }
        satellitesByCountry[satellite.country].push(satellite);
    });
    
    // Display countries with matching satellites
    Object.keys(satellitesByCountry).forEach(countryName => {
        const countryItem = document.createElement('div');
        countryItem.className = 'country-item';
        
        const flagUrl = `https://flagcdn.com/w320/${getCountryCode(countryName).toLowerCase()}.png`;
        const satelliteCount = satellitesByCountry[countryName].length;
        
        countryItem.innerHTML = `
            <img src="${flagUrl}" alt="${countryName}" class="country-flag" onerror="this.style.display='none'">
            <div class="satellite-text">
                <strong>${countryName}</strong>
                <small>${satelliteCount} matching satellite${satelliteCount !== 1 ? 's' : ''}</small>
            </div>
        `;
        
        countryItem.onclick = () => {
            selectCountry(countryName);
            // Filter satellites by search term
            const filteredSats = satellitesByCountry[countryName];
            displayFilteredSatellites(countryName, filteredSats);
        };
        countryResults.appendChild(countryItem);
    });
}

// Set filter type
function setFilter(filterType) {
    currentFilter = filterType;
    
    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`filter${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`).classList.add('active');
    
    // If a country is selected, update its satellites view
    if (selectedCountry) {
        displayCountrySatellites(selectedCountry);
    }
    
    showNotification(`Filter: ${filterType}`);
}

// Select a country and show its satellites
function selectCountry(countryName) {
    selectedCountry = countryName;
    
    // Update UI
    document.getElementById('countrySearch').value = countryName;
    document.getElementById('countryResults').innerHTML = '';
    
    // Show satellites section
    const satellitesSection = document.getElementById('countrySatellites');
    const satellitesTitle = document.getElementById('countrySatellitesTitle');
    
    satellitesSection.style.display = 'block';
    satellitesTitle.textContent = `Satellites of ${countryName}`;
    
    // Display satellites for this country
    displayCountrySatellites(countryName);
    
    // Update 3D view to show only this country's satellites
    updateSatelliteVisibility(countryName);
    
    // Show notification
    showNotification(`Showing satellites from ${countryName}`);
}

// Display satellites for selected country with filtering
function displayCountrySatellites(countryName) {
    const satelliteResults = document.getElementById('satelliteResults');
    satelliteResults.innerHTML = '';
    
    let countrySats = countrySatellitesMap[countryName] || [];
    
    // Apply filters
    if (currentFilter !== 'all') {
        countrySats = countrySats.filter(satellite => {
            if (currentFilter === 'active') {
                return satellite.status === 'operational';
            } else if (currentFilter === 'communication') {
                return satellite.type.toLowerCase().includes('communication') || 
                       satellite.type.toLowerCase().includes('starlink') ||
                       satellite.type.toLowerCase().includes('intelsat');
            } else if (currentFilter === 'navigation') {
                return satellite.type.toLowerCase().includes('navigation') || 
                       satellite.type.toLowerCase().includes('gps') ||
                       satellite.type.toLowerCase().includes('galileo');
            } else if (currentFilter === 'weather') {
                return satellite.type.toLowerCase().includes('weather') || 
                       satellite.type.toLowerCase().includes('goes') ||
                       satellite.type.toLowerCase().includes('meteosat');
            }
            return true;
        });
    }
    
    if (countrySats.length === 0) {
        satelliteResults.innerHTML = `
            <div class="detail-item" style="text-align: center; color: #666; font-style: italic;">
                No satellites found for ${countryName} with current filter
            </div>
        `;
        return;
    }
    
    countrySats.forEach(satellite => {
        const satItem = document.createElement('div');
        satItem.className = 'satellite-item';
        
        const statusColors = {
            'operational': '#00ff00',
            'degraded': '#ffff00',
            'failed': '#ff0000',
            'decommissioned': '#666666'
        };
        
        const statusColor = statusColors[satellite.status] || '#666666';
        const statusIndicator = `<span class="status-indicator" style="background: ${statusColor}"></span>`;
        
        const imageHtml = satellite.image ? 
            `<img src="${satellite.image}" alt="${satellite.name}" class="satellite-image" onerror="this.style.display='none'">` : 
            `<div style="width: 32px; height: 32px; background: #333; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 0.6em; color: #666;">IMG</div>`;
        
        satItem.innerHTML = `
            ${imageHtml}
            <div class="satellite-text">
                <strong>${statusIndicator}${satellite.name}</strong>
                <small>${satellite.type} • ${satellite.operator}</small>
            </div>
        `;
        
        satItem.onclick = () => selectSatellite(satellite.id);
        satelliteResults.appendChild(satItem);
    });
}

// Display filtered satellites by search
function displayFilteredSatellites(countryName, filteredSatellites) {
    const satelliteResults = document.getElementById('satelliteResults');
    satelliteResults.innerHTML = '';
    
    if (filteredSatellites.length === 0) {
        satelliteResults.innerHTML = `
            <div class="detail-item" style="text-align: center; color: #666; font-style: italic;">
                No matching satellites found for ${countryName}
            </div>
        `;
        return;
    }
    
    filteredSatellites.forEach(satellite => {
        const satItem = document.createElement('div');
        satItem.className = 'satellite-item';
        
        const statusColors = {
            'operational': '#00ff00',
            'degraded': '#ffff00',
            'failed': '#ff0000',
            'decommissioned': '#666666'
        };
        
        const statusColor = statusColors[satellite.status] || '#666666';
        const statusIndicator = `<span class="status-indicator" style="background: ${statusColor}"></span>`;
        
        const imageHtml = satellite.image ? 
            `<img src="${satellite.image}" alt="${satellite.name}" class="satellite-image" onerror="this.style.display='none'">` : 
            `<div style="width: 32px; height: 32px; background: #333; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 0.6em; color: #666;">IMG</div>`;
        
        satItem.innerHTML = `
            ${imageHtml}
            <div class="satellite-text">
                <strong>${statusIndicator}${satellite.name}</strong>
                <small>${satellite.type} • ${satellite.operator}</small>
            </div>
        `;
        
        satItem.onclick = () => selectSatellite(satellite.id);
        satelliteResults.appendChild(satItem);
    });
}

// Update satellite visibility in 3D scene based on selected country
function updateSatelliteVisibility(countryName) {
    satellites.forEach(satellite => {
        const satData = satellite.userData;
        if (countryName === 'all' || satData.country === countryName) {
            satellite.visible = true;
        } else {
            satellite.visible = false;
        }
    });
    
    // Update orbit lines
    orbitLines.forEach(item => {
        const satData = satelliteData.find(sat => sat.id === item.satelliteId);
        if (satData) {
            if (countryName === 'all' || satData.country === countryName) {
                item.orbitLine.visible = (selectedSatellite && selectedSatellite.userData.id === satData.id) ? true : false;
            } else {
                item.orbitLine.visible = false;
            }
        }
    });
}

// Toggle satellite type visibility
function toggleSatelliteType(type) {
    if (type === 'all') {
        // Show all satellites
        satellites.forEach(satellite => {
            satellite.visible = true;
        });
        document.getElementById('allSatsBtn').classList.add('active');
        document.getElementById('activeSatsBtn').classList.remove('active');
        showNotification('Showing all satellites');
    } else if (type === 'active') {
        // Show only operational satellites
        satellites.forEach(satellite => {
            satellite.visible = satellite.userData.status === 'operational';
        });
        document.getElementById('allSatsBtn').classList.remove('active');
        document.getElementById('activeSatsBtn').classList.add('active');
        showNotification('Showing active satellites only');
    }
}

// Reset country selection
function resetCountrySelection() {
    selectedCountry = null;
    document.getElementById('countrySearch').value = '';
    document.getElementById('countrySatellites').style.display = 'none';
    displayAllCountries();
    updateSatelliteVisibility('all');
}

// Show notification
function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Initialize the application
function init() {
    // Initialize country-satellite mapping
    initializeCountrySatellites();
    
    // Fetch countries from API
    fetchAllCountries();
    
    // Setup Three.js scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 2.5;
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('earth-container').appendChild(renderer.domElement);
    
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.5;
    controls.maxDistance = 100;
    
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);
    
    createRealEarth();
    createSatellites();
    createStars();
    
    window.addEventListener('resize', onWindowResize);
    
    setTimeout(() => {
        document.getElementById('loading').style.display = 'none';
        showNotification('3D Earth Satellite Tracker Loaded! 500+ satellites from 80+ countries');
    }, 3000);
    
    animate();
}

function createRealEarth() {
    const earthGeometry = new THREE.SphereGeometry(1, 128, 128);
    const earthGroup = new THREE.Group();
    earthGroup.rotation.z = -earthAxialTilt * Math.PI / 180;
    
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
        'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/earth_atmos_2048.jpg',
        function(texture) {
            const earthMaterial = new THREE.MeshPhongMaterial({ 
                map: texture,
                specular: new THREE.Color(0x333333),
                shininess: 10
            });
            earth = new THREE.Mesh(earthGeometry, earthMaterial);
            earthGroup.add(earth);
            scene.add(earthGroup);
            earth.userData = { group: earthGroup };
        },
        undefined,
        function(error) {
            const earthMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x2233ff,
                specular: 0x1188ff,
                shininess: 5
            });
            earth = new THREE.Mesh(earthGeometry, earthMaterial);
            earthGroup.add(earth);
            scene.add(earthGroup);
            earth.userData = { group: earthGroup };
        }
    );
}

function createSatellites() {
    satelliteData.forEach(sat => {
        const orbitRadius = 1 + (sat.altitude / 6371);
        const satellite = createSatelliteModel(sat);
        
        const angle = Math.random() * Math.PI * 2;
        satellite.position.x = orbitRadius * Math.cos(angle);
        satellite.position.z = orbitRadius * Math.sin(angle) * Math.cos(sat.inclination * Math.PI / 180);
        satellite.position.y = orbitRadius * Math.sin(angle) * Math.sin(sat.inclination * Math.PI / 180);
        
        satellite.userData = { 
            ...sat, 
            orbitRadius, 
            angle, 
            speed: (2 * Math.PI) / (sat.period * 60),
            inclination: sat.inclination * Math.PI / 180
        };
        
        satellites.push(satellite);
        scene.add(satellite);
        
        createOrbitLine(sat);
    });
}

function createSatelliteModel(satellite) {
    const group = new THREE.Group();
    
    switch(satellite.modelType) {
        case 'gps':
            createGPSModel(group, satellite);
            break;
        case 'iss':
            createISSModel(group, satellite);
            break;
        case 'hubble':
            createHubbleModel(group, satellite);
            break;
        case 'jwst':
            createJWSTModel(group, satellite);
            break;
        case 'starlink':
            createStarlinkModel(group, satellite);
            break;
        case 'weather':
            createWeatherModel(group, satellite);
            break;
        case 'tess':
            createTESSModel(group, satellite);
            break;
        case 'landsat':
            createLandsatModel(group, satellite);
            break;
        default:
            createGenericModel(group, satellite);
    }
    
    // Add status indicator
    const statusGeometry = new THREE.SphereGeometry(0.003, 8, 8);
    const statusColors = {
        'operational': 0x00ff00,
        'degraded': 0xffff00,
        'failed': 0xff0000,
        'decommissioned': 0x666666
    };
    const statusMaterial = new THREE.MeshBasicMaterial({ 
        color: statusColors[satellite.status] || 0x666666 
    });
    const statusIndicator = new THREE.Mesh(statusGeometry, statusMaterial);
    statusIndicator.position.y = satellite.size * 1.5;
    group.add(statusIndicator);
    
    return group;
}

function createGPSModel(group, sat) {
    const busGeometry = new THREE.BoxGeometry(0.01, 0.008, 0.012);
    const busMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    const bus = new THREE.Mesh(busGeometry, busMaterial);
    group.add(bus);
    
    const panelGeometry = new THREE.BoxGeometry(0.02, 0.001, 0.008);
    const panelMaterial = new THREE.MeshPhongMaterial({ color: 0x2222ff });
    const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    leftPanel.position.x = -0.015;
    group.add(leftPanel);
    
    const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    rightPanel.position.x = 0.015;
    group.add(rightPanel);
    
    const antennaGeometry = new THREE.CylinderGeometry(0.001, 0.001, 0.008, 8);
    const antennaMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
    
    for(let i = 0; i < 4; i++) {
        const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        antenna.rotation.x = Math.PI / 2;
        antenna.position.set(
            (i % 2) * 0.006 - 0.003,
            0.004,
            Math.floor(i / 2) * 0.008 - 0.004
        );
        group.add(antenna);
    }
}

function createHubbleModel(group, sat) {
    const bodyGeometry = new THREE.CylinderGeometry(0.006, 0.006, 0.015, 16);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);
    
    const panelGeometry = new THREE.BoxGeometry(0.012, 0.001, 0.008);
    const panelMaterial = new THREE.MeshPhongMaterial({ color: 0x2222ff });
    const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    leftPanel.position.x = -0.009;
    group.add(leftPanel);
    
    const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    rightPanel.position.x = 0.009;
    group.add(rightPanel);
    
    const apertureGeometry = new THREE.CircleGeometry(0.005, 16);
    const apertureMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const aperture = new THREE.Mesh(apertureGeometry, apertureMaterial);
    aperture.rotation.x = -Math.PI / 2;
    aperture.position.y = -0.008;
    group.add(aperture);
}

function createISSModel(group, sat) {
    const trussGeometry = new THREE.BoxGeometry(0.025, 0.002, 0.002);
    const trussMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
    const truss = new THREE.Mesh(trussGeometry, trussMaterial);
    group.add(truss);
    
    const solarGeometry = new THREE.BoxGeometry(0.015, 0.001, 0.008);
    const solarMaterial = new THREE.MeshPhongMaterial({ color: 0x2222ff });
    
    for(let i = -1; i <= 1; i += 2) {
        for(let j = -1; j <= 1; j += 2) {
            const solar = new THREE.Mesh(solarGeometry, solarMaterial);
            solar.position.set(i * 0.012, j * 0.006, 0);
            group.add(solar);
        }
    }
    
    const moduleGeometry = new THREE.BoxGeometry(0.008, 0.008, 0.008);
    const moduleMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    const module = new THREE.Mesh(moduleGeometry, moduleMaterial);
    module.position.z = 0.005;
    group.add(module);
}

function createStarlinkModel(group, sat) {
    const bodyGeometry = new THREE.BoxGeometry(0.008, 0.001, 0.004);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);
    
    const solarGeometry = new THREE.BoxGeometry(0.006, 0.0005, 0.003);
    const solarMaterial = new THREE.MeshPhongMaterial({ color: 0x1111ff });
    const solar = new THREE.Mesh(solarGeometry, solarMaterial);
    solar.position.y = 0.001;
    group.add(solar);
    
    const antennaGeometry = new THREE.BoxGeometry(0.004, 0.0003, 0.002);
    const antennaMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.y = -0.001;
    group.add(antenna);
}

function createJWSTModel(group, sat) {
    const shieldGeometry = new THREE.CylinderGeometry(0.008, 0.008, 0.001, 6);
    const shieldMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00 });
    const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
    shield.rotation.x = Math.PI / 2;
    group.add(shield);
    
    const scopeGeometry = new THREE.CylinderGeometry(0.002, 0.004, 0.006, 16);
    const scopeMaterial = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
    const scope = new THREE.Mesh(scopeGeometry, scopeMaterial);
    scope.position.z = 0.004;
    group.add(scope);
}

function createWeatherModel(group, sat) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.006, 0.010),
                              new THREE.MeshPhongMaterial({ color: 0x4477ff }));
    group.add(body);
    
    const solar = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.001, 0.006),
                               new THREE.MeshPhongMaterial({ color: 0x2222ff }));
    solar.position.x = -0.010;
    group.add(solar);
}

function createGenericModel(group, sat) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.006, 0.008),
                              new THREE.MeshPhongMaterial({ color: sat.color }));
    group.add(body);
    
    const solar = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.001, 0.004),
                               new THREE.MeshPhongMaterial({ color: 0x2222ff }));
    solar.position.x = -0.007;
    group.add(solar);
}

function createTESSModel(group, sat) { createGenericModel(group, sat); }
function createLandsatModel(group, sat) { createGenericModel(group, sat); }

function createOrbitLine(sat) {
    const orbitRadius = 1 + (sat.altitude / 6371);
    const orbitPoints = [];
    const segments = 180;
    
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const x = orbitRadius * Math.cos(theta);
        const z = orbitRadius * Math.sin(theta) * Math.cos(sat.inclination * Math.PI / 180);
        const y = orbitRadius * Math.sin(theta) * Math.sin(sat.inclination * Math.PI / 180);
        orbitPoints.push(new THREE.Vector3(x, y, z));
    }
    
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMaterial = new THREE.LineBasicMaterial({ 
        color: sat.color,
        transparent: true,
        opacity: 0.6,  // Increased opacity for better visibility when selected
        linewidth: 2   // Slightly thicker line
    });
    const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    orbitLine.visible = false;  // Start with ALL orbits hidden
    orbitLines.push({ orbitLine, satelliteId: sat.id });
    scene.add(orbitLine);
}

function createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starVertices = [];
    
    for (let i = 0; i < 25000; i++) {
        starVertices.push(
            (Math.random() - 0.5) * 3000,
            (Math.random() - 0.5) * 3000,
            (Math.random() - 0.5) * 3000
        );
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starMaterial = new THREE.PointsMaterial({ 
        color: 0xffffff, 
        size: 0.8,
        sizeAttenuation: true
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    
    if (autoRotation && earth && earth.userData.group) {
        const rotationSpeed = realTimeMode ? (2 * Math.PI) / (86400) : 0.001;
        earth.userData.group.rotation.y += rotationSpeed * delta * 60;
    }
    
    satellites.forEach(satellite => {
        const data = satellite.userData;
        const speedMultiplier = realTimeMode ? 1 : 3600;
        data.angle += data.speed * delta * speedMultiplier;
        
        satellite.position.x = data.orbitRadius * Math.cos(data.angle);
        satellite.position.z = data.orbitRadius * Math.sin(data.angle) * Math.cos(data.inclination);
        satellite.position.y = data.orbitRadius * Math.sin(data.angle) * Math.sin(data.inclination);
        
        satellite.lookAt(0, 0, 0);
    });
    
    controls.update();
    renderer.render(scene, camera);
}

function smoothZoomTo(targetPosition, targetDistance, duration = 2) {
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();
    const endTarget = targetPosition.clone();
    const startTime = performance.now();
    
    isAnimating = true;
    
    function zoomStep() {
        const currentTime = performance.now();
        const elapsed = (currentTime - startTime) / 1000;
        const progress = Math.min(elapsed / duration, 1);
        
        const easedProgress = progress < 0.5 
            ? 2 * progress * progress 
            : -1 + (4 - 2 * progress) * progress;
        
        camera.position.lerpVectors(startPosition, targetPosition.clone().normalize().multiplyScalar(targetDistance), easedProgress);
        controls.target.lerpVectors(startTarget, endTarget, easedProgress);
        controls.update();
        
        if (progress < 1) {
            requestAnimationFrame(zoomStep);
        } else {
            isAnimating = false;
        }
    }
    
    zoomStep();
}

// FIXED: Satellite selection now properly shows orbit line
function selectSatellite(satelliteId) {
    if (selectedSatellite) {
        selectedSatellite.traverse((child) => {
            if (child.isMesh && child.userData.originalMaterial) {
                child.material = child.userData.originalMaterial;
            }
        });
    }
    
    // Hide ALL orbit lines first
    orbitLines.forEach(item => {
        item.orbitLine.visible = false;
    });
    
    // Find and select the new satellite
    const satellite = satellites.find(sat => sat.userData.id === satelliteId);
    if (satellite) {
        // Highlight the selected satellite
        satellite.traverse((child) => {
            if (child.isMesh) {
                child.userData.originalMaterial = child.material;
                const newMaterial = child.material.clone();
                newMaterial.emissive = new THREE.Color(0x333333);
                child.material = newMaterial;
            }
        });
        
        // Show the selected satellite's orbit line
        const selectedOrbit = orbitLines.find(item => item.satelliteId === satelliteId);
        if (selectedOrbit) {
            selectedOrbit.orbitLine.visible = true;
        }
        
        // Zoom to the satellite
        const zoomDistance = Math.max(satellite.userData.orbitRadius * 1.5, 3);
        smoothZoomTo(satellite.position, zoomDistance, 2);
        
        selectedSatellite = satellite;
        showRealSatelliteInfo(satellite.userData);
        updateStatusInfo();
        
        showNotification(`Selected: ${satellite.userData.name}`);
    }
}

// IMPROVED: Better satellite info display with smaller images
function showRealSatelliteInfo(satellite) {
    const infoContainer = document.getElementById('satelliteInfo');
    const statusLabels = {
        'operational': '🟢 Operational',
        'degraded': '🟡 Degraded',
        'failed': '🔴 Failed',
        'decommissioned': '⚫ Decommissioned'
    };
    
    const statusLabel = statusLabels[satellite.status] || 'Unknown';
    
    // Create attractive satellite info card
    const imageHtml = satellite.image ? 
        `<div class="satellite-image-container">
            <img src="${satellite.image}" alt="${satellite.name}" class="satellite-real-image" onerror="this.style.display='none'">
        </div>` : 
        '<div class="no-image">🚀 No Image Available</div>';
    
    infoContainer.innerHTML = `
        <div class="satellite-details-card">
            <div class="satellite-header">
                <h3>${satellite.name}</h3>
                <span class="satellite-status">${statusLabel}</span>
            </div>
            
            ${imageHtml}
            
            <div class="satellite-info-grid">
                <div class="info-item">
                    <span class="info-label">🌍 Country:</span>
                    <span class="info-value">${satellite.country}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">📡 Type:</span>
                    <span class="info-value">${satellite.type}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">📊 Operator:</span>
                    <span class="info-value">${satellite.operator}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">🛰️ Altitude:</span>
                    <span class="info-value">${satellite.altitude.toLocaleString()} km</span>
                </div>
                <div class="info-item">
                    <span class="info-label">⏱️ Period:</span>
                    <span class="info-value">${satellite.period} min</span>
                </div>
                <div class="info-item">
                    <span class="info-label">📐 Inclination:</span>
                    <span class="info-value">${satellite.inclination}°</span>
                </div>
                ${satellite.launchDate ? `
                <div class="info-item">
                    <span class="info-label">🚀 Launch:</span>
                    <span class="info-value">${satellite.launchDate}</span>
                </div>` : ''}
                ${satellite.mass ? `
                <div class="info-item">
                    <span class="info-label">⚖️ Mass:</span>
                    <span class="info-value">${satellite.mass}</span>
                </div>` : ''}
            </div>
            
            <div class="satellite-description">
                <p>${satellite.description}</p>
            </div>
        </div>
    `;
}

function updateStatusInfo() {
    const status = document.getElementById('statusInfo');
    if (selectedSatellite) {
        status.textContent = `Viewing: ${selectedSatellite.userData.name} • Orbit Visible`;
    } else {
        status.textContent = `Earth Rotation: ${autoRotation ? 'REAL' : 'OFF'} • Orbits: ${showOrbits ? 'ON' : 'OFF'} • Time Warp: 1x`;
    }
}

function zoomToEarth() {
    const earthPosition = new THREE.Vector3(0, 0, 0);
    smoothZoomTo(earthPosition, 2.5, 1.5);
    
    if (selectedSatellite) {
        selectedSatellite.traverse((child) => {
            if (child.isMesh && child.userData.originalMaterial) {
                child.material = child.userData.originalMaterial;
            }
        });
        selectedSatellite = null;
    }
    
    // Hide ALL orbit lines when zooming to Earth
    orbitLines.forEach(item => {
        item.orbitLine.visible = false;
    });
    
    resetCountrySelection();
    updateStatusInfo();
    
    document.getElementById('satelliteInfo').innerHTML = `
        <div class="satellite-details">
            <div class="welcome-message">
                <h3>🌍 Earth Satellite Tracker</h3>
                <p>Select a satellite to view real images and detailed information</p>
            </div>
        </div>
    `;
}

function toggleAutoRotation() {
    autoRotation = !autoRotation;
    document.getElementById('autoRotateBtn').textContent = `Earth Rotation: ${autoRotation ? 'REAL' : 'OFF'}`;
    document.getElementById('autoRotateBtn').classList.toggle('active', autoRotation);
    updateStatusInfo();
    showNotification(`Earth rotation: ${autoRotation ? 'ON' : 'OFF'}`);
}

function toggleOrbits() {
    showOrbits = !showOrbits;
    
    // If Show Orbits is ON, show ALL orbits
    // If Show Orbits is OFF, hide ALL orbits (unless a satellite is selected)
    orbitLines.forEach(item => {
        if (showOrbits) {
            item.orbitLine.visible = true;
        } else {
            // Only keep orbit visible if it's the selected satellite
            const isSelectedSatellite = selectedSatellite && selectedSatellite.userData.id === item.satelliteId;
            item.orbitLine.visible = isSelectedSatellite;
        }
    });
    
    document.getElementById('orbitBtn').textContent = `Show Orbits: ${showOrbits ? 'ON' : 'OFF'}`;
    document.getElementById('orbitBtn').classList.toggle('active', showOrbits);
    updateStatusInfo();
    showNotification(`Orbits: ${showOrbits ? 'ON' : 'OFF'}`);
}

function toggleRealTime() {
    realTimeMode = !realTimeMode;
    document.getElementById('realTimeBtn').textContent = `Real Time: ${realTimeMode ? 'ON' : 'OFF'}`;
    document.getElementById('realTimeBtn').classList.toggle('active', realTimeMode);
    showNotification(`Real time mode: ${realTimeMode ? 'ON' : 'OFF'}`);
}

function resetView() {
    controls.reset();
    camera.position.set(0, 0, 2.5);
    controls.update();
    
    if (selectedSatellite) {
        selectedSatellite.traverse((child) => {
            if (child.isMesh && child.userData.originalMaterial) {
                child.material = child.userData.originalMaterial;
            }
        });
        selectedSatellite = null;
    }
    
    // Hide ALL orbit lines on reset
    orbitLines.forEach(item => {
        item.orbitLine.visible = false;
    });
    
    resetCountrySelection();
    updateStatusInfo();
    
    document.getElementById('satelliteInfo').innerHTML = `
        <div class="satellite-details">
            <div class="welcome-message">
                <h3>🌍 Earth Satellite Tracker</h3>
                <p>Select a satellite to view real images and detailed information</p>
            </div>
        </div>
    `;
    
    showNotification('View reset to default');
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Initialize the application
init();