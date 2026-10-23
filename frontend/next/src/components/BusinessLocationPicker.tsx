"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";

// Map-based coordinate picker (D7-31). Replaces the old latitude/
// longitude number inputs on the new-business form: the user clicks the
// map (or drags the pin) and the chosen WGS84 coordinates flow up
// through onChange as fixed-precision strings, so the parent's FormData
// contract (and validate-business.ts) stays byte-identical.
//
// Why next/dynamic + ssr:false at the call site: Leaflet calls
// window/document at import time, so this module must never be
// evaluated during server rendering (react-leaflet docs: "not compatible
// with server-side rendering").
//
// Details worth knowing:
// - TileLayer attribution is mandatory by the OSM tile usage policy;
//   Leaflet's default attribution control renders it bottom-right.
// - scrollWheelZoom is off at the MapContainer level: a map embedded in
//   a form must not swallow the page's scroll wheel.
// - The marker uses a L.divIcon (styled pin) instead of Leaflet's
//   default image icon, whose asset paths break under bundlers.
const DEFAULT_CENTER: [number, number] = [9.65, -82.75]; // Puerto Viejo, Costa Rica
const DEFAULT_ZOOM = 12;

function pinIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: '<div style="width:18px;height:18px;border-radius:9999px;background:#7fb85a;border:3px solid white;box-shadow:0 1px 3px rgba(0,0,0,.5)"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

// Thin child so useMapEvents can live inside MapContainer's context.
function ClickCapture({
  onPick,
}: {
  onPick: (latitude: string, longitude: string) => void;
}) {
  useMapEvents({
    click(event) {
      onPick(
        event.latlng.lat.toFixed(6),
        event.latlng.lng.toFixed(6),
      );
    },
  });
  return null;
}

export default function BusinessLocationPicker({
  latitude,
  longitude,
  onChange,
}: {
  latitude: string;
  longitude: string;
  onChange: (latitude: string, longitude: string) => void;
}) {
  const hasPicked = latitude !== "" && longitude !== "";
  const position: [number, number] | null = hasPicked
    ? [Number(latitude), Number(longitude)]
    : null;

  // react-leaflet creates the Leaflet map inside a ref callback and tears it
  // down in a useEffect cleanup. Under Next's client-side navigation the same
  // container <div> can be re-attached (React "reconnects" the fiber instead of
  // mounting a fresh one), so the old map's _leaflet_id is still stamped on the
  // node when a new map is created → Leaflet throws "Map container is being
  // reused by another instance" / "appendChild of undefined". Keying the
  // MapContainer with a per-mount id forces a brand-new container div every time
  // this picker mounts, so each map gets a clean node and cleanup can't collide.
  const [mapKey] = useState(() => `map-${Math.random().toString(36).slice(2)}`);

  return (
    <div>
      <p className="text-sm text-ink-600">
        Click the map to choose the location
        {position
          ? ` — selected: ${position[0].toFixed(6)}, ${position[1].toFixed(6)}`
          : " — not set yet"}
      </p>
      <MapContainer
        key={mapKey}
        center={position ?? DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={false}
        className="mt-1.5 h-72 w-full rounded-xl border border-[color:var(--field-border)]"
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ClickCapture onPick={onChange} />
        {position ? (
          <Marker
            position={position}
            icon={pinIcon()}
            draggable
            eventHandlers={{
              dragend(event) {
                const ll = (event.target as L.Marker).getLatLng();
                onChange(ll.lat.toFixed(6), ll.lng.toFixed(6));
              },
            }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}
