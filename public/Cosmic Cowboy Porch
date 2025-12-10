// ======= STARFIELD SPAWNER ======= 
function spawnStar() {
    const star = document.createElement("div");
    star.className = "star";
    star.style.left = Math.random() * window.innerWidth + "px";
    star.style.top  = window.innerHeight + "px";
    document.body.appendChild(star);
    setTimeout(() => star.remove(), 18000);
}

setInterval(spawnStar, 150);


// ======= COWBOY CHAT LOGIC =======
const input = document.getElementById("userInput");
const btn = document.getElementById("sendBtn");
const box = document.getElementById("messageBox");

btn.addEventListener("click", handleMessage);

input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleMessage();
});

function handleMessage() {
    const text = input.value.trim();
    if (!text) return;

    appendMessage("You", text);
    const reply = cowboyReply(text);
    setTimeout(() => appendMessage("Cowboy", reply), 400);
    input.value = "";
}

function appendMessage(speaker, message) {
    const p = document.createElement("p");
    p.innerHTML = `<strong>${speaker}:</strong> ${message}`;
    box.appendChild(p);
    box.scrollTop = box.scrollHeight;
}

function cowboyReply(userText) {
    const text = userText.toLowerCase();

    if (text.includes("truth")) {
        return "Cowboy: Truth’s the tail that keeps us straight.";
    }
    if (text.includes("question")) {
        return "Cowboy: Well now, that’s a mighty fine question.";
    }

    const lines = [
        "Evenin’. Sky’s wide and listening.",
        "Ain’t no rush — we got all of time’s front porch.",
        "Dreams take shape under patient stars.",
        "Lean back, partner. Night’s still workin’ on it."
    ];

    return "Cowboy: " + lines[Math.floor(Math.random() * lines.length)];
}
