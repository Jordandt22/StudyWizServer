require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const http = require("http");
const rateLimiter = require("express-rate-limit");
const slowDown = require("express-slow-down");
const connect = require("./models/db");
const { authUser, checkUser } = require("./middleware/auth.mw");
const { getCacheData } = require("./redis/redis.mw");
const { USER_KEY } = require("./redis/redis.keys");
const {
  validator,
  schemas: { FirebaseIDSchema },
} = require("./validators/params.validator");
const app = express();

// Middleware
const { NODE_ENV, PROXY_SERVER_URI, WEB_URL, API_VERSION } = process.env;
const isProduction = NODE_ENV === "production";
const webURL = isProduction ? WEB_URL : "http://localhost:3000";
const proxyServerURI = isProduction
  ? PROXY_SERVER_URI
  : "http://localhost:8000";
app.use(helmet());
app.use(
  cors({
    origin: [proxyServerURI, webURL],
  })
);
app.use(express.json());
if (!isProduction) {
  app.use(morgan("dev"));
} else {
  app.enable("trust proxy");
  app.set("trust proxy", 1);
}

// Mongoose Connection
connect();

// Rate & Speed Limiters Config
const timeLimit = 1000 * 60 * 5;
const limiter = rateLimiter({
  windowMs: timeLimit,
  max: 125,
});

const speedLimiter = slowDown({
  windowMs: timeLimit,
  delayAfter: 75,
  delayMs: 500,
});

// Rate & Speed Limiters
app.use(speedLimiter);
app.use(limiter);

// Routes
const version = `/v${API_VERSION}/api`;

// Landing Page Route
app.get("/", (req, res) => {
  res.send("API Server for StudyWiz is up and running...");
});

// API Routes
app.use(version + "/user", require("./routes/api/user.api.route"));
app.use(
  version + "/sets/user/:fbId",
  validator(FirebaseIDSchema),
  authUser,
  getCacheData(USER_KEY),
  checkUser,
  require("./routes/api/sets.api.route")
);

// PORT and Sever
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`CORS Enabled Server, Listening to port: ${PORT}...`);
});
