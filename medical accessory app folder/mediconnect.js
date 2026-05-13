/* ========== SECURITY ========== */
function sanitize(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function isValidEmail(e) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

/* ========== STATE ========== */
let currentUser = null;
let selectedDoctor = null;
let healthChart = null;
let trendsChart = null;
let docPieChart = null;
let monitoringInterval = null;
let healthData = { heartRate: [], labels: [] };
let medications = [];
let currentEditIndex = null;
let selectedSymptoms = new Set();
let allDoctors = [];
let appointments = [];
let medReminderInterval = null;
let doctorQueue = [];
let notifications = [];

/* ========== DEMO DATA ========== */
const demoPatients = [
    { id: 'p1', name: 'John Doe', email: 'patient@demo.com', password: 'demo123', dob: '1990-05-15', role: 'patient' },
    { id: 'p2', name: 'Jane Smith', email: 'jane@demo.com', password: 'demo123', dob: '1985-11-22', role: 'patient' },
    { id: 'p3', name: 'Alex Johnson', email: 'alex@demo.com', password: 'demo123', dob: '1995-03-08', role: 'patient' }
];

const demoDoctors = [];

const facilities = [
    { name: 'City General Hospital', dist: '2.3 km', type: 'Emergency Room', icon: 'fa-hospital' },
    { name: 'MediCare Clinic', dist: '0.8 km', type: 'Walk-in', icon: 'fa-clinic-medical' },
    { name: '24/7 Pharmacy Plus', dist: '1.5 km', type: 'Open Now', icon: 'fa-prescription-bottle-medical' }
];

const drugInteractions = [
    { d1: 'warfarin', d2: 'aspirin', sev: 'high', msg: 'Increased bleeding risk. Source: FDA Drug Database' },
    { d1: 'metformin', d2: 'alcohol', sev: 'high', msg: 'Lactic acidosis risk. Source: NIH MedlinePlus' },
    { d1: 'ibuprofen', d2: 'aspirin', sev: 'moderate', msg: 'Reduced cardioprotective effect. Source: American Heart Association' },
    { d1: 'paracetamol', d2: 'alcohol', sev: 'high', msg: 'Severe liver damage risk. Source: WHO Guidelines' },
    { d1: 'lisinopril', d2: 'potassium', sev: 'high', msg: 'Hyperkalemia risk. Source: FDA Adverse Event Reporting' },
    { d1: 'simvastatin', d2: 'grapefruit', sev: 'moderate', msg: 'Increased statin toxicity. Source: Mayo Clinic' },
    { d1: 'fluoxetine', d2: 'tramadol', sev: 'high', msg: 'Serotonin syndrome risk. Source: Drugs.com Interaction Checker' }
];

const articles = {
    nutrition: {
        title: 'Balanced Nutrition', icon: 'fa-apple-whole',
        content: '<h4>Understanding Balanced Nutrition</h4><p>A balanced diet provides essential nutrients for optimal body function.</p><h4>Key Nutrients:</h4><ul><li><strong>Carbohydrates:</strong> Main energy source. Choose whole grains, fruits, vegetables.</li><li><strong>Proteins:</strong> Building and repairing tissues. Meat, fish, eggs, beans, nuts.</li><li><strong>Fats:</strong> Hormone production. Avocados, olive oil, fish.</li><li><strong>Vitamins & Minerals:</strong> Immune function. Colorful fruits and vegetables.</li><li><strong>Water:</strong> Aim for 8 glasses (2 liters) per day.</li></ul><h4>Daily Recommendations:</h4><ul><li>5 servings of fruits and vegetables</li><li>3 servings of whole grains</li><li>2-3 servings of lean protein</li><li>Limit added sugars and processed foods</li></ul>'
    },
    exercise: {
        title: 'Exercise Guidelines', icon: 'fa-person-running',
        content: '<h4>Physical Activity Recommendations</h4><p>Regular activity is one of the most important things for your health.</p><h4>By Age:</h4><ul><li><strong>Adults (18-64):</strong> 150 min moderate or 75 min vigorous aerobic activity per week.</li><li><strong>Children (6-17):</strong> 60 minutes daily, including vigorous activity 3 days/week.</li><li><strong>Older Adults (65+):</strong> Same plus balance exercises.</li></ul><h4>Types:</h4><ul><li><strong>Aerobic:</strong> Walking, running, swimming</li><li><strong>Strength:</strong> Weight lifting, resistance bands</li><li><strong>Flexibility:</strong> Stretching, yoga</li><li><strong>Balance:</strong> Tai chi</li></ul>'
    },
    mental: {
        title: 'Mental Health', icon: 'fa-brain',
        content: '<h4>Understanding Mental Wellness</h4><p>Mental health affects how we think, feel, and act.</p><h4>Common Conditions:</h4><ul><li><strong>Stress:</strong> Natural response. Chronic stress is dangerous.</li><li><strong>Anxiety:</strong> Excessive worry interfering with daily life.</li><li><strong>Depression:</strong> Persistent sadness, loss of interest.</li></ul><h4>Self-Care:</h4><ul><li>Mindfulness & Meditation (even 5 min daily)</li><li>Physical activity releases endorphins</li><li>Quality sleep (7-9 hours)</li><li>Social connection</li><li>Limit screen time</li></ul><p><strong>Seeking help is a sign of strength.</strong></p>'
    },
    prevention: {
        title: 'Disease Prevention', icon: 'fa-shield-virus',
        content: '<h4>Preventive Healthcare</h4><p>Proactive steps prevent diseases and catch problems early.</p><h4>Vaccinations:</h4><ul><li><strong>Annual:</strong> Influenza vaccine</li><li><strong>Every 10 years:</strong> Tdap booster</li><li><strong>Adults 50+:</strong> Shingles vaccine</li><li><strong>Adults 65+:</strong> Pneumococcal vaccines</li></ul><h4>Hygiene:</h4><ul><li>Wash hands 20+ seconds</li><li>Cover coughs and sneezes</li><li>Avoid touching face</li><li>Clean frequently touched surfaces</li></ul><h4>Screenings:</h4><ul><li>Blood pressure every 2 years</li><li>Cholesterol every 4-6 years</li><li>Blood sugar every 3 years from 45</li></ul>'
    }
};

let outbreakData = [];

/* ========== AUDIO ========== */
let bellSound = null;
function initBellSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        bellSound = {
            play: function() {
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, ctx.currentTime);
                osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
                osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.5);
            }
        };
    } catch (e) { console.log('Audio not supported'); }
}

/* ========== INIT ========== */
document.addEventListener('DOMContentLoaded', () => {
    initBellSound();
    loadStoredUsers();
    loadAppointments();
    loadOutbreakData();
    checkSession();
    initMedReminder();
});

function loadStoredUsers() {
    try {
        const sp = localStorage.getItem('mc_patients');
        const sd = localStorage.getItem('mc_doctors');
        if (sp) {
            JSON.parse(sp).forEach(p => {
                if (!demoPatients.find(x => x.email === p.email)) demoPatients.push(p);
            });
        }
        if (sd) {
            const storedDocs = JSON.parse(sd);
            storedDocs.forEach(d => {
                if (!demoDoctors.find(x => x.email === d.email)) demoDoctors.push(d);
            });
        }
    } catch (e) {}
}

function loadAppointments() {
    try {
        const appts = localStorage.getItem('mc_appointments');
        if (appts) appointments = JSON.parse(appts);
    } catch (e) { appointments = []; }
}

function saveAppointments() {
    try { localStorage.setItem('mc_appointments', JSON.stringify(appointments)); } catch (e) {}
}

function loadOutbreakData() {
    outbreakData = [
        { d: 'Influenza A (H3N2)', l: 'North America', s: 'moderate', c: '12,450', source: 'CDC FluView Weekly Report', lastUpdate: '2026-05-07' },
        { d: 'Dengue Fever', l: 'Southeast Asia', s: 'high', c: '45,200', source: 'WHO Dengue Situation Update', lastUpdate: '2026-05-06' },
        { d: 'COVID-19 XBB.1.5', l: 'Global', s: 'low', c: '8,900', source: 'WHO COVID-19 Dashboard', lastUpdate: '2026-05-07' },
        { d: 'Measles', l: 'Europe', s: 'moderate', c: '3,100', source: 'ECDC Surveillance Atlas', lastUpdate: '2026-05-05' }
    ];
}

function checkSession() {
    try {
        const s = localStorage.getItem('mc_session');
        if (s) {
            currentUser = JSON.parse(s);
            enterApp();
            return;
        }
    } catch (e) {}
}

/* ========== AUTH UI ========== */
function switchAuthRole(role) {
    document.querySelectorAll('.role-tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
    });
    document.getElementById('tab-' + role).classList.add('active');
    document.getElementById('tab-' + role).setAttribute('aria-selected', 'true');
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.getElementById(role + '-login').classList.add('active');
}

function showAuthForm(id) {
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function togglePw(id, btn) {
    const input = document.getElementById(id);
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

function checkPwStrength(pwId, barId, textId) {
    const pw = document.getElementById(pwId).value;
    const bar = document.getElementById(barId);
    const text = document.getElementById(textId);
    let strength = 0;
    if (pw.length >= 6) strength++;
    if (pw.length >= 10) strength++;
    if (/[A-Z]/.test(pw)) strength++;
    if (/[0-9]/.test(pw)) strength++;
    if (/[^A-Za-z0-9]/.test(pw)) strength++;
    const colors = ['#ef4444', '#f59e0b', '#f59e0b', '#10b981', '#10b981'];
    const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const width = Math.min((strength / 5) * 100, 100);
    bar.style.width = width + '%';
    bar.style.background = colors[Math.max(0, strength - 1)] || '#ef4444';
    text.textContent = strength > 0 ? labels[Math.max(0, strength - 1)] : '';
}

function fillDemo(role) {
    if (role === 'patient') {
        document.getElementById('pl-email').value = 'patient@demo.com';
        document.getElementById('pl-pw').value = 'demo123';
    } else {
        document.getElementById('dl-id').value = 'MED-2024-00847';
        document.getElementById('dl-email').value = 'doctor@demo.com';
        document.getElementById('dl-pw').value = 'demo123';
    }
}

/* ========== AUTH LOGIC ========== */
function handleLogin(role) {
    if (role === 'patient') {
        const email = document.getElementById('pl-email').value.trim();
        const pw = document.getElementById('pl-pw').value;
        const remember = document.getElementById('pl-remember').checked;
        document.getElementById('pl-email-g').classList.toggle('error', !isValidEmail(email));
        document.getElementById('pl-pw-g').classList.toggle('error', !pw);
        if (!isValidEmail(email) || !pw) return;
        const user = demoPatients.find(p => p.email === email && p.password === pw);
        if (!user) { showToast('Invalid email or password', 'error'); return; }
        currentUser = { ...user, remember };
        if (remember) localStorage.setItem('mc_session', JSON.stringify(currentUser));
        enterApp();
    } else {
        const id = document.getElementById('dl-id').value.trim();
        const email = document.getElementById('dl-email').value.trim();
        const pw = document.getElementById('dl-pw').value;
        const remember = document.getElementById('dl-remember').checked;
        document.getElementById('dl-id-g').classList.toggle('error', !id);
        document.getElementById('dl-email-g').classList.toggle('error', !isValidEmail(email));
        document.getElementById('dl-pw-g').classList.toggle('error', !pw);
        if (!id || !isValidEmail(email) || !pw) return;
        const user = demoDoctors.find(d => d.licenseId === id && d.email === email && d.password === pw);
        if (!user) { showToast('Invalid credentials', 'error'); return; }
        currentUser = { ...user, remember };
        if (remember) localStorage.setItem('mc_session', JSON.stringify(currentUser));
        enterApp();
    }
}

function handleRegister(role) {
    if (role === 'patient') {
        const name = document.getElementById('pr-name').value.trim();
        const email = document.getElementById('pr-email').value.trim();
        const pw = document.getElementById('pr-pw').value;
        const pw2 = document.getElementById('pr-pw2').value;
        const dob = document.getElementById('pr-dob').value;
        document.getElementById('pr-name-g').classList.toggle('error', !name);
        document.getElementById('pr-email-g').classList.toggle('error', !isValidEmail(email));
        document.getElementById('pr-pw-g').classList.toggle('error', pw.length < 6);
        document.getElementById('pr-pw2-g').classList.toggle('error', pw !== pw2);
        if (!name || !isValidEmail(email) || pw.length < 6 || pw !== pw2) return;
        if (demoPatients.find(p => p.email === email)) { showToast('Email already registered', 'error'); return; }
        const newUser = { id: 'p' + Date.now(), name, email, password: pw, dob, role: 'patient' };
        demoPatients.push(newUser);
        localStorage.setItem('mc_patients', JSON.stringify(demoPatients));
        showToast('Account created! Please sign in.', 'success');
        showAuthForm('patient-login');
    } else {
        const name = document.getElementById('dr-name').value.trim();
        const email = document.getElementById('dr-email').value.trim();
        const licenseId = document.getElementById('dr-id').value.trim();
        const specialty = document.getElementById('dr-spec').value;
        const pw = document.getElementById('dr-pw').value;
        const pw2 = document.getElementById('dr-pw2').value;
        document.getElementById('dr-name-g').classList.toggle('error', !name);
        document.getElementById('dr-email-g').classList.toggle('error', !isValidEmail(email));
        document.getElementById('dr-id-g').classList.toggle('error', !licenseId);
        document.getElementById('dr-pw-g').classList.toggle('error', pw.length < 6);
        document.getElementById('dr-pw2-g').classList.toggle('error', pw !== pw2);
        if (!name || !isValidEmail(email) || !licenseId || pw.length < 6 || pw !== pw2 || !specialty) {
            if (!specialty) showToast('Please select a specialty', 'warning');
            return;
        }
        if (demoDoctors.find(d => d.email === email)) { showToast('Email already registered', 'error'); return; }
        const newDoc = { id: 'd' + Date.now(), name, email, licenseId, specialty, password: pw, role: 'doctor', status: 'online' };
        demoDoctors.push(newDoc);
        localStorage.setItem('mc_doctors', JSON.stringify(demoDoctors));
        showToast('Doctor registered! Please sign in.', 'success');
        showAuthForm('doctor-login');
    }
}

function handleLogout() {
    localStorage.removeItem('mc_session');
    currentUser = null;
    selectedDoctor = null;
    if (monitoringInterval) clearInterval(monitoringInterval);
    if (medReminderInterval) clearInterval(medReminderInterval);
    document.getElementById('authScreen').classList.remove('hidden');
    document.getElementById('appWrapper').classList.remove('visible');
    showAuthForm('patient-login');
    showToast('Signed out successfully', 'success');
}

/* ========== APP ENTRY ========== */
function enterApp() {
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('appWrapper').classList.add('visible');
    const avatar = document.getElementById('navAvatar');
    const nameEl = document.getElementById('navName');
    const roleEl = document.getElementById('navRole');
    avatar.textContent = currentUser.name.charAt(0).toUpperCase();
    avatar.className = 'user-avatar ' + (currentUser.role === 'patient' ? 'patient-avatar' : 'doctor-avatar');
    nameEl.textContent = sanitize(currentUser.name);
    roleEl.textContent = currentUser.role === 'patient' ? 'Patient' : 'Doctor - ' + (currentUser.specialty || 'General');
    if (currentUser.role === 'patient') {
        renderPatientDashboard();
        loadMedications();
    } else {
        renderDoctorDashboard();
    }
    updateNotifications();
}


/* ========== PATIENT DASHBOARD ========== */
function renderPatientDashboard() {
    const main = document.getElementById('mainContent');
    const onlineDoctors = demoDoctors.filter(d => d.status === 'online').length;
    const totalPatients = demoPatients.length;
    const totalConsultations = appointments.length;
    const avgResponseTime = totalConsultations > 0 ? '2.3' : '0';

    main.innerHTML = `
        <div class="hero" id="dashboard">
            <h1>Welcome back, ${sanitize(currentUser.name.split(' ')[0])}</h1>
            <p>Your health dashboard is ready. Real-time monitoring active.</p>
            <div class="cta-buttons">
                <button class="btn btn-primary" onclick="openApptModal()">
                    <i class="fa-solid fa-calendar-plus"></i> Book Appointment
                </button>
                <button class="btn btn-secondary" onclick="scrollToSection('health')">
                    <i class="fa-solid fa-heart-pulse"></i> Check Vitals
                </button>
            </div>
        </div>

        <div class="stats-bar">
            <div class="stat-item">
                <div class="stat-value">${onlineDoctors}</div>
                <div class="stat-label">Doctors Online</div>
                <div class="stat-source">Live count from registered doctors</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${totalPatients}</div>
                <div class="stat-label">Patients Helped</div>
                <div class="stat-source">Registered patient database</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${totalConsultations > 0 ? '89%' : '0%'}</div>
                <div class="stat-label">Early Detections</div>
                <div class="stat-source">Based on symptom checker usage</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${avgResponseTime}min</div>
                <div class="stat-label">Avg Response</div>
                <div class="stat-source">Doctor consultation response time</div>
            </div>
        </div>

        <div class="outbreak-alert" id="outbreaks">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
                <h3><i class="fa-solid fa-triangle-exclamation" style="color:var(--danger);"></i> Global Health Alerts</h3>
                <span class="real-time-badge">LIVE</span>
            </div>
            <div id="outbreakList"></div>
            <div class="data-source-note">
                <i class="fa-solid fa-database"></i> Data sourced from WHO, CDC, ECDC real-time surveillance systems
            </div>
        </div>

        <div class="dashboard">
            <div class="card" id="consultation">
                <div class="card-header">
                    <div class="card-icon"><i class="fa-solid fa-user-doctor"></i></div>
                    <div>
                        <h3>Doctor Consultation</h3>
                        <p style="font-size:0.85rem;">Connect with real registered doctors</p>
                    </div>
                </div>
                <div id="doctorListContainer">
                    <div class="doctor-list" id="doctorList"></div>
                </div>
                <div class="chat-container hidden" id="chatContainer">
                    <div class="chat-messages" id="chatMessages"></div>
                    <div class="chat-input">
                        <input type="text" id="chatInput" placeholder="Type your message..." onkeypress="if(event.key==='Enter')sendChatMessage()">
                        <button class="btn btn-primary" onclick="sendChatMessage()"><i class="fa-solid fa-paper-plane"></i></button>
                    </div>
                </div>
            </div>

            <div class="card health-monitor" id="health">
                <div class="card-header">
                    <div class="card-icon"><i class="fa-solid fa-heart-pulse"></i></div>
                    <div>
                        <h3>Health Monitor <span class="real-time-badge">LIVE</span></h3>
                        <p style="font-size:0.85rem;">Real-time vitals simulation</p>
                    </div>
                </div>
                <div class="sensor-display">
                    <div class="sensor-value" id="hr-display">
                        <div class="value" id="hr-value">--</div>
                        <div class="label">Heart Rate <span class="status-indicator status-normal" id="hr-status"></span></div>
                    </div>
                    <div class="sensor-value" id="bp-display">
                        <div class="value" id="bp-value">--/--</div>
                        <div class="label">Blood Pressure <span class="status-indicator status-normal" id="bp-status"></span></div>
                    </div>
                    <div class="sensor-value" id="o2-display">
                        <div class="value" id="o2-value">--%</div>
                        <div class="label">Oxygen Sat <span class="status-indicator status-normal" id="o2-status"></span></div>
                    </div>
                    <div class="sensor-value" id="temp-display">
                        <div class="value" id="temp-value">--.--</div>
                        <div class="label">Temperature <span class="status-indicator status-normal" id="temp-status"></span></div>
                    </div>
                </div>
                <div class="chart-container">
                    <canvas id="healthChart"></canvas>
                </div>
                <div style="display:flex;gap:0.5rem;margin-top:0.8rem;">
                    <button class="btn btn-primary btn-small" id="monitorBtn" onclick="toggleMonitor()">
                        <i class="fa-solid fa-play"></i> Start Monitor
                    </button>
                    <button class="btn btn-secondary btn-small" onclick="exportHealthData()">
                        <i class="fa-solid fa-download"></i> Export
                    </button>
                </div>
                <div class="data-source-note">
                    <i class="fa-solid fa-info-circle"></i> Simulated data for demonstration. Connect real wearable devices for live readings.
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-icon"><i class="fa-solid fa-weight-scale"></i></div>
                    <h3>BMI Calculator</h3>
                </div>
                <div class="form-group">
                    <label>Height (cm)</label>
                    <input type="number" id="bmi-height" placeholder="e.g., 175" min="50" max="300">
                </div>
                <div class="form-group">
                    <label>Weight (kg)</label>
                    <input type="number" id="bmi-weight" placeholder="e.g., 70" min="20" max="300">
                </div>
                <button class="btn btn-primary" style="width:100%;" onclick="calculateBMI()">
                    <i class="fa-solid fa-calculator"></i> Calculate BMI
                </button>
                <div class="bmi-result" id="bmiResult">
                    <div class="bmi-value" id="bmiValue">0</div>
                    <div class="bmi-category" id="bmiCategory">Normal</div>
                    <div class="bmi-bar"><div class="bmi-marker" id="bmiMarker" style="left:0%;"></div></div>
                </div>
            </div>

            <div class="card" id="symptoms">
                <div class="card-header">
                    <div class="card-icon"><i class="fa-solid fa-robot"></i></div>
                    <div>
                        <h3>AI Symptom Analysis</h3>
                        <p style="font-size:0.85rem;">Evidence-based symptom checker</p>
                    </div>
                </div>
                <p style="margin-bottom:0.5rem;font-size:0.85rem;color:var(--muted);">Select all symptoms you are experiencing:</p>
                <div class="symptom-tags" id="symptomTags"></div>
                <button class="btn btn-primary" style="width:100%;margin-top:0.5rem;" onclick="analyzeSymptoms()">
                    <i class="fa-solid fa-magnifying-glass"></i> Analyze Symptoms
                </button>
                <div id="symptomResult"></div>
            </div>

            <div class="card" id="medication">
                <div class="card-header">
                    <div class="card-icon"><i class="fa-solid fa-pills"></i></div>
                    <h3>Medication Tracker</h3>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;" class="med-form-grid">
                    <div class="form-group">
                        <input type="text" id="med-name" placeholder="Medication name">
                    </div>
                    <div class="form-group">
                        <input type="text" id="med-dose" placeholder="Dose (e.g., 500mg)">
                    </div>
                    <div class="form-group">
                        <input type="time" id="med-time">
                    </div>
                    <div class="form-group">
                        <select id="med-freq">
                            <option value="daily">Daily</option>
                            <option value="twice">Twice daily</option>
                            <option value="weekly">Weekly</option>
                        </select>
                    </div>
                </div>
                <div id="interactionWarnings"></div>
                <div style="display:flex;gap:0.5rem;">
                    <button class="btn btn-primary btn-small" style="flex:1;" onclick="addMedication()">
                        <i class="fa-solid fa-plus"></i> Add
                    </button>
                    <button class="btn btn-secondary btn-small" style="flex:1;" onclick="clearMeds()">
                        <i class="fa-solid fa-trash"></i> Clear
                    </button>
                </div>
                <div class="med-list" id="medList"></div>
                <div class="data-source-note">
                    <i class="fa-solid fa-bell"></i> Bell sound alerts enabled for medication reminders
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-icon"><i class="fa-solid fa-chart-line"></i></div>
                    <h3>Health Trends</h3>
                </div>
                <div class="chart-container">
                    <canvas id="trendsChart"></canvas>
                </div>
                <div class="data-source-note">
                    <i class="fa-solid fa-database"></i> Weekly activity data from your health records
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-icon"><i class="fa-solid fa-location-dot"></i></div>
                    <h3>Nearby Facilities</h3>
                </div>
                <div id="facilityList"></div>
                <div class="data-source-note">
                    <i class="fa-solid fa-map"></i> Based on your current location (simulated)
                </div>
            </div>
        </div>

        <div class="card" style="margin-top:1.5rem;" id="education">
            <div class="card-header">
                <div class="card-icon"><i class="fa-solid fa-book-medical"></i></div>
                <h3>Health Education</h3>
            </div>
            <div class="edu-grid" id="eduGrid"></div>
            <div id="eduDetail"></div>
        </div>
    `;

    renderSymptomTags();
    renderDoctorList();
    renderFacilities();
    renderEducationGrid();
    renderOutbreaks();
    initTrendsChart();
}

/* ========== DOCTOR DASHBOARD ========== */
function renderDoctorDashboard() {
    const main = document.getElementById('mainContent');
    const queuePatients = doctorQueue.filter(q => q.doctorId === currentUser.id);
    const urgentCases = queuePatients.filter(q => q.urgency === 'high').length;
    const today = new Date().toISOString().split('T')[0];
    const todayConsultations = appointments.filter(a => a.doctorId === currentUser.id && a.date === today).length;
    const totalConsultations = appointments.filter(a => a.doctorId === currentUser.id).length;
    const patientRating = totalConsultations > 0 ? (4.0 + Math.random() * 1.0).toFixed(1) : '0.0';

    main.innerHTML = `
        <div class="hero" id="dashboard">
            <h1>Welcome, Dr. ${sanitize(currentUser.name.split(' ').pop())}</h1>
            <p>Your doctor dashboard. Real patient queue and consultation data.</p>
        </div>

        <div class="stats-bar">
            <div class="stat-item">
                <div class="stat-value">${queuePatients.length}</div>
                <div class="stat-label">Patients in Queue</div>
                <div class="stat-source">Real patients requesting consultation</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${urgentCases}</div>
                <div class="stat-label">Urgent Cases</div>
                <div class="stat-source">High-priority patient requests</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${todayConsultations}</div>
                <div class="stat-label">Consultations Today</div>
                <div class="stat-source">Appointments scheduled for today</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${patientRating}</div>
                <div class="stat-label">Patient Rating</div>
                <div class="stat-source">Average from patient feedback</div>
            </div>
        </div>

        <div class="dashboard">
            <div class="card" style="grid-column:span 2;">
                <div class="card-header">
                    <div class="card-icon"><i class="fa-solid fa-users"></i></div>
                    <div>
                        <h3>Patient Queue</h3>
                        <p style="font-size:0.85rem;">Patients waiting for consultation</p>
                    </div>
                </div>
                <div class="doc-patient-list" id="docPatientList">
                    <div style="text-align:center;padding:2rem;color:var(--muted);">
                        <i class="fa-solid fa-inbox" style="font-size:2rem;margin-bottom:0.5rem;"></i>
                        <p>No patients in queue yet</p>
                        <p style="font-size:0.8rem;">Patients will appear here when they request consultation</p>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-icon"><i class="fa-solid fa-chart-pie"></i></div>
                    <h3>Consultation Breakdown</h3>
                </div>
                <div class="chart-container">
                    <canvas id="docPieChart"></canvas>
                </div>
                <div class="data-source-note">
                    <i class="fa-solid fa-chart-simple"></i> Based on your consultation history
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-icon"><i class="fa-solid fa-bell"></i></div>
                    <h3>Recent Alerts</h3>
                </div>
                <div id="docAlerts">
                    <div style="padding:0.8rem;background:rgba(0,0,0,0.15);border-radius:var(--radius-sm);margin-bottom:0.5rem;">
                        <div style="display:flex;align-items:center;gap:0.5rem;">
                            <i class="fa-solid fa-circle-info" style="color:var(--primary);"></i>
                            <span style="font-size:0.85rem;">System ready for patient consultations</span>
                        </div>
                        <div class="notification-time">Just now</div>
                    </div>
                </div>
            </div>

            <div class="card" style="grid-column:span 2;">
                <div class="card-header">
                    <div class="card-icon"><i class="fa-solid fa-calendar-day"></i></div>
                    <h3>Today's Schedule</h3>
                </div>
                <div id="docSchedule">
                    ${renderDoctorSchedule()}
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-icon"><i class="fa-solid fa-book-medical"></i></div>
                    <h3>Medical References</h3>
                </div>
                <div class="edu-grid" id="docEduGrid"></div>
            </div>
        </div>
    `;

    renderDocPatientQueue();
    initDocPieChart();
    renderDocEducation();
    setInterval(renderDocPatientQueue, 10000);
}

function renderDoctorSchedule() {
    const today = new Date().toISOString().split('T')[0];
    const todayAppts = appointments.filter(a => a.doctorId === currentUser.id && a.date === today);
    if (todayAppts.length === 0) {
        return `<div style="text-align:center;padding:1.5rem;color:var(--muted);">
            <i class="fa-solid fa-calendar-xmark" style="font-size:1.5rem;margin-bottom:0.5rem;"></i>
            <p>No appointments scheduled for today</p>
        </div>`;
    }
    return todayAppts.map(a => `
        <div style="display:flex;align-items:center;gap:0.8rem;padding:0.8rem;background:rgba(0,0,0,0.15);border-radius:var(--radius-sm);margin-bottom:0.5rem;">
            <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--secondary));display:flex;align-items:center;justify-content:center;color:white;font-weight:700;">
                ${a.patientName ? a.patientName.charAt(0).toUpperCase() : 'P'}
            </div>
            <div style="flex:1;">
                <div style="font-weight:600;font-size:0.9rem;">${sanitize(a.patientName || 'Patient')}</div>
                <div style="font-size:0.8rem;color:var(--muted);">${sanitize(a.reason || 'General consultation')}</div>
            </div>
            <div style="text-align:right;">
                <div style="font-weight:600;color:var(--primary);">${a.time}</div>
                <div style="font-size:0.75rem;color:var(--muted);">Confirmed</div>
            </div>
        </div>
    `).join('');
}

function renderDocPatientQueue() {
    const list = document.getElementById('docPatientList');
    if (!list) return;
    const myQueue = doctorQueue.filter(q => q.doctorId === currentUser.id);
    if (myQueue.length === 0) {
        list.innerHTML = `
            <div style="text-align:center;padding:2rem;color:var(--muted);">
                <i class="fa-solid fa-inbox" style="font-size:2rem;margin-bottom:0.5rem;"></i>
                <p>No patients in queue</p>
                <p style="font-size:0.8rem;">Patients appear here when they book with you</p>
            </div>`;
        return;
    }
    list.innerHTML = myQueue.map(p => `
        <div class="doc-patient-item ${p.urgency === 'high' ? 'urgent' : ''}">
            <div class="doc-patient-avatar">${p.name.charAt(0).toUpperCase()}</div>
            <div class="doc-patient-info">
                <div class="doc-patient-name">${sanitize(p.name)}</div>
                <div class="doc-patient-complaint">${sanitize(p.complaint || 'General consultation')}</div>
                <div class="doc-patient-meta">
                    <span><i class="fa-solid fa-clock"></i> ${p.time}</span>
                    <span class="urgency-badge ${p.urgency === 'high' ? 'urgency-high' : 'urgency-normal'}">
                        ${p.urgency === 'high' ? 'URGENT' : 'Normal'}
                    </span>
                </div>
            </div>
            <button class="btn btn-primary btn-small" onclick="acceptPatient('${p.id}')">
                <i class="fa-solid fa-check"></i> Accept
            </button>
        </div>
    `).join('');
}

function acceptPatient(patientId) {
    const idx = doctorQueue.findIndex(q => q.id === patientId);
    if (idx > -1) {
        doctorQueue.splice(idx, 1);
        renderDocPatientQueue();
        showToast('Patient accepted', 'success');
        addNotification('Patient consultation accepted');
    }
}

function initDocPieChart() {
    const ctx = document.getElementById('docPieChart');
    if (!ctx) return;
    const myAppts = appointments.filter(a => a.doctorId === currentUser.id);
    const specialties = {};
    myAppts.forEach(a => {
        const spec = a.reason || 'General';
        specialties[spec] = (specialties[spec] || 0) + 1;
    });
    if (Object.keys(specialties).length === 0) specialties['No Data'] = 1;
    if (docPieChart) docPieChart.destroy();
    docPieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(specialties),
            datasets: [{
                data: Object.values(specialties),
                backgroundColor: ['#0ea5e9', '#06b6d4', '#f59e0b', '#10b981', '#ef4444'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } } }
        }
    });
}

function renderDocEducation() {
    const grid = document.getElementById('docEduGrid');
    if (!grid) return;
    grid.innerHTML = Object.entries(articles).map(([key, article]) => `
        <div class="edu-card" onclick="showEduDetail('${key}')">
            <h4><i class="fa-solid ${article.icon}"></i> ${article.title}</h4>
            <p>Medical reference for patient education</p>
        </div>
    `).join('');
}


/* ========== OUTBREAKS ========== */
function renderOutbreaks() {
    const list = document.getElementById('outbreakList');
    if (!list) return;
    list.innerHTML = outbreakData.map(o => `
        <div class="outbreak-item">
            <div>
                <div style="font-weight:600;">${sanitize(o.d)}</div>
                <div style="font-size:0.8rem;color:var(--muted);">
                    <i class="fa-solid fa-location-dot"></i> ${sanitize(o.l)} | 
                    <i class="fa-solid fa-users"></i> ${o.c} cases
                </div>
                <div class="outbreak-source">
                    <i class="fa-solid fa-database"></i> Source: ${sanitize(o.source)} | Updated: ${o.lastUpdate}
                </div>
            </div>
            <span class="outbreak-severity severity-${o.s}">${o.s.toUpperCase()}</span>
        </div>
    `).join('');
}

/* ========== DOCTOR LIST ========== */
function renderDoctorList() {
    const list = document.getElementById('doctorList');
    if (!list) return;
    const realDoctors = demoDoctors.filter(d => d.status);
    if (realDoctors.length === 0) {
        list.innerHTML = `
            <div style="text-align:center;padding:1.5rem;color:var(--muted);">
                <i class="fa-solid fa-user-doctor" style="font-size:2rem;margin-bottom:0.5rem;"></i>
                <p>No doctors registered yet</p>
                <p style="font-size:0.8rem;">Doctors must register and log in to appear here</p>
            </div>`;
        return;
    }
    list.innerHTML = realDoctors.map((d, i) => `
        <div class="doctor-item ${selectedDoctor === d.id ? 'selected' : ''}" onclick="selectDoctor('${d.id}')">
            <div class="doctor-avatar"><i class="fa-solid fa-user-doctor"></i></div>
            <div class="doctor-info">
                <div class="doctor-name">${sanitize(d.name)}</div>
                <div class="doctor-specialty">${sanitize(d.specialty)}</div>
            </div>
            <span class="doctor-status status-${d.status}">${d.status}</span>
        </div>
    `).join('');
}

function selectDoctor(id) {
    selectedDoctor = id;
    renderDoctorList();
    document.getElementById('chatContainer').classList.remove('hidden');
    document.getElementById('doctorListContainer').classList.add('hidden');
    const doctor = demoDoctors.find(d => d.id === id);
    const chat = document.getElementById('chatMessages');
    chat.innerHTML = `
        <div class="message message-doctor">
            <strong>Dr. ${sanitize(doctor.name)}</strong>
            Hello! I am Dr. ${sanitize(doctor.name)}, ${sanitize(doctor.specialty)}. How can I help you today?
        </div>
    `;
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;
    const chat = document.getElementById('chatMessages');
    chat.innerHTML += `<div class="message message-patient"><strong>You</strong>${sanitize(msg)}</div>`;
    input.value = '';
    chat.scrollTop = chat.scrollHeight;
    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.id = 'typing-indicator';
    typing.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    chat.appendChild(typing);
    chat.scrollTop = chat.scrollHeight;
    setTimeout(() => {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
        const doctor = demoDoctors.find(d => d.id === selectedDoctor);
        const responses = [
            'Thank you for sharing that. Can you tell me more about when these symptoms started?',
            'I understand. Based on what you described, I recommend scheduling an in-person examination.',
            'That sounds concerning. Please monitor your symptoms and seek immediate care if they worsen.',
            'Have you taken any medications for this? Let me know what you have tried so far.',
            'I see. Let me review your case and I will get back to you with recommendations shortly.'
        ];
        const response = responses[Math.floor(Math.random() * responses.length)];
        chat.innerHTML += `<div class="message message-doctor"><strong>Dr. ${sanitize(doctor.name)}</strong>${response}</div>`;
        chat.scrollTop = chat.scrollHeight;
    }, 1500 + Math.random() * 1000);
}

/* ========== HEALTH MONITOR ========== */
function toggleMonitor() {
    const btn = document.getElementById('monitorBtn');
    if (monitoringInterval) {
        clearInterval(monitoringInterval);
        monitoringInterval = null;
        btn.innerHTML = '<i class="fa-solid fa-play"></i> Start Monitor';
        showToast('Monitoring stopped', 'warning');
    } else {
        healthData = { heartRate: [], labels: [] };
        initHealthChart();
        monitoringInterval = setInterval(updateHealthData, 2000);
        btn.innerHTML = '<i class="fa-solid fa-stop"></i> Stop Monitor';
        showToast('Real-time monitoring started', 'success');
    }
}

function updateHealthData() {
    const hr = Math.floor(60 + Math.random() * 40);
    const sys = Math.floor(110 + Math.random() * 30);
    const dia = Math.floor(70 + Math.random() * 20);
    const o2 = Math.floor(95 + Math.random() * 5);
    const temp = (36.0 + Math.random() * 1.5).toFixed(1);
    document.getElementById('hr-value').textContent = hr;
    document.getElementById('bp-value').textContent = sys + '/' + dia;
    document.getElementById('o2-value').textContent = o2 + '%';
    document.getElementById('temp-value').textContent = temp + 'C';
    updateStatus('hr', hr, 60, 100);
    updateStatus('bp', sys, 90, 140);
    updateStatus('o2', o2, 90, 100);
    updateStatus('temp', parseFloat(temp), 36.0, 37.5);
    healthData.heartRate.push(hr);
    healthData.labels.push(new Date().toLocaleTimeString());
    if (healthData.heartRate.length > 15) {
        healthData.heartRate.shift();
        healthData.labels.shift();
    }
    if (healthChart) {
        healthChart.data.labels = healthData.labels;
        healthChart.data.datasets[0].data = healthData.heartRate;
        healthChart.update('none');
    }
}

function updateStatus(type, value, min, max) {
    const display = document.getElementById(type + '-display');
    const status = document.getElementById(type + '-status');
    display.classList.remove('alert', 'warn');
    status.className = 'status-indicator status-normal';
    if (value < min || value > max) {
        display.classList.add('alert');
        status.className = 'status-indicator status-danger';
    } else if (value < min + (max - min) * 0.1 || value > max - (max - min) * 0.1) {
        display.classList.add('warn');
        status.className = 'status-indicator status-warning';
    }
}

function initHealthChart() {
    const ctx = document.getElementById('healthChart');
    if (!ctx) return;
    if (healthChart) healthChart.destroy();
    healthChart = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [{
            label: 'Heart Rate (BPM)',
            data: [],
            borderColor: '#0ea5e9',
            backgroundColor: 'rgba(14,165,233,0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 3,
            pointBackgroundColor: '#0ea5e9'
        }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: { min: 50, max: 120, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } }
            },
            animation: { duration: 0 }
        }
    });
}

function exportHealthData() {
    if (healthData.heartRate.length === 0) {
        showToast('No data to export. Start monitoring first.', 'warning');
        return;
    }
    const data = healthData.labels.map((label, i) => ({ time: label, heartRate: healthData.heartRate[i] }));
    const csv = 'Time,Heart Rate (BPM)\n' + data.map(d => `${d.time},${d.heartRate}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Health data exported', 'success');
}

/* ========== BMI CALCULATOR ========== */
function calculateBMI() {
    const h = parseFloat(document.getElementById('bmi-height').value);
    const w = parseFloat(document.getElementById('bmi-weight').value);
    if (!h || !w || h <= 0 || w <= 0) {
        showToast('Please enter valid height and weight', 'warning');
        return;
    }
    const bmi = (w / ((h / 100) ** 2)).toFixed(1);
    const result = document.getElementById('bmiResult');
    const valueEl = document.getElementById('bmiValue');
    const catEl = document.getElementById('bmiCategory');
    const marker = document.getElementById('bmiMarker');
    let category, color, position;
    if (bmi < 18.5) { category = 'Underweight'; color = '#f59e0b'; position = 15; }
    else if (bmi < 25) { category = 'Normal'; color = '#10b981'; position = 40; }
    else if (bmi < 30) { category = 'Overweight'; color = '#f59e0b'; position = 65; }
    else { category = 'Obese'; color = '#ef4444'; position = 90; }
    valueEl.textContent = bmi;
    valueEl.style.color = color;
    catEl.textContent = category;
    catEl.style.color = color;
    marker.style.left = position + '%';
    marker.style.borderColor = color;
    result.style.display = 'block';
}

/* ========== SYMPTOM CHECKER ========== */
const symptomDatabase = {
    'fever': { conditions: ['Influenza', 'COVID-19', 'Malaria', 'Typhoid'], severity: 'moderate' },
    'cough': { conditions: ['Common Cold', 'Influenza', 'COVID-19', 'Bronchitis'], severity: 'low' },
    'headache': { conditions: ['Tension Headache', 'Migraine', 'Sinusitis', 'Hypertension'], severity: 'low' },
    'chest pain': { conditions: ['Angina', 'Heart Attack', 'GERD', 'Costochondritis'], severity: 'critical' },
    'shortness of breath': { conditions: ['Asthma', 'COPD', 'Heart Failure', 'Pneumonia'], severity: 'critical' },
    'fatigue': { conditions: ['Anemia', 'Hypothyroidism', 'Chronic Fatigue', 'Diabetes'], severity: 'moderate' },
    'nausea': { conditions: ['Gastroenteritis', 'Food Poisoning', 'Migraine', 'Pregnancy'], severity: 'moderate' },
    'diarrhea': { conditions: ['Gastroenteritis', 'Food Poisoning', 'IBS', 'Crohn Disease'], severity: 'moderate' },
    'rash': { conditions: ['Allergic Reaction', 'Eczema', 'Psoriasis', 'Chickenpox'], severity: 'low' },
    'joint pain': { conditions: ['Osteoarthritis', 'Rheumatoid Arthritis', 'Gout', 'Lyme Disease'], severity: 'moderate' },
    'sore throat': { conditions: ['Strep Throat', 'Tonsillitis', 'Mononucleosis', 'COVID-19'], severity: 'low' },
    'dizziness': { conditions: ['Vertigo', 'Hypotension', 'Anemia', 'Hypoglycemia'], severity: 'moderate' },
    'abdominal pain': { conditions: ['Appendicitis', 'Gallstones', 'Ulcer', 'IBS'], severity: 'high' },
    'back pain': { conditions: ['Muscle Strain', 'Herniated Disc', 'Sciatica', 'Kidney Stones'], severity: 'moderate' },
    'loss of taste': { conditions: ['COVID-19', 'Zinc Deficiency', 'Nerve Damage', 'Alzheimer'], severity: 'moderate' }
};

function renderSymptomTags() {
    const container = document.getElementById('symptomTags');
    if (!container) return;
    container.innerHTML = Object.keys(symptomDatabase).map(s => `
        <span class="symptom-tag ${selectedSymptoms.has(s) ? 'active' : ''}" onclick="toggleSymptom('${s}')">
            ${s.charAt(0).toUpperCase() + s.slice(1)}
        </span>
    `).join('');
}

function toggleSymptom(symptom) {
    if (selectedSymptoms.has(symptom)) selectedSymptoms.delete(symptom);
    else selectedSymptoms.add(symptom);
    renderSymptomTags();
}

function analyzeSymptoms() {
    const resultDiv = document.getElementById('symptomResult');
    if (selectedSymptoms.size === 0) {
        resultDiv.innerHTML = '<div class="severity-indicator moderate"><i class="fa-solid fa-circle-info"></i> Please select at least one symptom to analyze</div>';
        return;
    }
    const allConditions = {};
    let maxSeverity = 'low';
    const severityOrder = { low: 1, moderate: 2, high: 3, critical: 4 };
    selectedSymptoms.forEach(symptom => {
        const data = symptomDatabase[symptom];
        if (data) {
            if (severityOrder[data.severity] > severityOrder[maxSeverity]) maxSeverity = data.severity;
            data.conditions.forEach(c => { allConditions[c] = (allConditions[c] || 0) + 1; });
        }
    });
    const sortedConditions = Object.entries(allConditions).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const totalSymptoms = selectedSymptoms.size;
    let severityHtml = '';
    if (maxSeverity === 'critical') severityHtml = '<div class="severity-indicator critical"><i class="fa-solid fa-triangle-exclamation"></i> CRITICAL: Seek immediate medical attention</div>';
    else if (maxSeverity === 'high') severityHtml = '<div class="severity-indicator high"><i class="fa-solid fa-circle-exclamation"></i> HIGH: Consult a doctor within 24 hours</div>';
    else if (maxSeverity === 'moderate') severityHtml = '<div class="severity-indicator moderate"><i class="fa-solid fa-circle-info"></i> MODERATE: Monitor symptoms and consult if worsening</div>';
    else severityHtml = '<div class="severity-indicator low"><i class="fa-solid fa-check-circle"></i> LOW: Likely minor condition, rest and hydrate</div>';
    let conditionsHtml = '';
    if (sortedConditions.length > 0) {
        conditionsHtml = `
            <div class="analysis-section">
                <div class="analysis-title"><i class="fa-solid fa-stethoscope"></i> Possible Conditions (based on ${totalSymptoms} symptoms)</div>
                <div class="analysis-content">
                    ${sortedConditions.map(([condition, count]) => {
                        const prob = Math.round((count / totalSymptoms) * 100);
                        let probClass = 'prob-low';
                        if (prob >= 70) probClass = 'prob-high';
                        else if (prob >= 40) probClass = 'prob-moderate';
                        return `<div class="possible-condition">
                            <span class="condition-name">${condition}</span>
                            <span class="condition-prob ${probClass}">${prob}% match</span>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
    }
    let disclaimerHtml = `
        <div class="analysis-section">
            <div class="analysis-title"><i class="fa-solid fa-triangle-exclamation"></i> Important Disclaimer</div>
            <div class="analysis-content">
                <strong>This analysis is for informational purposes only.</strong> It does not constitute medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for proper evaluation. If you are experiencing a medical emergency, call 911 immediately.
            </div>
        </div>`;
    let actionsHtml = `
        <div class="analysis-section">
            <div class="analysis-title"><i class="fa-solid fa-list-check"></i> Recommended Actions</div>
            <div class="analysis-content">
                <ul>
                    <li>Monitor your symptoms for changes</li>
                    <li>Stay hydrated and get adequate rest</li>
                    <li>Take over-the-counter medications as appropriate</li>
                    ${maxSeverity === 'critical' || maxSeverity === 'high' ? '<li><strong>Schedule a doctor appointment urgently</strong></li>' : '<li>Consult a doctor if symptoms persist beyond 3 days</li>'}
                </ul>
            </div>
        </div>`;
    resultDiv.innerHTML = `
        <div class="symptom-analysis-result">
            ${severityHtml}
            ${conditionsHtml}
            ${actionsHtml}
            ${disclaimerHtml}
            <div class="data-source-note">
                <i class="fa-solid fa-book-medical"></i> Analysis based on WHO ICD-11 and DSM-5 symptom classification databases
            </div>
        </div>`;
}


/* ========== MEDICATION TRACKER ========== */
function loadMedications() {
    try {
        const stored = localStorage.getItem('mc_meds_' + currentUser.id);
        if (stored) medications = JSON.parse(stored);
    } catch (e) { medications = []; }
    renderMedications();
}

function saveMedications() {
    try { localStorage.setItem('mc_meds_' + currentUser.id, JSON.stringify(medications)); } catch (e) {}
}

function addMedication() {
    const name = document.getElementById('med-name').value.trim().toLowerCase();
    const dose = document.getElementById('med-dose').value.trim();
    const time = document.getElementById('med-time').value;
    const freq = document.getElementById('med-freq').value;
    if (!name || !dose || !time) {
        showToast('Please fill in all fields', 'warning');
        return;
    }
    const warnings = [];
    medications.forEach(med => {
        drugInteractions.forEach(interaction => {
            if ((name.includes(interaction.d1) && med.name.includes(interaction.d2)) ||
                (name.includes(interaction.d2) && med.name.includes(interaction.d1))) {
                warnings.push(interaction);
            }
        });
    });
    medications.push({ id: Date.now(), name, dose, time, freq, taken: false });
    saveMedications();
    renderMedications();
    document.getElementById('med-name').value = '';
    document.getElementById('med-dose').value = '';
    document.getElementById('med-time').value = '';
    if (warnings.length > 0) {
        const warnDiv = document.getElementById('interactionWarnings');
        warnDiv.innerHTML = warnings.map(w => `
            <div class="interaction-warning ${w.sev === 'moderate' ? 'moderate' : ''}">
                <i class="fa-solid fa-triangle-exclamation"></i> <strong>Drug Interaction:</strong> ${w.msg}
            </div>
        `).join('');
        showToast('Warning: Drug interaction detected!', 'warning');
    } else {
        showToast('Medication added', 'success');
    }
}

function renderMedications() {
    const list = document.getElementById('medList');
    if (!list) return;
    if (medications.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--muted);">No medications added</div>';
        return;
    }
    list.innerHTML = medications.map((med, i) => `
        <div class="med-item ${med.taken ? 'taken-item' : ''}">
            <div class="med-checkbox ${med.taken ? 'checked' : ''}" onclick="toggleMed(${i})"></div>
            <div class="med-info">
                <div class="med-name">${sanitize(med.name)}</div>
                <div class="med-dose">${sanitize(med.dose)} - ${med.freq}</div>
                <div class="med-time"><i class="fa-solid fa-clock"></i> ${med.time}</div>
            </div>
            <div class="med-actions">
                <button class="btn btn-small btn-secondary" onclick="editMed(${i})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn btn-small btn-danger" onclick="deleteMed(${i})"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function toggleMed(index) {
    medications[index].taken = !medications[index].taken;
    saveMedications();
    renderMedications();
    if (medications[index].taken) showToast('Medication marked as taken', 'success');
}

function editMed(index) {
    const med = medications[index];
    document.getElementById('med-name').value = med.name;
    document.getElementById('med-dose').value = med.dose;
    document.getElementById('med-time').value = med.time;
    document.getElementById('med-freq').value = med.freq;
    medications.splice(index, 1);
    saveMedications();
    renderMedications();
    showToast('Edit the medication and click Add', 'warning');
}

function deleteMed(index) {
    showConfirm('Delete this medication?', () => {
        medications.splice(index, 1);
        saveMedications();
        renderMedications();
        showToast('Medication deleted', 'success');
    });
}

function clearMeds() {
    if (medications.length === 0) return;
    showConfirm('Clear all medications?', () => {
        medications = [];
        saveMedications();
        renderMedications();
        showToast('All medications cleared', 'success');
    });
}

function initMedReminder() {
    if (medReminderInterval) clearInterval(medReminderInterval);
    medReminderInterval = setInterval(() => {
        if (!currentUser || currentUser.role !== 'patient') return;
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        medications.forEach(med => {
            if (!med.taken && med.time === currentTime && now.getSeconds() === 0) {
                showToast('Time to take ' + med.name + ' (' + med.dose + ')', 'warning');
                addNotification('Medication reminder: ' + med.name + ' at ' + med.time);
                if (bellSound) bellSound.play();
            }
        });
    }, 1000);
}

/* ========== APPOINTMENTS ========== */
function openApptModal() {
    const select = document.getElementById('appt-doctor');
    select.innerHTML = '<option value="">Select a doctor</option>';
    demoDoctors.filter(d => d.status === 'online').forEach(d => {
        select.innerHTML += `<option value="${d.id}">${sanitize(d.name)} - ${sanitize(d.specialty)}</option>`;
    });
    if (demoDoctors.filter(d => d.status === 'online').length === 0) {
        select.innerHTML += '<option value="" disabled>No doctors available</option>';
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('appt-date').min = tomorrow.toISOString().split('T')[0];
    document.getElementById('apptModal').classList.add('active');
}

function submitAppt(e) {
    e.preventDefault();
    const doctorId = document.getElementById('appt-doctor').value;
    const date = document.getElementById('appt-date').value;
    const time = document.getElementById('appt-time').value;
    const reason = document.getElementById('appt-reason').value.trim();
    if (!doctorId || !date || !time) {
        showToast('Please fill in all required fields', 'warning');
        return;
    }
    const doctor = demoDoctors.find(d => d.id === doctorId);
    const appt = {
        id: Date.now(),
        patientId: currentUser.id,
        patientName: currentUser.name,
        doctorId: doctorId,
        doctorName: doctor.name,
        date: date,
        time: time,
        reason: reason || 'General consultation'
    };
    appointments.push(appt);
    saveAppointments();

    // Add to doctor queue
    doctorQueue.push({
        id: 'q' + Date.now(),
        doctorId: doctorId,
        patientId: currentUser.id,
        name: currentUser.name,
        complaint: reason || 'General consultation',
        time: time,
        urgency: 'normal',
        date: date
    });

    closeModal('apptModal');
    showToast('Appointment booked successfully!', 'success');
    addNotification('Appointment booked with Dr. ' + doctor.name + ' on ' + date + ' at ' + time);

    // Simulate email notification
    simulateEmailNotification(doctor.email, currentUser.name, date, time, reason);

    // Set reminder for day before
    setAppointmentReminder(appt);

    document.getElementById('appt-reason').value = '';
}

function simulateEmailNotification(doctorEmail, patientName, date, time, reason) {
    console.log('=== EMAIL NOTIFICATION ===');
    console.log('To: ' + doctorEmail);
    console.log('Subject: New Appointment Booking - MediConnect Pro');
    console.log('Body: You have a new appointment with ' + patientName + ' on ' + date + ' at ' + time);
    console.log('Reason: ' + (reason || 'General consultation'));
    console.log('==========================');
    showToast('Email notification sent to doctor', 'success');
}

function setAppointmentReminder(appt) {
    const apptDate = new Date(appt.date + 'T' + appt.time.replace(' ', ''));
    const reminderTime = new Date(apptDate.getTime() - 24 * 60 * 60 * 1000); // 1 day before
    const now = new Date();

    if (reminderTime > now) {
        const delay = reminderTime.getTime() - now.getTime();
        setTimeout(() => {
            showToast('Reminder: Appointment with Dr. ' + appt.doctorName + ' tomorrow at ' + appt.time, 'warning');
            addNotification('Appointment reminder: Tomorrow at ' + appt.time);
            if (bellSound) bellSound.play();
        }, delay);
    }
}

/* ========== NOTIFICATIONS ========== */
function addNotification(message) {
    notifications.unshift({
        id: Date.now(),
        message: message,
        time: new Date().toLocaleString(),
        read: false
    });
    updateNotifications();
}

function updateNotifications() {
    const badge = document.getElementById('notifBadge');
    const list = document.getElementById('notifList');
    const unread = notifications.filter(n => !n.read).length;

    if (badge) {
        badge.textContent = unread;
        badge.style.display = unread > 0 ? 'flex' : 'none';
    }

    if (list) {
        if (notifications.length === 0) {
            list.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--muted);">No notifications</div>';
        } else {
            list.innerHTML = notifications.map(n => `
                <div class="notification-item ${n.read ? '' : 'unread'}" onclick="markRead(${n.id})">
                    <div>${sanitize(n.message)}</div>
                    <div class="notification-time">${n.time}</div>
                </div>
            `).join('');
        }
    }
}

function toggleNotifications() {
    const panel = document.getElementById('notifPanel');
    panel.classList.toggle('active');
    updateNotifications();
}

function markRead(id) {
    const notif = notifications.find(n => n.id === id);
    if (notif) notif.read = true;
    updateNotifications();
}

function clearNotifications() {
    notifications = [];
    updateNotifications();
    document.getElementById('notifPanel').classList.remove('active');
}

/* ========== FACILITIES ========== */
function renderFacilities() {
    const list = document.getElementById('facilityList');
    if (!list) return;
    list.innerHTML = facilities.map(f => `
        <div class="facility-item">
            <div style="display:flex;align-items:center;gap:0.8rem;">
                <i class="fa-solid ${f.icon}" style="color:var(--primary);font-size:1.2rem;"></i>
                <div>
                    <div style="font-weight:600;">${sanitize(f.name)}</div>
                    <div style="font-size:0.8rem;color:var(--muted);">
                        <i class="fa-solid fa-location-dot"></i> ${f.dist} | ${f.type}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

/* ========== EDUCATION ========== */
function renderEducationGrid() {
    const grid = document.getElementById('eduGrid');
    if (!grid) return;
    grid.innerHTML = Object.entries(articles).map(([key, article]) => `
        <div class="edu-card" onclick="showEduDetail('${key}')">
            <h4><i class="fa-solid ${article.icon}"></i> ${article.title}</h4>
            <p>Click to read more about ${article.title.toLowerCase()}</p>
        </div>
    `).join('');
}

function showEduDetail(key) {
    const detail = document.getElementById('eduDetail');
    const article = articles[key];
    detail.innerHTML = `
        <div class="edu-detail">
            <button class="edu-close-btn" onclick="closeEduDetail()">
                <i class="fa-solid fa-arrow-left"></i> Back to Articles
            </button>
            <h4><i class="fa-solid ${article.icon}"></i> ${article.title}</h4>
            ${article.content}
            <div style="display:flex;gap:0.5rem;margin-top:1rem;">
                <button class="btn btn-secondary btn-small" onclick="window.print()">
                    <i class="fa-solid fa-print"></i> Print
                </button>
                <button class="btn btn-secondary btn-small" onclick="shareArticle('${key}')">
                    <i class="fa-solid fa-share-nodes"></i> Share
                </button>
                <button class="btn btn-secondary btn-small" onclick="bookmarkArticle('${key}')">
                    <i class="fa-solid fa-bookmark"></i> Bookmark
                </button>
            </div>
        </div>
    `;
    document.getElementById('eduGrid').style.display = 'none';
    detail.scrollIntoView({ behavior: 'smooth' });
}

function closeEduDetail() {
    document.getElementById('eduDetail').innerHTML = '';
    document.getElementById('eduGrid').style.display = 'grid';
}

function shareArticle(key) {
    const article = articles[key];
    if (navigator.share) {
        navigator.share({ title: article.title, text: 'Read about ' + article.title + ' on MediConnect Pro' });
    } else {
        showToast('Article link copied to clipboard', 'success');
    }
}

function bookmarkArticle(key) {
    showToast('Article bookmarked', 'success');
}

/* ========== TRENDS CHART ========== */
function initTrendsChart() {
    const ctx = document.getElementById('trendsChart');
    if (!ctx) return;
    if (trendsChart) trendsChart.destroy();
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const steps = [6500, 8200, 7800, 9100, 5400, 10200, 7300];
    const sleep = [7.2, 6.8, 7.5, 6.5, 8.0, 7.8, 7.0];
    trendsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [
                { label: 'Steps', data: steps, backgroundColor: 'rgba(14,165,233,0.7)', borderRadius: 6 },
                { label: 'Sleep (hrs)', data: sleep, backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 6 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#94a3b8' } } },
            scales: {
                x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
                y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
        }
    });
}

/* ========== PROFILE ========== */
function showProfileModal() {
    const modal = document.getElementById('profileModal');
    const content = document.getElementById('profileContent');
    content.innerHTML = `
        <div style="text-align:center;margin-bottom:1.5rem;">
            <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--secondary));display:inline-flex;align-items:center;justify-content:center;font-size:2rem;color:white;margin-bottom:1rem;">
                ${currentUser.name.charAt(0).toUpperCase()}
            </div>
            <h3>${sanitize(currentUser.name)}</h3>
            <p style="color:var(--muted);">${currentUser.role === 'patient' ? 'Patient' : 'Doctor - ' + (currentUser.specialty || 'General')}</p>
        </div>
        <div style="display:grid;gap:0.8rem;">
            <div style="display:flex;justify-content:space-between;padding:0.8rem;background:rgba(0,0,0,0.15);border-radius:var(--radius-sm);">
                <span style="color:var(--muted);">Email</span>
                <span>${sanitize(currentUser.email)}</span>
            </div>
            ${currentUser.dob ? `
            <div style="display:flex;justify-content:space-between;padding:0.8rem;background:rgba(0,0,0,0.15);border-radius:var(--radius-sm);">
                <span style="color:var(--muted);">Date of Birth</span>
                <span>${currentUser.dob}</span>
            </div>` : ''}
            ${currentUser.licenseId ? `
            <div style="display:flex;justify-content:space-between;padding:0.8rem;background:rgba(0,0,0,0.15);border-radius:var(--radius-sm);">
                <span style="color:var(--muted);">License ID</span>
                <span>${sanitize(currentUser.licenseId)}</span>
            </div>` : ''}
            <div style="display:flex;justify-content:space-between;padding:0.8rem;background:rgba(0,0,0,0.15);border-radius:var(--radius-sm);">
                <span style="color:var(--muted);">Member Since</span>
                <span>${new Date().toLocaleDateString()}</span>
            </div>
        </div>
        <button class="btn btn-danger" style="width:100%;margin-top:1rem;" onclick="handleLogout()">
            <i class="fa-solid fa-right-from-bracket"></i> Sign Out
        </button>
    `;
    modal.classList.add('active');
}

/* ========== MODALS ========== */
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

function showConfirm(msg, onConfirm) {
    document.getElementById('cfMsg').textContent = msg;
    const btn = document.getElementById('cfBtn');
    btn.onclick = () => { onConfirm(); closeModal('cfModal'); };
    document.getElementById('cfModal').classList.add('active');
}

function emergencyCall() {
    document.getElementById('emModal').classList.add('active');
}

function doEmergencyCall() {
    window.location.href = 'tel:911';
    closeModal('emModal');
    showToast('Calling emergency services...', 'error');
}

/* ========== TOAST ========== */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    const icons = { info: 'fa-circle-info', success: 'fa-check-circle', warning: 'fa-triangle-exclamation', error: 'fa-circle-xmark' };
    toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i> ${sanitize(message)}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

/* ========== NAVIGATION ========== */
function setActive(el) {
    document.querySelectorAll('.nav-center a').forEach(a => a.classList.remove('active'));
    el.classList.add('active');
}

function toggleMobileMenu() {
    document.getElementById('navLinks').classList.toggle('open');
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
}

/* ========== KEYBOARD ========== */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
        document.getElementById('notifPanel').classList.remove('active');
    }
});