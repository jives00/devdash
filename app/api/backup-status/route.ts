import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const raw = await readFile('/backups/backup_status.json', 'utf-8');
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json(null);
  }
}
