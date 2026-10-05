// ========================================
// CALENDAR - SMART DYNAMIC VERSION (TODAY FIXED)
// ========================================

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// ========================================
// GET HOLIDAYS MAP
// ========================================

function getHolidayMap() {
    const holidays = JSON.parse(localStorage.getItem("holidays") || "[]");
    const map = {};
    holidays.forEach(holiday => {
        map[holiday.date] = holiday.name;
    });
    return map;
}

// ========================================
// GET ATTENDANCE FOR DATE
// ========================================

function getAttendanceForDate(dateString) {
    const records = JSON.parse(localStorage.getItem("attendanceRecords") || "[]");
    const dayRecords = records.filter(r => r.date === dateString);
    
    if (dayRecords.length === 0) return null;
    
    const present = dayRecords.filter(r => r.status === 'present').length;
    const absent = dayRecords.filter(r => r.status === 'absent').length;
    const cancelled = dayRecords.filter(r => r.status === 'cancelled').length;
    
    if (present === 0 && absent === 0 && cancelled > 0) return 'cancelled';
    if (present > 0 && absent === 0) return 'present';
    if (absent > 0 && present === 0) return 'absent';
    if (present > 0 && absent > 0) return 'partial';
    return null;
}

// ========================================
// RENDER CALENDAR
// ========================================

function renderCalendar() {
    const title = document.getElementById("calendarTitle");
    const calendar = document.getElementById("calendarDays");

    if (!title || !calendar) {
        console.error("Calendar elements not found!");
        return;
    }

    // Ensure holidays exist for the current displayed year
    if (typeof ensureHolidaysForYear === "function") {
        ensureHolidaysForYear(currentYear);
    }

    calendar.innerHTML = "";

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    title.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const holidayMap = getHolidayMap();

    // ✅ GET TODAY'S DATE CORRECTLY
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement("div");
        empty.className = "calendar-day empty";
        calendar.appendChild(empty);
    }

    // Date cells
    for (let day = 1; day <= daysInMonth; day++) {
        const element = document.createElement("div");
        element.className = "calendar-day";

        const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        element.dataset.date = dateString;

        const holidayName = holidayMap[dateString];
        const attendanceStatus = getAttendanceForDate(dateString);

        // Build day content
        let content = `<span class="day-number">${day}</span>`;

        // ✅ CHECK IF IT'S SUNDAY
        const dayOfWeek = new Date(currentYear, currentMonth, day).getDay(); // 0 = Sunday
        const isSunday = dayOfWeek === 0;

        if (holidayName) {
            const allHolidays = JSON.parse(localStorage.getItem("holidays") || "[]");
            const holidayData = allHolidays.find(h => h.date === dateString);
            const isGovt = holidayData && holidayData.source === 'govt';
            
            element.classList.add("holiday");
            content += `<span class="holiday-label">${isGovt ? '🏛️' : '🎉'} ${holidayName}</span>`;
        } 
        // ✅ If no specific holiday, but it's Sunday, use RED color
        else if (isSunday) {
            element.classList.add("sunday");
            content += `<span class="sunday-label">🎉 Sunday</span>`;
        }

        if (attendanceStatus === 'present') {
            content += `<span class="attendance-dot present"></span>`;
        } else if (attendanceStatus === 'absent') {
            content += `<span class="attendance-dot absent"></span>`;
        } else if (attendanceStatus === 'cancelled') {
            content += `<span class="attendance-dot cancelled"></span>`;
        } else if (attendanceStatus === 'partial') {
            content += `<span class="attendance-dot present"></span><span class="attendance-dot absent" style="margin-left: 4px;"></span>`;
        }

        element.innerHTML = content;

        // ✅ ADD "TODAY" CLASS IF DATE MATCHES
        if (dateString === todayString) {
            element.classList.add("today");
        }

        element.addEventListener("click", function() {
            selectDate(dateString);
        });

        calendar.appendChild(element);
    }
}

// ========================================
// SELECT DATE
// ========================================

function selectDate(dateString) {
    localStorage.setItem("selectedDate", dateString);
    window.location.href = `attendance.html?date=${dateString}`;
}

// ========================================
// PREVIOUS MONTH
// ========================================

function previousMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
}

// ========================================
// NEXT MONTH
// ========================================

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
}

// ========================================
// GO TO TODAY
// ========================================

function goToToday() {
    const today = new Date();
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();
    renderCalendar();
}

// ========================================
// INITIALIZE
// ========================================

document.addEventListener("DOMContentLoaded", function() {
    console.log("📅 Calendar initializing...");
    
    // Force load correct holidays
    if (typeof initializeDefaultHolidays === "function") {
        initializeDefaultHolidays();
    }
    
    renderCalendar();

    const previous = document.getElementById("previousMonth");
    const next = document.getElementById("nextMonth");
    const today = document.getElementById("todayButton");

    if (previous) {
        previous.addEventListener("click", previousMonth);
    }

    if (next) {
        next.addEventListener("click", nextMonth);
    }

    if (today) {
        today.addEventListener("click", goToToday);
    }
});