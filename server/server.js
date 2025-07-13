require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());

// Configuração do servidor HTTP e Socket.io
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // URL do seu frontend React
    methods: ["GET", "POST"],
  },
});

// Conexão com o MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Conectado ao MongoDB"))
  .catch((err) => console.error("Erro ao conectar ao MongoDB:", err));

// Modelo para mensagens
const Message = mongoose.model("Message", {
  user: String,
  text: String,
  room: String,
  timestamp: { type: Date, default: Date.now },
});

// Lógica do Socket.io
io.on("connection", (socket) => {
  console.log("Novo usuário conectado:", socket.id);

  // Entrar em uma sala
  socket.on("join_room", (room) => {
    socket.join(room);
    console.log(`Usuário ${socket.id} entrou na sala ${room}`);
  });

  // Enviar mensagem para uma sala
  socket.on("send_message", async (data) => {
    const { room, user, text } = data;

    // Salvar mensagem no banco de dados
    const message = new Message({ user, text, room });
    await message.save();

    // Enviar mensagem para todos na sala
    io.to(room).emit("receive_message", message);
  });

  // Desconectar
  socket.on("disconnect", () => {
    console.log("Usuário desconectado:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
