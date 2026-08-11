/* ===========================================================
   CYRUSLINKSHUB — FIREBASE AUTH CONNECTOR
   Powers: login.html + register.html + forgot-password.html
=========================================================== */

/* 1️⃣ PASTE FIREBASE CONFIG (Firebase → ⚙️ Settings → Your apps → Web app) */
var firebaseConfig = {
    apiKey: "PASTE_API_KEY",
    authDomain: "PASTE_PROJECT.firebaseapp.com",
    projectId: "PASTE_PROJECT",
    storageBucket: "PASTE_PROJECT.appspot.com",
    messagingSenderId: "PASTE_SENDER_ID",
    appId: "PASTE_APP_ID"
};

/* 2️⃣ PASTE DISCORD CLIENT ID (Discord Developer Portal → OAuth2) */
var DISCORD_CLIENT_ID = "PASTE_DISCORD_CLIENT_ID";

/* ---------- init ---------- */
var FB = null;
try {
    if (typeof firebase !== 'undefined' && firebaseConfig.apiKey.indexOf('PASTE') !== 0) {
        firebase.initializeApp(firebaseConfig);
        FB = firebase;
    }
} catch (e) {}

var P_KEY = 'clh_profile';

/* ---------- helpers ---------- */
function $(id) { return document.getElementById(id); }
function saveProfile(p) { localStorage.setItem(P_KEY, JSON.stringify(p)); }
function err(m) { var e = $('authError'); if (e) { e.textContent = m; e.style.display = 'block'; var o = $('authOk'); if (o) o.style.display = 'none'; } else { alert(m); } }
function ok(m) { var e = $('authOk'); if (e) { e.textContent = m; e.style.display = 'block'; var o = $('authError'); if (o) o.style.display = 'none'; } else { alert(m); } }
function notReady() { err('Firebase not connected yet — paste your config in auth-firebase.js'); }

function togglePass(i, c) {
    var p = $(i); if (!p) return;
    var s = p.type === 'password';
    p.type = s ? 'text' : 'password';
    var ic = $(c); if (ic) ic.className = s ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
}

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
    ok('Access granted! Routing to hub...');
    setTimeout(function () { location.href = 'tools.html'; }, 900);
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

/* ---------- session sync + auto redirect ---------- */
if (FB) {
    FB.auth().onAuthStateChanged(function (u) {
        if (u) {
            saveProfile(profileFrom(u, 'Email'));
            if (location.href.indexOf('login') > -1 || location.href.indexOf('register') > -1) {
                location.replace('tools.html');
            }
        }
    });
}

/* ================= LOGIN (login.html) ================= */
function doLogin() {
    if (!FB) { notReady(); return; }
    var email = ($('email') ? $('email').value : '').trim().toLowerCase();
    var pass = $('pass') ? $('pass').value : '';
    if (!email || !pass) { err('Enter email and password.'); return; }
    FB.auth().signInWithEmailAndPassword(email, pass)
        .then(function (r) { enter(profileFrom(r.user, 'Email')); })
        .catch(function (e) { err(friendly(e.code)); });
}

/* ================= REGISTER (register.html) ================= */
function verifyChip() {
    var c = $('secChip'), t = $('terms');
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
    var name = ($('suName') ? $('suName').value : '').trim();
    var email = ($('email') ? $('email').value : '').trim().toLowerCase();
    var pass = $('pass') ? $('pass').value : '';
    var pass2 = $('pass2') ? $('pass2').value : '';

    if (name.length < 3) { err('Full name must be at least 3 characters.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err('Enter a valid email address.'); return; }
    if (pass.length < 6) { err('Password must be at least 6 characters.'); return; }
    if (pass !== pass2) { err('Passwords do not match.'); return; }
    if ($('terms') && !$('terms').checked) { err('You must accept the Terms of Service.'); return; }

    FB.auth().createUserWithEmailAndPassword(email, pass)
        .then(function (r) {
            return r.user.updateProfile({ displayName: name }).then(function () { return r.user; });
        })
        .then(function (u) { enter(profileFrom(u, 'Email')); })
        .catch(function (e) { err(friendly(e.code)); });
}

/* ================= FORGOT (forgot-password.html) ================= */
function sendToken() {
    if (!FB) { notReady(); return; }
    var email = ($('email') ? $('email').value : '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err('Enter a valid email address.'); return; }
    FB.auth().sendPasswordResetEmail(email)
        .then(function () {
            ok('Recovery email sent to ' + email + '. Open the link inside to reset your password.');
            var s1 = $('step1'); if (s1) s1.style.display = 'none';
            var h = $('handshake'); if (h) h.textContent = 'Reset Link Routed ✓';
        })
        .catch(function (e) { err(friendly(e.code)); });
}

function validateToken() {
    ok('Reset happens via the email link. Sign in with your new password.');
    setTimeout(function () { location.href = 'login.html'; }, 1200);
}

/* ================= CONTINUE WITH (social buttons) ================= */
function social(p) {
    /* DISCORD — own OAuth (Firebase has no Discord) */
    if (p === 'Discord') {
        if (DISCORD_CLIENT_ID.indexOf('PASTE') === 0) { err('Discord Client ID not pasted yet.'); return; }
        var redirect = encodeURIComponent(location.origin + location.pathname);
        location.href = 'https://discord.com/oauth2/authorize?client_id=' + DISCORD_CLIENT_ID +
            '&response_type=token&redirect_uri=' + redirect + '&scope=identify';
        return;
    }
    /* GOOGLE / GITHUB / FACEBOOK — Firebase popup */
    if (!FB) { notReady(); return; }
    var prov = null;
    if (p === 'Google') prov = new firebase.auth.GoogleAuthProvider();
    else if (p === 'GitHub') prov = new firebase.auth.GithubAuthProvider();
    else if (p === 'Facebook') prov = new firebase.auth.FacebookAuthProvider();
    FB.auth().signInWithPopup(prov)
        .then(function (r) { enter(profileFrom(r.user, p)); })
        .catch(function (e) { err(friendly(e.code)); });
}

/* DISCORD return handler (catches token when user comes back) */
(function () {
    var h = location.hash.replace('#', '');
    if (h.indexOf('access_token=') === -1) return;
    var params = {};
    h.split('&').forEach(function (kv) { var p = kv.split('='); params[p[0]] = decodeURIComponent(p[1]); });
    fetch('https://discord.com/api/users/@me', { headers: { Authorization: 'Bearer ' + params['access_token'] } })
        .then(function (r) { return r.json(); })
        .then(function (u) {
            var avatar = u.avatar
                ? 'https://cdn.discordapp.com/avatars/' + u.id + '/' + u.avatar + '.png?size=96'
                : 'https://cdn.discordapp.com/embed/avatars/0.png';
            enter({ name: u.global_name || u.username, email: '', provider: 'Discord', avatar: avatar, ts: Date.now() });
        })
        .catch(function () { err('Discord login failed. Try again.'); });
})();

/* Enter key support */
document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    if ($('pass2')) doRegister();
    else if ($('step1') && $('step1').style.display !== 'none') sendToken();
    else if ($('pass')) doLogin();
});
