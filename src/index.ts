import app from "./app.js";
import "../src/workers/monitor.worker.js";
import "../src/workers/notification.worker.js";
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Keep alive api running on port ${port}`);
});
