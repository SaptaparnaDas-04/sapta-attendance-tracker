// ========================================
// AUTH + CLOUD SYNC (SUPABASE)
// One account works on every device. Data lives in the
// `user_data` table (one row per user, protected by RLS).
// ========================================

var SYNC_KEYS = ["subjects", "attendanceRecords", "holidays", "attendanceTarget", "weeklySchedule"];

// ---- One-time setup (this file is loaded twice on some pages) ----
if (!window.__attAuthReady) {
    window.__attAuthReady = true;
    window.__attSyncing = false;
    window.__attOrigSet = Storage.prototype.setItem;
    window.__attOrigRemove = Storage.prototype.removeItem;

    // Any change to synced data marks it dirty and schedules a cloud save
    Storage.prototype.setItem = function (k, v) {
        window.__attOrigSet.call(this, k, v);
        if (this === window.localStorage && !window.__attSyncing && SYNC_KEYS.indexOf(k) > -1) {
            autoSaveUserData();
        }
    };
    Storage.prototype.removeItem = function (k) {
        window.__attOrigRemove.call(this, k);
        if (this === window.localStorage && !window.__attSyncing && SYNC_KEYS.indexOf(k) > -1) {
            autoSaveUserData();
        }
    };

    // Save right before the page closes / goes to background
    document.addEventListener("visibilitychange", async function () {
        if (document.visibilityState === "hidden") {
            if (localStorage.getItem("attDirty") === "1") saveCurrentUserData();
        } else if (document.visibilityState === "visible") {
            // Coming back to the app: pick up changes made on the other device
            var now = Date.now();
            if (now - (window.__attLastPull || 0) < 30000) return;
            window.__attLastPull = now;
            if (typeof supabaseClient === "undefined") return;
            var user = await getSessionUser();
            if (user && (await syncFromCloud(user))) location.reload();
        }
    });
}

// ---- Helpers ----
function authEmail(username) {
    return username.toLowerCase() + "@attendance.com";
}

async function getSessionUser() {
    try {
        var res = await supabaseClient.auth.getSession();
        return res.data && res.data.session ? res.data.session.user : null;
    } catch (e) {
        return null;
    }
}

async function getCurrentUser() {
    return getSessionUser();
}

function cacheProfile(user) {
    var meta = (user && user.user_metadata) || {};
    var username = meta.username || (user.email || "").split("@")[0];
    window.__attOrigSet.call(localStorage, "currentUser", username);
    window.__attOrigSet.call(localStorage, "currentUserFullName", meta.full_name || username);
}

function collectLocalData() {
    var d = {};
    SYNC_KEYS.forEach(function (k) {
        var v = localStorage.getItem(k);
        if (v !== null) {
            try { d[k] = JSON.parse(v); } catch (e) { d[k] = v; }
        }
    });
    return d;
}

// Cloud is a full snapshot: copy it over local data
function applyCloudData(cloud) {
    window.__attSyncing = true;
    try {
        SYNC_KEYS.forEach(function (k) {
            if (cloud[k] !== undefined && cloud[k] !== null) {
                localStorage.setItem(k, typeof cloud[k] === "string" ? cloud[k] : JSON.stringify(cloud[k]));
            } else {
                localStorage.removeItem(k);
            }
        });
    } finally {
        window.__attSyncing = false;
    }
}

// ---- Cloud save / load ----
async function saveCurrentUserData() {
    var user = await getSessionUser();
    if (!user) return false;
    var meta = user.user_metadata || {};

    var res = await supabaseClient.from("user_data").upsert({
        user_id: user.id,
        username: meta.username || null,
        full_name: meta.full_name || null,
        data: collectLocalData(),
        updated_at: new Date().toISOString()
    });

    if (res.error) {
        console.error("Error saving user data:", res.error);
        return false;
    }
    window.__attOrigRemove.call(localStorage, "attDirty");
    return true;
}

// Returns true if local data changed (so the page should reload)
async function syncFromCloud(user) {
    // Unsynced local edits win: push them instead of overwriting
    if (localStorage.getItem("attDirty") === "1") {
        await saveCurrentUserData();
        return false;
    }

    var res = await supabaseClient
        .from("user_data")
        .select("data")
        .eq("user_id", user.id)
        .maybeSingle();

    if (res.error) {
        console.error("Error loading user data:", res.error);
        return false;
    }

    var cloud = res.data && res.data.data;
    if (!cloud || Object.keys(cloud).length === 0) {
        // Nothing in the cloud yet: upload whatever this device has
        await saveCurrentUserData();
        return false;
    }

    var before = JSON.stringify(collectLocalData());
    applyCloudData(cloud);
    return before !== JSON.stringify(collectLocalData());
}

function autoSaveUserData() {
    window.__attOrigSet.call(localStorage, "attDirty", "1");
    clearTimeout(autoSaveUserData._timer);
    autoSaveUserData._timer = setTimeout(function () {
        if (localStorage.getItem("attDirty") === "1") saveCurrentUserData();
    }, 1500);
}

// ---- Sign up ----
async function signupUser() {
    var username = document.getElementById("signupUsername").value.trim().toLowerCase();
    var password = document.getElementById("signupPassword").value;
    var fullName = document.getElementById("signupFullName").value.trim();
    var err = document.getElementById("signupError");

    function fail(msg) { err.textContent = msg; err.style.display = "block"; }

    if (!username || !password) return fail("Please fill in all required fields!");
    if (!/^[a-z0-9._-]{3,30}$/.test(username))
        return fail("Username: 3-30 characters, only letters, numbers, . _ -");
    if (password.length < 6) return fail("Password must be at least 6 characters!");

    try {
        var res = await supabaseClient.auth.signUp({
            email: authEmail(username),
            password: password,
            options: { data: { username: username, full_name: fullName || username } }
        });

        if (res.error) return fail(res.error.message);

        if (res.data.user && res.data.user.identities && res.data.user.identities.length === 0)
            return fail("That username is already taken.");

        if (!res.data.session) {
            return fail("Account created, but Supabase still requires email confirmation. " +
                        "Turn off 'Confirm email' in Supabase > Authentication > Providers > Email.");
        }

        cacheProfile(res.data.user);
        await saveCurrentUserData();
        window.location.href = "index.html";
    } catch (e) {
        console.error(e);
        fail("Failed to connect. Check your internet connection.");
    }
}

// ---- Log in ----
async function loginUser() {
    var username = document.getElementById("loginUsername").value.trim().toLowerCase();
    var password = document.getElementById("loginPassword").value;
    var err = document.getElementById("loginError");

    function fail(msg) { err.textContent = msg; err.style.display = "block"; }

    if (!username || !password) return fail("Please enter username and password!");

    try {
        var res = await supabaseClient.auth.signInWithPassword({
            email: authEmail(username),
            password: password
        });
        if (res.error) return fail("Incorrect username or password!");

        cacheProfile(res.data.user);
        await syncFromCloud(res.data.user);
        sessionStorage.setItem("attSynced", "1");
        window.location.href = "index.html";
    } catch (e) {
        console.error(e);
        fail("Failed to connect. Check your internet connection.");
    }
}

// ---- Log out ----
async function logoutUser() {
    if (!confirm("Are you sure you want to logout?")) return;
    await saveCurrentUserData();
    await supabaseClient.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "login.html";
}

// ---- Page guard ----
async function checkAuth() {
    var onLogin = /login(\.html)?\/?$/.test(window.location.pathname);
    var user = await getSessionUser();

    if (onLogin) {
        if (user) window.location.href = "index.html";
        return;
    }
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    cacheProfile(user);

    if (!sessionStorage.getItem("attSynced")) {
        sessionStorage.setItem("attSynced", "1");
        if (await syncFromCloud(user)) window.location.reload();
    }
}

function getUserDisplayName() {
    var username = localStorage.getItem("currentUser");
    if (!username) return "Guest";
    return localStorage.getItem("currentUserFullName") || username;
}

function getUserInitials() {
    var name = getUserDisplayName();
    if (!name || name === "Guest") return "G";
    return name.charAt(0).toUpperCase();
}
