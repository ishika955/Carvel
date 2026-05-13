const cron = require("node-cron");
const { readJSON } = require("./fileStore");
const { sendAlert } = require("./emailService");
const { generateHealthReportPDF } = require("./pdfService");
const User = require("../models/User");

function startScheduler() {
  cron.schedule("0 21 * * *", async () => {
    console.log("📧 Running 9 PM daily health report...");
    try {
      const today = new Date().toDateString();
      const allData = await readJSON("data/patients.json", []);

      const familyUsers = await User.find({ 
        role: "family", 
        notifyEmail: { $exists: true, $ne: null } 
      });

      for (const family of familyUsers) {
        // Sirf us family ke patients ki data
        const myPatients = family.patients || [];
        if (!myPatients.length) continue;

        for (const patientName of myPatients) {
          const todayVitals = allData.filter(e =>
            e.type === "vitals" &&
            e.patientName === patientName &&
            new Date(e.date).toDateString() === today
          );
          const todayMeds = allData.filter(e =>
            e.type === "medication" &&
            e.patientName === patientName &&
            new Date(e.date || Date.now()).toDateString() === today
          );

          if (!todayVitals.length && !todayMeds.length) continue;

          const latest = todayVitals[todayVitals.length - 1];
          let status = "Stable";
          if (latest) {
            if (Number(latest.temperature) >= 102 || Number(latest.oxygen) < 90) status = "Critical";
            else if (Number(latest.pulse) > 120 || Number(latest.temperature) >= 100) status = "Warning";
          }

          const pdfBuffer = await generateHealthReportPDF({
            date: new Date(),
            patientName,
            vitals: todayVitals,
            medications: todayMeds,
            status
          });

          await sendAlert({
            subject: `📋 Carvèl Daily Report — ${patientName} — ${new Date().toLocaleDateString("en-IN")}`,
            title: `📋 Daily Health Summary for ${patientName}`,
            message: `Here is today's complete health report for ${patientName}.`,
            details: `Status: ${status} | Vitals: ${todayVitals.length} | Medications: ${todayMeds.length}`,
            recipients: [family.notifyEmail],
            pdfBuffer
          });

          console.log(`✅ Report sent to ${family.notifyEmail} for ${patientName}`);
        }
      }
    } catch (err) {
      console.error("❌ Scheduler error:", err.message);
    }
  });

  console.log("⏰ Scheduler started — daily report at 9 PM");
}

module.exports = { startScheduler };