import { NextResponse } from 'next/server';
import { getFonnteTokens } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

interface SafeDeviceInfo {
  tier: number;
  index: number;
  status: boolean;
  device_status: string;
  name: string;
  device: string;
  quota: string;
  messages: number;
  expired: string;
}

export async function GET() {
  try {
    const tokens = getFonnteTokens();

    const devices: SafeDeviceInfo[] = await Promise.all(
      tokens.map(async (token, i): Promise<SafeDeviceInfo> => {
        try {
          const response = await fetch('https://api.fonnte.com/device', {
            method: 'POST',
            headers: {
              Authorization: token,
            },
            cache: 'no-store',
          });
          const result = await response.json();

          return {
            tier: i + 1,
            index: i + 1,
            status: Boolean(result?.status),
            device_status: result?.device_status || 'disconnect',
            name: result?.name || '',
            device: result?.device || '',
            quota: String(result?.quota ?? '0'),
            messages: Number(result?.messages ?? 0),
            expired: result?.expired || '',
          };
        } catch {
          return {
            tier: i + 1,
            index: i + 1,
            status: false,
            device_status: 'disconnect',
            name: '',
            device: '',
            quota: '0',
            messages: 0,
            expired: '',
          };
        }
      })
    );

    const connectedDevices = devices.filter(
      (d) => d.status && d.device_status === 'connect'
    );
    const anyConnected = connectedDevices.length > 0;
    const primaryDevice = connectedDevices[0] || devices[0];
    const quotaSource = connectedDevices.length > 0 ? connectedDevices : devices;
    const totalQuota = quotaSource.reduce(
      (sum, d) => sum + (Number(d.quota) || 0),
      0
    );

    return NextResponse.json({
      ok: anyConnected,
      data: {
        status: anyConnected,
        device_status: anyConnected ? 'connect' : 'disconnect',
        name:
          devices.length > 1 && primaryDevice
            ? `Tier ${primaryDevice.index}: ${primaryDevice.name || 'Fonnte'} (Failover ${connectedDevices.length}/${devices.length} Online)`
            : primaryDevice?.name || 'Fonnte Gateway',
        device: primaryDevice?.device || '',
        quota: String(totalQuota),
        mode: 'tiered_failover',
        active_tier: connectedDevices[0]?.index || null,
        active_count: connectedDevices.length,
        total_count: devices.length,
        devices,
      },
    });
  } catch (error: any) {
    console.error('Error checking Fonnte device:', error);
    return NextResponse.json(
      { ok: false, message: error.message || 'Gagal mengecek status perangkat' },
      { status: 500 }
    );
  }
}
