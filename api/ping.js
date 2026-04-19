// Vercel cron job — houdt Supabase actief door elke 3 dagen een lichte query te doen.
// Aangeroepen via: GET /api/ping (door Vercel Cron)

export default async function handler(req, res) {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY

  if (!url || !key) {
    return res.status(500).json({ error: 'Missing Supabase env vars' })
  }

  try {
    const response = await fetch(`${url}/rest/v1/settings?select=key&limit=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    })

    if (!response.ok) {
      return res.status(500).json({ error: 'Supabase ping failed', status: response.status })
    }

    return res.status(200).json({ ok: true, time: new Date().toISOString() })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
