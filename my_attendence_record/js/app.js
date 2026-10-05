// ========================================
// INITIALIZE ON PAGE LOAD
// ========================================

document.addEventListener("DOMContentLoaded", function() {
    console.log("Page loaded - Initializing...");
    
    // Update dashboard
    if (typeof updateDashboard === "function") {
        updateDashboard();
    }
    
    // Update reminder
    if (typeof updateReminder === "function") {
        setTimeout(updateReminder, 500);
    }
    
    // Check if reminder was dismissed
    if (typeof checkReminderDismissed === "function") {
        checkReminderDismissed();
    }
    
    // Load dark mode preference
    if (typeof loadDarkModePreference === "function") {
        loadDarkModePreference();
    }
});

// ========================================
// GET DATA
// ========================================

function getSubjects() {
    return JSON.parse(localStorage.getItem("subjects")) || [];
}

function getAttendanceRecords() {
    return JSON.parse(localStorage.getItem("attendanceRecords")) || [];
}

function getHolidays() {
    return JSON.parse(localStorage.getItem("holidays")) || [];
}

// ========================================
// ATTENDANCE TARGET
// ========================================

let attendanceTarget = Number(localStorage.getItem("attendanceTarget")) || 75;

// ========================================
// UPDATE DASHBOARD
// ========================================

function updateDashboard() {
    const stats = getOverallStats();

    // Update percentage
    const percentageElement = document.getElementById("overallPercentage");
    if (percentageElement) {
        percentageElement.textContent = stats.percentage.toFixed(1) + "%";
        percentageElement.className = "overall-percentage";
        if (stats.percentage >= attendanceTarget) {
            percentageElement.classList.add("high");
        } else if (stats.percentage >= attendanceTarget - 10) {
            percentageElement.classList.add("medium");
        } else {
            percentageElement.classList.add("low");
        }
    }

    // Update present count
    const presentElement = document.getElementById("overallPresent");
    if (presentElement) {
        presentElement.textContent = stats.present;
    }

    // Update absent count
    const absentElement = document.getElementById("overallAbsent");
    if (absentElement) {
        absentElement.textContent = stats.absent;
    }

    // Update total count
    const totalElement = document.getElementById("overallTotal");
    if (totalElement) {
        totalElement.textContent = stats.total;
    }

    // Update target input
    const targetInput = document.getElementById("targetInput");
    if (targetInput) {
        targetInput.value = attendanceTarget;
    }

    // Update attendance message
    const messageElement = document.getElementById("attendanceMessage");
    if (!messageElement) return;

    messageElement.className = "attendance-message";

    if (stats.total === 0) {
        messageElement.textContent = "⚪ No attendance recorded yet.";
        return;
    }

    if (stats.percentage > attendanceTarget) {
        messageElement.textContent = "🟢 Your attendance is above the target.";
        messageElement.classList.add("good");
    } else if (stats.percentage === attendanceTarget) {
        messageElement.textContent = "🟡 Your attendance is exactly at the target.";
        messageElement.classList.add("equal");
    } else {
        messageElement.textContent = "🔴 Your attendance is below the target.";
        messageElement.classList.add("warning");
    }
}

// ========================================
// SAVE ATTENDANCE TARGET
// ========================================

function saveAttendanceTarget() {
    const input = document.getElementById("targetInput");
    if (!input) return;

    const value = Number(input.value);

    if (isNaN(value) || value < 0 || value > 100) {
        alert("Please enter a target between 0 and 100.");
        return;
    }

    attendanceTarget = value;
    localStorage.setItem("attendanceTarget", attendanceTarget);
    updateDashboard();
    
    // Auto-save to user account
    if (typeof autoSaveUserData === "function") {
        autoSaveUserData();
    }
}

// ========================================
// INITIALIZE DASHBOARD
// ========================================

document.addEventListener("DOMContentLoaded", function() {
    // Update dashboard immediately
    if (typeof updateDashboard === "function") {
        updateDashboard();
    }

    // Set up save target button
    const saveBtn = document.getElementById("saveTargetButton");
    if (saveBtn) {
        saveBtn.addEventListener("click", saveAttendanceTarget);
    }

    // Also save target when Enter key is pressed
    const targetInput = document.getElementById("targetInput");
    if (targetInput) {
        targetInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                saveAttendanceTarget();
            }
        });
    }
});

// ========================================
// DARK MODE FUNCTIONS (NEW)
// ========================================

function toggleDarkMode() {
    const body = document.body;
    body.classList.toggle('dark-mode');
    
    const isDark = body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
    
    const toggle = document.getElementById('darkModeToggle');
    if (toggle) toggle.textContent = isDark ? '☀️' : '🌙';
    
    // Re-render charts if on report page
    if (typeof createCharts === "function") setTimeout(createCharts, 100);
}

function loadDarkModePreference() {
    const darkMode = localStorage.getItem('darkMode');
    const body = document.body;
    const toggle = document.getElementById('darkModeToggle');
    
    if (darkMode === 'enabled') {
        body.classList.add('dark-mode');
        if (toggle) toggle.textContent = '☀️';
    } else {
        body.classList.remove('dark-mode');
        if (toggle) toggle.textContent = '🌙';
    }
}

// ========================================
// RESET ALL ATTENDANCE
// ========================================

function resetAllAttendance() {

    const confirmReset = confirm(
        "⚠️ Are you sure you want to reset ALL attendance?\n\n" +
        "This will delete all Present, Absent and Cancelled records."
    );

    if (!confirmReset) {
        return;
    }

    // Clear attendance records
    localStorage.removeItem("attendanceRecords");

    // Update dashboard
    if (typeof updateDashboard === "function") {
        updateDashboard();
    }

    // Auto-save to user account
    if (typeof autoSaveUserData === "function") {
        autoSaveUserData();
    }

    // Refresh page
    window.location.reload();
}

// ========================================
// RESET FUNCTIONS
// ========================================

// Reset ALL Data
function resetAllData() {
    const confirmed = confirm(
        "⚠️ WARNING: This will delete ALL your data!\n\n" +
        "This includes:\n" +
        "• All subjects\n" +
        "• All attendance records\n" +
        "• All holidays\n" +
        "• Attendance target\n\n" +
        "This action cannot be undone!\n\n" +
        "Are you sure you want to continue?"
    );
    
    if (!confirmed) return;
    
    // Double confirm for safety
    const secondConfirm = confirm(
        "⚠️ FINAL WARNING:\n\n" +
        "All your data will be permanently deleted.\n" +
        "Are you absolutely sure?"
    );
    
    if (!secondConfirm) return;
    
    // Clear all data
    localStorage.removeItem("subjects");
    localStorage.removeItem("attendanceRecords");
    localStorage.removeItem("holidays");
    localStorage.removeItem("attendanceTarget");
    localStorage.removeItem("selectedDate");
    
    // Clear user data if using auth
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
        const users = JSON.parse(localStorage.getItem("allUsers") || "{}");
        if (users[currentUser]) {
            users[currentUser].data = {
                subjects: [],
                attendanceRecords: [],
                holidays: [],
                attendanceTarget: 75
            };
            localStorage.setItem("allUsers", JSON.stringify(users));
        }
    }
    
    // Reload the page
    alert("✅ All data has been reset successfully!");
    location.reload();
}

// Reset ONLY Attendance Records
function resetAttendanceOnly() {
    const confirmed = confirm(
        "⚠️ This will delete ALL attendance records!\n\n" +
        "Subjects and holidays will NOT be affected.\n\n" +
        "Are you sure you want to continue?"
    );
    
    if (!confirmed) return;
    
    // Clear attendance records
    localStorage.removeItem("attendanceRecords");
    
    // Update user data if using auth
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
        const users = JSON.parse(localStorage.getItem("allUsers") || "{}");
        if (users[currentUser] && users[currentUser].data) {
            users[currentUser].data.attendanceRecords = [];
            localStorage.setItem("allUsers", JSON.stringify(users));
        }
    }
    
    alert("✅ All attendance records have been reset!");
    
    // Update dashboard if on home page
    if (typeof updateDashboard === "function") {
        updateDashboard();
    }
    
    // Refresh display if on attendance page
    if (typeof showDailySubjects === "function") {
        const date = new Date().toISOString().split('T')[0];
        showDailySubjects(date);
    }
    
    location.reload();
}

// Reset ONLY Subjects
function resetSubjectsOnly() {
    const confirmed = confirm(
        "⚠️ This will delete ALL subjects!\n\n" +
        "Attendance records and holidays will NOT be affected.\n\n" +
        "Are you sure you want to continue?"
    );
    
    if (!confirmed) return;
    
    // Clear subjects
    localStorage.removeItem("subjects");
    
    // Update user data if using auth
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
        const users = JSON.parse(localStorage.getItem("allUsers") || "{}");
        if (users[currentUser] && users[currentUser].data) {
            users[currentUser].data.subjects = [];
            localStorage.setItem("allUsers", JSON.stringify(users));
        }
    }
    
    alert("✅ All subjects have been reset!");
    
    // Refresh display if on subjects page
    if (typeof displaySubjects === "function") {
        displaySubjects();
    }
    
    location.reload();
}

// ========================================
// SMART REMINDERS
// ========================================

function generateReminder() {
    const stats = getOverallStats();
    const target = attendanceTarget || 75;
    
    const messages = [];
    
    // Check attendance
    if (stats.total > 0 && stats.percentage < target) {
        const neededClasses = Math.ceil(((target * stats.total) - (stats.present * 100)) / (100 - target));
        messages.push(`📚 You need ${neededClasses} more classes to reach ${target}% target.`);
    }
    
    // Check if today is marked
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = getAttendanceRecords().find(r => r.date === today);
    if (!todayRecord) {
        messages.push("📅 Don't forget to mark today's attendance!");
    }
    
    // Check if all subjects have attendance
    const subjects = getSubjects();
    const todaySubjects = getAttendanceRecords().filter(r => r.date === today);
    if (subjects.length > 0 && todaySubjects.length < subjects.length && todayRecord) {
        messages.push("📝 Some subjects are still unmarked for today!");
    }
    
    // Default message
    if (messages.length === 0) {
        messages.push("🎉 Great job! You're on track with your attendance.");
    }
    
    return messages[0];
}

function updateReminder() {
    const messageEl = document.getElementById('reminderMessage');
    if (messageEl) {
        messageEl.textContent = generateReminder();
    }
}

function dismissReminder() {
    const reminder = document.querySelector('.reminder-section');
    if (reminder) {
        reminder.style.display = 'none';
        localStorage.setItem('reminderDismissed', Date.now().toString());
    }
}

// Check if reminder was dismissed today
document.addEventListener('DOMContentLoaded', function() {
    const dismissed = localStorage.getItem('reminderDismissed');
    const today = new Date().toDateString();
    const dismissedDate = dismissed ? new Date(parseInt(dismissed)).toDateString() : null;
    
    if (dismissedDate === today) {
        const reminder = document.querySelector('.reminder-section');
        if (reminder) reminder.style.display = 'none';
    }
});

// ========================================
// PWA - SERVICE WORKER REGISTRATION
// ========================================

// Register Service Worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service_worker.js')
            .then(function(registration) {
                console.log('✅ Service Worker registered successfully!');
            })
            .catch(function(error) {
                console.error('❌ Service Worker registration failed:', error);
            });
    } else {
        console.log('⚠️ Service Workers not supported in this browser');
    }
}

// Check if app is installed
function checkAppInstalled() {
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('📱 App is installed on device');
        const installBanner = document.getElementById('installBanner');
        if (installBanner) {
            installBanner.style.display = 'none';
        }
        return true;
    }
    return false;
}

// ========================================
// INSTALL PROMPT
// ========================================

let deferredPrompt;

// Listen for install prompt
window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;
    console.log('📱 App can be installed!');
    
    // Show install banner
    const installBanner = document.getElementById('installBanner');
    if (installBanner) {
        installBanner.style.display = 'flex';
        installBanner.style.animation = 'slideUp 0.5s ease';
    }
});

// Install app function
function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function(choiceResult) {
            if (choiceResult.outcome === 'accepted') {
                console.log('✅ User accepted install prompt');
                const installBanner = document.getElementById('installBanner');
                if (installBanner) installBanner.remove();
            } else {
                console.log('❌ User dismissed install prompt');
            }
            deferredPrompt = null;
        });
    }
}

// App installed event
window.addEventListener('appinstalled', function() {
    console.log('📱 App installed successfully!');
    const installBanner = document.getElementById('installBanner');
    if (installBanner) installBanner.remove();
});

// ========================================
// INITIALIZE PWA
// ========================================

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing PWA...');
    
    // Register service worker
    registerServiceWorker();
    
    // Check if app is installed
    checkAppInstalled();
});

// Auto-save data when changes are made (for Supabase sync)
document.addEventListener("DOMContentLoaded", function() {
    if (typeof autoSaveUserData === "function") {
        // Save after every 2 seconds of inactivity
        setInterval(autoSaveUserData, 5000);
    }
});