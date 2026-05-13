const PDFDocument = require("pdfkit");

function generateHealthReportPDF(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const buffers = [];

    doc.on("data", chunk => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    const { date, patientName, vitals, medications, status } = data;

    // ── HEADER ──
    doc.rect(0, 0, 595, 80).fill("#353b2e");
    doc.fillColor("#c4a96b").font("Helvetica-Bold").fontSize(22)
       .text("CARVÈL", 50, 22, { align: "left" });
    doc.fillColor("#f5f0e6").font("Helvetica").fontSize(9)
       .text("ELDERLY CARE MANAGEMENT SYSTEM", 50, 48, { align: "left" });
    doc.fillColor("#f5f0e6").font("Helvetica").fontSize(9)
       .text("Daily Health Report", 400, 22)
       .text(new Date(date).toLocaleDateString("en-IN", {
         weekday: "long", year: "numeric", month: "long", day: "numeric"
       }), 400, 36);

    doc.moveDown(3);

    // ── PATIENT INFO ──
    doc.fillColor("#353b2e").font("Helvetica-Bold").fontSize(13)
       .text("Patient Information", 50, 100);
    doc.moveTo(50, 116).lineTo(545, 116).strokeColor("#e8e0d0").stroke();

    doc.fillColor("#2a2a22").font("Helvetica").fontSize(11)
       .text(`Patient Name:`, 50, 125).font("Helvetica-Bold")
       .text(patientName || "N/A", 160, 125);

    // Status badge
    const statusColor = status === "Critical" ? "#c0614a" : status === "Warning" ? "#c4a96b" : "#5a8f6a";
    doc.roundedRect(380, 118, 120, 22, 5).fill(statusColor);
    doc.fillColor("white").font("Helvetica-Bold").fontSize(10)
       .text(`Status: ${status || "Stable"}`, 385, 123, { width: 110, align: "center" });

    doc.moveDown(2);

    // ── VITALS SECTION ──
    doc.fillColor("#353b2e").font("Helvetica-Bold").fontSize(13)
       .text("Vitals Summary", 50, 160);
    doc.moveTo(50, 176).lineTo(545, 176).strokeColor("#e8e0d0").stroke();

    if (vitals && vitals.length > 0) {
      const latest = vitals[vitals.length - 1];

      // Vitals grid
      const vitalItems = [
        { label: "Temperature", value: `${latest.temperature || "—"}°F`, danger: Number(latest.temperature) >= 102 },
        { label: "Pulse", value: `${latest.pulse || "—"} bpm`, danger: Number(latest.pulse) > 120 },
        { label: "Blood Pressure", value: latest.bloodPressure || "—", danger: false },
        { label: "Oxygen Saturation", value: `${latest.oxygen || "—"}%`, danger: Number(latest.oxygen) < 90 },
      ];

      let x = 50; let y = 185;
      vitalItems.forEach((v, i) => {
        const boxColor = v.danger ? "#fdf0ee" : "#f5f5f0";
        const borderColor = v.danger ? "#c0614a" : "#e8e0d0";
        doc.roundedRect(x, y, 115, 55, 5).fillAndStroke(boxColor, borderColor);
        doc.fillColor(v.danger ? "#c0614a" : "#7a7a68").font("Helvetica").fontSize(8)
           .text(v.label.toUpperCase(), x + 8, y + 8, { width: 100 });
        doc.fillColor(v.danger ? "#c0614a" : "#2a2a22").font("Helvetica-Bold").fontSize(16)
           .text(v.value, x + 8, y + 22, { width: 100 });
        x += 125;
      });

      // Notes
      if (latest.notes) {
        doc.fillColor("#7a7a68").font("Helvetica").fontSize(9)
           .text(`Caretaker Notes: ${latest.notes}`, 50, 250);
      }

      // Vitals history table
      if (vitals.length > 1) {
        doc.fillColor("#353b2e").font("Helvetica-Bold").fontSize(11)
           .text("Vitals Log (Today)", 50, 270);
        doc.moveTo(50, 283).lineTo(545, 283).strokeColor("#e8e0d0").stroke();

        // Table header
        doc.rect(50, 285, 495, 18).fill("#353b2e");
        doc.fillColor("#f5f0e6").font("Helvetica-Bold").fontSize(8)
           .text("TIME", 55, 290)
           .text("TEMP (°F)", 130, 290)
           .text("PULSE (bpm)", 210, 290)
           .text("BP (mmHg)", 310, 290)
           .text("O₂ (%)", 410, 290);

        let rowY = 305;
        vitals.slice(-5).forEach((v, i) => {
          if (i % 2 === 0) doc.rect(50, rowY - 2, 495, 16).fill("#f9f7f4");
          doc.fillColor("#2a2a22").font("Helvetica").fontSize(8)
             .text(v.date ? new Date(v.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—", 55, rowY)
             .text(v.temperature || "—", 130, rowY)
             .text(v.pulse || "—", 210, rowY)
             .text(v.bloodPressure || "—", 310, rowY)
             .text(v.oxygen || "—", 410, rowY);
          rowY += 16;
        });
      }
    } else {
      doc.fillColor("#7a7a68").font("Helvetica").fontSize(10)
         .text("No vitals recorded today.", 50, 185);
    }

    // ── MEDICATIONS SECTION ──
    const medY = vitals && vitals.length > 1 ? 420 : 270;
    doc.fillColor("#353b2e").font("Helvetica-Bold").fontSize(13)
       .text("Medication Summary", 50, medY);
    doc.moveTo(50, medY + 16).lineTo(545, medY + 16).strokeColor("#e8e0d0").stroke();

    if (medications && medications.length > 0) {
      const given  = medications.filter(m => m.status === "given").length;
      const missed = medications.filter(m => m.status === "missed").length;

      // Summary pills
      doc.roundedRect(50, medY + 22, 100, 28, 5).fill("#edf7f0");
      doc.fillColor("#5a8f6a").font("Helvetica-Bold").fontSize(11)
         .text(`✓ ${given} Given`, 55, medY + 31, { width: 90, align: "center" });

      doc.roundedRect(160, medY + 22, 100, 28, 5).fill("#fdf0ee");
      doc.fillColor("#c0614a").font("Helvetica-Bold").fontSize(11)
         .text(`✗ ${missed} Missed`, 165, medY + 31, { width: 90, align: "center" });

      // Med list
      let mY = medY + 58;
      medications.slice(0, 6).forEach((m, i) => {
        const bg = m.status === "given" ? "#f0f7f2" : m.status === "missed" ? "#fdf0ee" : "#fdf8ee";
        const color = m.status === "given" ? "#5a8f6a" : m.status === "missed" ? "#c0614a" : "#9a7530";
        doc.roundedRect(50, mY, 495, 20, 3).fill(bg);
        doc.fillColor(color).font("Helvetica-Bold").fontSize(9)
           .text(`[${(m.status || "pending").toUpperCase()}]`, 55, mY + 6, { width: 70 });
        doc.fillColor("#2a2a22").font("Helvetica").fontSize(9)
           .text(`${m.medication || "—"}  •  ${m.dosage || ""}  •  ${m.time || ""}`, 130, mY + 6);
        mY += 24;
      });
    } else {
      doc.fillColor("#7a7a68").font("Helvetica").fontSize(10)
         .text("No medications recorded today.", 50, medY + 25);
    }

    // ── FOOTER ──
    doc.rect(0, 780, 595, 62).fill("#353b2e");
    doc.fillColor("rgba(245,240,230,0.4)").font("Helvetica").fontSize(8)
       .text("This report was automatically generated by Carvèl Elderly Care System.", 50, 790, { align: "center", width: 495 })
       .text("For emergencies, please contact your caretaker immediately.", 50, 803, { align: "center", width: 495 });
    doc.fillColor("#c4a96b").font("Helvetica-Bold").fontSize(8)
       .text("Carvèl — Care Well for those who once cared for us.", 50, 820, { align: "center", width: 495 });

    doc.end();
  });
}

module.exports = { generateHealthReportPDF };