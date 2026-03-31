import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.HASURA_URL
  const secret = process.env.HASURA_ADMIN_SECRET

  if (!url || !secret) {
    return NextResponse.json({ 
      error: 'env vars missing',
      HASURA_URL: url ?? 'NOT SET',
      HASURA_ADMIN_SECRET: secret ?? 'NOT SET'
    })
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': secret,
      },
      body: JSON.stringify({ 
        query: '{ interns_aggregate { aggregate { count } } }' 
      }),
    })
    const json = await res.json()
    return NextResponse.json({ success: true, data: json })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message })
  }
}