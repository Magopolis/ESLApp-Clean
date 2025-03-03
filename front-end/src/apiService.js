export const fetchFromAPI = async ({ service, input, model = null }) => {
    let url, method, body;
    const API_BASE_URL = "http://localhost:4000"; // Change from 4001 to 4000

    switch (service) {
      case "openai":
        url = `${API_BASE_URL}`;  // ✅ Uses correct port (removed /ask)
        method = "POST";
        body = JSON.stringify({
          prompt: `${input} \n\n Admin Prompt: "short answer <40 words"`, // Append admin prompt
          model: model || "gpt-3.5-turbo",
        });
        break;
  
      case "huggingface":
        url = `${API_BASE_URL}/pos`;
        method = "POST";
        body = JSON.stringify({ text: input });
        break;
  
      case "pexels":
        url = `${API_BASE_URL}/images?query=${input}`;
        method = "GET"; // No body needed
        body = null;
        break;
  
      case "whisper":
        url = url = `${API_BASE_URL}/transcribe`; // Example for Whisper API
        method = "POST";
        body = JSON.stringify({ audioFile: input });
        break;
  
      case "text-to-speech":
        url = url = `${API_BASE_URL}/transcribe`; // Example for TTS
        method = "POST";
        body = JSON.stringify({ text: input, voice: "en-US-Wavenet-F" });
        break;
  
      default:
        throw new Error("Unknown API service");
    }
  
    try {
      const requestPayload = JSON.stringify({
        query: `
          query Ask($prompt: String!, $model: String!) {
            ask(prompt: $prompt, model: $model)
          }
        `,
        variables: {
          prompt: `${input} \n\n Admin Prompt: "short answer <40 words"`,
          model: model || "gpt-3.5-turbo",
        },
      });
    
      // Log the payload so you can inspect it
      console.log("Sending payload:", requestPayload);
    
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: requestPayload,
      });
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching from ${service}:`, error);
      return { error: `Failed to fetch from ${service}.` };
    }
    
  };
  