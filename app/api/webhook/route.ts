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
        trackEvent('miniapp_install', {
          fid: body.fid,
          source: 'base_app',
        });
        break;

      case 'frame_removed':
        // User removed the app - track as uninstall
        trackEvent('miniapp_uninstall', {
          fid: body.fid,
        });
        break;

      case 'notifications_enabled':
        // User enabled notifications
        trackEvent('notifications_enabled', {
          fid: body.fid,
        });
        break;

      case 'notifications_disabled':
        // User disabled notifications
        trackEvent('notifications_disabled', {
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

// Structured event logging — retrievable from Vercel/server logs
function trackEvent(event: string, properties: Record<string, unknown>) {
  console.log(JSON.stringify({
    event,
    properties,
    timestamp: new Date().toISOString(),
    source: 'p402-mini',
  }));
}
