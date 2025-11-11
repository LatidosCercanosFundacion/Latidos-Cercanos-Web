
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PetPost, GeoPoint } from '../types';
import { IQUIQUE_CENTER } from '../constants';
import { generatePetDescriptionFromImage } from '../services/geminiService';
import { SparklesIcon } from './icons/Icons';

interface PostFormProps {
    onSubmit: (post: Omit<PetPost, 'id' | 'createdAt' | 'userId' | 'userName'>) => void;
    onCancel: () => void;
    isSubmitting: boolean;
    submitText: string;
    initialLocation?: GeoPoint | null;
}

const PostForm: React.FC<PostFormProps> = ({ onSubmit, onCancel, isSubmitting, submitText, initialLocation }) => {
    const [type, setType] = useState<'LOST' | 'FOUND'>('LOST');
    const [breed, setBreed] = useState('');
    const [color, setColor] = useState('');
    const [size, setSize] = useState('');
    const [description, setDescription] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [location, setLocation] = useState<GeoPoint>(initialLocation || IQUIQUE_CENTER);
    const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
    
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            const map = L.map(mapContainerRef.current, {
                center: location,
                zoom: initialLocation ? 16 : 13,
                zoomControl: true,
                attributionControl: false,
            });
            mapRef.current = map;

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            const marker = L.marker(location, {
                draggable: true,
                title: "Arrastra para ajustar la ubicación",
            }).addTo(map);
            markerRef.current = marker;

            map.on('click', (e: any) => {
                const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
                marker.setLatLng(newPos);
                setLocation(newPos);
            });

            marker.on('dragend', () => {
                const pos = marker.getLatLng();
                if (pos) {
                    setLocation({ lat: pos.lat, lng: pos.lng });
                }
            });
        }
    }, []);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPhoto(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };
    
    const handleGenerateDescription = async () => {
        if (!photo) return;
        setIsGeneratingDescription(true);
        try {
            const result = await generatePetDescriptionFromImage(photo);
            setBreed(result.breed);
            setColor(result.color);
            setSize(result.size);
            setDescription(result.description);
        } catch (error: any) {
            alert(`Error al generar descripción: ${error.message}`);
        } finally {
            setIsGeneratingDescription(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!photo || !breed || !description || !color || !size) {
            alert("Por favor, completa todos los campos.");
            return;
        }
        onSubmit({
            type,
            breed,
            color,
            size,
            description,
            photoUrl: photoPreview!, // In a real app, this would be a URL from Firebase Storage
            location,
        });
    };
    
    const inputStyle = "w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary transition-all";

    return (
        <div className="max-w-4xl mx-auto bg-dark-card p-8 rounded-lg shadow-2xl">
            <h2 className="text-3xl font-bold text-center text-primary mb-6">Crear Nuevo Reporte</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block mb-2 font-semibold text-gray-300">Tipo de Reporte</label>
                    <div className="flex gap-4">
                        <button type="button" onClick={() => setType('LOST')} className={`w-full p-3 rounded-lg font-bold transition-all ${type === 'LOST' ? 'bg-primary text-background' : 'bg-gray-700 text-white'}`}>Mascota Perdida</button>
                        <button type="button" onClick={() => setType('FOUND')} className={`w-full p-3 rounded-lg font-bold transition-all ${type === 'FOUND' ? 'bg-highlight text-background' : 'bg-gray-700 text-white'}`}>Mascota Encontrada</button>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center bg-gray-700 border-2 border-dashed border-gray-500 rounded-lg p-4 md:col-span-2 space-y-4">
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" id="photoUpload" />
                    <label htmlFor="photoUpload" className="cursor-pointer text-center w-full">
                        {photoPreview ? (
                            <img src={photoPreview} alt="Vista previa" className="w-full max-w-sm h-64 object-cover rounded-lg mx-auto" />
                        ) : (
                           <div className="text-gray-400">
                                <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                <p className="mt-2">Haz clic para subir una foto</p>
                                <p className="text-xs">PNG, JPG, GIF hasta 10MB</p>
                           </div>
                        )}
                    </label>
                    {photoPreview && (
                        <button 
                            type="button"
                            onClick={handleGenerateDescription}
                            disabled={isGeneratingDescription}
                            className="flex items-center justify-center gap-2 bg-primary/80 text-background font-bold py-2 px-4 rounded-lg hover:bg-primary transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                            {isGeneratingDescription ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    <span>Analizando...</span>
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="w-5 h-5" />
                                    Generar Descripción con IA
                                </>
                            )}
                        </button>
                    )}
                </div>

                <div>
                    <label htmlFor="breed" className="block mb-1 font-semibold text-gray-300">Raza</label>
                    <input type="text" id="breed" value={breed} onChange={e => setBreed(e.target.value)} className={inputStyle} placeholder="Ej: Labrador, Mestizo" required/>
                </div>
                <div>
                    <label htmlFor="color" className="block mb-1 font-semibold text-gray-300">Color</label>
                    <input type="text" id="color" value={color} onChange={e => setColor(e.target.value)} className={inputStyle} placeholder="Ej: Negro con manchas blancas" required/>
                </div>
                <div>
                     <label htmlFor="size" className="block mb-1 font-semibold text-gray-300">Tamaño</label>
                     <select id="size" value={size} onChange={e => setSize(e.target.value)} className={inputStyle} required>
                         <option value="">Selecciona un tamaño</option>
                         <option value="Pequeño">Pequeño</option>
                         <option value="Mediano">Mediano</option>
                         <option value="Grande">Grande</option>
                     </select>
                </div>
                 <div className="md:col-span-2">
                    <label htmlFor="description" className="block mb-1 font-semibold text-gray-300">Descripción / Señas Particulares</label>
                    <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} className={inputStyle} rows={3} placeholder="Ej: Llevaba un collar rojo, tiene una oreja caída..." required></textarea>
                </div>
                
                <div className="md:col-span-2">
                    <label className="block mb-2 font-semibold text-gray-300">{type === 'LOST' ? 'Última ubicación conocida' : 'Lugar donde fue encontrado'}</label>
                    {initialLocation 
                        ? <p className="text-sm text-highlight mb-2">Ubicación pre-seleccionada. Arrastra el marcador para ajustar.</p>
                        : <p className="text-sm text-gray-400 mb-2">Haz clic en el mapa o arrastra el marcador para fijar la ubicación.</p>
                    }
                    <div ref={mapContainerRef} className="h-64 w-full rounded-lg border-2 border-primary/50"></div>
                </div>

                <div className="md:col-span-2 flex justify-end gap-4">
                    <button type="button" onClick={onCancel} className="bg-gray-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-500 transition-colors" disabled={isSubmitting}>Cancelar</button>
                    <button 
                        type="submit" 
                        className="bg-primary text-background font-bold py-2 px-6 rounded-lg hover:bg-highlight transition-colors flex justify-center items-center w-56 disabled:bg-primary/70 disabled:cursor-not-allowed"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>{submitText}</span>
                            </>
                        ) : 'Publicar Reporte'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PostForm;