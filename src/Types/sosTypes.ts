import { Document, Types } from 'mongoose';

export type SOSStatus = 'active' | 'acknowledged' | 'responding' | 'resolved';
export type SOSTriggerType = 'button';

export interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: Date;
}

export interface ISOS {
  userId: Types.ObjectId;
  status: SOSStatus;
  triggerType: SOSTriggerType;
  location: {
    latitude: number;
    longitude: number;
  };
  latestLocation?: LocationPoint;
  locationHistory?: LocationPoint[];
  note?: string;
  acknowledgedAt?: Date;
  respondedAt?: Date;
  resolvedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SOSDocument extends ISOS, Document {}
