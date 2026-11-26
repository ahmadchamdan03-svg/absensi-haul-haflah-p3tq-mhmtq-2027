import { NextResponse } from 'next/server';
import { getFonnteTokens } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

interface SafeDeviceInfo {
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
    const totalQuota = devices.reduce(
      (sum, d) => sum + (Number(d.quota) || 0),
      0
    );
    const sourceList = connectedDevices.length > 0 ? connectedDevices : devices;
    const displayNames = sourceList.map((d) => d.name).filter(Boolean);
    const displayNumbers = sourceList.map((d) => d.device).filter(Boolean);

    return NextResponse.json({
      ok: anyConnected,
      data: {
        status: anyConnected,
        device_status: anyConnected ? 'connect' : 'disconnect',
        name:
          devices.length > 1
            ? `${displayNames.join(' & ') || 'Fonnte Multi-Device'} (Bergantian ${connectedDevices.length}/${devices.length})`
            : displayNames[0] || 'Fonnte Gateway',
        device: displayNumbers.join(' / '),
        quota: String(totalQuota),
        rotation: devices.length > 1,
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
