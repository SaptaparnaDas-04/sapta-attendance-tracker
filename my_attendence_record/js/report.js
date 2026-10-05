// ========================================
// REPORT
// ========================================

function displayReports() {
    const overall = getOverallStats();

    const percentage = document.getElementById("overallPercentage");
    const present = document.getElementById("overallPresent");
    const absent = document.getElementById("overallAbsent");
    const total = document.getElementById("overallTotal");

    if (percentage) {
        percentage.textContent = `${overall.percentage.toFixed(1)}%`;
    }

    if (present) {
        present.textContent = overall.present;
    }

    if (absent) {
        absent.textContent = overall.absent;
    }

    if (total) {
        total.textContent = overall.total;
    }

    const container = document.getElementById("subjectReports");
    if (!container) return;

    const subjects = getSubjects();

    if (subjects.length === 0) {
        container.innerHTML = `
            <div class="report-card">
                <h3>No subjects yet 📚</h3>
            </div>
        `;
        return;
    }

    container.innerHTML = "";

    subjects.forEach(subject => {
        const stats = getSubjectStats(subject.id);

        container.innerHTML += `
            <div class="report-card">
                <h3>📚 ${subject.name}</h3>
                <h2>${stats.percentage.toFixed(1)}%</h2>
                <p>🟢 Present: ${stats.present}</p>
                <p>🔴 Absent: ${stats.absent}</p>
                ${stats.cancelled > 0 ? `<p>🚫 Cancelled: ${stats.cancelled} <small>(not counted)</small></p>` : ''}
                <p>📚 Total: ${stats.total}</p>
                <div class="progress">
                    <div class="progress-bar" style="width: ${stats.percentage}%"></div>
                </div>
            </div>
        `;
    });
}

// ========================================
// INITIALIZE
// ========================================

document.addEventListener("DOMContentLoaded", displayReports);