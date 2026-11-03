import { isDestinationId } from '@globeguide/domain';

import { japanTripDestinationId, getJapanRouteTemplate, type JapanRouteTemplateId } from './japan-trip';

const STORAGE_KEY = 'globeguide:trips:v1';
const VERSION = 1;
const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface Trip {
  version: 1;
  id: string;
  title: string;
  destinationId: string;
  startDate: string | null;
  endDate: string | null;
  notes: string;
  highlightIds: string[];
  route?: { kind: 'japan'; templateId: JapanRouteTemplateId };
  updatedAt: string;
}

interface TripArchive {
  version: 1;
  trips: Trip[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parts = value.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function parseTrip(value: unknown): Trip {
  if (!isRecord(value) || value.version !== VERSION || typeof value.id !== 'string' || !ID_PATTERN.test(value.id)) {
    throw new Error('Invalid trip ID or version.');
  }
  if (typeof value.title !== 'string' || !value.title.trim() || value.title.length > 100) {
    throw new Error('Trip title must be 1 to 100 characters.');
  }
  if (typeof value.destinationId !== 'string' || !isDestinationId(value.destinationId)) {
    throw new Error('Choose a supported destination.');
  }
  if (!((value.startDate === null && value.endDate === null) ||
    (isDate(value.startDate) && isDate(value.endDate) && value.startDate <= value.endDate))) {
    throw new Error('Enter a valid date range, or leave both dates empty.');
  }
  if (typeof value.notes !== 'string' || value.notes.length > 4000) {
    throw new Error('Trip notes must be under 4,000 characters.');
  }
  if (!Array.isArray(value.highlightIds) || value.highlightIds.length > 100 ||
    !value.highlightIds.every((id) => typeof id === 'string' && id.length > 0 && id.length <= 100) ||
    new Set(value.highlightIds).size !== value.highlightIds.length) {
    throw new Error('Trip stops must be unique valid highlight IDs.');
  }
  let route: Trip['route'];
  if (value.route !== undefined) {
    if (!isRecord(value.route) || value.route.kind !== 'japan' || value.destinationId !== japanTripDestinationId ||
      typeof value.route.templateId !== 'string' || !getJapanRouteTemplate(value.route.templateId)) {
      throw new Error('Invalid route template.');
    }
    route = { kind: 'japan', templateId: value.route.templateId as JapanRouteTemplateId };
  }
  if (typeof value.updatedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value.updatedAt) ||
    !Number.isFinite(Date.parse(value.updatedAt))) {
    throw new Error('Invalid trip update time.');
  }
  return {
    version: 1,
    id: value.id,
    title: value.title.trim(),
    destinationId: value.destinationId,
    startDate: value.startDate,
    endDate: value.endDate,
    notes: value.notes,
    highlightIds: [...value.highlightIds],
    ...(route ? { route } : {}),
    updatedAt: value.updatedAt,
  } as Trip;
}

function parseArchive(value: unknown): TripArchive {
  if (!isRecord(value) || value.version !== VERSION || !Array.isArray(value.trips) || value.trips.length > 500) {
    throw new Error('Invalid or unsupported trip file.');
  }
  const trips = value.trips.map(parseTrip);
  if (new Set(trips.map((trip) => trip.id)).size !== trips.length) {
    throw new Error('Trip file contains duplicate IDs.');
  }
  return { version: 1, trips };
}

function writeTrips(trips: Trip[], storage: Storage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, trips } satisfies TripArchive));
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('globeguide:trips-change'));
}

export function readTrips(storage: Storage = localStorage): Trip[] {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw === null ? [] : parseArchive(JSON.parse(raw)).trips;
  } catch {
    return [];
  }
}

export function saveTrip(value: Trip, storage: Storage = localStorage): Trip {
  const trip = parseTrip(value);
  const trips = readTrips(storage);
  const index = trips.findIndex((item) => item.id === trip.id);
  if (index < 0) trips.unshift(trip);
  else trips[index] = trip;
  if (trips.length > 500) throw new Error('Trip limit reached. Export older plans before adding more.');
  writeTrips(trips, storage);
  return trip;
}

export function deleteTrip(id: string, storage: Storage = localStorage): void {
  writeTrips(readTrips(storage).filter((trip) => trip.id !== id), storage);
}

export function exportTrips(storage: Storage = localStorage): string {
  const raw = storage.getItem(STORAGE_KEY);
  const trips = raw === null ? [] : parseArchive(JSON.parse(raw)).trips;
  return JSON.stringify({ version: VERSION, trips } satisfies TripArchive, null, 2);
}

export function importTrips(json: string, storage: Storage = localStorage): Trip[] {
  const incoming = parseArchive(JSON.parse(json));
  const merged = new Map(readTrips(storage).map((trip) => [trip.id, trip]));
  incoming.trips.forEach((trip) => merged.set(trip.id, trip));
  const trips = [...merged.values()];
  if (trips.length > 500) throw new Error('Trip file exceeds the 500-trip limit.');
  writeTrips(trips, storage);
  return trips;
}
