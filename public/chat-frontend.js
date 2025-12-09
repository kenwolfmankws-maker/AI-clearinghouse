// FRONTEND CHAT SCRIPT FOR AI CLEARINGHOUSE

document.addEventListener("DOMContentLoaded", () => {
    const chatWindow = document.getElementById("eldon-chat-window");
    const input = document.getElementById("eldon-input");
    const sendBtn = document.getElementById("sendBtn");

    function addMessage(sender, text) {
        const msg = document.createElement("div");
        msg.style.margin = "8px 0";
        msg.style.whiteSpace = "pre-wrap";
        msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
        chatWindow.appendChild(msg);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    async function sendMessage() {
        const message = input.value.trim();
        if (!message) return;

        addMessage("You", message);
        input.value = "";

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message })
            });

            const data = await res.json();
            addMessage("AI", data);
        } catch (err) {
            addMessage("System", "Error contacting server.");
        }
    }

    sendBtn.addEventListener("click", sendMessage);
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendMessage();
    });
});
