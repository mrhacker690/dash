/* ===========================================================
   CYRUSLINKSHUB — FINAL AUTH ENGINE (auth-firebase.js)
   Powers: login / register / forgot / portal pages
   Email+GitHub = Firebase | Google+Discord = Direct OAuth
=========================================================== */

/* 1️⃣ FIREBASE CONFIG (yours — already filled) */
var firebaseConfig = {
    apiKey: "AIzaSyA2n3WLi1_savBMMWWmMv2Ge19VSvQkUjI",
    authDomain: "cyruslinkshub-2e195.firebaseapp.com",
    projectId: "cyruslinkshub-2e195",
    storageBucket: "cyruslinkshub-2e195.firebasestorage.app",
    messagingSenderId: "1015015184649",
    appId: "1:1015015184649:web:922ee0a6bcaf5d86ee5bd8",
    measurementId: "G-LTT4WV9397"
};

/* 2️⃣ DIRECT OAUTH IDS */
var GOOGLE_CLIENT_ID = "766581835119-1f25q81kop3fn41ujk7dv0peb8jtlrpl.apps.googleusercontent.com";
var DISCORD_CLIENT_ID = "PASTE_DISCORD_CLIENT_ID";   /* ← paste yours */

/* 3️⃣ REDIRECTS */
var DASHBOARD_URL = 'https://dash.cyruslinkshub.com';
var LANDING_URL = 'https://www.cyruslinkshub.com';

var FB = null;
try {
    if (typeof firebase !== 'undefined' && firebaseConfig.apiKey.indexOf('PASTE') !== 0) {
        firebase.initializeApp(firebaseConfig);
        FB = firebase;
    }
} catch (e) {}

var P_KEY = 'clh_profile';

/* ---------- storage helpers ---------- */
function saveProfile(p) {
    localStorage.setItem(P_KEY, JSON.stringify(p));
    try {
        var v = encodeURIComponent(JSON.stringify(p));
        document.cookie = 'clh_cookie=' + v + ';path=/;domain=.cyruslinkshub.com;max-age=31536000';
        document.cookie = 'clh_cookie=' + v + ';path=/;max-age=31536000';
    } catch (e) {}
}
function clearSession() {
    localStorage.removeItem(P_KEY);
    document.cookie = 'clh_cookie=;path=/;domain=.cyruslinkshub.com;expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'clh_cookie=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

/* ---------- message boxes (auto-created if missing) ---------- */
function ensureMsgs() {
    if (document.getElementById('authError')) return;
    var first = document.querySelector('input');
    var host = first ? (first.closest('.glass, .auth-card, section, main') || document.body) : document.body;
    var e = document.createElement('div'); e.id = 'authError'; e.className = 'error-msg';
    var o = document.createElement('div'); o.id = 'authOk'; o.className = 'success-msg';
    host.insertBefore(o, first ? first.parentElement : host.firstChild);
    host.insertBefore(e, o);
}
function err(m) { ensureMsgs(); var e = document.getElementById('authError'); e.textContent = m; e.style.display = 'block'; document.getElementById('authOk').style.display = 'none'; var l = document.getElementById('authLoad'); if (l) l.style.display = 'none'; }
function ok(m) { ensureMsgs(); var o = document.getElementById('authOk'); o.textContent = m; o.style.display = 'block'; document.getElementById('authError').style.display = 'none'; var l = document.getElementById('authLoad'); if (l) l.style.display = 'none'; }
function notReady() { err('Firebase not connected yet.'); }

/* ---------- profile helpers ---------- */
function avatarFor(n, p) {
    var e = encodeURIComponent(n || 'player');
    if (p === 'GitHub' || p === 'github.com') return 'https://github.com/' + e + '.png?size=96';
    if (p === 'Google') return 'https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=' + e;
    if (p === 'Facebook') return 'https://api.dicebear.com/9.x/adventurer/svg?seed=' + e;
    if (p === 'Discord') return 'https://api.dicebear.com/9.x/bottts/svg?seed=' + e;
    return 'https://api.dicebear.com/9.x/initials/svg?seed=' + e;
}
function profileFrom(u, prov) {
    var name = u.displayName || (u.email ? u.email.split('@')[0] : 'Player');
    return { name: name, email: u.email || '', provider: prov, avatar: u.photoURL || avatarFor(name, prov), ts: Date.now() };
}
function enter(p) {
    saveProfile(p);
    ok('Access granted! Routing to dashboard...');
    setTimeout(function () { location.href = DASHBOARD_URL; }, 900);
}
function friendly(code) {
    var m = {
        'auth/invalid-email': 'Invalid email address.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Wrong password.',
        'auth/email-already-in-use': 'Email already registered. Sign in instead.',
        'auth/weak-password': 'Password too weak (min 6 characters).',
        'auth/too-many-requests': 'Too many attempts. Wait and retry.',
        'auth/popup-closed-by-user': 'Popup closed before finishing.',
        'auth/popup-blocked': 'Popup blocked. Allow popups.',
        'auth/unauthorized-domain': 'Domain not authorized. Add it in Firebase → Auth → Settings.',
        'auth/operation-not-allowed': 'Provider disabled. Enable it in Firebase Console.',
        'auth/network-request-failed': 'Network error. Check internet.'
    };
    return m[code] || ('Authentication failed (' + code + ').');
}

/* ---------- auto field detection ---------- */
function fEmail() { return document.querySelector('input[type="email"]'); }
function fPass() { return document.querySelectorAll('input[type="password"]'); }
function fText() { return document.querySelectorAll('input[type="text"]'); }
function fTerms() { return document.querySelector('input[type="checkbox"]'); }

/* ================= EMAIL LOGIN ================= */
function doLogin() {
    if (!FB) { notReady(); return; }
    var l = document.getElementById('authLoad'); if (l) l.style.display = 'block';
    var em = fEmail() ? fEmail().value.trim().toLowerCase() : '';
    var ps = fPass(); var pw = ps[0] ? ps[0].value : '';
    if (!em || !pw) { err('Enter email and password.'); return; }
    FB.auth().signInWithEmailAndPassword(em, pw)
        .then(function (r) { enter(profileFrom(r.user, 'Email')); })
        .catch(function (e) { err(friendly(e.code)); });
}

/* ================= REGISTER ================= */
function verifyChip() {
    var c = document.getElementById('secChip'), t = fTerms();
    if (!c || !t) return;
    if (t.checked) {
        c.innerHTML = '<i class="fa-solid fa-circle-check"></i> Security Status: Verified';
        c.style.borderColor = 'var(--green)'; c.style.color = 'var(--green)';
    } else {
        c.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Security Status: Unverified';
        c.style.borderColor = ''; c.style.color = '';
    }
}
function doRegister() {
    if (!FB) { notReady(); return; }
    var l = document.getElementById('authLoad'); if (l) l.style.display = 'block';
    var tx = fText(), ps = fPass();
    var name = tx[0] ? tx[0].value.trim() : '';
    var em = fEmail() ? fEmail().value.trim().toLowerCase() : '';
    var pw = ps[0] ? ps[0].value : '';
    var pw2 = ps[1] ? ps[1].value : '';
    if (name.length < 3) { err('Full name must be at least 3 characters.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { err('Enter a valid email address.'); return; }
    if (pw.length < 6) { err('Password must be at least 6 characters.'); return; }
    if (pw !== pw2) { err('Passwords do not match.'); return; }
    var t = fTerms();
    if (t && !t.checked) { err('You must accept the Terms and Privacy Policy.'); return; }
    FB.auth().createUserWithEmailAndPassword(em, pw)
        .then(function (r) { return r.user.updateProfile({ displayName: name }).then(function () { return r.user; }); })
        .then(function (u) { enter(profileFrom(u, 'Email')); })
        .catch(function (e) { err(friendly(e.code)); });
}

/* ================= FORGOT / RESET (with your-domain continue link) ================= */
function sendReset() {
    if (!FB) { notReady(); return; }
    var l = document.getElementById('authLoad'); if (l) l.style.display = 'block';
    var em = fEmail() ? fEmail().value.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { err('Enter a valid email address.'); return; }
    FB.auth().sendPasswordResetEmail(em, {
        url: LANDING_URL + '/login.html',   /* ✅ "Continue" button returns to YOUR site */
        handleCodeInApp: false
    })
        .then(function () { ok('Recovery email sent to ' + em + '. Open the link inside to reset your password.'); })
        .catch(function (e) { err(friendly(e.code)); });
}
function validateToken() {
    ok('Reset happens via the email link. Sign in with your new password.');
    setTimeout(function () { location.href = 'login.html'; }, 1200);
}

/* ================= SOCIAL ROUTER ================= */
function social(p) {
    if (p === 'Google') { googleLogin(); return; }
    if (p === 'Discord') { discordLogin(); return; }
    if (p === 'GitHub') { githubLogin(); return; }
    if (p === 'Facebook') { facebookLogin(); return; }
}

/* GOOGLE — direct OAuth (like Discord) */
function googleLogin() {
    if (GOOGLE_CLIENT_ID.indexOf('PASTE') === 0) { err('Paste your Google Client ID in auth-firebase.js'); return; }
    var redirect = encodeURIComponent(location.origin + location.pathname);
    location.href = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=' + GOOGLE_CLIENT_ID +
        '&redirect_uri=' + redirect + '&response_type=token&scope=openid%20profile%20email&state=clh_google';
}

/* DISCORD — direct OAuth */
function discordLogin() {
    if (DISCORD_CLIENT_ID.indexOf('PASTE') === 0) { err('Paste your Discord Client ID in auth-firebase.js'); return; }
    var redirect = encodeURIComponent(location.origin + location.pathname);
    location.href = 'https://discord.com/oauth2/authorize?client_id=' + DISCORD_CLIENT_ID +
        '&response_type=token&redirect_uri=' + redirect + '&scope=identify&state=clh_discord';
}

/* GITHUB — Firebase popup */
function githubLogin() {
    if (!FB) { notReady(); return; }
    var l = document.getElementById('authLoad'); if (l) l.style.display = 'block';
    FB.auth().signInWithPopup(new firebase.auth.GithubAuthProvider())
        .then(function (r) { enter(profileFrom(r.user, 'GitHub')); })
        .catch(function (e) { err(friendly(e.code)); });
}

/* FACEBOOK — Firebase popup */
function facebookLogin() {
    if (!FB) { notReady(); return; }
    FB.auth().signInWithPopup(new firebase.auth.FacebookAuthProvider())
        .then(function (r) { enter(profileFrom(r.user, 'Facebook')); })
        .catch(function (e) { err(friendly(e.code)); });
}

/* ================= LOGOUT ================= */
function logout() {
    clearSession();
    if (FB) FB.auth().signOut();
    location.href = LANDING_URL;
}

/* ================= RETURN HANDLER (Google + Discord tokens) ================= */
(function () {
    var h = location.hash.replace('#', '');
    if (h.indexOf('access_token=') === -1) return;
    var params = {};
    h.split('&').forEach(function (kv) { var p = kv.split('='); params[p[0]] = decodeURIComponent(p[1]); });
    var token = params['access_token'], state = params['state'] || '';

    if (state === 'clh_google') {
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: 'Bearer ' + token } })
            .then(function (r) { return r.json(); })
            .then(function (u) {
                enter({ name: u.name || (u.email ? u.email.split('@')[0] : 'Player'), email: u.email || '', provider: 'Google', avatar: u.picture, ts: Date.now() });
            })
            .catch(function () { err('Google login failed. Try again.'); });
    } else {
        fetch('https://discord.com/api/users/@me', { headers: { Authorization: 'Bearer ' + token } })
            .then(function (r) { return r.json(); })
            .then(function (u) {
                var av = u.avatar ? ('https://cdn.discordapp.com/avatars/' + u.id + '/' + u.avatar + '.png?size=96') : 'https://cdn.discordapp.com/embed/avatars/0.png';
                enter({ name: u.global_name || u.username, email: '', provider: 'Discord', avatar: av, ts: Date.now() });
            })
            .catch(function () { err('Discord login failed. Try again.'); });
    }
})();

/* ================= AUTO-BIND (reads button text — zero HTML edits) ================= */
var authPage = false;
function bindAll() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
        (function (b) {
            var t = ((b.textContent || '') + '').toUpperCase();
            var hit = null;
            if ((t.indexOf('SIGN IN') > -1 && t.indexOf('CONTINUE') === -1) || t.indexOf('AUTHENTICATE') > -1) hit = doLogin;
            else if (t.indexOf('CREATE ACCOUNT') > -1 || t.indexOf('INITIALIZE REGISTRATION') > -1) hit = doRegister;
            else if (t.indexOf('SEND RESET') > -1 || t.indexOf('RECOVERY TOKEN') > -1) hit = sendReset;
            else if (t.indexOf('VALIDATE') > -1) hit = validateToken;
            else if (t.indexOf('LOGOUT') > -1 || t.indexOf('SIGN OUT') > -1) hit = logout;
            else if (t.indexOf('GOOGLE') > -1) hit = function () { social('Google'); };
            else if (t.indexOf('GITHUB') > -1) hit = function () { social('GitHub'); };
            else if (t.indexOf('DISCORD') > -1) hit = function () { social('Discord'); };
            else if (t.indexOf('FACEBOOK') > -1) hit = function () { social('Facebook'); };
            else if (t === '◉' || b.querySelector('.fa-eye, .fa-eye-slash')) hit = function () {
                var wrap = b.parentElement;
                var inp = wrap ? wrap.querySelector('input') : null;
                if (!inp && b.previousElementSibling && b.previousElementSibling.tagName === 'INPUT') inp = b.previousElementSibling;
                if (inp) inp.type = (inp.type === 'password') ? 'text' : 'password';
            };
            if (hit) {
                authPage = true;
                b.addEventListener('click', function (ev) { ev.preventDefault(); hit(); });
            }
        })(btns[i]);
    }
}

/* ================= SESSION SYNC + AUTO REDIRECT ================= */
if (FB) {
    FB.auth().onAuthStateChanged(function (u) {
        /* COOKIE = only source of truth (fixes logout + redirect loops) */
        var hasCookie = document.cookie.indexOf('clh_cookie=') > -1;
        if (u && hasCookie) {
            saveProfile(profileFrom(u, u.providerData && u.providerData[0] ? u.providerData[0].providerId : 'Email'));
            if (authPage) location.replace(DASHBOARD_URL);
        }
        /* Firebase user but NO cookie = logged out → do NOTHING */
    });
}

/* ================= ENTER KEY ================= */
document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || !authPage) return;
    if (fPass().length > 1) doRegister();
    else if (fEmail() && fPass().length === 1) {
        var first = document.querySelector('button');
        var t = first ? ((first.textContent || '') + '').toUpperCase() : '';
        if (t.indexOf('RESET') > -1 || t.indexOf('RECOVERY') > -1) sendReset(); else doLogin();
    }
});

/* start (script loads at end of body → DOM ready) */
bindAll();
console.log('auth-firebase.js loaded ✔ | Google:', GOOGLE_CLIENT_ID.slice(0, 12) + '... | Discord:', DISCORD_CLIENT_ID.slice(0, 8) + '...');
