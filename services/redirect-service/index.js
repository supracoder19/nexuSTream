const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigin = process.env.ALLOWED_ORIGIN || "*"; // Set your default origin safely

const WORKER_DOMAIN = process.env.WORKER_DOMAIN; // e.g., "https://video.xxx"

app.use(cors({
    origin: allowedOrigin,
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
    exposedHeaders: ['Content-Length', 'Content-Range'], // Vital for video streaming seek bars
    credentials: true
}));

if (!WORKER_DOMAIN) {
  console.error("CRITICAL ERROR: Missing WORKER_DOMAIN in environment variables.");
  process.exit(1);
}

// 1. Root Route for System Healthchecks
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/watch/*filename', (req, res) => {
  processReq(req, res);
});

app.get('/image/*filename', (req, res) => {
  processReq(req, res);
});

const processReq = (req, res) => {
  try {
    const fullPath = req.path; // e.g., "/image/xxx/yyy" or "/watch/movie.mp4"
    console.log(`\n--- [INCOMING REDIRECT] Path: ${fullPath} ---`);
    console.log(`[DEBUG QUERY] Raw incoming query parameters:`, req.query);

    if (!fullPath || fullPath === '/') {
      console.warn("[DEBUG REDIRECT] Blocked request: Missing destination path");
      return res.status(400).json({ error: "Missing destination path" });
    }

    // 1. Replace the leading "/watch/" or "/image/" with "/download/"
    const convertedPath = fullPath.replace(/^\/(watch|image)\//, '/download/');
    console.log(`[DEBUG PATH] Converted routing match prefix: ${fullPath} -> ${convertedPath}`);

    // 2. Clean your domain base url (remove any trailing slash)
    const cleanDomain = WORKER_DOMAIN.replace(/\/$/, '');
    
    // 3. Create the final destination URL object
    const redirectUrl = new URL(`${cleanDomain}${convertedPath}`);

    // 4. Loop through parameters and safeguard against Array duplication anomalies
    for (const [key, value] of Object.entries(req.query)) {
      if (Array.isArray(value)) {
        // 💡 FIX: If the token parameter is captured as an array, pick ONLY the first entry 
        // to prevent commas squashing them together and breaking your Worker signature validation!
        console.warn(`[DEBUG REDIRECT] Detected duplicate parameters array for key "${key}". Selecting primary string element: "${value[0]}"`);
        redirectUrl.searchParams.set(key, value[0]);
      } else if (value && value.includes(',')) {
        // Double-check if a comma-separated string has already slipped in, split it, and take the first token
        const cleanedVal = value.split(',')[0];
        console.warn(`[DEBUG REDIRECT] Found comma-separated values in key "${key}". Trimming string down to: "${cleanedVal}"`);
        redirectUrl.searchParams.set(key, cleanedVal);
      } else {
        redirectUrl.searchParams.set(key, value);
      }
    }

    console.log(`[Redirect] Dispatching 302 routing instruction -> ${redirectUrl.toString()}`);

    // 5. Issue the clean 302 Found redirect
    return res.redirect(302, redirectUrl.toString());

  } catch (error) {
    console.error("Redirection pipeline failure:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Backend media router running on http://localhost:${PORT}`);
});