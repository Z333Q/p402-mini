import { NextRequest, NextResponse } from 'next/server';

/**
 * Webhook handler for Base Mini App events
 * 
 * Events received:
 * - frame_added: User added app to home screen
 * - frame_removed: User removed app
 * - notifications_enabled: User enabled notifications
 * - notifications_disabled: User disabled notifications
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Log event for analytics
    console.log('[P402 MiniApp Event]', {
      type: body.type,
      fid: body.fid,
      timestamp: new Date().toISOString(),
    });

    // Handle different event types
    switch (body.type) {
      case 'frame_added':
        // User added the app - track as install
        await trackEvent('miniapp_install', {
          fid: body.fid,
          source: 'base_app',
        });
        break;

      case 'frame_removed':
        // User removed the app - track as uninstall
        await trackEvent('miniapp_uninstall', {
          fid: body.fid,
        });
        break;

      case 'notifications_enabled':
        // User enabled notifications
        await trackEvent('notifications_enabled', {
          fid: body.fid,
        });
        break;

      case 'notifications_disabled':
        // User disabled notifications
        await trackEvent('notifications_disabled', {
          fid: body.fid,
        });
        break;

      default:
        console.log('Unknown event type:', body.type);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[P402 MiniApp Webhook Error]', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// Simple event tracking - can be replaced with actual analytics
async function trackEvent(event: string, properties: Record<string, any>) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Track] ${event}`, properties);
    return;
  }

  // In production, send to P402 analytics endpoint
  try {
    await fetch(`${process.env.P402_API_URL || 'https://p402.io'}/api/v2/analytics/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-p402-source': 'base-miniapp',
      },
      body: JSON.stringify({
        event,
        properties,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (e) {
    console.error('Failed to track event:', e);
  }
}
