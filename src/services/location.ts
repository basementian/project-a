import type { DipLocation } from '@/types/dip';

export function getCurrentPosition(): Promise<DipLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  });
}

export function watchPosition(callback: (loc: DipLocation) => void): number {
  return navigator.geolocation.watchPosition(
    (pos) => callback({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
    () => {},
    { enableHighAccuracy: true }
  );
}

export function stopWatching(watchId: number): void {
  navigator.geolocation.clearWatch(watchId);
}

export function distanceBetween(a: DipLocation, b: DipLocation): number {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const calc = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(calc), Math.sqrt(1 - calc));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function isWithinProximity(
  userLoc: DipLocation,
  targetLoc: DipLocation,
  thresholdMeters = 200
): boolean {
  return distanceBetween(userLoc, targetLoc) <= thresholdMeters;
}
