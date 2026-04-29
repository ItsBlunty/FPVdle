import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_IMAGE_EXT = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
const ALLOWED_VIDEO_EXT = ['.mp4', '.webm', '.mov'];

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file');
  const kind = String(form.get('kind') || '');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }
  if (kind !== 'image' && kind !== 'video') {
    return NextResponse.json({ error: 'kind must be "image" or "video"' }, { status: 400 });
  }

  const origExt = path.extname(file.name).toLowerCase();
  const allowed = kind === 'image' ? ALLOWED_IMAGE_EXT : ALLOWED_VIDEO_EXT;
  if (!allowed.includes(origExt)) {
    return NextResponse.json(
      { error: `Unsupported ${kind} extension: ${origExt}` },
      { status: 400 },
    );
  }

  const mediaDir = path.resolve(process.env.MEDIA_DIR || './data/media');
  const subdir = kind === 'image' ? 'images' : 'videos';
  const targetDir = path.join(mediaDir, subdir);
  await fs.mkdir(targetDir, { recursive: true });

  const id = crypto.randomBytes(8).toString('hex');
  const filename = `${id}${origExt}`;
  const targetPath = path.join(targetDir, filename);

  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(targetPath, buf);

  const publicPath = `/media/${subdir}/${filename}`;
  return NextResponse.json({ path: publicPath });
}
