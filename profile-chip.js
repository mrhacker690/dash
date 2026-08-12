/* ===========================================================
   CYRUSLINKSHUB — SHARED PROFILE CHIP
   Shows avatar + name on ALL pages (www + dash subdomains)
=========================================================== */
(function () {
    var COOKIE = 'clh_cookie';
    var LS_KEY = 'clh_profile';

    /* Read profile from cookie (shared across subdomains) */
    function readCookie() {
        var m = document.cookie.match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([^;]+)'));
        if (!m) return null;
        try { return JSON.parse(decodeURIComponent(m[1])); } catch (e) { return null; }
    }

    /* Read profile from localStorage */
    function readLS() {
        try { return JSON.parse(localStorage.getItem(LS_KEY)); } catch (e) { return null; }
    }

    /* Render the chip in every .profile-area */
    function render() {
        var areas = document.querySelectorAll('#profileArea, .profile-area');
        if (!areas.length) return;

        var p = readLS() || readCookie();

        /* Also try Firebase (handles page reloads on dash subdomain) */
        if (!p && typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged(function (u) {
                if (u) {
                    var n = u.displayName || (u.email ? u.email.split('@')[0] : 'Player');
                    var np = {
                        name: n,
                        email: u.email || '',
                        provider: 'Firebase',
                        avatar: u.photoURL || 'https://api.dicebear.com/9.x/initials/svg?seed=' + encodeURIComponent(n),
                        ts: Date.now()
                    };
                    try { localStorage.setItem(LS_KEY, JSON.stringify(np)); } catch (e) {}
                    injectChip(np);
                } else {
                    hideAll();
                }
            });
            return; /* wait for Firebase */
        }

        if (p) injectChip(p); else hideAll();
    }

    function hideAll() {
        document.querySelectorAll('#profileArea, .profile-area').forEach(function (a) {
            a.style.display = 'none'; a.innerHTML = '';
        });
    }

    function injectChip(p) {
        document.querySelectorAll('#profileArea, .profile-area').forEach(function (area) {
            area.style.display = '';
            if (area.dataset.bound) return;
            area.dataset.bound = '1';
            area.innerHTML = '';

            var chip = document.createElement('div');
            chip.className = 'profile-chip';

            var img = document.createElement('img');
            img.className = 'avatar-img';
            img.alt = p.name || '';
            img.src = p.avatar || '';
            img.onerror = function () {
                img.onerror = null;
                img.src = 'https://api.dicebear.com/9.x/initials/svg?seed=' + encodeURIComponent(p.name || 'player');
            };

            var nm = document.createElement('span');
            nm.className = 'profile-name';
            nm.textContent = p.name || '';

            var menu = document.createElement('div');
            menu.className = 'profile-menu';
            menu.innerHTML =
                '<div class="pm-head"><i class="fa-solid fa-circle-check"></i> ' + (p.provider || '') + ' account</div>' +
                '<button id="clhOut' + Math.random().toString(36).slice(2) + '"><i class="fa-solid fa-right-from-bracket"></i> Logout</button>';

            chip.appendChild(img);
            chip.appendChild(nm);
            chip.appendChild(menu);
            chip.onclick = function () { menu.classList.toggle('show'); };
            area.appendChild(chip);

            menu.querySelector('button').onclick = function (e) {
                e.stopPropagation();
                try { localStorage.removeItem(LS_KEY); } catch (x) {}
                document.cookie = COOKIE + '=;path=/;domain=.cyruslinkshub.com;expires=Thu, 01 Jan 1970 00:00:00 GMT';
                document.cookie = COOKIE + '=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT';
                if (typeof firebase !== 'undefined' && firebase.auth) {
                    firebase.auth().signOut().then(function () { location.href = 'https://www.cyruslinkshub.com'; });
                } else {
                    location.href = 'https://www.cyruslinkshub.com';
                }
            };
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', render);
    } else {
        render();
    }
})();
