
import React, { useRef, useEffect } from 'react';
import { PetPost, GeoPoint } from '../types';
import { IQUIQUE_CENTER } from '../constants';

interface MapViewProps {
    posts: PetPost[];
    onMarkerClick: (post: PetPost) => void;
    onMapClick?: (location: GeoPoint) => void;
    isStatic?: boolean;
}

const MapView: React.FC<MapViewProps> = ({ posts, onMarkerClick, onMapClick, isStatic = false }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null); // L.Map
    const markersRef = useRef<any[]>([]); // L.Marker[]

    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            mapRef.current = L.map(mapContainerRef.current, {
                center: posts.length === 1 ? posts[0].location : IQUIQUE_CENTER,
                zoom: posts.length === 1 ? 15 : 12,
                zoomControl: !isStatic,
                dragging: !isStatic,
                scrollWheelZoom: !isStatic,
                attributionControl: false,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapRef.current);

            if (!isStatic && onMapClick) {
                mapRef.current.on('click', (e: any) => {
                    const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
                    onMapClick(newPos);
                });
            }
        }
    }, [isStatic, posts, onMapClick]);
    
    useEffect(() => {
        if (mapRef.current && mapContainerRef.current) {
            if (!isStatic && onMapClick) {
                mapContainerRef.current.classList.add('leaflet-clickable-map');
            } else {
                mapContainerRef.current.classList.remove('leaflet-clickable-map');
            }
        }
    }, [isStatic, onMapClick]);


    useEffect(() => {
        // Clear existing markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        if (mapRef.current) {
            posts.forEach(post => {
                const isLost = post.type === 'LOST';
                // Custom icon to replicate the colored circles
                const petIcon = L.divIcon({
                  html: `<div style="background-color: ${isLost ? '#FFB347' : '#FFF176'}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid #333333; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
                  className: '', // important to clear default styling
                  iconSize: [20, 20],
                  iconAnchor: [10, 10],
                });
                
                const marker = L.marker(post.location, { icon: petIcon }).addTo(mapRef.current);

                if (!isStatic) {
                    marker.on('click', () => onMarkerClick(post));
                }
                markersRef.current.push(marker);
            });

             // Adjust map bounds
            if (posts.length > 1 && mapRef.current && !isStatic) {
                const bounds = L.latLngBounds(posts.map(p => p.location));
                mapRef.current.fitBounds(bounds, { padding: [50, 50] });
            } else if (posts.length === 1 && mapRef.current) {
                mapRef.current.setView(posts[0].location, 15);
            } else if (posts.length === 0 && mapRef.current && !isStatic) {
                mapRef.current.setView(IQUIQUE_CENTER, 12);
            }
        }
    }, [posts, onMarkerClick, isStatic]);

    return <div ref={mapContainerRef} className="w-full h-full" />;
};

export default MapView;