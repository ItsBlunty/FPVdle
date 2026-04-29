import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, checkPassword, signAdminToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface LoginBody {
  username: string;
  password: string;
}

export async function POST(req: NextRequest) {
  let body: LoginBody;
  try {
    body = (await req.json()) as LoginBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { username, password } = body;

  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedHash = process.env.ADMIN_PASSWORD_HASH;
  if (!expectedUser || !expectedHash) {
    return NextResponse.json({ error: 'Admin not configured' }, { status: 500 });
  }

  if (username !== expectedUser) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  const ok = await checkPassword(password, expectedHash);
  if (!ok) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = await signAdminToken(username);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
  return res;
}
