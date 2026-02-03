import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

// Fix for default marker icon in Leaflet with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle clicks on map
const LocationSelector = ({ onLocationSelect }) => {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng);
        },
    });
    return null;
};

const MapComponent = ({
    initialLocation,
    onLocationSelect,
    readOnly = false,
    markers = [],
    height = '400px'
}) => {
    const defaultCenter = [20.5937, 78.9629]; // India center
    const [center, setCenter] = useState(initialLocation || defaultCenter);
    const [selectedPosition, setSelectedPosition] = useState(initialLocation);

    useEffect(() => {
        if (navigator.geolocation && !initialLocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const coords = [latitude, longitude];
                    setCenter(coords);
                    if (!readOnly && onLocationSelect) {
                        setSelectedPosition(coords); // Auto-select current loc if editing
                        onLocationSelect({ lat: latitude, lng: longitude });
                    }
                },
                (error) => {
                    console.error("Error getting location:", error);
                }
            );
        }
    }, [initialLocation, readOnly, onLocationSelect]);

    const handleMapClick = (latlng) => {
        if (!readOnly && onLocationSelect) {
            setSelectedPosition([latlng.lat, latlng.lng]);
            onLocationSelect(latlng);
        }
    };

    return (
        <MapContainer
            center={center}
            zoom={13}
            style={{ height: height, width: '100%', borderRadius: '0.75rem', zIndex: 0 }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {!readOnly && <LocationSelector onLocationSelect={handleMapClick} />}

            {selectedPosition && (
                <Marker position={selectedPosition}>
                    <Popup>Selected Location</Popup>
                </Marker>
            )}

            {markers.map((marker, idx) => (
                <Marker key={idx} position={marker.position}>
                    <Popup>{marker.popupText}</Popup>
                </Marker>
            ))}

            {/* Show user's current location with a circle if available */}
            {selectedPosition && (
                <Circle center={selectedPosition} radius={500} pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }} />
            )}

        </MapContainer>
    );
};

export default MapComponent;
