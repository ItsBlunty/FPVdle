import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
};

export async function GET(_req: NextRequest, { params }: { params: { path: string[] } }) {
  const mediaDir = path.resolve(process.env.MEDIA_DIR || './data/media');
  const requested = path.resolve(mediaDir, ...(params.path || []));

  // Path traversal guard: requested must live inside mediaDir.
  if (!requested.startsWith(mediaDir + path.sep) && requested !== mediaDir) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const stat = await fs.stat(requested);
    if (!stat.isFile()) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const data = await fs.readFile(requested);
    const ext = path.extname(requested).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Length': String(stat.size),
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
