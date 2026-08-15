/* CYRUSLINKSHUB — PROFILE CHIP (loop-proof, cookie + URL handoff) */
(function () {
    var COOKIE = 'clh_cookie';
    var LANDING = 'https://www.cyruslinkshub.com';

    var st = document.createElement('style');
    st.textContent = '.profile-area{margin-left:auto;display:flex;align-items:center}.profile-chip{position:relative;display:flex;align-items:center;gap:10px;cursor:pointer;padding:6px 12px;border:1px solid rgba(0,240,255,.25);border-radius:999px;background:rgba(0,240,255,.07);box-shadow:0 0 14px rgba(0,240,255,.15)}.avatar-img{width:38px;height:38px;border-radius:50%;border:2px solid #00f0ff;box-shadow:0 0 12px #00f0ff;object-fit:cover;background:#000}.profile-name{font-family:"Orbitron",sans-serif;font-size:.72rem;color:#00f0ff;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.profile-menu{position:absolute;top:115%;right:0;background:#0b0620;border:1px solid rgba(0,240,255,.25);border-radius:12px;padding:10px;display:none;min-width:170px;z-index:300;box-shadow:0 0 25px rgba(0,240,255,.25)}.profile-menu.show{display:block}.pm-head{font-size:.68rem;color:#9aa7c7;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px}.profile-menu button{width:100%;background:rgba(255,0,80,.15);color:#ff5588;box-shadow:none;border:none;border-radius:8px;padding:10px;cursor:pointer;font-family:"Orbitron",sans-serif}@media(max-width:480px){.profile-name{display:none}}';
    document.head.appendChild(st);

    function setCookie(p) {
        var v = encodeURIComponent(JSON.stringify(p));
        document.cookie = COOKIE + '=' + v + ';path=/;domain=.cyruslinkshub.com;max-age=31536000';
        document.cookie = COOKIE + '=' + v + ';path=/;max-age=31536000';
    }
    function readCookie() {
        var m = document.cookie.match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([^;]+)'));
        if (!m) return null;
        try { return JSON.parse(decodeURIComponent(m[1])); } catch (e) { return null; }
    }

    /* 1) RECEIVE profile from login redirect (?clh=...) */
    var m = location.search.match(/[?&]clh=([^&]+)/);
    if (m) {
        try {
            setCookie(JSON.parse(decodeURIComponent(m[1])));
            location.replace(location.pathname);   /* clean URL, reload with cookie */
            return;
        } catch (e) {}
    }

    var p = readCookie();
    var isDash = location.hostname.indexOf('dash.') === 0;

    /* 2) DASH GUARD — loop-proof: sends ?out=1 so login won't bounce back */
    if (isDash && !p) { location.replace(LANDING + '/login.html?out=1'); return; }

    /* 3) LOGOUT — clears cookie everywhere */
    window.clhLogout = function () {
        try { localStorage.removeItem('clh_profile'); } catch (e) {}
        document.cookie = COOKIE + '=;path=/;domain=.cyruslinkshub.com;expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = COOKIE + '=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = COOKIE + '=;path=/;domain=www.cyruslinkshub.com;expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = COOKIE + '=;path=/;domain=dash.cyruslinkshub.com;expires=Thu, 01 Jan 1970 00:00:00 GMT';
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().signOut().then(function () { location.href = LANDING; });
        } else { location.href = LANDING; }
    };

    /* 4) RENDER chip */
    function render() {
        var areas = document.querySelectorAll('#profileArea, .profile-area');
        if (!areas.length) return;
        if (!p) { areas.forEach(function (a) { a.style.display = 'none'; a.innerHTML = ''; }); return; }
        areas.forEach(function (area) {
            area.style.display = '';
            if (area.dataset.bound) return;
            area.dataset.bound = '1';
            area.innerHTML = '';
            var chip = document.createElement('div'); chip.className = 'profile-chip';
            var img = document.createElement('img'); img.className = 'avatar-img'; img.alt = p.name || '';
            img.src = p.avatar || '';
            img.onerror = function () { img.onerror = null; img.src = 'https://api.dicebear.com/9.x/initials/svg?seed=' + encodeURIComponent(p.name || 'player'); };
            var nm = document.createElement('span'); nm.className = 'profile-name'; nm.textContent = p.name || '';
            var menu = document.createElement('div'); menu.className = 'profile-menu';
            menu.innerHTML = '<div class="pm-head"><i class="fa-solid fa-circle-check"></i> ' + (p.provider || '') + ' account</div><button><i class="fa-solid fa-right-from-bracket"></i> Logout</button>';
            chip.appendChild(img); chip.appendChild(nm); chip.appendChild(menu);
            chip.onclick = function () { menu.classList.toggle('show'); };
            area.appendChild(chip);
            menu.querySelector('button').onclick = function (e) { e.stopPropagation(); clhLogout(); };
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
    else render();
})();
