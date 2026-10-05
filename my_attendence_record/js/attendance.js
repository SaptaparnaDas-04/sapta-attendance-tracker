// ========================================
// ATTENDANCE DATA
// ========================================

let attendanceRecords = getAttendanceRecords();

// ========================================
// SAVE
// ========================================

function saveAttendance() {
    localStorage.setItem("attendanceRecords", JSON.stringify(attendanceRecords));
}

// ========================================
// GET SUBJECTS FOR THIS DAY (Based on weekday)
// ========================================

function getSubjectsForDay(dateString) {
    const subjects = getSubjects();
    const dayOfWeek = new Date(dateString + "T00:00:00").getDay(); // 0=Sun, 1=Mon, etc.
    
    // Get weekly schedule
    const weeklySchedule = JSON.parse(localStorage.getItem("weeklySchedule") || "{}");
    
    // If schedule exists for this day, show only those subjects
    if (weeklySchedule[dayOfWeek] && weeklySchedule[dayOfWeek].length > 0) {
        return subjects.filter(subject => weeklySchedule[dayOfWeek].includes(subject.id));
    }
    
    // If no schedule for this day, show no subjects
    return [];
}

// ========================================
// MARK ATTENDANCE
// ========================================

function markAttendance(date, subjectId, status) {
    console.log("Marking attendance:", date, subjectId, status);

    if (!date || !subjectId || !status) {
        console.error("Missing attendance information");
        return;
    }

    // Find existing record
    const existing = attendanceRecords.find(
        record => record.date === date && record.subjectId === subjectId
    );

    // Update existing record
    if (existing) {
        existing.status = status;
    } else {
        // Create new record
        attendanceRecords.push({
            date: date,
            subjectId: subjectId,
            status: status
        });
    }

    // Save attendance
    saveAttendance();

    // Refresh selected date
    if (typeof showDailySubjects === "function") {
        showDailySubjects(date);
    }

    // Refresh dashboard
    if (typeof updateDashboard === "function") {
        updateDashboard();
    }

    console.log("Attendance saved:", attendanceRecords);
}

// ========================================
// REMOVE ATTENDANCE
// ========================================

function removeAttendance(date, subjectId) {
    if (!date || !subjectId) {
        console.error("Missing information for removal");
        return;
    }

    const confirmed = confirm("Remove attendance marking for this subject on this date?");
    if (!confirmed) return;

    attendanceRecords = attendanceRecords.filter(
        record => !(record.date === date && record.subjectId === subjectId)
    );

    saveAttendance();

    // Refresh selected date
    if (typeof showDailySubjects === "function") {
        showDailySubjects(date);
    }

    // Refresh dashboard
    if (typeof updateDashboard === "function") {
        updateDashboard();
    }
}

// ========================================
// CANCEL ALL CLASSES FOR A DAY
// ========================================

function cancelAllClasses(date) {
    const subjects = getSubjectsForDay(date);
    if (subjects.length === 0) return;

    const confirmed = confirm("Mark ALL classes on this day as cancelled?");
    if (!confirmed) return;

    subjects.forEach(subject => {
        const existing = attendanceRecords.find(
            record => record.date === date && record.subjectId === subject.id
        );
        if (existing) {
            existing.status = "cancelled";
        } else {
            attendanceRecords.push({ date: date, subjectId: subject.id, status: "cancelled" });
        }
    });

    saveAttendance();
    showDailySubjects(date);
    if (typeof updateDashboard === "function") updateDashboard();
}

// ========================================
// SUBJECT STATISTICS
// ========================================

function getSubjectStats(subjectId) {
    const records = attendanceRecords.filter(
        record => record.subjectId === subjectId
    );

    const present = records.filter(record => record.status === "present").length;
    const absent = records.filter(record => record.status === "absent").length;
    const cancelled = records.filter(record => record.status === "cancelled").length;
    // Cancelled classes are NOT counted in total / percentage
    const total = present + absent;
    const percentage = total === 0 ? 0 : (present / total) * 100;

    return { present, absent, cancelled, total, percentage };
}

// ========================================
// OVERALL STATISTICS
// ========================================

function getOverallStats() {
    const present = attendanceRecords.filter(record => record.status === "present").length;
    const absent = attendanceRecords.filter(record => record.status === "absent").length;
    const cancelled = attendanceRecords.filter(record => record.status === "cancelled").length;
    // Cancelled classes are NOT counted in total / percentage
    const total = present + absent;
    const percentage = total === 0 ? 0 : (present / total) * 100;

    return { present, absent, cancelled, total, percentage };
}

// ========================================
// SHOW DAILY SUBJECTS (Based on weekday)
// ========================================

function showDailySubjects(date) {
    const container = document.getElementById("attendanceSubjects");
    if (!container) return;

    // ✅ CHECK IF IT'S SUNDAY
    const dateObjForCheck = new Date(date + "T00:00:00");
    const dayOfWeek = dateObjForCheck.getDay(); // 0 = Sunday
    
    if (dayOfWeek === 0) {
        container.innerHTML = `
            <div class="subject-card" style="text-align: center; padding: 30px;">
                <h3>🎉 Sunday Holiday</h3>
                <p>No attendance needed on Sundays!</p>
            </div>
        `;
        return;
    }

    // Get subjects for this specific day
    const subjects = getSubjectsForDay(date);

    if (subjects.length === 0) {
        container.innerHTML = `
            <div class="subject-card" style="text-align: center; padding: 30px;">
                <h3>📅 No classes today</h3>
                <p>No subjects scheduled for this day.</p>
            </div>
        `;
        return;
    }

    const dateObject = new Date(date + "T00:00:00");
    const formatted = dateObject.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    const dateElement = document.getElementById("attendanceDate");
    if (dateElement) {
        dateElement.textContent = formatted;
    }

    container.innerHTML = `
        <div class="cancel-all-bar">
            <button class="cancel-all-btn" onclick="cancelAllClasses('${date}')">
                🚫 Cancel all classes today
            </button>
        </div>
    `;

    subjects.forEach(subject => {
        const record = attendanceRecords.find(
            item => item.date === date && item.subjectId === subject.id
        );

        let statusText = "⚪ Not Marked";
        if (record && record.status === "present") {
            statusText = "🟢 Present";
        } else if (record && record.status === "absent") {
            statusText = "🔴 Absent";
        } else if (record && record.status === "cancelled") {
            statusText = "🚫 Class Cancelled";
        }

        container.innerHTML += `
            <div class="daily-subject">
                <h3>📚 ${subject.name}</h3>
                <div class="status-text">Status: ${statusText}</div>

                <button class="present-btn" onclick="markAttendance('${date}', '${subject.id}', 'present')">
                    ✅ Present
                </button>

                <button class="absent-btn" onclick="markAttendance('${date}', '${subject.id}', 'absent')">
                    ❌ Absent
                </button>

                <button class="cancelled-btn" onclick="markAttendance('${date}', '${subject.id}', 'cancelled')">
                    🚫 Cancelled
                </button>

                <button class="remove-btn" onclick="removeAttendance('${date}', '${subject.id}')">
                    ↩️ Remove Marking
                </button>
            </div>
        `;
    });
}

// ========================================
// INITIALIZE ATTENDANCE PAGE
// ========================================

document.addEventListener("DOMContentLoaded", function() {
    const params = new URLSearchParams(window.location.search);
    let date = params.get("date");

    if (!date) {
        date = localStorage.getItem("selectedDate");
    }

    if (!date) {
        const today = new Date();
        date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    }

    showDailySubjects(date);
});