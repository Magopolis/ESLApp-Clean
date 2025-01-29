export const fetchFromAPI = async ({ service, input, model = null }) => {
    let url, method, body;
  
    switch (service) {
      case "openai":
        url = "http://localhost:4001/ask";
        method = "POST";
        body = JSON.stringify({
          prompt: `${input} \n\n Admin Prompt: "short answer <40 words"`, // Append admin prompt
          model: model || "gpt-3.5-turbo",
        });
        break;
  
      case "huggingface":
        url = "http://localhost:4001/pos";
        method = "POST";
        body = JSON.stringify({ text: input });
        break;
  
      case "pexels":
        url = `http://localhost:4001/images?query=${input}`;
        method = "GET"; // No body needed
        body = null;
        break;
  
      case "whisper":
        url = "http://localhost:4001/transcribe"; // Example for Whisper API
        method = "POST";
        body = JSON.stringify({ audioFile: input });
        break;
  
      case "text-to-speech":
        url = "http://localhost:4001/speech"; // Example for TTS
        method = "POST";
        body = JSON.stringify({ text: input, voice: "en-US-Wavenet-F" });
        break;
  
      default:
        throw new Error("Unknown API service");
    }
  
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });
      return await response.json();
    } catch (error) {
      console.error(`Error fetching from ${service}:`, error);
      return { error: `Failed to fetch from ${service}.` };
    }
  };
  