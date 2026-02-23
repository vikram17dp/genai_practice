const sessionId = crypto.randomUUID();

async function sendMessage() {
  const input = document.getElementById("messageInput");
  const chatBox = document.getElementById("chatBox");

  const message = input.value.trim();
  if (!message) return;

  addMessage("You", message, "text-right");
  input.value = "";

  const response = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, sessionId }),
  });

  const data = await response.json();

  addMessage("AI", data.reply, "text-left");
}

function addMessage(sender, text, alignment) {
  const chatBox = document.getElementById("chatBox");

  const messageDiv = document.createElement("div");
  messageDiv.className = alignment;

  messageDiv.innerHTML = `
    <div class="inline-block bg-gray-200 rounded px-3 py-2 max-w-xs">
      ${text}
    </div>
  `;

  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}