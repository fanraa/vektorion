import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix leafet default icon issue
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapLocationPickerProps {
  onLocationSelect: (address: string) => void;
}

function LocationMarker({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onSelect(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
}

export function MapLocationPicker({ onLocationSelect }: MapLocationPickerProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Custom reverse geocoding via Nominatim
  const handleSelect = async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await res.json();
      if (data && data.display_name) {
        let address = data.display_name;
        if (data.address) {
            const a = data.address;
            const pieces = [a.amenity, a.road || a.pedestrian, a.suburb, a.city || a.town || a.village].filter(Boolean);
            if (pieces.length > 0) {
                address = pieces.join(', ');
            }
        }
        onLocationSelect(address);
      }
    } catch (e) {
      console.error("Geocoding failed", e);
    }
    setIsLoading(false);
  };

  return (
    <div className="relative w-full h-[220px] rounded-md overflow-hidden border border-slate-200 shadow-inner mt-2">
      <MapContainer 
        center={[-5.3619, 105.3129]} // Default to ITERA approximation
        zoom={16} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker onSelect={handleSelect} />
      </MapContainer>
      {isLoading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-[1000] rounded-md">
          <div className="flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-[3px] border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-bold text-amber-700 bg-white/80 px-2 py-0.5 rounded-full">Mengambil Lokasi...</span>
          </div>
        </div>
      )}
      <div className="absolute top-2 right-2 pointer-events-none z-[400] bg-white/95 px-2 py-1 rounded-sm text-[9px] font-bold text-slate-600 shadow-sm border border-slate-100">
        Klik area map untuk pilih titik lokasi
      </div>
    </div>
  );
}
