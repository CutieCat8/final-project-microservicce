import app from "./app";

// ── เริ่มต้น server ─────────────────────────────────────────
// อ่าน PORT จาก environment variable (Docker Compose จะตั้งให้ 3000)
// ถ้าไม่มีจะใช้ 3000 เป็นค่าเริ่มต้น
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Notification Service is running on port ${PORT}`);
});
