// Patient Login
function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const status = document.getElementById("loginStatus");

  if (username && password) {
    localStorage.setItem("patientUser", username);
    status.textContent = "Login successful!";
    showApp();
  } else {
    status.textContent = "Please enter username and password.";
  }
}

function showApp() {
  document.getElementById("login").classList.add("hidden");
  document.getElementById("chat").classList.remove("hidden");
  document.getElementById("monitor").classList.remove("hidden");
  document.getElementById("education").classList.remove("hidden");
  document.getElementById("terminal").classList.remove("hidden");
}

// Doctor–Patient Chat
async function sendMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value.trim();
  if (message) {
    addMessage("You", message);
    input.value = "";
    const reply = await getDoctorReply(message);
    addMessage("Doctor", reply);
    saveChat();
  }
}

async function getDoctorReply(msg) {
  const responses = [
    "Stay hydrated and rest well.",
    "Please monitor your symptoms closely.",
    "Schedule a check-up if needed."
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

function addMessage(sender, text, save = true) {
  const chatBox = document.getElementById("chatBox");
  const p = document.createElement("p");
  p.textContent = `${sender}: ${text}`;
  chatBox.appendChild(p);

  if (save) {
    const history = JSON.parse(localStorage.getItem("chatHistory")) || [];
    history.push({ sender, text });
    localStorage.setItem("chatHistory", JSON.stringify(history));
  }
}

function saveChat() {
  const chatBox = document.getElementById("chatBox");
  localStorage.setItem("chatHistory", chatBox.innerHTML);
}

// Load chat history
window.onload = () => {
  const savedChat = JSON.parse(localStorage.getItem("chatHistory")) || [];
  savedChat.forEach(msg => addMessage(msg.sender, msg.text, false));

  const savedReadings = JSON.parse(localStorage.getItem("healthReadings"));
  if (savedReadings) {
    document.getElementById("heartRate").textContent = `Heart Rate: ${savedReadings.heartRate} bpm`;
    document.getElementById("bloodPressure").textContent = `Blood Pressure: ${savedReadings.bp}`;
  }
};

// Health Monitoring Simulation
function getHeartRate() {
  return Math.floor(Math.random() * (100 - 60 + 1)) + 60;
}

function getBloodPressure() {
  const systolic = Math.floor(Math.random() * (130 - 110 + 1)) + 110;
  const diastolic = Math.floor(Math.random() * (90 - 70 + 1)) + 70;
  return { systolic, diastolic };
}

function displayReadings() {
  const heartRate = getHeartRate();
  const bp = getBloodPressure();
  document.getElementById("heartRate").textContent = `Heart Rate: ${heartRate} bpm`;
  document.getElementById("bloodPressure").textContent = `Blood Pressure: ${bp.systolic} / ${bp.diastolic} mmHg`;

  localStorage.setItem("healthReadings", JSON.stringify({
    heartRate,
    bp: `${bp.systolic} / ${bp.diastolic} mmHg`
  }));
}

setInterval(displayReadings, 3000); // update every 3 seconds

// Terminal-style Doctor Call Simulation
function callDoctorTerminal() {
  const terminal = document.getElementById("terminalWindow");
  terminal.innerHTML = ""; // clear previous logs

  const messages = [
    "Initializing call sequence...",
    "Connecting to Doctor...",
    "Establishing secure channel...",
    "Doctor connected. Free consultation ongoing!"
  ];

  let i = 0;
  function typeLine() {
    if (i < messages.length) {
      const p = document.createElement("p");
      terminal.appendChild(p);
      let text = messages[i];
      let j = 0;

      function typeChar() {
        if (j < text.length) {
          p.textContent += text[j];
          j++;
          setTimeout(typeChar, 50); // typing speed
        } else {
          i++;
          setTimeout(typeLine, 500); // pause before next line
        }
      }
      typeChar();
    }
  }
  typeLine();
}
