export interface SOSRequestBody {
  location: {
    latitude: number;
    longitude: number;
  };
  note?: string;
}

export function isValidSOSRequest(body: unknown): body is SOSRequestBody {
  if (body === null || body === undefined || typeof body !== 'object') {
    return false;
  }

  const b = body as Record<string, unknown>;

  // Check location exists and is an object
  if (!b.location || typeof b.location !== 'object' || b.location === null) {
    return false;
  }

  const loc = b.location as Record<string, unknown>;

  // Check latitude and longitude are numbers
  if (typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number') {
    return false;
  }

  // Check latitude/longitude ranges
  if (
    loc.latitude < -90 ||
    loc.latitude > 90 ||
    loc.longitude < -180 ||
    loc.longitude > 180
  ) {
    return false;
  }

  // Optional note must be string if present
  if (b.note !== undefined && typeof b.note !== 'string') {
    return false;
  }

  return true;
}
