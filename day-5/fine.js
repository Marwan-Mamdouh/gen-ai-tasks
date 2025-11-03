process.loadEnvFile(".env");
const apiKey = process.env.KEY ?? "";

const askQuestion = async (question) => {
  const context = `Set in post-World War II New York, The Godfather tells the story of the powerful Corleone crime family, led by Vito Corleone (Marlon Brando). When rival gangs challenge the family's power, a series of betrayals and violent struggles for control unfold.
  Vito’s youngest son, Michael Corleone (Al Pacino), initially wants nothing to do with the family business — he’s a war hero and an outsider to their criminal world. But as events escalate (an assassination attempt on his father, murders, and betrayals), Michael gradually transforms into the new ruthless Don, taking over the empire his father built.
  The film explores themes of power, loyalty, corruption, family, and the American dream’s darker side.
  The Godfather is widely regarded as one of the greatest films ever made, praised for its direction, screenplay, performances, and its profound impact on cinema and popular culture.
  The movie is set primarily in New York City, with some scenes in Sicily, Italy.
  Vito Corleone is the patriarch of the Corleone crime family, portrayed by Marlon Brando. He is a powerful and influential Mafia boss known for his wisdom, strategic mind, and strong sense of family loyalty.`;
  const response = await fetch(
    "https://api-inference.huggingface.co/models/deepset/roberta-base-squad2",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: { question, context } }),
    }
  );
  const data = await response.json();
  return data;
};

const display = async () => {
  const questions = [
    "Who is the youngest son of Vito Corleone?",
    "What themes does the film explore?",
    "Where is the movie set?",
    "ًًWho is Vito Corleone?",
    "What is Michael Corleone's initial attitude towards the family business?",
  ];

  for (const q of questions) {
    console.log("\nQuestion:", q);
    const answer = await askQuestion(q);
    console.log("Answer:", answer.answer);
  }
};

await display()
  .then("fine tunning is running")
  .catch((error) => console.error("Error:", error.message));
