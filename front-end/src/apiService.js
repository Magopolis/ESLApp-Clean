// front-end/src/apiService.js
export const fetchFromAPI = async ({ service, input, model = null }) => {
  let url, method, body;
  const API_BASE_URL = "http://localhost:4000"; // Your backend GraphQL/REST endpoint

  switch (service) {
    case "openai":
      // OpenAI via your backend
      url = `${API_BASE_URL}`;
      method = "POST";
      body = JSON.stringify({
        prompt: `${input} \n\n Admin Prompt: \"short answer <40 words\"`,
        model: model || "gpt-3.5-turbo",
      });
      break;

    case "ollama":
      // Local Mistral via Ollama
      url = "http://localhost:11434/api/generate";
      method = "POST";
      body = JSON.stringify({
        model: model || "mistral:7b-instruct-q4_0", //  "mistral:instruct"or "mistral:latest" if needed 
        prompt: input,
        stream: false,
      });
      console.log("📡 Sending LOCAL Mistral request:", body);
      try {
        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body,
        });
        return await response.json();
      } catch (error) {
        console.error("❌ Local Mistral error:", error);
        return { error: "Failed to fetch from local Mistral." };
      }

    case "huggingface":
      url = `${API_BASE_URL}/pos`;
      method = "POST";
      body = JSON.stringify({ text: input });
      break;

    case "pexels":
      url = `${API_BASE_URL}/images?query=${encodeURIComponent(input)}`;
      method = "GET";
      body = null;
      break;

    case "whisper":
      url = `${API_BASE_URL}/transcribe`;
      method = "POST";
      body = JSON.stringify({ audioFile: input });
      break;

    case "text-to-speech":
      url = `${API_BASE_URL}/transcribe`;
      method = "POST";
      body = JSON.stringify({ text: input, voice: "en-US-Wavenet-F" });
      break;

    default:
      throw new Error(`Unknown API service: ${service}`);
  }

  // Fallback: GraphQL for non-local services
  try {
    const requestPayload = JSON.stringify({
      query: `
        query Ask($prompt: String!, $model: String!) {
          ask(prompt: $prompt, model: $model)
        }
      `,
      variables: {
        prompt: `${input} \n\n Admin Prompt: \"short answer <40 words\"`,
        model: model || "gpt-3.5-turbo",
      },
    });
    console.log(`📡 Sending GraphQL payload to ${service}:`, requestPayload);

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: requestPayload,
    });
    return await response.json();
  } catch (error) {
    console.error(`❌ Error fetching from ${service}:`, error);
    return { error: `Failed to fetch from ${service}.` };
  }
};
