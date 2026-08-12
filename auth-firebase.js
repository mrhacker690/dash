/* ===========================================================
   CYRUSLINKSHUB — FIREBASE AUTH (2-DOMAIN SETUP)
   www.cyruslinkshub.com (landing) → dash.cyruslinkshub.com (dashboard)
=========================================================== */

var firebaseConfig = {
    apiKey: "AIzaSyA2n3WLi1_savBMMWWmMv2Ge19VSvQkUjI",
    authDomain: "cyruslinkshub-2e195.firebaseapp.com",
    projectId: "cyruslinkshub-2e195",
    storageBucket: "cyruslinkshub-2e195.firebasestorage.app",
    messagingSenderId: "1015015184649",
    appId: "1:1015015184649:web:922ee0a6bcaf5d86ee5bd8",
    measurementId: "G-LTT4WV9397"
};
var DISCORD_CLIENT_ID = "1536842067865636874";

var FB = null;
try {
    if (typeof firebase !== 'undefined' && firebaseConfig.apiKey.indexOf('PASTE') !== 0) {
        firebase.initializeApp(firebaseConfig);
        FB = firebase;
    }
} catch (e) {}

var P_KEY = 'clh_profile';
var DASHBOARD_URL = 'https://dash.cyruslinkshub.com';
var LANDING_URL = 'https://www.cyruslinkshub.com';

function saveProfile(p) { localStorage.setItem(P_KEY, JSON.stringify(p)); }
function getProfile() { try { return JSON.parse(localStorage.getItem(P_KEY)); } catch (e) { return null; } }

function ensureMsgs() {
    if (document.getElementById('authError')) return;
    var first = document.querySelector('input');
    var host = first ? (first.closest('.glass, .auth-card, section, main') || document.body) : document.body;
    var e = document.createElement('div'); e.id = 'authError'; e.className = 'error-msg';
    var o = document.createElement('div'); o.id = 'authOk'; o.className = 'success-msg';
    host.insertBefore(o, first ? first.parentElement : host.firstChild);
    host.insertBefore(e, o);
}
function err(m) { ensureMsgs(); var e = document.getElementById('authError'); e.textContent = m; e.style.display = 'block'; document.getElementById('authOk').style.display = 'none'; }
function ok(m) { ensureMsgs(); var o = document.getElementById('authOk'); o.textContent = m; o.style.display = 'block'; document.getElementById('authError').style.display = 'none'; }
function notReady() { err('Firebase not connected yet — paste your config in auth-firebase.js'); }

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

/* ENTER → redirect to DASHBOARD */
function enter(p) {
    saveProfile(p);
    ok('Access granted! Routing to dashboard...');
    setTimeout(function () { location.href = DASHBOARD_URL; }, 900);
}

/* LOGOUT → back to LANDING */
function logout() {
    localStorage.removeItem(P_KEY);
    if (FB) FB.auth().signOut();
    location.href = LANDING_URL;
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

function fEmail() { return document.querySelector('input[type="email"]'); }
function fPass() { return document.querySelectorAll('input[type="password"]'); }
function fText() { return document.querySelectorAll('input[type="text"]'); }
function fTerms() { return document.querySelector('input[type="checkbox"]'); }

function doLogin() {
    if (!FB) { notReady(); return; }
    var em = fEmail() ? fEmail().value.trim().toLowerCase() : '';
    var ps = fPass(); var pw = ps[0] ? ps[0].value : '';
    if (!em || !pw) { err('Enter email and password.'); return; }
    FB.auth().signInWithEmailAndPassword(em, pw)
        .then(function (r) { enter(profileFrom(r.user, 'Email')); })
        .catch(function (e) { err(friendly(e.code)); });
}

function doRegister() {
    if (!FB) { notReady(); return; }
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

function sendReset() {
    if (!FB) { notReady(); return; }
    var em = fEmail() ? fEmail().value.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { err('Enter a valid email address.'); return; }
    FB.auth().sendPasswordResetEmail(em)
        .then(function () { ok('Recovery email sent to ' + em + '. Open the link inside to reset your password.'); })
        .catch(function (e) { err(friendly(e.code)); });
}

function social(p) {
    if (p === 'Discord') {
        if (DISCORD_CLIENT_ID.indexOf('PASTE') === 0) { err('Discord Client ID not pasted in auth-firebase.js yet.'); return; }
        var redirect = encodeURIComponent(location.origin + location.pathname);
        location.href = 'https://discord.com/oauth2/authorize?client_id=' + DISCORD_CLIENT_ID +
            '&response_type=token&redirect_uri=' + redirect + '&scope=identify';
        return;
    }
    if (!FB) { notReady(); return; }
    var prov = null;
    if (p === 'Google') prov = new firebase.auth.GoogleAuthProvider();
    else if (p === 'GitHub') prov = new firebase.auth.GithubAuthProvider();
    else if (p === 'Facebook') prov = new firebase.auth.FacebookAuthProvider();
    FB.auth().signInWithPopup(prov)
        .then(function (r) { enter(profileFrom(r.user, p)); })
        .catch(function (e) { err(friendly(e.code)); });
}

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
            else if (t.indexOf('LOGOUT') > -1 || t.indexOf('SIGN OUT') > -1) hit = logout;
            else if (t.indexOf('GOOGLE') > -1) hit = function () { social('Google'); };
            else if (t.indexOf('GITHUB') > -1) hit = function () { social('GitHub'); };
            else if (t.indexOf('DISCORD') > -1) hit = function () { social('Discord'); };
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

if (FB) {
    FB.auth().onAuthStateChanged(function (u) {
        if (u) {
            saveProfile(profileFrom(u, 'Email'));
            if (authPage) location.replace(DASHBOARD_URL);
        }
    });
}

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

document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || !authPage) return;
    if (fPass().length > 1) doRegister();
    else if (fEmail() && fPass().length === 1 && document.querySelector('button')) {
        var t = ((document.querySelector('button').textContent || '') + '').toUpperCase();
        if (t.indexOf('RESET') > -1 || t.indexOf('RECOVERY') > -1) sendReset(); else doLogin();
    }
});
document.addEventListener('DOMContentLoaded', bindAll);
