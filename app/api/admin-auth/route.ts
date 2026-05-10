import { NextRequest, NextResponse } from 'next/server'
import {
  clearAdminSessionCookie,
  hasValidAdminSession,
  isValidAdminPassword,
  setAdminSessionCookie,
} from '@/lib/admin-auth'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  return NextResponse.json({ authenticated: hasValidAdminSession(req) })
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const limit = checkRateLimit(`admin-auth:${ip}`, 8, 5 * 60 * 1000)

    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(limit.retryAfter) },
        }
      )
    }

    const body = await req.json().catch(() => null)
    const password = body?.password

    if (!isValidAdminPassword(password)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })
    setAdminSessionCookie(response)
    return response
  } catch (err) {
    console.error('Admin auth error:', err)
    return NextResponse.json(
      { error: 'Admin authentication is not configured correctly' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  clearAdminSessionCookie(response)
  return response
}
