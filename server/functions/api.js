const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cookieParser = require("cookie-parser");
const serverless = require("serverless-http");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());
app.use(cookieParser());
const router = express.Router();
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Allow requests from any origin
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "POST"); // Adjust the allowed methods as needed
  next();
});

const maxApiCallsPerDay = 1;

const fetchGPTResponse = async (prompt) => {
  const apiKey = process.env.REACT_APP_APIKEY; // Replace with your OpenAI API key
  console.log("first response: ", apiKey);
  const apiUrl =
    "https://api.openai.com/v1/engines/text-davinci-003/completions";

  try {
    const response = await axios.post(
      apiUrl,
      {
        prompt,
        max_tokens: 500,
        temperature: 0.7,
        n: 1,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.data.choices || response.data.choices.length === 0) {
      throw new Error("GPT API response is empty.");
    }
    console.log("first,", response.data.choices[0].text);

    return { res: response.data.choices[0].text };
  } catch (error) {
    console.error("Error fetching data from GPT API:", error);
    throw error;
  }
};

router.post("/", async (req, res) => {
  const { prompt } = req.body;

  try {
    const currentDate = new Date().toLocaleDateString();
    const ip = req.ip; // Express automatically retrieves the user's IP address

    const ipCallRecord = req.cookies[`apiCallRecord_${ip}`];

    if (ipCallRecord) {
      const { date, count } = JSON.parse(ipCallRecord);

      if (date === currentDate && count >= maxApiCallsPerDay) {
        res
          .status(429)
          .json({ error: "You have exceeded the API call limit for today." });
        return;
      }

      // Update API call record for this IP
      if (date === currentDate) {
        res.cookie(
          `apiCallRecord_${ip}`,
          JSON.stringify({ date, count: count + 1 })
        );
      } else {
        res.cookie(
          `apiCallRecord_${ip}`,
          JSON.stringify({ date: currentDate, count: 1 })
        );
      }
    } else {
      // Set API call record for this IP
      res.cookie(
        `apiCallRecord_${ip}`,
        JSON.stringify({ date: currentDate, count: 1 })
      );
    }

    // Proceed to make the API call to GPT and return the response
    const gptResponse = await fetchGPTResponse(prompt);
    res.json({ text: gptResponse });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.use("/.netlify/functions/api", router);
module.exports.handler = serverless(app);
