const express = require("express")
const cors = require("cors")

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigin = process.env.ALLOWED_ORIGIN || 3000;

const WORKER_DOMAIN = process.env.WORKER_DOMAIN; // e.g., "https://video.xxx"

app.use(cors({
    origin: allowedOrigin,
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
    exposedHeaders: ['Content-Length', 'Content-Range'], // Vital for video streaming seek bars
    credentials: true
}));

if (!WORKER_DOMAIN) {
  console.error("CRITICAL ERROR: Missing TRANSCODER_SECRET or WORKER_DOMAIN in environment variables.");
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

const processReq = (req,res)=>
{
  try {
    const fullPath = req.path; // e.g., "/image/xxx/yyy" or "/watch/movie.mp4"

    if (!fullPath || fullPath === '/') {
      return res.status(400).json({ error: "Missing destination path" });
    }

    // 1. Replace the leading "/watch/" or "/image/" with "/download/"
    // This regex matches /watch/ or /image/ right at the beginning of the string
    const convertedPath = fullPath.replace(/^\/(watch|image)\//, '/download/');

    // 2. Clean your domain base url (remove any trailing slash)
    const cleanDomain = WORKER_DOMAIN.replace(/\/$/, '');
    
    // 3. Create the final destination URL
    // e.g., https://video.xxx/download/xxx/yyy
    const redirectUrl = new URL(`${cleanDomain}${convertedPath}`);

    // 3. Loop through all incoming query params and append them to the target URL
    // This automatically grabs ?token=xyz, ?session=abc, or any other query parameters
    for (const [key, value] of Object.entries(req.query)) {
      redirectUrl.searchParams.set(key, value);
    }

    console.log(`[Redirect] Routing request for ${fullPath} -> ${redirectUrl.toString()}`);

    // 4. Issue the clean 302 Found redirect using the string version of your modified URL object
    return res.redirect(302, redirectUrl.toString());

  } catch (error) {
    console.error("Redirection pipeline failure:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Backend media router running on http://localhost:${PORT}`);
});