require("./config/db")();
require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
const path = require('path');
const https = require('http');
const fs = require('fs');

const socketServer = require('./socket');
const routes = require("./routes");
const { endPoint } = require("./utils/endPoint");
const { startJob } = require("./cronjobs/sendNotifForTravelRequest");
const { seedAdmin } = require('./seeders/adminSeeder');

// Create Admin By Seed & CronJob
seedAdmin();
startJob();

// Define paths to the certificate and key files
const certPath = path.join(__dirname, 'bin', 'cert.pem');
const keyPath = path.join(__dirname, 'bin', 'key.pem');

// Read the certificate and key files
const options = { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) };

// use ejs middleware
app.set("view engine", "ejs");
app.set("views", path.join("views"));

// Serve the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// For Admin Panel UI
// app.use(express.static(path.join(__dirname, "public")));
// app.get('/*', function (req, res) {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// Cors Options
const corsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
}
app.options('*', cors(corsOptions)); // Pre-flight support

//middlewares
// express.json(): use to get json format data from req.body
app.use(express.json());
app.use(cors(corsOptions));

// use app
app.get("/", (req, res) => {
    res.send("Main Page Of Backend Application, APP is Running...");
});

// All Routes of Application
app.use("/api", routes);

app.route("*").get(endPoint).post(endPoint).put(endPoint).delete(endPoint);

const port = process.env.PORT;
// Create HTTP server
const server = https.createServer(options, app).listen(port, () => {
    console.info(`App is Running at PORT: ${port}.`);
});

socketServer.initChat(server);