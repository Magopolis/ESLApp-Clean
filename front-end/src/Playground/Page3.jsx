import { useState } from "react";

export default function Page3() {
  const [inputText, setInputText] = useState(`"A way out west there was a fella, 
fella I want to tell you about, fella 
by the name of Jeff Lebowski.  At 
least, that was the handle his lovin' 
parents gave him, but he never had 
much use for it himself.  This 
Lebowski, he called himself the Dude.  
Now, Dude, that's a name no one would 
self-apply where I come from.  But 
then, there was a lot about the Dude 
that didn't make a whole lot of sense 
to me.  And a lot about where he 
lived, like- wise.  But then again, 
maybe that's why I found the place 
s'durned innarestin'."`);

  const [outputText, setOutputText] = useState("");

  const removeLineBreaks = () => {
    const cleaned = inputText
      .trim()
      .replace(/[\r\n]+/g, " ")
      .replace(/\s+/g, " ");
    setOutputText(cleaned);
  };

  const clearText = () => {
    setInputText("");
    setOutputText("");
  };

  return (
    <div style={pageStyle}>
      <h1>Fix Formats</h1>
      <h2>Remove: <strong>Line Breaks</strong>, and <strong>White Space!</strong></h2>

      <textarea
        rows="8"
        placeholder="Paste your text here..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        style={textareaStyle}
      />

      <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
        <button onClick={removeLineBreaks} style={buttonStyle}>Clean It</button>
        <button onClick={clearText} style={buttonStyle}>Clear Text</button>
      </div>

      <pre style={outputStyle}>
        {outputText}
      </pre>
    </div>
  );
}


const pageStyle = {
  fontFamily: "sans-serif",
  padding: "2rem",
  background: "#1e1e1e",
  color: "#fff",
  minHeight: "100vh",
};

const textareaStyle = {
  width: "100%",
  padding: "1rem",
  background: "#2e2e2e",
  color: "#f8f8f2",
  borderRadius: "5px",
  border: "1px solid #555",
  fontSize: "1rem",
};

const outputStyle = {
  marginTop: "1rem",
  background: "#2e2e2e",
  padding: "1rem",
  borderRadius: "5px",
  color: "#f8f8f2",
  minHeight: "150px",
  whiteSpace: "pre-wrap",
  overflowWrap: "break-word",
  minWidth: "calc(100% - 2rem)",
};

const buttonStyle = {
  padding: "0.5rem 1rem",
  background: "#4caf50",
  color: "white",
  border: "none",
  borderRadius: "5px",
  fontWeight: "bold",
  cursor: "pointer",
};
