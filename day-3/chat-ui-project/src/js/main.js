const sendToBackend = async (message) => {
  const res = await fetch("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
    credentials: "include", // include session cookie
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || "Backend error");
  }

  const data = await res.json();
  // read assistant (preferred) or fallback to message/reply
  return data.assistant ?? data.message ?? data.reply ?? "";
};

document.addEventListener("DOMContentLoaded", () => {
  const messageInput = document.getElementById("user-input");
  const sendButton = document.getElementById("send-button");
  const messagesContainer = document.getElementById("messages");

  const addMessage = (text, role = "user") => {
    const messageBox = document.createElement("div");
    messageBox.classList.add(
      "message-box",
      role === "bot" ? "bot-message" : "user-message"
    );
    messageBox.textContent = text;
    messagesContainer.appendChild(messageBox);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  };

  sendButton.addEventListener("click", async () => {
    const messageText = messageInput.value.trim();
    if (!messageText) return;

    // show user's message immediately
    addMessage(messageText, "user");
    messageInput.value = "";
    messageInput.focus();

    // typing indicator
    console.log(messageInput);
    const typingBox = document.createElement("div");
    console.log(typingBox);
    typingBox.classList.add("message-box", "bot-message", "typing");
    typingBox.textContent = "…";
    messagesContainer.appendChild(typingBox);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
      const reply = await sendToBackend(messageText);
      console.log(reply);
      typingBox.remove();
      addMessage(reply, "bot");
    } catch (err) {
      typingBox.remove();
      addMessage("Error: Unable to get response from server.", "bot");
      console.error("Chat error:", err);
    }
  });

  messageInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      sendButton.click();
    }
  });
});
