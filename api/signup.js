// /api/signup.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { email, reward } = req.body || {};
    const emailOk = typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!emailOk) {
      return res.status(400).json({ ok: false, error: 'Invalid email' });
    }

    if (!reward || !['report', 'icebreakers', 'memes'].includes(reward)) {
      return res.status(400).json({ ok: false, error: 'Invalid reward' });
    }

    const API_KEY = process.env.RESEND_API_KEY;
    const FROM = process.env.FROM_EMAIL || 'Sygn Language <hello@sygnlanguage.com>';

    if (!API_KEY) {
      console.error('Missing RESEND_API_KEY env var');
      return res.status(500).json({ ok: false, error: 'Server not configured' });
    }

    // subjects + bodies
    const subjects = {
      report: "✨ Your Mini Zodiac Report",
      icebreakers: "🎲 Your Icebreaker Pack",
      memes: "😂 Your Toxic Meme Drop",
    };

    const bodies = {
      report: `
        <h1 style="margin:0 0 12px">Your Mini Zodiac Report ✨</h1>
        <p>Welcome to Sygn Language. Here’s a tiny cosmic snapshot to keep:</p>
        <ul>
          <li><b>Strength today:</b> honest connection</li>
          <li><b>Watch-out:</b> overthinking replies</li>
          <li><b>Vibe check:</b> choose patience over proof</li>
        </ul>
        <p>More deep-dive stuff coming soon. You’re on the list.</p>
      `,
      icebreakers: `
        <h1 style="margin:0 0 12px">3 Icebreakers for Tonight 🎲</h1>
        <ol>
          <li>Playful: Rate my vibe today 1–10. Be honest 👀</li>
          <li>Deep: What’s one thing you wish I understood better about you?</li>
          <li>Plan: Pick one — night drive + music or noodles + arcade?</li>
        </ol>
        <p>Reply if you want a set tailored to your pairing. We’ll cook it up.</p>
      `,
      memes: `
        <h1 style="margin:0 0 12px">Your Toxic Meme Drop 😂</h1>
        <p>Ok, chaos goblin — your meme pack is ready:</p>
        <ul>
          <li>We outside 🔥 (might delete later idk)</li>
          <li>Running 10 min late. 10 or 12? Be specific.</li>
          <li>I ordered fries for the table. Do not touch <i>mine</i>.</li>
        </ul>
        <p>More spicy stuff soon. Thanks for joining.</p>
      `
    };

    const subject = subjects[reward] || "✨ Welcome to Sygn Language";
    const html = bodies[reward] || "<p>Welcome! You’re on the list.</p>";

    // Send via Resend REST API
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,                 // e.g., "Sygn Language <hello@yourdomain.com>"
        to: [email],                // array is safest with Resend
        subject,
        html,
      }),
    });

    if (!r.ok) {
      const text = await r.text().catch(()=> '');
      console.error('Resend error:', text || r.status);
      return res.status(500).json({ ok: false, error: 'Email send failed' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
