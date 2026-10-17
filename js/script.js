// --- VIUNGANISHI VYA JSONBIN ---
const JSONBIN_BIN_ID = "6ac561e7ac6210605a1a73c9";
const JSONBIN_API_KEY = "$2a$10$s6iBC3g.njqiqMtn5KXbqeJpY8CKQwxRuo3DNHYA43KfLd3LbJjC6";
const ADMIN_PASSWORD = "Richard";

// Wakati wa kupakia ukurasa
window.onload = function() {
    checkRegistrationWindow();
    loadDashboardState();
};

// --- 1. KUBADILISHA TAB ZA AUTH (LOGIN / REGISTER) ---
function switchTab(type) {
    let loginForm = document.getElementById('login-form');
    let registerForm = document.getElementById('register-form');

    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'none';

    if (type === 'login' && loginForm) {
        loginForm.style.display = 'block';
    } else if (type === 'register' && registerForm) {
        registerForm.style.display = 'block';
        checkRegistrationWindow();
    }
}

function checkRegistrationWindow() {
    let statusMsg = document.getElementById('reg-status-msg');
    let submitBtn = document.getElementById('btn-submit-reg');
    if (statusMsg && submitBtn) {
        statusMsg.innerText = "Dirisha la usajili liko wazi!";
        submitBtn.disabled = false;
    }
}

// --- 2. KUSOMA DATA KUTOKA JSONBIN ---
async function fetchDataFromBin() {
    try {
        let response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
            headers: { 'X-Master-Key': JSONBIN_API_KEY }
        });
        let result = await response.json();
        return result.record || { users: [], pending_matches: [], match_history: [], fixtures: [] };
    } catch (err) {
        console.error("Hitilafu ya kusoma data:", err);
        return { users: [], pending_matches: [], match_history: [], fixtures: [] };
    }
}

// --- 3. KUSAJILI MCHEZAJI MPYA ---
async function handleRegister() {
    let name = document.getElementById('reg-name').value.trim();
    let contact = document.getElementById('reg-contact').value.trim();

    if (!name || !contact) {
        alert('Tafadhali jaza jina lako na mawasiliano!');
        return;
    }

    let newId = `L1P-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
        let db = await fetchDataFromBin();
        if (!db.users) db.users = [];

        // Hifadhi mcheza kwa muda kwenye localStorage ili akajaze timu yake
        let tempUser = { id: newId, full_name: name, contact: contact, role: 'player', team_name: '', team_logo: '' };
        localStorage.setItem('l1p_temp_user', JSON.stringify(tempUser));

        // Onyesha ukurasa wa pili wa kusajili timu na logo
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('team-setup-section').style.display = 'block';
        document.getElementById('assigned-id-display').innerText = newId;

    } catch (err) {
        alert('Hitilafu: ' + err.message);
    }
}

// --- 4. KUHIFADHI TIMU NA LOGO BAADA YA KUSAJILI ---
async function saveTeamDetails() {
    let teamName = document.getElementById('team-name-input').value.trim();
    let teamLogo = document.getElementById('team-logo-input').value.trim();

    if (!teamName) {
        alert('Tafadhali jaza jina la timu yako!');
        return;
    }

    let tempUserStr = localStorage.getItem('l1p_temp_user');
    if (!tempUserStr) {
        alert('Kuna tatizo limetokea. Tafadhali jisajili upya.');
        location.reload();
        return;
    }

    let userObj = JSON.parse(tempUserStr);
    userObj.team_name = teamName;
    userObj.team_logo = teamLogo || 'https://via.placeholder.com/40';

    try {
        let db = await fetchDataFromBin();
        if (!db.users) db.users = [];
        db.users.push(userObj);

        let response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify(db)
        });

        if (response.ok) {
            alert(`Usajili umekamilika! ID yako ni: ${userObj.id}. Itumie hii kuingia baadaye.`);
            localStorage.removeItem('l1p_temp_user');
            localStorage.setItem('l1p_current_user', JSON.stringify(userObj));
            loadDashboardState();
        } else {
            alert('Imeshindikana kuhifadhi timu kwenye wingu.');
        }
    } catch (err) {
        alert('Hitilafu ya mtandao: ' + err.message);
    }
}

// --- 5. KUINGIA KWENYE MFUMO (LOGIN) ---
async function handleLogin() {
    let inputId = document.getElementById('login-id').value.trim();
    if (!inputId) {
        alert('Weka ID yako au password ya Admin!');
        return;
    }

    // Angalia kama ni Admin (Richard)
    if (inputId === ADMIN_PASSWORD) {
        let adminUser = { id: ADMIN_PASSWORD, full_name: 'Richard (Admin)', role: 'admin' };
        localStorage.setItem('l1p_current_user', JSON.stringify(adminUser));
        loadDashboardState();
        return;
    }

    try {
        let db = await fetchDataFromBin();
        let users = db.users || [];
        let foundUser = users.find(u => u.id === inputId);

        if (!foundUser) {
            alert('ID haipatikani kwenye mfumo! Hakikisha umeandika kwa usahihi au jisajili upya.');
        } else {
            localStorage.setItem('l1p_current_user', JSON.stringify(foundUser));
            loadDashboardState();
        }
    } catch (err) {
        alert('Hitilafu ya mtandao: ' + err.message);
    }
}

function handleLogout() {
    localStorage.removeItem('l1p_current_user');
    location.reload();
}

// --- 6. HALI YA DASHBOARD & KURASA ---
function loadDashboardState() {
    let currentUserStr = localStorage.getItem('l1p_current_user');
    let authSec = document.getElementById('auth-section');
    let teamSec = document.getElementById('team-setup-section');
    let dashSec = document.getElementById('dashboard-section');

    if (!currentUserStr) {
        if (authSec) authSec.style.display = 'block';
        if (teamSec) teamSec.style.display = 'none';
        if (dashSec) dashSec.style.display = 'none';
        return;
    }

    let currentUser = JSON.parse(currentUserStr);
    if (authSec) authSec.style.display = 'none';
    if (teamSec) teamSec.style.display = 'none';
    if (dashSec) dashSec.style.display = 'block';

    let welcomeElem = document.getElementById('user-welcome-name');
    if (welcomeElem) welcomeElem.innerText = currentUser.full_name;
    
    let roleBadge = document.getElementById('user-role-badge');
    if (roleBadge) roleBadge.innerText = currentUser.role.toUpperCase();

    if (currentUser.role === 'admin') {
        let adminBtn = document.getElementById('admin-menu-btn');
        if (adminBtn) adminBtn.style.display = 'inline-block';
        fetchPendingQueue();
    }

    navigateTo('view-table');
}

// --- 7. KUBADILISHA KURASA (VIEWS) ---
function navigateTo(viewId) {
    let subViews = document.querySelectorAll('.sub-view');
    subViews.forEach(v => v.style.display = 'none');

    let targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.style.display = 'block';
    }

    if (viewId === 'view-table') fetchLeagueTable();
    if (viewId === 'view-scorers') fetchTopScorersAndAssists();
    if (viewId === 'view-fixtures') fetchFixtures();
    if (viewId === 'view-history') fetchMatchHistory();
    if (viewId === 'view-admin') fetchPendingQueue();
}

// --- 8. KUSOMA NA KUONYESHA MSIMAMO WA LIGI ---
async function fetchLeagueTable() {
    let tbody = document.getElementById('league-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="11">Inapakia msimamo...</td></tr>';
    
    try {
        let db = await fetchDataFromBin();
        let users = db.users || [];
        let history = db.match_history || [];
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11">Hakuna timu zilizosajiliwa bado.</td></tr>';
            return;
        }
        
        let stats = {};
        users.forEach(user => {
            let name = user.team_name || user.full_name;
            stats[name] = {
                name: name,
                logo: user.team_logo || '',
                played: 0,
                won: 0,
                drawn: 0,
                lost: 0,
                gf: 0,
                ga: 0,
                gd: 0,
                points: 0
            };
        });
        
        history.forEach(match => {
            let home = match.home;
            let away = match.away;
            let scores = match.score.split('-').map(s => parseInt(s.trim()) || 0);
            let homeScore = scores[0] || 0;
            let awayScore = scores[1] || 0;
            
            if (stats[home]) {
                stats[home].played++;
                stats[home].gf += homeScore;
                stats[home].ga += awayScore;
                if (homeScore > awayScore) {
                    stats[home].won++;
                    stats[home].points += 3;
                } else if (homeScore === awayScore) {
                    stats[home].drawn++;
                    stats[home].points += 1;
                } else {
                    stats[home].lost++;
                }
                stats[home].gd = stats[home].gf - stats[home].ga;
            }
            
            if (stats[away]) {
                stats[away].played++;
                stats[away].gf += awayScore;
                stats[away].ga += homeScore;
                if (awayScore > homeScore) {
                    stats[away].won++;
                    stats[away].points += 3;
                } else if (awayScore === homeScore) {
                    stats[away].drawn++;
                    stats[away].points += 1;
                } else {
                    stats[away].lost++;
                }
                stats[away].gd = stats[away].gf - stats[away].ga;
            }
        });
        
        let tableArr = Object.values(stats);
        tableArr.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.gd !== a.gd) return b.gd - a.gd;
            return b.gf - a.gf;
        });
        
        tbody.innerHTML = '';
        tableArr.forEach((team, index) => {
            let logoImg = team.logo ? `<img src="${team.logo}" width="30" height="30" style="border-radius: 50%;">` : '';
            tbody.innerHTML += `<tr>
                <td>${index + 1}</td>
                <td>${logoImg}</td>
                <td>${team.name}</td>
                <td>${team.played}</td>
                <td>${team.won}</td>
                <td>${team.drawn}</td>
                <td>${team.lost}</td>
                <td>${team.gf}</td>
                <td>${team.ga}</td>
                <td>${team.gd}</td>
                <td><strong>${team.points}</strong></td>
            </tr>`;
        });
    } catch (err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="11">Imeshindikana kupakia msimamo.</td></tr>';
    }
                        }
async function fetchFixtures() {
    let container = document.getElementById('fixtures-container');
    if (!container) return;

    container.innerHTML = "<p>Inapakia ratiba...</p>";

    try {
        let db = await fetchDataFromBin();
        let fixtures = db.fixtures || [];

        if (fixtures.length === 0) {
            container.innerHTML = "<p>Hakuna ratiba zilizopangwa kwa sasa</p>";
            return;
        }

        let html = "<ul style='list-style: none; padding: 0;'>";
        fixtures.forEach((match, index) => {
            let matchDate = match.date ? `<br><small style='color: #3498db;'>Tarehe: ${match.date} (Saa 10:00 Jioni - 2:30 Usiku)</small>` : '';
            html += `<li style='background: #222; margin-bottom: 10px; padding: 10px; border-radius: 5px;'>
                <strong>Mechi ya ${index + 1}:</strong> ${match.home} vs ${match.away} 
                ${matchDate}
                <span style='float: right; color: #f1c40f;'>-:-</span>
            </li>`;
        });
        html += "</ul>";

        container.innerHTML = html;
    } catch (err) {
        console.error(err);
        container.innerHTML = "<p>Imeshindikana kupakia ratiba.</p>";
  
}
}

async function fetchTopScorersAndAssists() {
    let scorersContainer = document.getElementById('top-scorers-list');
    let assistsContainer = document.getElementById('top-assists-list');
    
    if (scorersContainer) scorersContainer.innerHTML = '<li>Inapakia wafungaji...</li>';
    if (assistsContainer) assistsContainer.innerHTML = '<li>Inapakia assist...</li>';
    
    try {
        let db = await fetchDataFromBin();
        let history = db.match_history || [];
        
        if (history.length === 0) {
            if (scorersContainer) scorersContainer.innerHTML = '<li>Bado hakuna takwimu.</li>';
            if (assistsContainer) assistsContainer.innerHTML = '<li>Bado hakuna takwimu.</li>';
            return;
        }
        
        let scorersCount = {};
        let assistsCount = {};
        
        history.forEach(match => {
            if (match.scorer && match.scorer.trim() !== '' && match.scorer.toLowerCase() !== 'hakuna') {
                let name = match.scorer.trim();
                scorersCount[name] = (scorersCount[name] || 0) + 1;
            }
            if (match.assist && match.assist.trim() !== '' && match.assist.toLowerCase() !== 'hakuna') {
                let name = match.assist.trim();
                assistsCount[name] = (assistsCount[name] || 0) + 1;
            }
        });
        
        let sortedScorers = Object.entries(scorersCount).sort((a, b) => b[1] - a[1]);
        if (scorersContainer) {
            if (sortedScorers.length === 0) {
                scorersContainer.innerHTML = '<li>Bado hakuna takwimu.</li>';
            } else {
                let html = '';
                sortedScorers.forEach(([player, goals]) => {
                    html += `<li><strong>${player}</strong> - ${goals} Magoli</li>`;
                });
                scorersContainer.innerHTML = html;
            }
        }
        
        let sortedAssists = Object.entries(assistsCount).sort((a, b) => b[1] - a[1]);
        if (assistsContainer) {
            if (sortedAssists.length === 0) {
                assistsContainer.innerHTML = '<li>Bado hakuna takwimu.</li>';
            } else {
                let html = '';
                sortedAssists.forEach(([player, assists]) => {
                    html += `<li><strong>${player}</strong> - ${assists} Assist</li>`;
                });
                assistsContainer.innerHTML = html;
            }
        }
    } catch (err) {
        console.error(err);
        if (scorersContainer) scorersContainer.innerHTML = '<li>Imeshindikana kupakia takwimu.</li>';
        if (assistsContainer) assistsContainer.innerHTML = '<li>Imeshindikana kupakia takwimu.</li>';
    }
}


async function fetchMatchHistory() {
    let container = document.getElementById('match-history-container');
    if (container) container.innerHTML = '<p>Hakuna mechi zilizochezwa bado.</p>';
}

// --- 10. KUWASILISHA MATOKEO (Wachezaji) ---
async function submitMatchResult() {
    let opponent = document.getElementById('match-opponent').value.trim();
    let score = document.getElementById('match-score').value.trim();
    let scorer = document.getElementById('match-scorer-name').value.trim();
    let assist = document.getElementById('match-assist-name').value.trim();
    
    if (!opponent || !score) {
        alert('Tafadhali jaza mpinzani na matokeo!');
        return;
    }

    let currentUserStr = localStorage.getItem('l1p_current_user');
    if (!currentUserStr) {
        alert('Tafadhali ingia kwenye akaunti yako kwanza.');
        return;
    }
    let currentUser = JSON.parse(currentUserStr);

    try {
        let db = await fetchDataFromBin();
        if (!db.pending_matches) db.pending_matches = [];

        // Hifadhi matokeo kwenye foleni ya kusubiri uthibitisho wako
        db.pending_matches.push({
            reporter: currentUser.team_name || currentUser.full_name,
            opponent: opponent,
            score: score,
            scorer: scorer || 'Hakuna',
            assist: assist || 'Hakuna',
            timestamp: new Date().toISOString()
        });

        let response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify(db)
        });

        if (response.ok) {
            alert('Matokeo yametumwa kwa Admin kwa ajili ya uthibitisho!');
            document.getElementById('match-opponent').value = '';
            document.getElementById('match-score').value = '';
            document.getElementById('match-scorer-name').value = '';
            document.getElementById('match-assist-name').value = '';
        } else {
            alert('Imeshindikana kutuma matokeo kwenye mfumo.');
        }
    } catch (err) {
        console.error(err);
        alert('Hitilafu ya mtandao imetokea.');
    }
}


// --- 11. ADMIN: KUKAGUA NA KUREFRESH LIGI ---
async function fetchPendingQueue() {
    let container = document.getElementById('admin-pending-container');
    if (!container) return;
    
    container.innerHTML = "<p>Inapakia matokeo yanayosubiri...</p>";
    
    try {
        let db = await fetchDataFromBin();
        let pending = db.pending_matches || [];
        
        if (pending.length === 0) {
            container.innerHTML = "<p>Hakuna matokeo yanayosubiri uthibitisho.</p>";
            return;
        }
        
        let html = "<ul style='list-style: none; padding: 0;'>";
        pending.forEach((match, index) => {
            html += `<li style='background: #222; margin-bottom: 10px; padding: 12px; border-radius: 6px; color: white;'>
                <strong>Mtumaji:</strong> ${match.reporter} vs ${match.opponent}<br>
                <strong>Matokeo:</strong> ${match.score} | <strong>Mfungaji:</strong> ${match.scorer} | <strong>Assist:</strong> ${match.assist}<br>
                <button onclick="approveMatch(${index})" style='background: #2ecc71; color: white; border: none; padding: 6px 12px; border-radius: 4px; margin-top: 8px; cursor: pointer;'>Kubali</button>
                <button onclick="rejectMatch(${index})" style='background: #e74c3c; color: white; border: none; padding: 6px 12px; border-radius: 4px; margin-top: 8px; margin-left: 6px; cursor: pointer;'>Kataa</button>
            </li>`;
        });
        html += "</ul>";
        
        container.innerHTML = html;
    } catch (err) {
        console.error(err);
        container.innerHTML = "<p>Imeshindikana kupakia matokeo.</p>";
    }
}
async function approveMatch(index) {
    try {
        let db = await fetchDataFromBin();
        if (!db.pending_matches || !db.pending_matches[index]) return;

        let match = db.pending_matches[index];

        if (!db.match_history) db.match_history = [];
        db.match_history.push({
            home: match.reporter,
            away: match.opponent,
            score: match.score,
            scorer: match.scorer,
            assist: match.assist,
            status: "Approved"
        });

        db.pending_matches.splice(index, 1);

        let response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify(db)
        });

        if (response.ok) {
            alert('Matokeo yamethibitishwa rasmi!');
            fetchPendingQueue();
        } else {
            alert('Imeshindikana kusasisha mfumo.');
        }
    } catch (err) {
        console.error(err);
        alert('Hitilafu imetokea.');
    }
}
async function rejectMatch(index) {
    try {
        let db = await fetchDataFromBin();
        if (!db.pending_matches || !db.pending_matches[index]) return;

        let rejectedMatch = db.pending_matches[index];

        // 1. Futa kwenye foleni ya kusubiri ya Admin
        db.pending_matches.splice(index, 1);

        // 2. Irudishe kwenye ratiba (Reschedule) ili wacheze tena
        if (!db.fixtures) db.fixtures = [];
        db.fixtures.push({
            home: rejectedMatch.reporter,
            away: rejectedMatch.opponent,
            home_score: "",
            away_score: "",
            status: "Rescheduled"
        });

        let response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify(db)
        });

        if (response.ok) {
            alert('Mechi imekataliwa na kurudishwa kwenye ratiba ili wacheze tena!');
            fetchPendingQueue();
        } else {
            alert('Imeshindikana kusasisha mfumo.');
        }
    } catch (err) {
        console.error(err);
        alert('Hitilafu imetokea.');
  
    }
}

// ADMIN: KUREFRESH / RESET LIGI (Inafuta ligi na kufungua usajili)
async function adminResetLeague() {
    let confirmReset = confirm("WARNING: Je, una hakika unataka ku-reset ligi? Hii itafuta data zote za sasa na kufungua dirisha la usajili upya!");
    if (!confirmReset) return;

    try {
        let emptyDb = { users: [], pending_matches: [], match_history: [], fixtures: [] };
        let response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify(emptyDb)
        });

        if (response.ok) {
            alert('Ligi imefutwa kikamilifu! Dirisha la usajili liko wazi.');
            localStorage.removeItem('l1p_current_user');
            location.reload();
        } else {
            alert('Imeshindikana kufanya reset kwenye wingu.');
        }
    } catch (err) {
        alert('Hitilafu: ' + err.message);
    }
}async function adminToggleAndStartLeague() {
    let password = prompt("Ingiza nenosiri la Admin (Richard):");
    if (password !== ADMIN_PASSWORD) {
        alert("Nenosiri si sahihi!");
        return;
    }

    try {
        let res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
            headers: { 'X-Master-Key': JSONBIN_API_KEY }
        });
        let data = await res.json();
        let users = data.record.users || data.record;

        if (!Array.isArray(users)) {
            alert("Hitilafu kwenye muundo wa data za wachezaji.");
            return;
        }

        // Kichujio cha kuondoa wote waliojisajili mara mbili (Duplicate cleaner)
        let uniqueUsers = [];
        let seenContacts = new Set();
        let seenNames = new Set();

        users.forEach(player => {
            let name = player.full_name ? player.full_name.trim().toLowerCase() : "";
            let contact = player.contact ? player.contact.trim() : "";
            
            if (name && contact && !seenContacts.has(contact) && !seenNames.has(name)) {
                seenContacts.add(contact);
                seenNames.add(name);
                uniqueUsers.push(player);
            }
        });

                // 1. Kusanya majina ya timu zote zilizokwishacheza kwenye match_history
    let playedTeams = new Set();
    if (db.match_history) {
        db.match_history.forEach(m => {
            playedTeams.add(m.home);
            playedTeams.add(m.away);
        });
    }

    // 2. Chuja tubakize tu zile ambazo BADO hazijacheza
    let remainingTeams = uniqueUsers.filter(user => {
        let teamName = user.team_name || user.full_name;
        return !playedTeams.has(teamName);
    });

    let fixtures = [];
    let teams = [...remainingTeams
                ];
        
        if (teams.length % 2 !== 0) {
            teams.push({ full_name: "Mapumziko (Bye)", team_name: "Mapumziko (Bye)" });
        }

        let totalRounds = teams.length - 1;
        let halfSize = teams.length / 2;

        for (let round = 0; round < totalRounds; round++) {
            for (let i = 0; i < halfSize; i++) {
                let team1 = teams[i];
                let team2 = teams[teams.length - 1 - i];

                if (team1.team_name !== "Mapumziko (Bye)" && team2.team_name !== "Mapumziko (Bye)" &&
                    team1.full_name !== "Mapumziko (Bye)" && team2.full_name !== "Mapumziko (Bye)") {
                    
               fixtures.push({
                home: team1.team_name || team1.full_name,
                away: team2.team_name || team2.full_name,
                home_score: "",
                away_score: "",
                status: "Pending",
                date: "14/10/2026"
            });
                    
                }
            }
            teams.splice(1, 0, teams.pop());
        }
        
   

        // Hifadhi hali ya kufungwa, orodha safi, na ratiba kwenye JSONBin
        let updateRes = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify({ users: uniqueUsers, fixtures: fixtures, registration_closed: true })
        });


        if (updateRes.ok) {
            localStorage.setItem('registration_closed', 'true');
            alert(`Usajili umefungwa rasmi! Waliojirudia wamefutwa. Wachezaji halali kwenye ligi ni: ${uniqueUsers.length}. Ligi imeanza!`);
            location.reload();
        } else {
            alert("Imeshindikana kusasisha hifadhi ya data.");
        }
    } catch (err) {
        console.error(err);
        alert("Hitilafu ya mtandao imetokea.");
    }
}
// --- MFUMO WA KUBADILISHA PICHA ZA NYUMA (BACKGROUND WALLPAPERS) ---
const pichaZangu = [
    '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg', 
    '8.jpg', '9.jpg', '10.jpg', '11.jpg', '12.jpg', 
    '13.jpg', '14.jpg', '15.jpg'
];

let nambaYaPicha = 0;

function badiliPichaNyuma() {
    nambaYaPicha = (nambaYaPicha + 1) % pichaZangu.length;
    document.body.style.backgroundImage = `linear-gradient(rgba(11, 19, 43, 0.8), rgba(11, 19, 43, 0.8)), url('${pichaZangu[nambaYaPicha]}')`;
}

document.addEventListener("DOMContentLoaded", () => {
    document.body.style.backgroundImage = 'linear-gradient(rgba(11, 19, 43, 0.8), rgba(11, 19, 43, 0.8)), url("images/' + pichazangu[0] + '")';
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center center";
    document.body.style.backgroundRepeat = "no-repeat";

    // Inabadilisha picha kila baada ya sekunde 6
    setInterval(badiliPichaNyuma, 6000);

    // --- KUVUTA NEWS TICKER KUTOKA JSONBIN ---
    fetch('https://api.jsonbin.io/v3/b/6ac561e7ac6210605a1a73c9/latest', {
        headers: { 'X-Master-Key': '$2a$10$s6iBC3g.njqiqMtn5KXbqeJpY8CKQwxRuo3DNHYA43KfLd3LbJjC6' }
    })
    .then(res => res.json())
    .then(data => {
        if(data.record && data.record.ticker) {
            const tickerSpan = document.getElementById('ticker-text-display');
            if(tickerSpan) {
                tickerSpan.innerText = data.record.ticker;
            }
        }
    })
    .catch(err => console.error("Hitilafu ya Ticker:", err));
});
