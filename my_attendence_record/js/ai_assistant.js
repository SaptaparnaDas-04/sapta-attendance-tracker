// ========================================
// AI ASSISTANT - SMART CHATBOT + ANALYTICS
// ========================================

// ========================================
// ATTENDANCE STREAK CALCULATOR
// ========================================

function calculateStreak() {
    const records = getAttendanceRecords();
    const today = new Date();
    let streak = 0;
    
    // Check today first
    let checkDate = new Date(today);
    
    // If today is Sunday or not marked, start from yesterday
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const todayRecord = records.find(r => r.date === todayString);
    
    if (!todayRecord || today.getDay() === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
    }
    
    // Count consecutive days with attendance
    while (true) {
        const dayOfWeek = checkDate.getDay();
        
        // Skip Sundays (Holiday)
        if (dayOfWeek !== 0) {
            const dateString = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;
            const dayRecord = records.find(r => r.date === dateString);
            
            if (dayRecord) {
                streak++;
            } else {
                break;
            }
        }
        
        checkDate.setDate(checkDate.getDate() - 1);
        
        // Safety limit (avoid infinite loop)
        if (streak > 365) break;
    }
    
    return streak;
}

// ========================================
// ANALYTICS DASHBOARD
// ========================================

function getAnalytics() {
    const records = getAttendanceRecords();
    const subjects = getSubjects();
    
    // Best Day of the Week
    const dayStats = { 0: {present: 0, total: 0}, 1: {present: 0, total: 0}, 2: {present: 0, total: 0}, 3: {present: 0, total: 0}, 4: {present: 0, total: 0}, 5: {present: 0, total: 0}, 6: {present: 0, total: 0} };
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    records.forEach(record => {
        if (record.status === "cancelled") return; // cancelled classes don't count
        const dayOfWeek = new Date(record.date + "T00:00:00").getDay();
        if (dayStats[dayOfWeek]) {
            dayStats[dayOfWeek].total++;
            if (record.status === "present") dayStats[dayOfWeek].present++;
        }
    });
    
    let bestDay = "None";
    let bestDayPct = 0;
    Object.keys(dayStats).forEach(day => {
        const stat = dayStats[day];
        if (stat.total > 0) {
            const pct = (stat.present / stat.total) * 100;
            if (pct > bestDayPct) {
                bestDayPct = pct;
                bestDay = dayNames[parseInt(day)];
            }
        }
    });
    
    // Worst Subject
    let worstSubject = "None";
    let worstPct = 100;
    subjects.forEach(subject => {
        const stats = getSubjectStats(subject.id);
        if (stats.total > 0 && stats.percentage < worstPct) {
            worstPct = stats.percentage;
            worstSubject = subject.name;
        }
    });
    
    // Total classes missed
    const totalAbsent = records.filter(r => r.status === "absent").length;
    
    // Longest streak
    const streak = calculateStreak();
    
    return {
        bestDay: bestDay,
        bestDayPct: Math.round(bestDayPct),
        worstSubject: worstSubject,
        worstPct: Math.round(worstPct),
        totalAbsent: totalAbsent,
        streak: streak
    };
}

// ========================================
// AI CHATBOT  -  SMART OFFLINE ENGINE
// ----------------------------------------
// • understands typos & slang ("bunk", "attendence")
// • recognises your subjects, dates, % and numbers
// • remembers the conversation ("what about maths?")
// • does real maths (safe-to-skip, classes needed, what-if)
// • runs fully in the browser - no API key needed
// ========================================

const BOT_STATE = { lastIntent: null, lastSubject: null, lastDir: null, pending: null };

// ---------- small helpers ----------

function botEsc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function botDateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function botToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

function botAddDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
}

function botTarget() {
    return Number(localStorage.getItem("attendanceTarget")) || 75;
}

function botPlural(n, one, many) {
    return n === 1 ? one : (many || one + "s");
}

function botCls(n) {
    return botPlural(n, "class", "classes");
}

// "**3 Physics classes**" or "**3 classes**"
function botCount(n, subj) {
    return `**${n} ${subj ? botEsc(subj.name) + " " : ""}${botCls(n)}**`;
}

function botFmtDate(d) {
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

// ---------- text understanding ----------

const BOT_CANON = {
    bunk: "skip", bunking: "skip", bunked: "skip", skipping: "skip", skipped: "skip", skips: "skip", cut: "skip",
    missing: "miss", missed: "miss", misses: "miss",
    classes: "class", lecture: "class", lectures: "class", lec: "class", periods: "class", period: "class",
    subjects: "subject", courses: "subject", course: "subject", papers: "subject",
    absents: "absent", absence: "absent", absences: "absent",
    cancelled: "cancel", canceled: "cancel", cancels: "cancel", cancellation: "cancel", cancelling: "cancel",
    holidays: "holiday", vacations: "holiday",
    attended: "attend", attending: "attend", attends: "attend",
    percentage: "percent", percentages: "percent", pct: "percent",
    targets: "target", streaks: "streak",
    mis: "miss", clases: "class", clas: "class", clasess: "class", skp: "skip", skiping: "skip",
    abcent: "absent", absnt: "absent", atend: "attend", attnd: "attend",
    timetable: "schedule", routine: "schedule", tmrw: "tomorrow", tomorow: "tomorrow", tommorow: "tomorrow"
};

const BOT_NUMBER_WORDS = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10
};

const BOT_NAME_STOP = new Set([
    "and", "the", "for", "of", "to", "in", "lab", "class", "intro", "introduction",
    "basic", "basics", "advanced", "theory", "practical", "i", "ii", "iii", "iv"
]);

function botTokens(text) {
    return String(text).toLowerCase()
        .replace(/[’']/g, "")
        .replace(/[^a-z0-9%.\s]/g, " ")
        .split(/\s+/)
        .filter(Boolean);
}

function botWordsToNumbers(text) {
    return text.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/gi,
        m => BOT_NUMBER_WORDS[m.toLowerCase()]);
}

function botLev(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    let prev = [];
    for (let j = 0; j <= n; j++) prev[j] = j;
    for (let i = 1; i <= m; i++) {
        const cur = [i];
        for (let j = 1; j <= n; j++) {
            cur[j] = Math.min(
                prev[j] + 1,
                cur[j - 1] + 1,
                prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
            );
        }
        prev = cur;
    }
    return prev[n];
}

// token ≈ word (exact, or a small typo for longer words)
function botMatch(token, word) {
    if (token === word) return true;
    if (word.length < 5 || token.length < 4) return false;
    if (Math.abs(token.length - word.length) > 2) return false;
    const maxD = word.length >= 8 ? 2 : 1;
    return botLev(token, word) <= maxD;
}

function botHasPhrase(text, phrase) {
    return (" " + text + " ").indexOf(" " + phrase + " ") !== -1;
}

function botCommonPrefix(a, b) {
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    return i;
}

// ---------- entity extraction ----------

function botFindSubject(tokens, text) {
    const subjects = getSubjects();
    let best = null, bestScore = 0;

    subjects.forEach(subject => {
        const nameTokens = botTokens(subject.name).filter(t => t.length >= 2 && !BOT_NAME_STOP.has(t));
        if (!nameTokens.length) return;

        let matched = 0;
        nameTokens.forEach(nt => {
            const hit = tokens.some(t => {
                if (t === nt) return true;
                if (nt.length >= 5 && botMatch(t, nt)) return true;
                if (t.length >= 4 && nt.length >= 4) {
                    const cp = botCommonPrefix(t, nt);
                    if (cp >= 4 && cp >= 0.8 * Math.min(t.length, nt.length)) return true;
                }
                return false;
            });
            if (hit) matched++;
        });

        // initials: "se" -> Software Engineering
        if (nameTokens.length >= 2) {
            const initials = nameTokens.map(t => t[0]).join("");
            if (tokens.includes(initials)) matched = Math.max(matched, nameTokens.length);
        }

        if (!matched) return;

        let score = matched + (matched === nameTokens.length ? 1 : 0);
        const fullTokens = botTokens(subject.name);
        if (botHasPhrase(text, fullTokens.join(" "))) score += 1 + fullTokens.length; // longer exact name wins

        if (score > bestScore) {
            bestScore = score;
            best = subject;
        }
    });

    return best;
}

function botFindDate(tokens) {
    const today = botToday();
    const text = tokens.join(" ");

    if (botHasPhrase(text, "day after tomorrow")) return { date: botAddDays(today, 2), label: "day after tomorrow" };
    if (tokens.some(t => botMatch(t, "today") || t === "tonight")) return { date: today, label: "today" };
    if (tokens.some(t => botMatch(t, "tomorrow"))) return { date: botAddDays(today, 1), label: "tomorrow" };
    if (tokens.some(t => botMatch(t, "yesterday"))) return { date: botAddDays(today, -1), label: "yesterday" };

    const days = {
        sunday: 0, sun: 0, monday: 1, mon: 1, tuesday: 2, tue: 2, tues: 2, wednesday: 3, wed: 3,
        thursday: 4, thu: 4, thur: 4, thurs: 4, friday: 5, fri: 5, saturday: 6, sat: 6
    };
    const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    for (let i = 0; i < tokens.length; i++) {
        if (days[tokens[i]] !== undefined) {
            const target = days[tokens[i]];
            const wantsPast = i > 0 && tokens[i - 1] === "last";
            let d = new Date(today);
            if (wantsPast) {
                do { d = botAddDays(d, -1); } while (d.getDay() !== target);
            } else {
                while (d.getDay() !== target) d = botAddDays(d, 1);
            }
            return { date: d, label: (wantsPast ? "last " : "") + names[target] };
        }
    }
    return null;
}

function botNumbers(prepared) {
    const t = prepared.toLowerCase();
    let pct = null, count = null, rest = t;

    const pm = t.match(/(\d{1,3}(?:\.\d+)?)\s*(?:%|percent|per cent|pct)/);
    if (pm) {
        pct = parseFloat(pm[1]);
        rest = rest.replace(pm[0], " ");
    }
    if (pct === null) {
        const tm = t.match(/target[^\d]{0,15}(\d{1,3}(?:\.\d+)?)/);
        if (tm) {
            pct = parseFloat(tm[1]);
            rest = rest.replace(tm[0], " ");
        }
    }
    if (pct === null) {
        const rm = t.match(/(?:reach|get to|hit|achieve|to|at)\s+(\d{2,3})\b/);
        if (rm && Number(rm[1]) >= 30 && Number(rm[1]) <= 100) {
            pct = Number(rm[1]);
            rest = rest.replace(rm[0], " ");
        }
    }
    const nm = rest.match(/\b(\d{1,3})\b/);
    if (nm) count = Number(nm[1]);

    if (pct !== null && (pct <= 0 || pct > 100)) pct = null;
    return { pct, count };
}

// ---------- attendance maths ----------

function botStats(subjectId) {
    const recs = getAttendanceRecords().filter(r => !subjectId || r.subjectId === subjectId);
    const present = recs.filter(r => r.status === "present").length;
    const absent = recs.filter(r => r.status === "absent").length;
    const cancelled = recs.filter(r => r.status === "cancelled").length;
    const total = present + absent; // cancelled classes never count
    return { present, absent, cancelled, total, pct: total === 0 ? 0 : (present / total) * 100 };
}

// most classes you can still miss and stay >= target
function botMaxSkip(p, t, target) {
    if (target <= 0) return Infinity;
    return Math.max(0, Math.floor((p * 100) / target - t + 1e-9));
}

// consecutive classes needed to reach target (null = impossible)
function botNeed(p, t, target) {
    if (t > 0 && (p / t) * 100 >= target) return 0;
    if (t === 0) return 0;
    if (target >= 100) return null;
    return Math.max(0, Math.ceil((target * t - 100 * p) / (100 - target) - 1e-9));
}

function botClassesPerWeek(subjectId) {
    const ws = JSON.parse(localStorage.getItem("weeklySchedule") || "{}");
    let n = 0;
    Object.keys(ws).forEach(d => {
        if (Number(d) === 0) return;
        (ws[d] || []).forEach(id => { if (!subjectId || id === subjectId) n++; });
    });
    return n;
}

function botScheduleFor(date) {
    const ws = JSON.parse(localStorage.getItem("weeklySchedule") || "{}");
    const ids = ws[date.getDay()] || [];
    return getSubjects().filter(s => ids.includes(s.id));
}

function botHolidayOn(dateStr) {
    return getHolidays().find(h => h.date === dateStr) || null;
}

function botIcon(pct, target) {
    if (pct >= target) return "✅";
    if (pct >= target - 10) return "⚠️";
    return "🔴";
}

function botWeeks(need, subjectId) {
    const perWeek = botClassesPerWeek(subjectId);
    if (!need || !perWeek) return "";
    const weeks = Math.ceil(need / perWeek);
    return ` (about ${weeks} ${botPlural(weeks, "week")} at ${perWeek} ${botCls(perWeek)}/week)`;
}

// advice line used in several answers
function botAdvice(st, target, subjectId) {
    if (st.total === 0) return "";
    if (st.pct >= target) {
        const skip = botMaxSkip(st.present, st.total, target);
        return skip > 0
            ? `🛋️ You can skip up to **${skip}** more ${botCls(skip)} and still stay at ${target}%.`
            : `⚠️ You're right on the edge - skipping even one class drops you below ${target}%.`;
    }
    const need = botNeed(st.present, st.total, target);
    return need === null
        ? `🎯 ${target}% is no longer reachable with ${st.absent} absences on record.`
        : `🎯 Attend the next **${need}** ${botCls(need)} in a row to reach ${target}%${botWeeks(need, subjectId)}.`;
}

function botDayStats() {
    const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const stats = names.map(() => ({ present: 0, total: 0 }));
    getAttendanceRecords().forEach(r => {
        if (r.status !== "present" && r.status !== "absent") return;
        const d = new Date(r.date + "T00:00:00").getDay();
        stats[d].total++;
        if (r.status === "present") stats[d].present++;
    });
    return names.map((name, i) => ({
        name, total: stats[i].total,
        pct: stats[i].total ? (stats[i].present / stats[i].total) * 100 : null
    })).filter(d => d.total > 0);
}

function botPeriodStats(fromDate, toDate) {
    const from = botDateStr(fromDate), to = botDateStr(toDate);
    const recs = getAttendanceRecords().filter(r => r.date >= from && r.date <= to);
    const p = recs.filter(r => r.status === "present").length;
    const a = recs.filter(r => r.status === "absent").length;
    return { present: p, absent: a, total: p + a, pct: p + a === 0 ? null : (p / (p + a)) * 100 };
}

// unmarked scheduled classes in the recent past (never before your first record)
function botPendingList() {
    const records = getAttendanceRecords();
    if (records.length === 0) return { list: [], total: 0, noData: true };

    const earliest = records.map(r => r.date).sort()[0];
    const today = botToday();
    const holidays = new Set(getHolidays().map(h => h.date));
    const list = [];
    let total = 0;

    for (let i = 0; i <= 14; i++) {
        const d = botAddDays(today, -i);
        const ds = botDateStr(d);
        if (ds < earliest || d.getDay() === 0 || holidays.has(ds)) continue;

        const missing = botScheduleFor(d).filter(s =>
            !records.some(r => r.date === ds && r.subjectId === s.id));
        if (missing.length) {
            list.push({ date: d, ds, subjects: missing });
            total += missing.length;
        }
    }
    return { list, total, noData: false };
}

// ---------- chips ----------

// ---------- intent definitions ----------

const BOT_SUBJECT_CAPABLE = ["overall", "skip", "need", "whatif", "cancel"];

const BOT_INTENTS = {
    thanks: { w: 4, exact: true, words: ["thanks", "thank", "thx", "ty", "thankyou", "cheers"], phrases: ["thank you"] },
    greeting: { w: 3, exact: true, words: ["hello", "hi", "hey", "hii", "hiya", "namaste", "yo", "sup"], phrases: ["good morning", "good afternoon", "good evening"] },
    help: { w: 4, exact: true, words: ["help", "commands", "options", "menu"], phrases: ["what can you do", "how to use", "what do you do"] },
    pending: {
        w: 4, words: ["pending", "unmarked", "forgot", "forget", "forgotten", "incomplete"],
        phrases: ["not marked", "havent marked", "didnt mark", "to mark", "need to mark", "left to mark", "yet to mark", "unmarked days"]
    },
    cancel: { w: 4, words: ["cancel"], phrases: ["called off", "not held", "didnt happen"] },
    skip: {
        w: 3, words: ["skip", "afford", "safe", "leave", "relax", "margin", "buffer"],
        phrases: ["can i skip", "can i miss", "how many can i miss", "how many class can", "safe to", "allowed to miss", "can i take"]
    },
    need: {
        w: 3, words: ["need", "reach", "required", "requirement", "recover", "boost"],
        phrases: ["how many class", "catch up", "bring up", "get to", "improve my", "raise my", "increase my", "to reach", "what do i need"]
    },
    risk: {
        w: 3, words: ["risk", "danger", "shortage", "below", "critical", "warning", "low", "falling", "detained", "detention"],
        phrases: ["which subject", "at risk", "in trouble"]
    },
    worst: { w: 3, words: ["worst", "weakest", "weak", "lowest", "poor", "struggling"], phrases: ["bad subject"] },
    best: { w: 3, words: ["best", "strongest", "top", "highest"], phrases: [] },
    streak: { w: 3, words: ["streak", "consecutive", "row"], phrases: ["in a row"] },
    schedule: {
        w: 3, words: ["schedule", "lineup"],
        phrases: ["what do i have", "what class", "which class", "whats on", "class today", "class tomorrow", "any class", "have class"]
    },
    holiday: { w: 3, words: ["holiday", "festival", "break", "off"], phrases: ["day off", "public holiday", "long weekend"] },
    trend: {
        w: 3, words: ["trend", "improving", "lately", "recently", "progressing", "declining"],
        phrases: ["getting better", "getting worse", "this week", "last week", "am i improving", "over time", "compared to"]
    },
    summary: {
        w: 3, words: ["summary", "overview", "status", "progress", "insights", "insight", "report", "recap"],
        phrases: ["how am i doing", "how am i", "where do i stand", "give me an update", "how is my attendance"]
    },
    overall: {
        w: 2, words: ["attendance", "percent", "score", "absent", "attend", "present"],
        phrases: ["how much", "my attendance", "how many times", "total class"]
    }
};

function botScoreIntents(tokens, text, raw) {
    const scores = {};
    Object.keys(BOT_INTENTS).forEach(name => {
        const def = BOT_INTENTS[name];
        let score = 0;
        def.words.forEach(w => {
            const hit = def.exact ? tokens.includes(w) : tokens.some(t => botMatch(t, w));
            if (hit) score += def.w;
        });
        def.phrases.forEach(p => { if (botHasPhrase(text, p)) score += def.w + 1; });
        scores[name] = score;
    });
    if (raw.indexOf("%") !== -1) scores.overall += 1;
    if (scores.greeting > 0 && tokens.length > 5) scores.greeting = 0; // "hi" inside a long question
    return scores;
}

// ---------- intent handlers ----------

function botNoData() {
    return {
        text: "📭 You haven't marked any attendance yet. Open the **Calendar** or **Attendance** page, mark a class, and I'll start giving real numbers.",
        chips: ["What can you do?"]
    };
}

function botNoSubjects() {
    return {
        text: "📚 You haven't added any subjects yet. Add them on the **Subjects** page first, then I can analyse each one.",
        chips: ["What can you do?"]
    };
}

function botSubjectReport(subject) {
    const target = botTarget();
    const st = botStats(subject.id);
    const name = botEsc(subject.name);

    if (st.total === 0) {
        return {
            text: `📚 **${name}**: nothing counted yet` + (st.cancelled ? ` (${st.cancelled} cancelled).` : "."),
            chips: ["Show my at-risk subjects", "How am I doing?"]
        };
    }

    let text = `📚 **${name}** - **${st.pct.toFixed(1)}%** ${botIcon(st.pct, target)}\n` +
        `🟢 ${st.present} present · 🔴 ${st.absent} absent` +
        (st.cancelled ? ` · 🚫 ${st.cancelled} cancelled (not counted)` : "") + "\n" +
        botAdvice(st, target, subject.id);

    return {
        text,
        chips: [`Can I skip ${subject.name}?`, `What if I miss 2 ${subject.name} classes?`, "Show my at-risk subjects"]
    };
}

function hOverall(p) {
    if (p.subject) return botSubjectReport(p.subject);
    const st = botStats(null);
    if (st.total === 0) return botNoData();
    const target = botTarget();

    const text = `📊 Your overall attendance is **${st.pct.toFixed(1)}%** ${botIcon(st.pct, target)} (target ${target}%).\n` +
        `🟢 ${st.present} present · 🔴 ${st.absent} absent` +
        (st.cancelled ? ` · 🚫 ${st.cancelled} cancelled (not counted)` : "") + "\n" +
        botAdvice(st, target, null);

    return { text, chips: ["How am I doing?", "Show my at-risk subjects", "Am I improving?"] };
}

function hSkip(p) {
    const target = p.pct || botTarget();
    const subjects = getSubjects();
    const subj = p.subject;
    const st = botStats(subj ? subj.id : null);
    if (st.total === 0) return botNoData();

    const label = subj ? `**${botEsc(subj.name)}**` : "overall";
    const who = subj ? `In ${label},` : "Overall,";
    const maxSkip = botMaxSkip(st.present, st.total, target);

    // "Can I skip tomorrow?" -> look at what is actually scheduled that day
    let dayPrefix = "";
    if (!p.count && p.date) {
        const ds = botDateStr(p.date.date);
        const holiday = botHolidayOn(ds);
        const day = botScheduleFor(p.date.date).filter(s => !subj || s.id === subj.id);
        if (p.date.date.getDay() === 0 || holiday || day.length === 0) {
            return {
                text: `📭 Nothing to skip ${p.date.label} - ` + (holiday ? `it's a holiday (${botEsc(holiday.name)}).` : p.date.date.getDay() === 0 ? "Sundays are your weekly off anyway." : `no ${subj ? botEsc(subj.name) + " " : ""}classes are scheduled.`),
                chips: ["Upcoming holidays", "Today's classes"]
            };
        }
        p = Object.assign({}, p, { count: day.length });
        dayPrefix = p.date.label + "'s ";
    }

    // "Can I skip 3 classes?"
    if (p.count) {
        const after = (st.present / (st.total + p.count)) * 100;
        const ok = after >= target;
        return {
            text: (ok ? "✅ " : "🚫 ") +
                `If you skip ${dayPrefix}${botCount(p.count, subj)}, you'd drop from ${st.pct.toFixed(1)}% to **${after.toFixed(1)}%** - ` +
                (ok ? `still above your ${target}% target.` : `below your ${target}% target.`) +
                (ok ? `\n🛋️ Your total safe limit is ${maxSkip} ${botCls(maxSkip)}.` : `\n🛋️ Safe limit right now: ${maxSkip} ${botCls(maxSkip)}.`),
            chips: ["How many classes do I need?", "Show my at-risk subjects"]
        };
    }

    let text;
    if (st.pct >= target) {
        text = maxSkip > 0
            ? `🛋️ ${who} you can skip up to **${maxSkip}** more ${botCls(maxSkip)} and still stay at ${target}%.`
            : `⚠️ No spare room ${subj ? "in " + label : "overall"} - you're exactly at the limit, so skipping one class takes you below ${target}%.`;
    } else {
        const need = botNeed(st.present, st.total, target);
        text = `🚫 Not safe - ${subj ? label : "your overall attendance"} is at ${st.pct.toFixed(1)}%, below your ${target}% target. ` +
            (need === null ? "" : `You need **${need}** ${botCls(need)} in a row first.`);
    }

    // per-subject margins when asking about everything
    if (!subj && subjects.length > 1) {
        const rows = subjects
            .map(s => ({ s, st: botStats(s.id) }))
            .filter(r => r.st.total > 0)
            .map(r => {
                const margin = r.st.pct >= target ? botMaxSkip(r.st.present, r.st.total, target) : -1;
                const need = margin < 0 ? botNeed(r.st.present, r.st.total, target) : 0;
                return { name: r.s.name, pct: r.st.pct, margin, need };
            })
            .sort((a, b) => a.margin - b.margin)
            .slice(0, 8);

        if (rows.length) {
            text += "\n\n**Per subject:**\n" + rows.map(r =>
                `• ${botEsc(r.name)} (${r.pct.toFixed(0)}%) → ` +
                (r.margin < 0 ? `needs ${r.need === null ? "-" : r.need} more` : `can skip ${r.margin}`)
            ).join("\n");
            text += "\n\n💡 If your college checks each subject, the lowest margin is your real limit.";
        }
    }

    return { text, chips: ["What if I miss 2 classes?", "Show my at-risk subjects", "Today's classes"] };
}

function hNeed(p) {
    const target = p.pct || botTarget();
    const subj = p.subject;
    const st = botStats(subj ? subj.id : null);
    if (st.total === 0) return botNoData();

    const label = subj ? `**${botEsc(subj.name)}**` : "overall";

    if (st.pct >= target) {
        const skip = botMaxSkip(st.present, st.total, target);
        return {
            text: `✅ ${subj ? label : "Overall"} you're already at **${st.pct.toFixed(1)}%**, above ${target}%. ` +
                (skip > 0 ? `You even have room to skip ${skip} ${botCls(skip)}.` : "But there's no room to skip."),
            chips: ["Can I skip a class?", "Show my at-risk subjects"]
        };
    }

    const need = botNeed(st.present, st.total, target);
    if (need === null) {
        return { text: `🎯 ${target}% can't be reached ${subj ? "in " + label : "overall"} - at that level, even one absence is permanent.`, chips: ["What's my overall attendance?"] };
    }
    return {
        text: `🎯 To go from **${st.pct.toFixed(1)}%** to **${target}%** ${subj ? "in " + label : "overall"}, attend the next **${need}** ${botCls(need)} without missing any${botWeeks(need, subj ? subj.id : null)}.`,
        chips: ["Show my at-risk subjects", "What if I attend 5 classes?"]
    };
}

function hWhatIf(p) {
    const target = p.pct || botTarget();
    const subj = p.subject;
    const st = botStats(subj ? subj.id : null);
    if (st.total === 0) return botNoData();

    let n = p.count || 0;
    if (!n && p.date) {
        const day = botScheduleFor(p.date.date).filter(s => !subj || s.id === subj.id);
        n = day.length;
    }
    if (!n) n = 1;
    const dir = p.dir || "miss";
    const newP = dir === "attend" ? st.present + n : st.present;
    const newT = st.total + n;
    const after = (newP / newT) * 100;
    const diff = after - st.pct;

    return {
        text: `🔮 If you ${dir === "attend" ? "attend" : "miss"} ${p.date && !p.count ? p.date.label + "'s" : "the next"} ${botCount(n, subj)}:\n` +
            `${st.pct.toFixed(1)}% → **${after.toFixed(1)}%** (${diff >= 0 ? "+" : ""}${diff.toFixed(1)}) ` +
            (after >= target ? `✅ still above ${target}%` : `🔴 below your ${target}% target`),
        chips: dir === "miss" ? ["What if I attend 5 classes?", "Can I skip a class?"] : ["What if I miss 2 classes?", "How many classes do I need?"]
    };
}

function hRisk() {
    const target = botTarget();
    const rows = getSubjects()
        .map(s => ({ s, st: botStats(s.id) }))
        .filter(r => r.st.total > 0);

    if (rows.length === 0) return botNoData();

    const low = rows.filter(r => r.st.pct < target).sort((a, b) => a.st.pct - b.st.pct);
    const edge = rows.filter(r => r.st.pct >= target && botMaxSkip(r.st.present, r.st.total, target) <= 1);

    if (!low.length && !edge.length) {
        return { text: `🎉 All ${rows.length} of your subjects are safely above ${target}%. Nice work!`, chips: ["Can I skip a class?", "How am I doing?"] };
    }

    let text = "";
    if (low.length) {
        text += `🔴 **Below ${target}%:**\n` + low.map(r => {
            const need = botNeed(r.st.present, r.st.total, target);
            return `• ${botEsc(r.s.name)} - ${r.st.pct.toFixed(1)}% (needs ${need === null ? "-" : need} more)`;
        }).join("\n");
    }
    if (edge.length) {
        text += (text ? "\n\n" : "") + `⚠️ **On the edge:**\n` + edge.map(r =>
            `• ${botEsc(r.s.name)} - ${r.st.pct.toFixed(1)}% (` +
            (botMaxSkip(r.st.present, r.st.total, target) === 0 ? "no spare classes" : "only 1 spare class") + ")").join("\n");
    }
    const first = (low[0] || edge[0]).s;
    return { text, chips: [`How many ${first.name} classes do I need?`, "Today's classes"] };
}

function hWorst() {
    const target = botTarget();
    const rows = getSubjects().map(s => ({ s, st: botStats(s.id) })).filter(r => r.st.total > 0)
        .sort((a, b) => a.st.pct - b.st.pct);
    if (!rows.length) return botNoData();

    const w = rows[0];
    let text = `📉 Your weakest subject is **${botEsc(w.s.name)}** at **${w.st.pct.toFixed(1)}%** ${botIcon(w.st.pct, target)}.\n${botAdvice(w.st, target, w.s.id)}`;
    if (rows.length > 1) {
        text += "\n\n**Bottom 3:**\n" + rows.slice(0, 3).map(r => `• ${botEsc(r.s.name)} - ${r.st.pct.toFixed(1)}%`).join("\n");
    }
    return { text, chips: [`Tell me about ${w.s.name}`, "Show my at-risk subjects"] };
}

function hBest(p) {
    const wantsDay = p.tokens.some(t => botMatch(t, "day")) || p.tokens.includes("weekday");
    if (wantsDay) {
        const days = botDayStats().sort((a, b) => b.pct - a.pct);
        if (!days.length) return botNoData();
        const best = days[0], worst = days[days.length - 1];
        let text = `📈 Your best day is **${best.name}** at ${best.pct.toFixed(0)}% attendance.`;
        if (days.length > 1 && worst.name !== best.name) {
            text += `\n📉 Your weakest day is **${worst.name}** at ${worst.pct.toFixed(0)}%.`;
        }
        return { text, chips: ["Am I improving?", "Show my at-risk subjects"] };
    }

    const target = botTarget();
    const rows = getSubjects().map(s => ({ s, st: botStats(s.id) })).filter(r => r.st.total > 0)
        .sort((a, b) => b.st.pct - a.st.pct);
    if (!rows.length) return botNoData();
    const b = rows[0];
    return {
        text: `🏆 Your strongest subject is **${botEsc(b.s.name)}** at **${b.st.pct.toFixed(1)}%** ${botIcon(b.st.pct, target)}.` +
            (rows.length > 1 ? "\n\n**Top 3:**\n" + rows.slice(0, 3).map(r => `• ${botEsc(r.s.name)} - ${r.st.pct.toFixed(1)}%`).join("\n") : ""),
        chips: ["What's my best day?", "Show my at-risk subjects"]
    };
}

function hStreak() {
    const streak = typeof calculateStreak === "function" ? calculateStreak() : 0;
    if (streak === 0) {
        return { text: "🔥 No active streak yet. Mark today's attendance to start one!", chips: ["Today's classes"] };
    }
    const msg = streak >= 14 ? "Unstoppable! 🚀" : streak >= 7 ? "Great consistency! 💪" : "Keep it going!";
    return { text: `🔥 You've marked attendance for **${streak}** ${botPlural(streak, "day")} in a row (Sundays skipped). ${msg}`, chips: ["Any unmarked days?", "How am I doing?"] };
}

function hSchedule(p) {
    const info = p.date || { date: botToday(), label: "today" };
    const d = info.date;
    const ds = botDateStr(d);
    const today = botToday();
    const isFuture = d >= today;
    const head = `📅 **${info.label.charAt(0).toUpperCase() + info.label.slice(1)}** (${botFmtDate(d)})`;

    if (d.getDay() === 0) return { text: `${head}\n🎉 It's Sunday - no classes!`, chips: ["Upcoming holidays", "Tomorrow's classes"] };

    const holiday = botHolidayOn(ds);
    if (holiday) return { text: `${head}\n🎉 Holiday: ${botEsc(holiday.name)}. No classes!`, chips: ["Upcoming holidays"] };

    const subjects = botScheduleFor(d);
    if (!subjects.length) return { text: `${head}\n📭 No classes are scheduled for this day.`, chips: ["Upcoming holidays"] };

    const records = getAttendanceRecords();
    const icons = { present: "🟢", absent: "🔴", cancel: "🚫", cancelled: "🚫" };
    let unmarked = 0;

    const lines = subjects.map(s => {
        const rec = records.find(r => r.date === ds && r.subjectId === s.id);
        if (!rec) unmarked++;
        return `${rec ? icons[rec.status] || "⚪" : "⚪"} ${botEsc(s.name)}` +
            (rec ? ` - ${rec.status}` : (d <= today ? " - not marked" : ""));
    });

    let text = `${head}\n${lines.join("\n")}`;

    if (isFuture && unmarked > 0) {
        const st = botStats(null);
        if (st.total > 0) {
            const after = (st.present / (st.total + unmarked)) * 100;
            const attendAll = ((st.present + unmarked) / (st.total + unmarked)) * 100;
            text += `\n\n🔮 Attend all ${unmarked}: **${attendAll.toFixed(1)}%** · Skip all ${unmarked}: **${after.toFixed(1)}%**`;
        }
    }
    if (d <= today && unmarked > 0) {
        text += `\n\n👉 <a href="attendance.html?date=${ds}" class="bot-link">Mark attendance for this day</a>`;
    }

    return { text, chips: info.label === "today" ? ["Tomorrow's classes", "Any unmarked days?"] : ["Today's classes", "Can I skip a class?"] };
}

function hPending() {
    const res = botPendingList();
    if (res.noData) return botNoData();
    if (res.total === 0) {
        return { text: "✅ Nothing pending - every scheduled class in the last 2 weeks is marked. 👏", chips: ["How am I doing?", "Today's classes"] };
    }

    const shown = res.list.slice(0, 5);
    let text = `📝 You have **${res.total}** unmarked ${botCls(res.total)} in the last 2 weeks:\n` +
        shown.map(it =>
            `• <a href="attendance.html?date=${it.ds}" class="bot-link">${botFmtDate(it.date)}</a> - ${it.subjects.map(s => botEsc(s.name)).join(", ")}`
        ).join("\n");
    if (res.list.length > shown.length) text += `\n…and ${res.list.length - shown.length} more ${botPlural(res.list.length - shown.length, "day")}.`;
    text += "\n\nTap a date to mark it.";
    return { text, chips: ["Today's classes", "How am I doing?"] };
}

function hHoliday(p) {
    if (p.date) {
        const ds = botDateStr(p.date.date);
        const h = botHolidayOn(ds);
        if (p.date.date.getDay() === 0 && !h) return { text: `🎉 ${p.date.label} is a Sunday - a weekly off.`, chips: ["Upcoming holidays"] };
        return {
            text: h ? `🎉 ${p.date.label.charAt(0).toUpperCase() + p.date.label.slice(1)} is a holiday: **${botEsc(h.name)}**.`
                    : `📚 No holiday ${p.date.label} - it's a regular day.`,
            chips: ["Upcoming holidays", "Today's classes"]
        };
    }

    const todayStr = botDateStr(botToday());
    const upcoming = getHolidays().filter(h => h.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
    if (!upcoming.length) return { text: "🎉 No upcoming holidays found. Add some on the **Holidays** page.", chips: ["Today's classes"] };

    const lines = upcoming.map(h => {
        const d = new Date(h.date + "T00:00:00");
        const diff = Math.round((d - botToday()) / 86400000);
        const when = diff === 0 ? "today" : diff === 1 ? "tomorrow" : `in ${diff} days`;
        return `• ${botFmtDate(d)} (${when}) - ${botEsc(h.name)}`;
    });
    return { text: `🎉 **Upcoming holidays:**\n${lines.join("\n")}`, chips: ["Tomorrow's classes", "Can I skip a class?"] };
}

function hCancel(p) {
    const subj = p.subject;
    const recs = getAttendanceRecords().filter(r => r.status === "cancel" || r.status === "cancelled")
        .filter(r => !subj || r.subjectId === subj.id);

    if (!recs.length) {
        return { text: `🚫 No cancelled classes recorded${subj ? " for **" + botEsc(subj.name) + "**" : ""}. You can mark one with the **🚫 Cancelled** button on the Attendance page.`, chips: ["How am I doing?"] };
    }

    const subjects = getSubjects();
    const recent = recs.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map(r => {
        const s = subjects.find(x => x.id === r.subjectId);
        const d = new Date(r.date + "T00:00:00");
        return `• ${botFmtDate(d)} - ${botEsc(s ? s.name : "Unknown")}`;
    });

    return {
        text: `🚫 **${recs.length}** cancelled ${botCls(recs.length)}${subj ? " in **" + botEsc(subj.name) + "**" : ""}. They're not counted in your percentage.\n\n**Most recent:**\n${recent.join("\n")}`,
        chips: ["What's my overall attendance?", "Show my at-risk subjects"]
    };
}

function hTrend() {
    const today = botToday();
    const thisWeek = botPeriodStats(botAddDays(today, -6), today);
    const lastWeek = botPeriodStats(botAddDays(today, -13), botAddDays(today, -7));

    if (thisWeek.total === 0 && lastWeek.total === 0) {
        return { text: "📈 Not enough recent data to see a trend yet. Mark a few more days!", chips: ["Today's classes"] };
    }

    let text = "📈 **Weekly trend:**\n";
    text += thisWeek.total ? `• Last 7 days: **${thisWeek.pct.toFixed(0)}%** (${thisWeek.present}/${thisWeek.total})\n` : "• Last 7 days: nothing marked\n";
    text += lastWeek.total ? `• Previous 7 days: **${lastWeek.pct.toFixed(0)}%** (${lastWeek.present}/${lastWeek.total})` : "• Previous 7 days: nothing marked";

    if (thisWeek.total && lastWeek.total) {
        const diff = thisWeek.pct - lastWeek.pct;
        if (diff > 3) text += `\n\n🚀 You're improving - up ${diff.toFixed(0)} points!`;
        else if (diff < -3) text += `\n\n⚠️ Slipping - down ${Math.abs(diff).toFixed(0)} points. Let's turn it around.`;
        else text += "\n\n➡️ Steady - about the same as before.";
    }
    return { text, chips: ["What's my best day?", "Show my at-risk subjects"] };
}

function hSummary() {
    const st = botStats(null);
    if (st.total === 0) return botNoData();
    const target = botTarget();
    const subjects = getSubjects().map(s => ({ s, st: botStats(s.id) })).filter(r => r.st.total > 0);
    const low = subjects.filter(r => r.st.pct < target);
    const pending = botPendingList();
    const streak = typeof calculateStreak === "function" ? calculateStreak() : 0;

    let text = `📋 **Your attendance snapshot**\n` +
        `${botIcon(st.pct, target)} Overall: **${st.pct.toFixed(1)}%** (target ${target}%)\n` +
        `${botAdvice(st, target, null)}\n`;

    text += low.length
        ? `🔴 ${low.length} ${botPlural(low.length, "subject")} below target: ${low.slice(0, 3).map(r => botEsc(r.s.name)).join(", ")}${low.length > 3 ? "…" : ""}\n`
        : `🟢 All subjects are above target.\n`;
    if (pending.total > 0) text += `📝 ${pending.total} unmarked ${botCls(pending.total)} to catch up on.\n`;
    if (streak > 0) text += `🔥 ${streak}-day marking streak.`;

    return { text: text.trim(), chips: ["Show my at-risk subjects", "Can I skip a class?", "Any unmarked days?"] };
}

function hSetTarget(p) {
    if (!p.pct) {
        BOT_STATE.pending = "settarget";
        return { text: `🎯 Your current target is **${botTarget()}%**. What would you like to change it to? (e.g. "85")`, chips: ["75", "80", "85"] };
    }
    const value = Math.round(p.pct);
    localStorage.setItem("attendanceTarget", value);
    try { if (typeof attendanceTarget !== "undefined") attendanceTarget = value; } catch (e) { /* ignore */ }
    if (typeof updateDashboard === "function") { try { updateDashboard(); } catch (e) { /* ignore */ } }
    if (typeof autoSaveUserData === "function") { try { autoSaveUserData(); } catch (e) { /* ignore */ } }
    BOT_STATE.pending = null;

    const st = botStats(null);
    return {
        text: `✅ Target updated to **${value}%**.` + (st.total ? `\n${botAdvice(st, value, null)}` : ""),
        chips: ["How am I doing?", "Show my at-risk subjects"]
    };
}

function hGreeting() {
    const h = new Date().getHours();
    const hello = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    let extra = "Ask me about your attendance, what you can skip, or your timetable.";

    const d = botToday();
    if (d.getDay() !== 0 && !botHolidayOn(botDateStr(d))) {
        const subjects = botScheduleFor(d);
        if (subjects.length) {
            const recs = getAttendanceRecords();
            const unmarked = subjects.filter(s => !recs.some(r => r.date === botDateStr(d) && r.subjectId === s.id)).length;
            extra = `You have **${subjects.length}** ${botCls(subjects.length)} today` + (unmarked ? `, **${unmarked}** not marked yet.` : " - all marked. ✅");
        }
    }
    return { text: `👋 ${hello}! ${extra}`, chips: ["How am I doing?", "Can I skip a class?", "Today's classes"] };
}

function hThanks() {
    return { text: "😊 Happy to help! Anything else you'd like to check?", chips: ["How am I doing?", "Show my at-risk subjects"] };
}

function hHelp() {
    return {
        text: "🤖 **Here's what I can do:**\n" +
            "• 📊 \"How am I doing?\" - full snapshot\n" +
            "• 🛋️ \"Can I skip a class?\" / \"Can I bunk physics?\"\n" +
            "• 🎯 \"How many classes to reach 85%?\"\n" +
            "• 🔮 \"What if I miss 3 classes?\"\n" +
            "• 🚨 \"Which subjects are at risk?\"\n" +
            "• 📅 \"What classes do I have tomorrow?\"\n" +
            "• 📝 \"Any unmarked days?\"\n" +
            "• 🎉 \"Upcoming holidays\"\n" +
            "• 📈 \"Am I improving?\" · 🔥 \"streak\" · 🚫 \"cancelled classes\"\n" +
            "• ⚙️ \"Set my target to 80%\"\n\n" +
            "Tip: mention a subject by name and I'll focus on it.",
        chips: ["How am I doing?", "Can I skip a class?", "Show my at-risk subjects"]
    };
}

function hFallback(scores) {
    const labels = {
        overall: "What's my overall attendance?", skip: "Can I skip a class?", need: "How many classes do I need?",
        risk: "Show my at-risk subjects", schedule: "Today's classes", holiday: "Upcoming holidays",
        summary: "How am I doing?", trend: "Am I improving?", pending: "Any unmarked days?", streak: "What's my streak?"
    };
    const guesses = Object.keys(scores).filter(k => scores[k] > 0 && labels[k]).sort((a, b) => scores[b] - scores[a]).slice(0, 2).map(k => labels[k]);

    return {
        text: guesses.length
            ? "🤔 I'm not totally sure what you meant. Did you mean one of these?"
            : "🤔 I didn't quite catch that. Try asking in a different way, or pick one below - I can also tell you everything I can do with **help**.",
        chips: guesses.length ? guesses.concat(["What can you do?"]) : ["How am I doing?", "Can I skip a class?", "What can you do?"]
    };
}

// ---------- main brain ----------

function botDispatch(intent, p) {
    switch (intent) {
        case "overall": return hOverall(p);
        case "skip": return hSkip(p);
        case "need": return hNeed(p);
        case "whatif": return hWhatIf(p);
        case "risk": return hRisk(p);
        case "worst": return hWorst(p);
        case "best": return hBest(p);
        case "streak": return hStreak(p);
        case "schedule": return hSchedule(p);
        case "pending": return hPending(p);
        case "holiday": return hHoliday(p);
        case "cancel": return hCancel(p);
        case "trend": return hTrend(p);
        case "summary": return hSummary(p);
        case "settarget": return hSetTarget(p);
        case "greeting": return hGreeting(p);
        case "thanks": return hThanks(p);
        case "help": return hHelp(p);
        default: return null;
    }
}

function botReply(message) {
    const raw = String(message || "").trim();
    const prepared = botWordsToNumbers(raw);
    const rawTokens = botTokens(prepared);
    const tokens = rawTokens.map(t => BOT_CANON[t] || t);
    const text = tokens.join(" ");
    const nums = botNumbers(prepared);

    const foundSubject = botFindSubject(rawTokens, rawTokens.join(" "));
    if (foundSubject && nums.count !== null && (foundSubject.name.match(/\d+/g) || []).includes(String(nums.count))) {
        nums.count = null; // the digit belongs to the subject name ("Maths 2")
    }

    const params = {
        raw, tokens, text,
        subject: foundSubject,
        date: botFindDate(rawTokens),
        count: nums.count,
        pct: nums.pct,
        dir: null
    };

    // 1) waiting for an answer (e.g. target value)
    if (BOT_STATE.pending === "settarget") {
        const only = prepared.match(/(\d{1,3})/);
        if (only && Number(only[1]) > 0 && Number(only[1]) <= 100) {
            params.pct = Number(only[1]);
            return finish("settarget", params);
        }
        BOT_STATE.pending = null;
    }

    // 2) set target ("set my target to 80%", "change target 85")
    const low = prepared.toLowerCase();
    const hasTarget = tokens.some(t => botMatch(t, "target"));
    if (hasTarget && /\b(set|change|update|make|put|raise|lower)\b/.test(low)) {
        return finish("settarget", params);
    }
    if (hasTarget && params.pct && /\bmy target (is|=)\b/.test(low)) {
        return finish("settarget", params);
    }

    // 3) what-if
    const missW = tokens.some(t => ["miss", "skip", "absent", "bunk", "leave"].includes(t));
    const attW = tokens.some(t => ["attend", "present", "go"].includes(t) || botMatch(t, "attend"));
    const neg = tokens.some(t => ["dont", "not", "never", "wont", "without"].includes(t));
    if (tokens.includes("if") && (missW || attW)) {
        params.dir = (attW && !missW) || (missW && neg) ? "attend" : "miss";
        return finish("whatif", params);
    }

    // 4) score intents
    const scores = botScoreIntents(tokens, text, raw);
    let intent = null, top = 0;
    Object.keys(scores).forEach(k => { if (scores[k] > top) { top = scores[k]; intent = k; } });

    // subject mentioned: "attendance in maths", "tell me about maths", "what about physics?"
    if (params.subject && (top < 2 || intent === "overall" || intent === "summary")) {
        const followUp = /^\s*(and|what about|how about|&|for|also|same for)\b/i.test(raw);
        if (followUp && BOT_SUBJECT_CAPABLE.includes(BOT_STATE.lastIntent) && top < 2) {
            params.dir = BOT_STATE.lastDir;
            return finish(BOT_STATE.lastIntent, params);
        }
        return finish("overall", params);
    }

    // follow-ups with no keywords: "and tomorrow?", "what about 85%?", "and 3 classes?"
    if (top < 2 && BOT_STATE.lastIntent) {
        const last = BOT_STATE.lastIntent;
        if (!params.subject && BOT_SUBJECT_CAPABLE.includes(last) && BOT_STATE.lastSubject) {
            params.subject = getSubjects().find(s => s.id === BOT_STATE.lastSubject) || null;
        }
        if (params.date && (last === "schedule" || last === "holiday")) return finish(last, params);
        if (params.pct && last === "need") return finish("need", params);
        if (params.count && (last === "whatif" || last === "skip")) {
            params.dir = BOT_STATE.lastDir;
            return finish(last, params);
        }
    }

    // a date + class-ish words => schedule
    if (params.date && (top < 5) && (tokens.includes("class") || tokens.includes("have") || tokens.includes("on")) && intent !== "holiday" && intent !== "pending") {
        intent = "schedule";
        top = Math.max(top, 3);
    }

    if (top < 2 || !intent) return finish(null, params, scores);

    // pronouns: "can I skip it?"
    if (!params.subject && BOT_SUBJECT_CAPABLE.includes(intent) && BOT_STATE.lastSubject &&
        (/\b(skip|miss|attend|about|for|in|of)\s+(it|that|this one)\b/.test(text) || /\bsame\b/.test(text))) {
        params.subject = getSubjects().find(s => s.id === BOT_STATE.lastSubject) || null;
    }

    return finish(intent, params);

    function finish(name, prm, sc) {
        let result = name ? botDispatch(name, prm) : hFallback(sc || {});
        if (!result) result = hFallback(sc || {});

        if (name) {
            if (BOT_SUBJECT_CAPABLE.includes(name)) BOT_STATE.lastSubject = prm.subject ? prm.subject.id : null;
            if (!["greeting", "thanks", "help"].includes(name)) BOT_STATE.lastIntent = name;
            if (name === "whatif") BOT_STATE.lastDir = prm.dir;
        }
        return result;
    }
}

// keep the old API working
function getBotResponse(message) {
    return botReply(message).text;
}

// ---------- chat UI ----------

function botFormat(text) {
    return text.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>");
}

function botInjectStyles() {
    if (document.getElementById("botStyles")) return;
    const style = document.createElement("style");
    style.id = "botStyles";
    style.textContent = `
        #botMessages { display: flex; flex-direction: column; gap: 8px; }
        .bot-message { max-width: 88%; padding: 9px 13px; border-radius: 14px; font-size: 14px; line-height: 1.45; word-wrap: break-word; }
        .bot-message.bot { align-self: flex-start; background: #fff; color: #1a1a2e; border: 1px solid #e5e7eb; border-bottom-left-radius: 4px; }
        .bot-message.user { align-self: flex-end; background: #4a6cf7; color: #fff; border-bottom-right-radius: 4px; }
        .bot-message .bot-link { color: #4a6cf7; font-weight: 600; text-decoration: underline; }
        .bot-chips { display: flex; flex-wrap: wrap; gap: 6px; align-self: flex-start; max-width: 100%; }
        .bot-chip { border: 1px solid #4a6cf7; background: #eef2ff; color: #3b54c9; border-radius: 16px; padding: 5px 11px; font-size: 12.5px; cursor: pointer; transition: 0.2s; }
        .bot-chip:hover { background: #4a6cf7; color: #fff; }
        .bot-typing i { display: inline-block; width: 6px; height: 6px; margin: 0 2px; border-radius: 50%; background: #9ca3af; animation: botBlink 1s infinite; }
        .bot-typing i:nth-child(2) { animation-delay: .2s; }
        .bot-typing i:nth-child(3) { animation-delay: .4s; }
        @keyframes botBlink { 0%, 80%, 100% { opacity: .25; } 40% { opacity: 1; } }
        body.dark-mode #chatbotWindow { background: #1e1e2e !important; border-color: #333 !important; }
        body.dark-mode #botMessages { background: #181825 !important; }
        body.dark-mode .bot-message.bot { background: #2a2a3c; color: #e0e0e0; border-color: #3a3a4e; }
        body.dark-mode .bot-message .bot-link { color: #8fa4ff; }
        body.dark-mode .bot-chip { background: #2a2a3c; color: #aab8ff; border-color: #4a6cf7; }
        body.dark-mode .bot-chip:hover { background: #4a6cf7; color: #fff; }
        body.dark-mode #botInput { background: #2a2a3c; color: #e0e0e0; border-color: #3a3a4e !important; }
    `;
    document.head.appendChild(style);
}

function botClearChips() {
    document.querySelectorAll("#botMessages .bot-chips").forEach(el => el.remove());
}

function botSaveChat() {
    try {
        const box = document.getElementById("botMessages");
        if (box) sessionStorage.setItem("botChatHtml", box.innerHTML);
        sessionStorage.setItem("botChatState", JSON.stringify(BOT_STATE));
    } catch (e) { /* storage unavailable */ }
}

function botRestoreChat() {
    try {
        const box = document.getElementById("botMessages");
        const html = sessionStorage.getItem("botChatHtml");
        if (box && html && box.children.length === 0) box.innerHTML = html;
        const st = JSON.parse(sessionStorage.getItem("botChatState") || "null");
        if (st) Object.assign(BOT_STATE, st);
        if (box) box.scrollTop = box.scrollHeight;
    } catch (e) { /* ignore */ }
}

function showBotMessage(message, chips) {
    const box = document.getElementById("botMessages");
    if (!box) return null;

    const div = document.createElement("div");
    div.className = "bot-message bot";
    div.innerHTML = botFormat(message);
    box.appendChild(div);

    if (chips && chips.length) {
        const row = document.createElement("div");
        row.className = "bot-chips";
        chips.forEach(label => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "bot-chip";
            b.textContent = label;
            b.setAttribute("data-q", label);
            row.appendChild(b);
        });
        box.appendChild(row);
    }

    box.scrollTop = box.scrollHeight;
    botSaveChat();
    return div;
}

function askBot(message) {
    const box = document.getElementById("botMessages");
    if (!box || !message) return;

    botClearChips();

    const userDiv = document.createElement("div");
    userDiv.className = "bot-message user";
    userDiv.textContent = message;
    box.appendChild(userDiv);

    // typing indicator
    const typing = document.createElement("div");
    typing.className = "bot-message bot bot-typing";
    typing.innerHTML = "<i></i><i></i><i></i>";
    box.appendChild(typing);
    box.scrollTop = box.scrollHeight;

    let reply;
    try {
        reply = botReply(message);
    } catch (err) {
        console.error("Assistant error:", err);
        reply = { text: "😅 Oops, something went wrong while reading your data. Try again or rephrase.", chips: ["What can you do?"] };
    }

    setTimeout(() => {
        typing.remove();
        showBotMessage(reply.text, reply.chips);
    }, 400);
}

function sendBotMessage() {
    const input = document.getElementById("botInput");
    if (!input) return;
    const message = input.value.trim();
    if (!message) return;
    input.value = "";
    askBot(message);
}

function openChatbot() {
    const chatbot = document.getElementById("chatbotWindow");
    if (!chatbot) return;
    chatbot.style.display = "flex";
    botInjectStyles();
    botRestoreChat();

    const box = document.getElementById("botMessages");
    if (box && box.children.length === 0) {
        const g = hGreeting();
        showBotMessage(g.text, g.chips);
    }
    const input = document.getElementById("botInput");
    if (input) input.focus();
}

function closeChatbot() {
    const chatbot = document.getElementById("chatbotWindow");
    if (chatbot) chatbot.style.display = "none";
}

document.addEventListener("click", function (e) {
    const chip = e.target && e.target.closest ? e.target.closest(".bot-chip") : null;
    if (chip && chip.getAttribute("data-q")) askBot(chip.getAttribute("data-q"));
});

document.addEventListener("DOMContentLoaded", function () {
    botInjectStyles();
    botRestoreChat();
});

// ========================================
// EXPORT DATA
// ========================================

function exportCSV() {
    const records = getAttendanceRecords();
    const subjects = getSubjects();
    
    let csv = "Date,Subject,Status\n";
    records.forEach(record => {
        const subject = subjects.find(s => s.id === record.subjectId);
        const subjectName = subject ? subject.name : "Unknown";
        csv += `${record.date},${subjectName},${record.status}\n`;
    });
    
    downloadFile(csv, "attendance.csv", "text/csv");
}

function exportJSON() {
    const data = {
        subjects: getSubjects(),
        attendanceRecords: getAttendanceRecords(),
        holidays: getHolidays(),
        attendanceTarget: Number(localStorage.getItem("attendanceTarget")) || 75
    };
    
    downloadFile(JSON.stringify(data, null, 2), "attendance-backup.json", "application/json");
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ========================================
// THEME PICKER (FIXED - NOW WORKS!)
// ========================================

function setTheme(theme) {
    const body = document.body;
    
    // Remove all theme classes
    body.classList.remove("theme-green", "theme-purple", "theme-dark", "dark-mode");
    
    // Add selected theme
    if (theme === "green") {
        body.classList.add("theme-green");
        localStorage.setItem("theme", "green");
        localStorage.setItem("darkMode", "disabled");
    } else if (theme === "purple") {
        body.classList.add("theme-purple");
        localStorage.setItem("theme", "purple");
        localStorage.setItem("darkMode", "disabled");
    } else if (theme === "dark") {
        body.classList.add("theme-dark", "dark-mode");
        localStorage.setItem("theme", "dark");
        localStorage.setItem("darkMode", "enabled");
    } else {
        // Default Blue
        body.classList.remove("theme-green", "theme-purple", "theme-dark", "dark-mode");
        localStorage.setItem("theme", "blue");
        localStorage.setItem("darkMode", "disabled");
    }
    
    // Update toggle button if it exists
    const toggle = document.getElementById("darkModeToggle");
    if (toggle) {
        if (theme === "dark") {
            toggle.textContent = "☀️";
        } else {
            toggle.textContent = "🌙";
        }
    }
}

function loadThemePreference() {
    const theme = localStorage.getItem("theme") || "blue";
    setTheme(theme);
}

// ========================================
// DAILY REMINDER (PUSH NOTIFICATION)
// ========================================

function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(function(permission) {
            if (permission === "granted") {
                showNotification("✅ Notifications enabled!", "We'll remind you to mark your attendance daily.");
            }
        });
    }
}

function showNotification(title, body) {
    if ('Notification' in window && Notification.permission === "granted") {
        new Notification(title, {
            body: body,
            icon: "./icon-192.png"
        });
    }
}

// ========================================
// INITIALIZE
// ========================================

document.addEventListener("DOMContentLoaded", function() {
    loadThemePreference();
    
    // Request notification permission (on first load)
    if (localStorage.getItem("notificationsRequested") !== "true") {
        setTimeout(requestNotificationPermission, 3000);
        localStorage.setItem("notificationsRequested", "true");
    }
});