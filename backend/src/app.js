require("dotenv/config");
const express = require("express");
const cors = require("cors");
const prisma = require("./config/prisma");
const safetyRoutes = require("./routes/safety.routes");

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

app.get("/api/safety-data", async (req, res) => {
  const { dataType, page = "1", pageSize = "50" } = req.query;
  const take = Math.min(Number(pageSize) || 50, 200);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const where = dataType ? { dataType } : undefined;
  const [items, total] = await Promise.all([
    prisma.safetyData.findMany({ where, skip, take }),
    prisma.safetyData.count({ where }),
  ]);

  res.json({ total, page: Number(page), pageSize: take, items });
});

app.use("/api", safetyRoutes);

app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});