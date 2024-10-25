const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");
const ACTIONS = require("./Actions"); // Make sure this file contains relevant actions
require("dotenv").config();

const server = http.createServer(app);

// Use Judge0 API URL and your API Key from RapidAPI
const JUDGE0_API = "https://judge0-ce.p.rapidapi.com/submissions";
const RAPIDAPI_KEY = "edf5320062mshe53aebc7bcd5d7fp1c4cedjsnce019d50808e";

// Only support C++
const LANGUAGE_IDS = {
  cpp: 50, // C++ ID from Judge0
};

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Socket.io related code for real-time communication
const userSocketMap = {};

const getAllConnectedClients = (roomId) => {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        username: userSocketMap[socketId],
      };
    }
  );
};

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);
    const clients = getAllConnectedClients(roomId);

    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });

    delete userSocketMap[socket.id];
    socket.leave();
  });
});

// Code compilation route using Judge0 API
app.post("/compile", async (req, res) => {
  const { code } = req.body;

  // Use the C++ language ID
  const languageId = LANGUAGE_IDS.cpp;

  try {
    // Submit the code to Judge0 API
    const submissionResponse = await axios.post(
      JUDGE0_API,
      {
        source_code: code,
        language_id: languageId,
        stdin: "", // Optional: pass input if needed
        expected_output: "" // Optional: if you have expected output for testing
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": RAPIDAPI_KEY,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
      }
    );

    const { token } = submissionResponse.data;

    // Poll for the result
    const resultResponse = await axios.get(`${JUDGE0_API}/${token}`, {
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
      },
    });

    // Respond with the output or error
    const { stdout, stderr, status_message } = resultResponse.data;
    if (stdout) {
      return res.json({ output: stdout });
    } else {
      return res.json({ output: stderr || status_message });
    }
  } catch (error) {
    console.error("Error with Judge0 API:", error);
    return res.status(500).json({ error: "Error executing code." });
  }
});

// Server setup
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
