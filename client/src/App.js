import "./App.css";
import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import axios from "axios";

function App() {
  const [response, setResponse] = useState(``);
  const [prompt, setPrompt] = useState("");
  const [ip, setIP] = useState("");
  const maxApiCallsPerDay = 1;

  const getData = async () => {
    try {
      const res = await axios.get("https://api.ipify.org/?format=json");
      setIP(res.data.ip);
    } catch (error) {
      console.error("Error fetching IP:", error);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const onClick = async () => {
    // Check if the user has exceeded the API call limit for today based on their IP
    const currentDate = new Date().toLocaleDateString();
    const ipCallRecord = Cookies.get(`apiCallRecord_${ip}`);

    if (ipCallRecord) {
      const { date, count } = JSON.parse(ipCallRecord);

      if (date === currentDate && count >= maxApiCallsPerDay) {
        setResponse("You have exceeded the API call limit for today.");
        return;
      }

      // Update API call record for this IP
      if (date === currentDate) {
        Cookies.set(
          `apiCallRecord_${ip}`,
          JSON.stringify({ date, count: count + 1 })
        );
      } else {
        Cookies.set(
          `apiCallRecord_${ip}`,
          JSON.stringify({ date: currentDate, count: 1 })
        );
      }
    } else {
      // Set API call record for this IP
      Cookies.set(
        `apiCallRecord_${ip}`,
        JSON.stringify({ date: currentDate, count: 1 })
      );
    }

    // Proceed to make the API call to your server
    try {
      const response = await axios.post(
        "https://extension-api.netlify.app/.netlify/functions/api/",
        { prompt }
      );
      setResponse(response.data.text.res);
    } catch (error) {
      console.error("Error:", error);
      setResponse(`Error: ${error.message}`);
    }
  };

  const onChange = (event) => {
    setPrompt(event.target.value);
  };

  return (
    <div
      style={{ backgroundColor: "lightgrey", height: "420px", width: "400px" }}
    >
      <div style={{ padding: "10px" }}>
        <p style={{ fontSize: "18px", marginLeft: "5px" }}>Ask ChatGPT</p>
        <textarea
          style={{ margin: "5px", padding: "10px" }}
          rows="4"
          cols="45"
          value={prompt}
          onChange={onChange}
          placeholder="Enter text here..."
        />
        <button onClick={onClick} className="button">
          Get Answer
        </button>
      </div>
      <p style={{ fontSize: "18px", marginLeft: "5px" }}>GPT Response:</p>
      <div className="response-container" style={{ margin: "10px" }}>
        <div className="response-text ">
          <p>{response}</p>
          <div style={{ height: "20px" }}></div>
        </div>
      </div>
    </div>
  );
}

export default App;
