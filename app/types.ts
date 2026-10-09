export type Airline = 'ANA' | 'JAL';

export interface FlightLogEx {
  id: string;
  airline: Airline;
  date: string; // YYYY-MM-DD
  year: number; // Derived from date
  origin: string;
  destination: string;
  via: string;
  
  // Points
  pp: number; // Premium Points (ANA) or Fly On Points (JAL)
  lsp: number; // Life Status Points (JAL)
  price: number; // Ticket price in JPY
  
  // Aviation Geek Details
  aircraftType?: string; // e.g., "B787-9", "A350-900"
  registration?: string; // e.g., "JA801A"
  seat?: string; // e.g., "5A"
  flightNumber?: string; // e.g., "NH10" or "JL516"
  
  // Image reference for background
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
  jalTargetType: string;
  activeMode: Airline; // Which airline to display on dashboard
}
