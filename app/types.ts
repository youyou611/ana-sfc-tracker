export type Airline = 'ANA';

export interface FlightLegDetail {
  origin: string;
  destination: string;
  flightNumber?: string;
  operatingCarrier?: string;
  seat?: string;
  travelClass?: import("./lib/travelClass").TravelClass;
  bookingClass?: string;
  accrualRate?: number;
  aircraftType?: string;
  registration?: string;
}

export interface FlightLogEx {
  id: string;
  airline: Airline;
  /** Actual operating carrier for partner-operated flights; omitted means ANA for older records. */
  operatingCarrier?: string;
  date: string; // YYYY-MM-DD
  year: number; // Derived from date
  origin: string;
  destination: string;
  via: string;
  /** Per-leg details for connections. Optional to preserve older saved records. */
  legs?: FlightLegDetail[];
  
  // Points
  pp: number; // ANA Premium Points
  lsp: number; // Retained as 0 for compatibility with the former mixed record format
  price: number; // Ticket price in JPY
  
  // Aviation Geek Details
  aircraftType?: string; // e.g., "B787-9", "A350-900"
  registration?: string; // e.g., "JA801A"
  seat?: string; // e.g., "5A"
  flightNumber?: string; // e.g., "NH10" or "JL516"
  flightMode?: "domestic" | "international";
  travelClass?: import("./lib/travelClass").TravelClass;
  bookingClass?: string;
  /** The verified ANA Mileage Club accrual percentage for partner-operated flights, when known. */
  accrualRate?: number;
  /** Boarding points for partner-operated international flights, when verified from the applicable accrual rate. */
  boardingPoints?: number;
  /** Distance source used by the PP calculation. */
  distanceSource?: "ana-chart" | "manual-official" | "great-circle";
  memo?: string;
  // Photos attached to the flight memo; imageId remains the optional cover-photo override.
  memoImageIds?: string[];
  // Selected livery image path for this flight.
  aircraftImagePath?: string;
  // Optional user-uploaded aircraft background stored in the images object store.
  aircraftCustomImageId?: string;
  
  // Image reference for the flight's cover/background
  imageId?: string; 
  
  // Legacy fields map:
  // legacy id -> id
  // legacy date -> date
  // legacy year -> year
  // legacy origin -> origin
  // legacy destination -> destination
  // legacy via -> via
  // legacy pp -> pp
  // legacy price -> price
  // missing fields will be default: airline='ANA', lsp=0
}

export interface FlightImage {
  id: string; // matches FlightLogEx.imageId
  data: string; // base64 data url
}

export interface Settings {
  anaTargetType: string;
}

