require("dotenv/config");
const express = require("express");
const cors = require("cors");
const prisma = require("./prisma");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/users", async (req, res) => {
  const users = await prisma.user.findMany({ orderBy: { id: "desc" } });
  res.json(users);
});

app.post("/api/users", async (req, res) => {
  const { email, name } = req.body;
  if (!email) {
    return res.status(400).json({ error: "email is required" });
  }
  const user = await prisma.user.create({ data: { email, name } });
  res.status(201).json(user);
});

app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
