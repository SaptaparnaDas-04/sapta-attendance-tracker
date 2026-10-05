// ========================================
// SUBJECT MANAGEMENT
// ========================================

let subjects = getSubjects();

// ========================================
// SAVE
// ========================================

function saveSubjects() {
    localStorage.setItem("subjects", JSON.stringify(subjects));
}

// ========================================
// DISPLAY SUBJECTS
// ========================================

function displaySubjects() {
    const container = document.getElementById("subjectsList");
    if (!container) return;

    container.innerHTML = "";

    if (subjects.length === 0) {
        container.innerHTML = `
            <div class="subject-card">
                <h3>No subjects yet 📚</h3>
                <p>Add your first subject above.</p>
            </div>
        `;
        return;
    }

    subjects.forEach(subject => {
        const subjectType = subject.type || "General";
        const subjectCode = subject.code || "";
        const schedule = getSubjectScheduleInfo(subject.id);

        container.innerHTML += `
            <div class="subject-card">
                <h3>📚 ${subject.name}</h3>
                <p>📋 Type: ${subjectType}</p>
                ${subjectCode ? `<p>🔢 Code: ${subjectCode}</p>` : ''}
                <p style="font-size: 12px; color: #666;">📅 Days: ${schedule}</p>
                <div class="card-buttons">
                    <button class="edit-btn" onclick="editSubject('${subject.id}')">
                        ✏️ Edit
                    </button>
                    <button class="delete-btn" onclick="deleteSubject('${subject.id}')">
                        🗑️ Delete
                    </button>
                    <button class="edit-btn" onclick="openDayModal('${subject.id}')" style="background: #22c55e; color: white;">
                        📅 Set Days
                    </button>
                </div>
            </div>
        `;
    });
}

// ========================================
// GET SUBJECT SCHEDULE INFO (Display text)
// ========================================

function getSubjectScheduleInfo(subjectId) {
    const weeklySchedule = JSON.parse(localStorage.getItem("weeklySchedule") || "{}");
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const days = [];
    
    Object.keys(weeklySchedule).forEach(day => {
        if (weeklySchedule[day].includes(subjectId)) {
            days.push(dayNames[parseInt(day)]);
        }
    });
    
    if (days.length === 0) return "No days assigned";
    return days.join(", ");
}

// ========================================
// OPEN DAY SELECTOR MODAL
// ========================================

function openDayModal(subjectId) {
    const subject = subjects.find(sub => sub.id === subjectId);
    if (!subject) return;
    
    const weeklySchedule = JSON.parse(localStorage.getItem("weeklySchedule") || "{}");
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    // Build the modal HTML
    const modalHTML = `
        <div id="dayModalOverlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; justify-content: center; align-items: center;">
            <div style="background: white; padding: 30px; border-radius: 16px; max-width: 400px; width: 90%; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
                <h3 style="margin: 0 0 20px 0; color: #1a1a2e; font-size: 20px;">📅 Select Days for "${subject.name}"</h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                    ${dayNames.map((day, index) => {
                        // Skip Sunday (index 0) - always holiday
                        if (index === 0) {
                            return `
                                <div style="background: #fee2e2; padding: 10px; border-radius: 8px; text-align: center; color: #991b1b; font-weight: 600; border: 2px solid #dc2626;">
                                    ${day} 🎉
                                </div>
                            `;
                        }
                        
                        const isChecked = weeklySchedule[index] && weeklySchedule[index].includes(subjectId);
                        
                        return `
                            <label style="display: flex; align-items: center; gap: 8px; background: #f8f9fa; padding: 10px; border-radius: 8px; cursor: pointer; border: 2px solid #e0e0e0;">
                                <input type="checkbox" id="day_${index}" ${isChecked ? 'checked' : ''} style="width: 18px; height: 18px;">
                                <span style="font-weight: 600; color: #1a1a2e;">${day}</span>
                            </label>
                        `;
                    }).join('')}
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button onclick="closeDayModal()" style="padding: 10px 20px; border: 2px solid #e0e0e0; background: white; border-radius: 8px; cursor: pointer; font-weight: 600; color: #666;">
                        Cancel
                    </button>
                    <button onclick="saveDayModal('${subjectId}')" style="padding: 10px 20px; border: none; background: #22c55e; color: white; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        ✅ Save
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Append modal to body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
}

// ========================================
// CLOSE DAY SELECTOR MODAL
// ========================================

function closeDayModal() {
    const modal = document.getElementById('dayModalOverlay');
    if (modal) {
        modal.remove();
    }
}

// ========================================
// SAVE DAY SELECTOR MODAL
// ========================================

function saveDayModal(subjectId) {
    const selectedDays = [];
    
    // Get checked days (Monday to Saturday, index 1-6)
    for (let i = 1; i < 7; i++) {
        const checkbox = document.getElementById(`day_${i}`);
        if (checkbox && checkbox.checked) {
            selectedDays.push(i);
        }
    }
    
    // Save schedule
    const weeklySchedule = JSON.parse(localStorage.getItem("weeklySchedule") || "{}");
    
    // Remove subject from all days first
    Object.keys(weeklySchedule).forEach(day => {
        weeklySchedule[day] = weeklySchedule[day].filter(id => id !== subjectId);
    });
    
    // Add subject to selected days
    selectedDays.forEach(day => {
        if (!weeklySchedule[day]) weeklySchedule[day] = [];
        weeklySchedule[day].push(subjectId);
    });
    
    // ALWAYS remove from Sunday (index 0)
    if (weeklySchedule[0]) {
        weeklySchedule[0] = weeklySchedule[0].filter(id => id !== subjectId);
    }
    
    localStorage.setItem("weeklySchedule", JSON.stringify(weeklySchedule));
    
    // Close modal and refresh display
    closeDayModal();
    displaySubjects();
    
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    alert(`✅ "${subjects.find(s => s.id === subjectId).name}" will appear on: ${selectedDays.map(d => dayNames[d-1]).join(", ")}`);
}

// ========================================
// ADD SUBJECT
// ========================================

function addSubject() {
    const nameInput = document.getElementById("subjectInput");
    const typeSelect = document.getElementById("subjectType");
    const codeInput = document.getElementById("subjectCode");
    
    if (!nameInput) {
        alert("Error: Subject input not found.");
        return;
    }
    
    const name = nameInput.value.trim();
    const type = typeSelect ? typeSelect.value : "general";
    const code = codeInput ? codeInput.value.trim() : "";

    if (!name) {
        alert("Please enter a subject name.");
        nameInput.focus();
        return;
    }

    const duplicate = subjects.find(sub => sub.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
        alert(`Subject "${name}" already exists!`);
        nameInput.focus();
        return;
    }

    const subject = {
        id: Date.now().toString(),
        name: name,
        type: type,
        code: code
    };

    subjects.push(subject);
    saveSubjects();
    
    nameInput.value = "";
    if (typeSelect) typeSelect.value = "general";
    if (codeInput) codeInput.value = "";
    
    displaySubjects();
}

// ========================================
// EDIT SUBJECT
// ========================================

function editSubject(id) {
    const subject = subjects.find(item => item.id === id);
    if (!subject) {
        alert("Subject not found!");
        return;
    }

    const newName = prompt("Enter new subject name:", subject.name);
    if (!newName || !newName.trim()) {
        return;
    }
    subject.name = newName.trim();
    
    const currentType = subject.type || "General";
    const newType = prompt("Enter subject type (Theory/Practical/General):", currentType);
    if (newType && newType.trim()) {
        subject.type = newType.trim();
    }
    
    const newCode = prompt("Enter subject code (optional):", subject.code || "");
    if (newCode !== null) {
        subject.code = newCode.trim();
    }
    
    saveSubjects();
    displaySubjects();
}

// ========================================
// DELETE SUBJECT
// ========================================

function deleteSubject(id) {
    const subject = subjects.find(item => item.id === id);
    if (!subject) {
        alert("Subject not found!");
        return;
    }

    const confirmed = confirm(`Delete "${subject.name}"?`);
    if (!confirmed) return;

    // Remove from weekly schedule
    const weeklySchedule = JSON.parse(localStorage.getItem("weeklySchedule") || "{}");
    Object.keys(weeklySchedule).forEach(day => {
        weeklySchedule[day] = weeklySchedule[day].filter(sId => sId !== id);
    });
    localStorage.setItem("weeklySchedule", JSON.stringify(weeklySchedule));

    subjects = subjects.filter(item => item.id !== id);
    saveSubjects();
    displaySubjects();
}

// ========================================
// INITIALIZE
// ========================================

document.addEventListener("DOMContentLoaded", function() {
    displaySubjects();
    
    const nameInput = document.getElementById("subjectInput");
    if (nameInput) {
        nameInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                addSubject();
            }
        });
    }
});