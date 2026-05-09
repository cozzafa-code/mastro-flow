import type { DeviceInfo } from './types';

export function detectDevice(): DeviceInfo {
  if (typeof window === 'undefined') return {};

  const ua = navigator.userAgent;
  let modello = 'Unknown';
  let os = 'Unknown';
  let browser = 'Unknown';

  if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac/i.test(ua)) os = 'macOS';

  if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Edg/i.test(ua)) browser = 'Edge';

  const iPhoneMatch = ua.match(/iPhone OS (\d+)/);
  if (iPhoneMatch) modello = `iPhone iOS ${iPhoneMatch[1]}`;
  const androidMatch = ua.match(/;\s([^;)]+)\sBuild/);
  if (androidMatch) modello = androidMatch[1].trim();

  return { modello, os, browser, user_agent: ua };
}

export function getGeoPosition(): Promise<{
  lat: number; lng: number; accuracy: number;
} | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return resolve(null);
    }

    const timeout = setTimeout(() => resolve(null), 4000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeout);
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      () => {
        clearTimeout(timeout);
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: 4000, maximumAge: 60000 }
    );
  });
}
