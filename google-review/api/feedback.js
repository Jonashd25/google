const { Resend } = require("resend");

// Konfiguration
const NOTIFICATION_EMAIL = "feedback@beispiel.de";

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function isEmail(value) {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return json(res, 405, { success: false, error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const body = req.body || {};
    const rating = Number(body.rating);
    const message = (body.message || "").trim();
    const businessName = (body.businessName || "").trim();
    const email = (body.email || "").trim();
    const timestamp = body.timestamp || new Date().toISOString();
    const userAgent = body.userAgent || "unknown";

    if (rating !== 1 && rating !== 2 && rating !== 3) {
      return json(res, 400, { success: false, error: "INVALID_RATING" });
    }

    if (message.length < 5) {
      return json(res, 400, { success: false, error: "INVALID_MESSAGE" });
    }

    if (email && !isEmail(email)) {
      return json(res, 400, { success: false, error: "INVALID_EMAIL" });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "Feedback <no-reply@resend.dev>",
      to: [NOTIFICATION_EMAIL],
      subject: `Feedback für ${businessName || "Business"}`,
      text: [
        `Business: ${businessName || "-"}`,
        `Bewertung: ${rating}`,
        `Nachricht: ${message}`,
        `E-Mail: ${email || "-"}`,
        `Zeitpunkt: ${timestamp}`,
        `User-Agent: ${userAgent}`
      ].join("\n")
    });

    return json(res, 200, { success: true });
  } catch (err) {
    return json(res, 500, { success: false, error: "SERVER_ERROR" });
  }
};
