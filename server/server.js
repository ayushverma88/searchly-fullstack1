
require("dotenv").config({
  path: require("path").join(__dirname, ".env"),
});

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cheerio = require("cheerio");
const dns = require("node:dns").promises;
const net = require("node:net");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error(
    "Set JWT_SECRET to a random string at least 32 characters long in .env"
  );
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is missing from server/.env");
  process.exit(1);
}

// -------------------- Middleware --------------------

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(helmet());
app.use(express.json({ limit: "1mb" }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

// -------------------- Database Models --------------------

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    kind: {
      type: String,
      enum: ["seo", "content"],
      required: true,
    },
    name: { type: String, trim: true, default: "" },
    input: { type: mongoose.Schema.Types.Mixed },
    result: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

const User =
  mongoose.models.User || mongoose.model("User", userSchema);

const Report =
  mongoose.models.Report || mongoose.model("Report", reportSchema);

// -------------------- Authentication Helpers --------------------

function createToken(user) {
  return jwt.sign(
    { userId: user._id.toString() },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
}

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Please log in first." });
    }

    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.userId);

    if (!user) {
      return res.status(401).json({ error: "User not found." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired login token.",
    });
  }
}

// -------------------- Health Check --------------------

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Searchly API",
  });
});

// -------------------- Register --------------------

app.post("/api/auth/register", authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      password.length < 8
    ) {
      return res.status(400).json({
        error: "Name, valid email, and password (at least 8 characters) are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        error: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    return res.status(201).json({
      message: "Registration successful.",
      token: createToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: "An account with this email already exists.",
      });
    }

    console.error("Registration error:", error.message);
    return res.status(500).json({
      error: "Registration failed. Please try again.",
    });
  }
});

// -------------------- Login --------------------

app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({
        error: "Incorrect email or password.",
      });
    }

    return res.json({
      message: "Login successful.",
      token: createToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      error: "Login failed. Please try again.",
    });
  }
});

// -------------------- Current User --------------------

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// -------------------- URL Validation Helpers --------------------

// Avoid requesting local/private addresses during SEO analysis.
function isPublicIPv4(ip) {
  const parts = ip.split(".").map(Number);

  if (parts.length !== 4 || parts.some((n) => n < 0 || n > 255)) {
    return false;
  }

  const [a, b] = parts;

  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    a === 169 && b === 254 ||
    a === 172 && b >= 16 && b <= 31 ||
    a === 192 && b === 168 ||
    a === 100 && b >= 64 && b <= 127 ||
    a === 192 && b === 0 ||
    a === 198 && (b === 18 || b === 19)
  );
}

function isPublicIPv6(ip) {
  const normalized = ip.toLowerCase().split("%")[0];

  if (normalized === "::" || normalized === "::1") return false;

  // Deny IPv4-mapped IPv6 addresses here to avoid bypasses.
  if (normalized.includes(".")) return false;

  // Public global unicast IPv6 addresses start with 2000::/3.
  return /^[23][0-9a-f]{0,3}:/i.test(normalized);
}

async function validatePublicUrl(value) {
  let url;

  try {
    url = new URL(value);
  } catch {
    throw new Error("Enter a valid website URL.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS website URLs are supported.");
  }

  if (url.username || url.password) {
    throw new Error("URLs containing credentials are not allowed.");
  }

  if (url.port && !["80", "443"].includes(url.port)) {
    throw new Error("Only standard HTTP/HTTPS ports are allowed.");
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new Error("Local or private websites cannot be analyzed.");
  }

  if (net.isIP(hostname)) {
    const safe = net.isIPv4(hostname)
      ? isPublicIPv4(hostname)
      : isPublicIPv6(hostname);

    if (!safe) throw new Error("Private IP addresses cannot be analyzed.");
    return url;
  }

  let addresses;

  try {
    addresses = await dns.lookup(hostname, { all: true });
  } catch {
    throw new Error("Could not resolve the website hostname.");
  }

  if (
    !addresses.length ||
    addresses.some(({ address, family }) =>
      family === 4
        ? !isPublicIPv4(address)
        : !isPublicIPv6(address)
    )
  ) {
    throw new Error("The website resolves to a private or blocked IP address.");
  }

  return url;
}

async function fetchWebsite(value) {
  const url = await validatePublicUrl(value);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "error",
      headers: {
        "User-Agent": "SearchlySEO/1.0",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      throw new Error(`Website returned HTTP ${response.status}.`);
    }

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("text/html") &&
        !contentType.includes("application/xhtml+xml")) {
      throw new Error("The URL did not return an HTML page.");
    }

    const html = await response.text();

    if (html.length > 2_000_000) {
      throw new Error("The webpage is too large to analyze.");
    }

    return { url, html };
  } finally {
    clearTimeout(timeout);
  }
}

// -------------------- SEO Analyzer --------------------

app.post("/api/seo/analyze", requireAuth, async (req, res) => {
  try {
    const { url: inputUrl } = req.body || {};

    if (typeof inputUrl !== "string" || !inputUrl.trim()) {
      return res.status(400).json({
        error: "A website URL is required.",
      });
    }

    const { url, html } = await fetchWebsite(inputUrl.trim());
    const $ = cheerio.load(html);

    const title = $("title").first().text().trim();
    const description =
      $('meta[name="description"]').attr("content")?.trim() || "";
    const canonical =
      $('link[rel="canonical"]').attr("href") || "";
    const h1 = $("h1").map((_, el) => $(el).text().trim()).get();
    const h2Count = $("h2").length;
    const images = $("img").map((_, el) => ({
      src: $(el).attr("src") || "",
      alt: ($(el).attr("alt") || "").trim(),
    })).get();

    const robots =
      $('meta[name="robots"]').attr("content") || "Not specified";

    const checks = [
      {
        name: "Title tag",
        passed: Boolean(title),
        detail: title || "Missing title tag",
      },
      {
        name: "Meta description",
        passed: Boolean(description),
        detail: description || "Missing meta description",
      },
      {
        name: "H1 heading",
        passed: h1.length === 1,
        detail: `${h1.length} H1 heading(s) found`,
      },
      {
        name: "Canonical URL",
        passed: Boolean(canonical),
        detail: canonical || "Canonical URL not specified",
      },
      {
        name: "Image alt text",
        passed: images.every((img) => img.alt.length > 0),
        detail: `${images.filter((img) => !img.alt).length} image(s) missing alt text`,
      },
    ];

    const score = Math.round(
      (checks.filter((check) => check.passed).length / checks.length) * 100
    );

    const result = {
      url: url.href,
      score,
      title,
      titleLength: title.length,
      description,
      descriptionLength: description.length,
      canonical,
      h1,
      h2Count,
      imageCount: images.length,
      imagesMissingAlt: images.filter((img) => !img.alt).length,
      robots,
      checks,
    };

    return res.json({ result });
  } catch (error) {
    console.error("SEO analysis error:", error.message);
    return res.status(400).json({
      error: error.name === "AbortError"
        ? "The website took too long to respond."
        : error.message || "SEO analysis failed.",
    });
  }
});

// -------------------- Content Analyzer --------------------

app.post("/api/content/analyze", requireAuth, async (req, res) => {
  try {
    const { content, text, keyword } = req.body || {};
    const body = typeof content === "string"
      ? content
      : typeof text === "string"
        ? text
        : "";

    if (!body.trim()) {
      return res.status(400).json({
        error: "Please provide content to analyze.",
      });
    }

    const words = body.trim().split(/\s+/);
    const sentences = body.split(/[.!?]+/).filter((s) => s.trim());
    const paragraphs = body.split(/\n\s*\n/).filter((p) => p.trim());
    const keywordCount = typeof keyword === "string" && keyword.trim()
      ? body.toLowerCase().split(keyword.trim().toLowerCase()).length - 1
      : 0;

    const result = {
      wordCount: words.length,
      characterCount: body.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      averageWordsPerSentence: sentences.length
        ? Math.round(words.length / sentences.length)
        : 0,
      keyword: keyword || "",
      keywordCount,
      keywordDensity: keyword && words.length
        ? Number(((keywordCount / words.length) * 100).toFixed(2))
        : 0,
    };

    return res.json({ result });
  } catch (error) {
    console.error("Content analysis error:", error.message);
    return res.status(500).json({
      error: "Content analysis failed.",
    });
  }
});

// -------------------- Reports --------------------

app.get("/api/reports", requireAuth, async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ reports });
  } catch (error) {
    console.error("Get reports error:", error.message);
    res.status(500).json({ error: "Could not load reports." });
  }
});

app.post("/api/reports", requireAuth, async (req, res) => {
  try {
    const { kind, name, input, result } = req.body || {};

    if (!["seo", "content"].includes(kind)) {
      return res.status(400).json({
        error: "Report kind must be seo or content.",
      });
    }

    const report = await Report.create({
      userId: req.user._id,
      kind,
      name: typeof name === "string" ? name.trim().slice(0, 200) : "",
      input,
      result,
    });

    res.status(201).json({ report });
  } catch (error) {
    console.error("Save report error:", error.message);
    res.status(500).json({ error: "Could not save report." });
  }
});

app.delete("/api/reports/:id", requireAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid report ID." });
    }

    const report = await Report.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!report) {
      return res.status(404).json({ error: "Report not found." });
    }

    res.json({ message: "Report deleted successfully." });
  } catch (error) {
    console.error("Delete report error:", error.message);
    res.status(500).json({ error: "Could not delete report." });
  }
});

// -------------------- Error Handler --------------------

app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err.message);

  if (res.headersSent) return next(err);

  res.status(500).json({
    error: "An unexpected server error occurred.",
  });
});

// -------------------- Start Server --------------------

async function start() {
  try {
    console.log(
      "MongoDB URI loaded:",
      Boolean(process.env.MONGODB_URI)
    );

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Searchly API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

start();
