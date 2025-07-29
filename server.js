require("dotenv").config();
require("./src/database/database");
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { socketProvider } = require("./src/sockets/socket");
const { routesProvider } = require("./src/routes/routes");
const morgan = require("morgan");

const expressPort = 8080;
const socketPort = 8081;

const app = express();
const server = createServer(app);
// const io = new Server(server, {
//   path: "/ws",
//   cors: { origin: "*", methods: ["GET", "POST"] },
// });

let corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://192.168.0.30:3000",
    "http://saude.nr1pro.com.br",
    "http://saude.nr1pro.com.br:3000",
  ],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// socketProvider(io);
routesProvider(app);

app.listen(expressPort, () => {
  console.log(`Server listening on port ${expressPort}`);
});

// server.listen(socketPort, () => {
//   console.log(`Socket server listening on port ${socketPort}`);
// });
