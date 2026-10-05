// ========================================
// HOLIDAYS MANAGEMENT - SMART DYNAMIC GENERATION
// ========================================

// ========================================
// OFFICIAL HOLIDAY DATA (2026-2030)
// ========================================

const OFFICIAL_HOLIDAYS = {
    2026: [
        { date: '2026-01-01', name: '🎉 New Year\'s Day' },
        { date: '2026-01-14', name: '🌾 Makar Sankranti' },
        { date: '2026-01-23', name: '🌟 Basant Panchami' },
        { date: '2026-01-26', name: '🧡 Republic Day' },
        { date: '2026-02-15', name: '🕉️ Maha Shivratri' },
        { date: '2026-03-04', name: '🎨 Holi' },
        { date: '2026-03-19', name: '🌸 Gudi Padwa / Ugadi' },
        { date: '2026-03-21', name: '🕌 Id-ul-Fitr' },
        { date: '2026-03-26', name: '🕉️ Ram Navami' },
        { date: '2026-03-31', name: '🕉️ Mahavir Jayanti' },
        { date: '2026-04-03', name: '✝️ Good Friday' },
        { date: '2026-04-14', name: '🌾 Dr. Ambedkar Jayanti' },
        { date: '2026-04-15', name: '🌾 Vaisakhadi (Bengal)' },
        { date: '2026-05-01', name: '👷 Labour Day' },
        { date: '2026-05-01', name: '☸️ Budha Purnima' },
        { date: '2026-05-27', name: '🕌 Id-ul-Zuha (Bakrid)' },
        { date: '2026-06-26', name: '🕌 Muharram' },
        { date: '2026-07-16', name: '🚩 Rath Yatra' },
        { date: '2026-08-15', name: '🧡 Independence Day' },
        { date: '2026-08-26', name: '🕌 Milad-un-Nabi (Id-e-Milad)' },
        { date: '2026-08-28', name: '🎀 Raksha Bandhan' },
        { date: '2026-09-04', name: '🎉 Janmashtami' },
        { date: '2026-09-14', name: '🐘 Ganesh Chaturthi' },
        { date: '2026-10-02', name: '🕊️ Gandhi Jayanti' },
        { date: '2026-10-20', name: '🎉 Dussehra' },
        { date: '2026-10-29', name: '🌙 Karwa Chauth' },
        { date: '2026-11-08', name: '🪔 Diwali (Deepavali)' },
        { date: '2026-11-09', name: '🐄 Govardhan Puja' },
        { date: '2026-11-11', name: '👫 Bhai Duj' },
        { date: '2026-11-24', name: '📖 Guru Nanak Jayanti' },
        { date: '2026-12-25', name: '🎄 Christmas Day' }
    ],
    2027: [
        { date: '2027-01-01', name: '🎉 New Year\'s Day' },
        { date: '2027-01-15', name: '🌾 Makar Sankranti' },
        { date: '2027-01-26', name: '🇮🇳 Republic Day' },
        { date: '2027-03-06', name: '🕉️ Maha Shivratri' },
        { date: '2027-03-10', name: '🕌 Id-ul-Fitr' },
        { date: '2027-03-22', name: '🎨 Holi' },
        { date: '2027-03-26', name: '✝️ Good Friday' },
        { date: '2027-04-14', name: '🌾 Dr. Ambedkar Jayanti' },
        { date: '2027-04-15', name: '🌾 Vaisakhadi (Bengal)' },
        { date: '2027-05-01', name: '👷 Labour Day' },
        { date: '2027-05-28', name: '🕌 Id-ul-Zuha (Bakrid)' },
        { date: '2027-06-26', name: '🕌 Muharram' },
        { date: '2027-08-15', name: '🇮🇳 Independence Day' },
        { date: '2027-08-25', name: '🎉 Janmashtami' },
        { date: '2027-10-02', name: '🕊️ Gandhi Jayanti' },
        { date: '2027-10-09', name: '🎉 Dussehra' },
        { date: '2027-10-29', name: '🪔 Diwali (Deepavali)' },
        { date: '2027-11-22', name: '📖 Guru Nanak Jayanti' },
        { date: '2027-12-25', name: '🎄 Christmas Day' }
    ],
    2028: [
        { date: '2028-01-01', name: '🎉 New Year\'s Day' },
        { date: '2028-01-15', name: '🌾 Makar Sankranti' },
        { date: '2028-01-26', name: '🇮🇳 Republic Day' },
        { date: '2028-02-27', name: '🕌 Id-ul-Fitr' },
        { date: '2028-03-11', name: '🎨 Holi' },
        { date: '2028-04-14', name: '✝️ Good Friday' },
        { date: '2028-04-14', name: '🌾 Dr. Ambedkar Jayanti' },
        { date: '2028-05-01', name: '👷 Labour Day' },
        { date: '2028-05-06', name: '🕌 Id-ul-Zuha (Bakrid)' },
        { date: '2028-06-04', name: '🕌 Muharram' },
        { date: '2028-08-15', name: '🇮🇳 Independence Day' },
        { date: '2028-08-13', name: '🎉 Janmashtami' },
        { date: '2028-10-02', name: '🕊️ Gandhi Jayanti' },
        { date: '2028-10-17', name: '🪔 Diwali (Deepavali)' },
        { date: '2028-11-02', name: '📖 Guru Nanak Jayanti' },
        { date: '2028-12-25', name: '🎄 Christmas Day' }
    ],
    2029: [
        { date: '2029-01-01', name: '🎉 New Year\'s Day' },
        { date: '2029-01-15', name: '🌾 Makar Sankranti' },
        { date: '2029-01-26', name: '🇮🇳 Republic Day' },
        { date: '2029-02-14', name: '🕌 Id-ul-Fitr' },
        { date: '2029-03-30', name: '✝️ Good Friday' },
        { date: '2029-04-14', name: '🌾 Dr. Ambedkar Jayanti' },
        { date: '2029-04-15', name: '🌾 Vaisakhadi (Bengal)' },
        { date: '2029-05-01', name: '👷 Labour Day' },
        { date: '2029-04-25', name: '🕌 Id-ul-Zuha (Bakrid)' },
        { date: '2029-05-24', name: '🕌 Muharram' },
        { date: '2029-08-15', name: '🇮🇳 Independence Day' },
        { date: '2029-09-01', name: '🎉 Janmashtami' },
        { date: '2029-10-02', name: '🕊️ Gandhi Jayanti' },
        { date: '2029-10-16', name: '🎉 Dussehra' },
        { date: '2029-11-05', name: '🪔 Diwali (Deepavali)' },
        { date: '2029-11-21', name: '📖 Guru Nanak Jayanti' },
        { date: '2029-12-25', name: '🎄 Christmas Day' }
    ],
    2030: [
        { date: '2030-01-01', name: '🎉 New Year\'s Day' },
        { date: '2030-01-15', name: '🌾 Makar Sankranti' },
        { date: '2030-01-26', name: '🇮🇳 Republic Day' },
        { date: '2030-02-04', name: '🕌 Id-ul-Fitr' },
        { date: '2030-04-13', name: '🕌 Id-ul-Zuha (Bakrid)' },
        { date: '2030-04-19', name: '✝️ Good Friday' },
        { date: '2030-04-14', name: '🌾 Dr. Ambedkar Jayanti' },
        { date: '2030-05-01', name: '👷 Labour Day' },
        { date: '2030-05-03', name: '🕌 Muharram' },
        { date: '2030-08-15', name: '🇮🇳 Independence Day' },
        { date: '2030-10-02', name: '🕊️ Gandhi Jayanti' },
        { date: '2030-10-26', name: '🪔 Diwali (Deepavali)' },
        { date: '2030-12-25', name: '🎄 Christmas Day' }
    ]
};

// ========================================
// GENERATE HOLIDAYS FOR ANY SPECIFIC YEAR
// ========================================

function generateHolidaysForYear(year) {
    // If official data exists for this year
    if (OFFICIAL_HOLIDAYS[year]) {
        return OFFICIAL_HOLIDAYS[year];
    }
    
    // Fixed National Holidays (Always correct)
    const fixedHolidays = [
        { date: `${year}-01-01`, name: '🎉 New Year\'s Day' },
        { date: `${year}-01-26`, name: '🇮🇳 Republic Day' },
        { date: `${year}-04-14`, name: '🌾 Dr. Ambedkar Jayanti' },
        { date: `${year}-05-01`, name: '👷 Labour Day' },
        { date: `${year}-08-15`, name: '🇮🇳 Independence Day' },
        { date: `${year}-10-02`, name: '🕊️ Gandhi Jayanti' },
        { date: `${year}-12-25`, name: '🎄 Christmas' }
    ];
    
    // Estimated Lunar Holidays (Auto-generated for future years)
    const estimatedHolidays = [
        { date: `${year}-03-${String(10 + (year % 5)).padStart(2, '0')}`, name: '🎨 Holi (Estimated)' },
        { date: `${year}-03-${String(20 + (year % 7)).padStart(2, '0')}`, name: '🕌 Id-ul-Fitr (Estimated)' },
        { date: `${year}-05-${String(25 + (year % 6)).padStart(2, '0')}`, name: '🕌 Id-ul-Zuha (Estimated)' },
        { date: `${year}-08-${String(25 + (year % 5)).padStart(2, '0')}`, name: '🎉 Janmashtami (Estimated)' },
        { date: `${year}-10-${String(15 + (year % 4)).padStart(2, '0')}`, name: '🎉 Dussehra (Estimated)' },
        { date: `${year}-11-${String(5 + (year % 6)).padStart(2, '0')}`, name: '🪔 Diwali (Estimated)' },
        { date: `${year}-11-${String(20 + (year % 5)).padStart(2, '0')}`, name: '📖 Guru Nanak Jayanti (Estimated)' }
    ];
    
    return [...fixedHolidays, ...estimatedHolidays];
}

// ========================================
// HOLIDAYS DATA
// ========================================

let holidays = [];

// ========================================
// SAVE HOLIDAYS
// ========================================

function saveHolidays() {
    localStorage.setItem("holidays", JSON.stringify(holidays));
    
    if (typeof autoSaveUserData === "function") {
        autoSaveUserData();
    }
}

// ========================================
// SMART INITIALIZE (Generates current year + 20 years)
// ========================================

function initializeDefaultHolidays() {
    const currentYear = new Date().getFullYear();
    const allHolidays = [];
    
    // Generate holidays for current year - 1 to current year + 20
    for (let year = currentYear - 1; year <= currentYear + 20; year++) {
        const yearHolidays = generateHolidaysForYear(year);
        yearHolidays.forEach(holiday => {
            allHolidays.push({
                id: 'default-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                date: holiday.date,
                name: holiday.name,
                isDefault: true,
                source: 'govt'
            });
        });
    }
    
    // FORCE OVERWRITE localStorage
    localStorage.setItem('holidays', JSON.stringify(allHolidays));
    localStorage.setItem('defaultHolidaysInitialized', 'true');
    holidays = allHolidays;
    console.log(`✅ SMART GENERATED ${allHolidays.length} holidays!`);
}

// ========================================
// AUTO-GENERATE WHEN NAVIGATING TO FUTURE YEARS
// ========================================

function ensureHolidaysForYear(year) {
    const currentHolidays = getHolidays();
    const hasYear = currentHolidays.some(h => h.date.startsWith(String(year)));
    
    if (!hasYear) {
        // Generate holidays for this year and next 10 years
        for (let y = year; y <= year + 10; y++) {
            const yearHolidays = generateHolidaysForYear(y);
            yearHolidays.forEach(holiday => {
                const exists = currentHolidays.some(h => h.date === holiday.date);
                if (!exists) {
                    currentHolidays.push({
                        id: 'default-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                        date: holiday.date,
                        name: holiday.name,
                        isDefault: true,
                        source: 'govt'
                    });
                }
            });
        }
        
        localStorage.setItem('holidays', JSON.stringify(currentHolidays));
        holidays = currentHolidays;
        console.log(`✅ AUTO-GENERATED holidays for ${year}!`);
    }
}

// ========================================
// DISPLAY HOLIDAYS
// ========================================

function displayHolidays() {
    const container = document.getElementById("holidayList");
    if (!container) return;

    container.innerHTML = "";

    const sortedHolidays = [...holidays].sort((a, b) => a.date.localeCompare(b.date));

    if (sortedHolidays.length === 0) {
        container.innerHTML = `
            <div class="subject-card">
                <h3>No holidays added 🎉</h3>
                <p>Add your own holidays or click "Add Govt Holidays".</p>
                <br>
                <button onclick="addDefaultHolidays()" class="primary-btn">
                    📅 Add Govt Holidays
                </button>
            </div>
        `;
        return;
    }

    let currentMonth = '';

    sortedHolidays.forEach(holiday => {
        const dateObj = new Date(holiday.date + 'T00:00:00');
        const monthYear = dateObj.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
        
        if (monthYear !== currentMonth) {
            if (currentMonth !== '') {
                container.innerHTML += `<div style="grid-column: 1 / -1; margin-top: 10px;"></div>`;
            }
            currentMonth = monthYear;
            container.innerHTML += `
                <div style="grid-column: 1 / -1; font-weight: 700; color: #4a6cf7; font-size: 18px; padding: 10px 0 5px 0; border-bottom: 2px solid #e5e7eb;">
                    📅 ${monthYear}
                </div>
            `;
        }

        const isDefault = holiday.isDefault || false;
        const isGovt = holiday.source === 'govt';
        const isEstimated = holiday.name.includes('Estimated');
        
        const badge = isGovt 
            ? `<span style="font-size: 10px; background: #4a6cf7; color: white; padding: 2px 8px; border-radius: 10px; margin-left: 6px;">🏛️ Govt</span>`
            : `<span style="font-size: 10px; background: #22c55e; color: white; padding: 2px 8px; border-radius: 10px; margin-left: 6px;">✏️ Custom</span>`;

        container.innerHTML += `
            <div class="subject-card" style="${isGovt ? 'border-left: 3px solid #4a6cf7;' : 'border-left: 3px solid #22c55e;'}">
                <h3>
                    ${holiday.name}
                    ${badge}
                    ${isEstimated ? `<span style="font-size: 10px; background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 10px; margin-left: 6px;">⚠️ Estimated</span>` : ''}
                </h3>
                <p>📅 ${holiday.date}</p>
                <div class="card-buttons">
                    ${!isGovt ? `
                        <button class="delete-btn" onclick="deleteHoliday('${holiday.id}')">
                            🗑️ Delete
                        </button>
                    ` : `
                        <button class="edit-btn" onclick="removeGovtHoliday('${holiday.id}')" style="background: #fef3c7; color: #92400e;">
                            ⭐ Remove from Govt
                        </button>
                    `}
                </div>
            </div>
        `;
    });
    
    updateHolidayCount();
}

// ========================================
// ADD DEFAULT HOLIDAYS
// ========================================

function addDefaultHolidays() {
    const confirmed = confirm(
        '📅 Add official government holidays?\n\n' +
        'This will add Indian national and major holidays.\n' +
        'Holidays will be auto-generated for all years you visit.\n\n' +
        'Existing holidays will not be duplicated.'
    );
    
    if (!confirmed) return;
    
    initializeDefaultHolidays();
    displayHolidays();
    alert('✅ Government holidays added successfully!');
}

// ========================================
// ADD CUSTOM HOLIDAY
// ========================================

function addHoliday() {
    const date = document.getElementById("holidayDate").value;
    const name = document.getElementById("holidayName").value.trim();

    if (!date || !name) {
        alert("⚠️ Please enter date and holiday name.");
        return;
    }

    const existing = holidays.find(holiday => holiday.date === date);
    if (existing) {
        alert(`⚠️ A holiday already exists on this date: "${existing.name}"`);
        return;
    }

    holidays.push({
        id: 'custom-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        date: date,
        name: name,
        isDefault: false,
        source: 'custom'
    });

    saveHolidays();

    document.getElementById("holidayDate").value = "";
    document.getElementById("holidayName").value = "";

    displayHolidays();
    alert(`✅ "${name}" added as a custom holiday!`);
}

// ========================================
// DELETE CUSTOM HOLIDAY
// ========================================

function deleteHoliday(id) {
    const holiday = holidays.find(h => h.id === id);
    if (!holiday) return;

    const confirmed = confirm(`Delete "${holiday.name}"?`);
    if (!confirmed) return;

    holidays = holidays.filter(holiday => holiday.id !== id);
    saveHolidays();
    displayHolidays();
}

// ========================================
// REMOVE GOVERNMENT HOLIDAY
// ========================================

function removeGovtHoliday(id) {
    const holiday = holidays.find(h => h.id === id);
    if (!holiday) return;

    const confirmed = confirm(`Remove "${holiday.name}" from government holidays?`);
    if (!confirmed) return;

    holidays = holidays.filter(h => h.id !== id);
    saveHolidays();
    displayHolidays();
}

// ========================================
// CLEAR ALL HOLIDAYS
// ========================================

function clearAllHolidays() {
    const confirmed = confirm(
        '⚠️ This will delete ALL holidays (including custom ones).\n\n' +
        'Are you sure?'
    );
    
    if (!confirmed) return;
    
    holidays = [];
    saveHolidays();
    localStorage.removeItem('defaultHolidaysInitialized');
    displayHolidays();
    alert('✅ All holidays cleared!');
}

// ========================================
// UPDATE HOLIDAY COUNT
// ========================================

function updateHolidayCount() {
    const count = document.getElementById('holidayCount');
    if (count) {
        const allHolidays = getHolidays();
        const govtCount = allHolidays.filter(h => h.source === 'govt').length;
        const customCount = allHolidays.filter(h => h.source === 'custom').length;
        const estimatedCount = allHolidays.filter(h => h.name.includes('Estimated')).length;
        count.textContent = `${allHolidays.length} holidays (${govtCount} govt, ${customCount} custom, ${estimatedCount} estimated)`;
    }
}

// ========================================
// INITIALIZE
// ========================================

document.addEventListener("DOMContentLoaded", function() {
    initializeDefaultHolidays();
    displayHolidays();
});