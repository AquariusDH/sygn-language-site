// api/signup.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { email, reward } = req.body || {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ ok: false, error: 'Invalid email' });
    }

    const API_KEY = process.env.RESEND_API_KEY;
    const FROM = process.env.FROM_EMAIL || 'Sygn Language <hello@sygnlanguage.com>';
    if (!API_KEY) {
      return res.status(500).json({ ok: false, error: 'Missing RESEND_API_KEY' });
    }

    // simple content (no rewards needed now, but leaving structure)
    const subjects = {
      waitlist: "🎉 You’re on the Sygn Language waitlist",
    };
    const bodies = {
      waitlist: `
        <h1 style="margin:0 0 12px">Welcome to Sygn Language ✨</h1>
        <p>Thanks for joining the waitlist for the Zodiac Translator.</p>
        <p>We’ll email you the moment the app is live.</p>
        <p style="margin-top:16px">— The Sygn Language Team</p>
      `
    };

    const subject = subjects[reward] || "You’re on the list";
    const html = bodies[reward] || "<p>Thanks for joining the waitlist.</p>";

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: email,
        subject,
        html,
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error('Resend error:', text);
      return res.status(500).json({ ok: false, error: 'Email send failed' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
