export type DipType = 'seat' | 'desk' | 'queue' | 'charger' | 'other';
export type DipStatus = 'active' | 'claimed' | 'expired' | 'completed';
export type AccessMethod = 'code' | 'qr' | 'physical_handoff' | 'meet_confirm';

export interface DipLocation {
  lat: number;
  lng: number;
}

export interface Dip {
  id: string;
  type: DipType;
  location: DipLocation;
  available_until: string;
  price: number;
  access_method: AccessMethod;
  rules?: string;
  status: DipStatus;
  owner_id: string;
  claimer_id?: string;
  access_instructions?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface CreateDipPayload {
  type: DipType;
  lat: number;
  lng: number;
  available_until: string;
  price: number;
  access_method: AccessMethod;
  rules?: string;
  access_instructions?: string;
}

export interface DipFilter {
  maxDistance: number;
  maxPrice?: number;
  minTimeRemaining?: number;
  types?: DipType[];
}

export const DIP_TYPE_LABELS: Record<DipType, string> = {
  seat: 'Seat',
  desk: 'Desk',
  queue: 'Queue Spot',
  charger: 'Charger',
  other: 'Other',
};

export const DIP_TYPE_ICONS: Record<DipType, string> = {
  seat: '\u{1fa91}',
  desk: '\u{1f5a5}',
  queue: '\u{1f522}',
  charger: '\u{1f50c}',
  other: '\u{1f4cd}',
};

export const ACCESS_METHOD_LABELS: Record<AccessMethod, string> = {
  code: 'Access Code',
  qr: 'QR Code',
  physical_handoff: 'Physical Handoff',
  meet_confirm: 'Meet & Confirm',
};
