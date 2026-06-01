import cors from "cors";
import express from "express";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "TIMsys backend",
    preview: "1"
  });
});

app.get("/api/status", (_req, res) => {
  res.json({
    supabase: "ready-to-connect",
    persistence: "mocked-in-preview-1",
    smartPropertyHunter: "prepared-for-ai"
  });
});

app.listen(port, () => {
  console.log(`TIMsys backend listening on ${port}`);
});
