import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET() {
  try {
    // Try to reach the backend health endpoint
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        status: 'ok',
        frontend: 'healthy',
        backend: data,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json({
        status: 'degraded',
        frontend: 'healthy',
        backend: 'unhealthy',
        timestamp: new Date().toISOString(),
      }, { status: 503 });
    }
  } catch (error) {
    // Backend not available, return frontend health only
    return NextResponse.json({
      status: 'degraded',
      frontend: 'healthy',
      backend: 'unavailable',
      message: 'Backend service is not responding',
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
