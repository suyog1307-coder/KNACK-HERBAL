import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface DistanceResult {
  distanceMeters: number;
  distanceText: string;
  durationSeconds: number;
  durationText: string;
}

/**
 * GoogleMapsService — wraps Google Maps Distance Matrix and Geocoding APIs.
 *
 * Requires: GOOGLE_MAPS_API_KEY in .env
 *
 * Used by DeliveryService for:
 *  - Estimating delivery time between warehouse and customer address
 *  - Geocoding customer address to lat/lng for live tracking display
 */
@Injectable()
export class GoogleMapsService {
  private readonly logger = new Logger(GoogleMapsService.name);
  private readonly apiKey: string | undefined;
  private readonly BASE = 'https://maps.googleapis.com/maps/api';

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('GOOGLE_MAPS_API_KEY');
    if (!this.apiKey) {
      this.logger.warn('GOOGLE_MAPS_API_KEY not set — Google Maps features disabled');
    }
  }

  private get isEnabled() {
    return !!this.apiKey;
  }

  /**
   * Get distance and estimated travel time between two addresses/coordinates.
   * Returns null if API key is not configured.
   */
  async getDistance(origin: string, destination: string): Promise<DistanceResult | null> {
    if (!this.isEnabled) return null;

    try {
      const url = `${this.BASE}/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&units=metric&key=${this.apiKey}`;
      const res = await fetch(url);
      const data: any = await res.json();

      const element = data?.rows?.[0]?.elements?.[0];
      if (!element || element.status !== 'OK') return null;

      return {
        distanceMeters: element.distance.value,
        distanceText: element.distance.text,
        durationSeconds: element.duration.value,
        durationText: element.duration.text,
      };
    } catch (err) {
      this.logger.error('Google Maps distance request failed', err);
      return null;
    }
  }

  /**
   * Geocode a human-readable address to lat/lng.
   * Returns null if API key is not configured or address not found.
   */
  async geocode(address: string): Promise<LatLng | null> {
    if (!this.isEnabled) return null;

    try {
      const url = `${this.BASE}/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`;
      const res = await fetch(url);
      const data: any = await res.json();

      const location = data?.results?.[0]?.geometry?.location;
      if (!location) return null;

      return { lat: location.lat, lng: location.lng };
    } catch (err) {
      this.logger.error('Google Maps geocode request failed', err);
      return null;
    }
  }

  /**
   * Reverse-geocode lat/lng to a human-readable address string.
   */
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    if (!this.isEnabled) return null;

    try {
      const url = `${this.BASE}/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}`;
      const res = await fetch(url);
      const data: any = await res.json();

      return data?.results?.[0]?.formatted_address ?? null;
    } catch (err) {
      this.logger.error('Google Maps reverse geocode request failed', err);
      return null;
    }
  }
}
