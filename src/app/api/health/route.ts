import { NextResponse } from 'next/server';

// Simple diagnostic endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    message: 'API is working'
  });
}

export async function POST() {
  return NextResponse.json({
    status: 'ok',
    message: 'POST is working'
  });
}
