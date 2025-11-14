const express = require('express');
const fetch = require('node-fetch'); // For Node 14/16. If Node 18+, use global fetch.
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static('.')); // Serves disease.html etc

// COVID-19 live stats endpoint
app.get('/covid/:country', async (req, res) => {
  const country = req.params.country;
  const apiUrl = `https://disease.sh/v3/covid-19/countries/${encodeURIComponent(country)}`;
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'COVID fetch failed.', details: error.message });
  }
});

// Historical daily stats (last 60 days)
app.get('/historical/:country', async (req, res) => {
  const country = req.params.country;
  const url = `https://disease.sh/v3/covid-19/historical/${encodeURIComponent(country)}?lastdays=60`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Historical fetch failed.', details: error.message });
  }
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Disease dashboard proxy running at http://localhost:${PORT}`);
});
