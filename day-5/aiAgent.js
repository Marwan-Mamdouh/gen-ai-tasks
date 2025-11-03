import nodemailer from "nodemailer"; // need to install it with npm i nodemailer

process.loadEnvFile(".env");
const TOKEN = process.env.GOOGLE_API_KEY; // need to add your GOOGLE_API_KEY in the .env file
const aiAgent = async (text) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${TOKEN}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Extract reminder & time in minutes from:"${text}"

Return only JSON like:
{"task":"drink water", "minutes":1}

No code blocks, no comments, no text.`,
              },
            ],
          },
        ],
      }),
    }
  );
  const data = await response.json();
  const replay = data?.candidates?.[0]?.content?.parts[0]?.text;

  if (!replay) throw new Error("No response from AI");

  const cleaned = replay
    .replaceAll(/```json/gi, "")
    .replaceAll("```", "")
    .trim();

  return JSON.parse(cleaned);
};

const createReminder = async (message) => {
  try {
    const { task, minutes } = await aiAgent(message);

    console.log(`Reminder created`);

    setTimeout(async () => {
      console.log(`Reminder: ${task}`);
      await sendEmailNotification(task);
    }, minutes * 60000);
  } catch (error) {
    console.error(`error:`, error.message);
  }
};

// Create a transporter (example: Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_TO, // e.g., your_email@gmail.com
    pass: process.env.EMAIL_PASSWORD, // your app password, not your real password!
  },
});

const sendEmailNotification = async (task) => {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_TO, // your email, add it here or in the .env (if you don't have one add one )
    to: process.env.EMAIL_TO, // where you to want to send the email
    subject: "Reminder Notification",
    text: `This is a reminder for your task: ${task}`,
  });
  console.log("Email sent:", info.messageId);
};

await createReminder("Please remind me to drink coffee in 0.5 minute");
