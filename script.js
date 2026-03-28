let messageHistory = [];

async function sendMessage() {
  const input = document.getElementById("message");
  const chat = document.getElementById("chat");
  const sendBtn = document.getElementById("sendBtn");

  const userText = input.value.trim();
  if (!userText) return;

  sendBtn.disabled = true;

  addMessage(userText, "user");
  input.value = "";
  autosizeTextarea(input);

  const loading = addMessage("Typing...", "bot");

  try {
    const response = await fetch("https://fuctiondk-cpcvdre2g8aje9ev.eastus-01.azurewebsites.net/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: userText,
        history: messageHistory
      })
    });

    const rawText = await response.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error("RAW RESPONSE:", rawText);
      throw new Error(rawText || "Invalid JSON from server");
    }

    if (loading && loading.remove) loading.remove();

    if (!response.ok) {
      throw new Error(data.error || rawText || response.statusText);
    }

    if (data.response) {
      addMessage(data.response, "bot");
      // Update history for context awareness
      messageHistory.push({ role: "user", content: userText });
      messageHistory.push({ role: "assistant", content: data.response });
    } else {
      addMessage("Error: " + (data.error || "No response returned"), "bot");
    }

  } catch (error) {
    if (loading && loading.remove) loading.remove();
    addMessage("Error: " + error.message, "bot");
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
}

function addMessage(text, sender) {
  const chat = document.getElementById("chat");

  const msg = document.createElement("div");
  msg.className = "message " + sender;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = sender === "user" ? "🧳" : "✨";

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  const meta = document.createElement("div");
  meta.className = "meta-row";

  const senderLabel = document.createElement("div");
  senderLabel.className = "sender";
  senderLabel.textContent = sender === "user" ? "You" : "Margie";

  const time = document.createElement("div");
  time.className = "time";
  time.textContent = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

  meta.appendChild(senderLabel);
  meta.appendChild(time);

  const copyBtn = document.createElement("button");
  copyBtn.className = "copy-btn";
  copyBtn.type = "button";
  copyBtn.textContent = "Copy";

  if (sender === "bot") {
    meta.appendChild(copyBtn);

    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = "Copied!";
        setTimeout(() => (copyBtn.textContent = "Copy"), 1200);
      } catch (e) {
        copyBtn.textContent = "Can't copy";
        setTimeout(() => (copyBtn.textContent = "Copy"), 1200);
      }
    });
  }

  const contentWrap = document.createElement("div");
  contentWrap.className = "content";

  if (sender === "bot" && text === "Typing...") {
    const typing = document.createElement("div");
    typing.className = "typing";
    typing.setAttribute("aria-label", "Bot is typing");

    const d1 = document.createElement("span");
    d1.className = "dot";
    const d2 = document.createElement("span");
    d2.className = "dot";
    const d3 = document.createElement("span");
    d3.className = "dot";

    typing.appendChild(d1);
    typing.appendChild(d2);
    typing.appendChild(d3);
    contentWrap.appendChild(typing);
  } else if (sender === "bot") {
    const rawHtml = marked.parse(text);
    contentWrap.innerHTML = DOMPurify.sanitize(rawHtml);
  } else {
    contentWrap.textContent = text;
  }

  bubble.appendChild(meta);
  bubble.appendChild(contentWrap);

  msg.appendChild(avatar);
  msg.appendChild(bubble);

  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;

  return msg;
}

function autosizeTextarea(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 140) + "px";
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("message");
  const form = document.getElementById("chatForm");

  // Enter to send, Shift+Enter newline
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Submit handler
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    sendMessage();
  });

  // Auto-grow textarea
  input.addEventListener("input", () => autosizeTextarea(input));

  autosizeTextarea(input);

  // New Journey / Clear History
  const newChatBtn = document.querySelector(".new-chat");
  if (newChatBtn) {
    newChatBtn.addEventListener("click", () => {
      messageHistory = [];
      const chatContainer = document.getElementById("chat");

      // Keep only the welcome section
      const welcome = chatContainer.querySelector(".welcome");
      chatContainer.innerHTML = "";
      if (welcome) {
        chatContainer.appendChild(welcome);
      }

      addMessage("New context started. How can I help you today?", "bot");
    });
  }
});
