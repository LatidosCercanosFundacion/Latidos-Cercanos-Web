
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PostType, PetPost, User, View, GeoPoint, GroundedResponse } from './types';
import { MOCK_POSTS, MOCK_USER } from './constants';
import { getSuggestions, getNearbyPlaces, editImageFromUrl, generateSocialMediaPost } from './services/geminiService';
import Header from './components/Header';
import Footer from './components/Footer';
import PostForm from './components/PostForm';
import MapView from './components/MapView';
import PetCard from './components/PetCard';
import Modal from './components/Modal';
import AuthModal from './components/AuthModal';
import Toast from './components/Toast';
import Chatbot from './components/Chatbot';
import { SearchIcon, UserIcon, MapPinIcon, XCircleIcon, SparklesIcon, ArrowPathIcon, ClipboardCopyIcon } from './components/icons/Icons';

// Helper function to calculate distance between two geo points (Haversine formula)
const getDistanceInKm = (point1: GeoPoint, point2: GeoPoint) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (point2.lat - point1.lat) * (Math.PI / 180);
    const dLng = (point2.lng - point1.lng) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(point1.lat * (Math.PI / 180)) * Math.cos(point2.lat * (Math.PI / 180)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const SimpleMarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
    return (
        <div className="text-sm text-gray-200 space-y-1">
            {text.split('\n').map((line, index) => {
                // simple parser for bold (**text**) and lists (* or -)
                const lineWithBullet = line.replace(/^\s*[-*]\s*/, '• ');
                const parts = lineWithBullet.split(/(\*\*.*?\*\*)/g);

                return (
                    <p key={index} className={line.startsWith(' ') || line.startsWith('\t') ? 'pl-4' : ''}>
                        {parts.map((part, i) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={i} className="text-highlight font-semibold">{part.slice(2, -2)}</strong>;
                            }
                            return <span key={i}>{part}</span>;
                        })}
                    </p>
                );
            })}
        </div>
    );
};


const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [posts, setPosts] = useState<PetPost[]>([]);
    const [view, setView] = useState<View>('home');
    const [filter, setFilter] = useState<'ALL' | PostType>('ALL');
    const [breedFilter, setBreedFilter] = useState('');
    const [colorFilter, setColorFilter] = useState('');
    const [sizeFilter, setSizeFilter] = useState('');
    const [showMyPostsOnly, setShowMyPostsOnly] = useState(false);
    const [selectedPost, setSelectedPost] = useState<PetPost | null>(null);
    const [suggestedMatches, setSuggestedMatches] = useState<PetPost[]>([]);
    const [nearbyPlaces, setNearbyPlaces] = useState<GroundedResponse | null>(null);
    const [loadingPlaceType, setLoadingPlaceType] = useState<string | null>(null);
    const [isSubmittingPost, setIsSubmittingPost] = useState(false);
    const [submitButtonText, setSubmitButtonText] = useState('Publicar Reporte');
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [initialPostLocation, setInitialPostLocation] = useState<GeoPoint | null>(null);

    // State for Image Editing
    const [isEditingImage, setIsEditingImage] = useState(false);
    const [editPrompt, setEditPrompt] = useState('');
    const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [imageEditError, setImageEditError] = useState<string | null>(null);
    
    // State for Social Media Post Generation
    const [socialMediaText, setSocialMediaText] = useState<string | null>(null);
    const [isGeneratingSocialPost, setIsGeneratingSocialPost] = useState(false);


    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
    };

    useEffect(() => {
        setPosts(MOCK_POSTS);
    }, []);


    const handleLogin = () => {
        setUser(MOCK_USER);
        setIsAuthModalOpen(false);
    };
    const handleLogout = () => {
        setUser(null);
        setShowMyPostsOnly(false);
    };

    const handleUpdateProfilePicture = (newPhotoUrl: string) => {
        if (user) {
            setUser({ ...user, photoURL: newPhotoUrl });
        }
    };

    const handleCreatePost = useCallback(async (newPostData: Omit<PetPost, 'id' | 'createdAt' | 'userId' | 'userName'>) => {
        if (!user) return;
        
        setIsSubmittingPost(true);
        setSubmitButtonText('Publicando...');

        const newPost: PetPost = {
            ...newPostData,
            id: `post_${Date.now()}`,
            createdAt: new Date(),
            userId: user.uid,
            userName: user.displayName || 'Anonymous',
        };

        const updatedPosts = [newPost, ...posts];
        setPosts(updatedPosts);
        
        if (newPost.type === 'LOST') {
            setSubmitButtonText('Buscando coincidencias...');
            const foundPets = updatedPosts.filter(p => p.type === 'FOUND');
            try {
                const matchIds = await getSuggestions(newPost, foundPets);
                const matches = updatedPosts.filter(p => matchIds.includes(p.id));
                setSuggestedMatches(matches);
            } catch (error) {
                console.error("Error getting AI suggestions:", error);
                showToast('No se pudieron obtener sugerencias de IA.', 'error');
            }
        }
        
        setIsSubmittingPost(false);
        setSubmitButtonText('Publicar Reporte');
        setView('home');
        showToast('Reporte creado con éxito.');

    }, [posts, user]);
    
    const handleClearFilters = () => {
        setFilter('ALL');
        setBreedFilter('');
        setColorFilter('');
        setSizeFilter('');
    };

    const handleFindNearbyPlaces = async (placeType: string) => {
        if (!selectedPost) return;
        setLoadingPlaceType(placeType);
        setNearbyPlaces(null);
        try {
            const results = await getNearbyPlaces(selectedPost.location, placeType);
            setNearbyPlaces(results);
        } catch (error) {
            console.error(`Error finding nearby ${placeType}:`, error);
            showToast(`Error al buscar ${placeType}`, 'error');
        } finally {
            setLoadingPlaceType(null);
        }
    };
    
    const handleCloseModal = () => {
        setSelectedPost(null);
        setNearbyPlaces(null);
        setLoadingPlaceType(null);
        // Reset editing state
        setIsEditingImage(false);
        setEditPrompt('');
        setEditedImageUrl(null);
        setIsGeneratingImage(false);
        setImageEditError(null);
        // Reset social post state
        setSocialMediaText(null);
        setIsGeneratingSocialPost(false);
    };

    const handleGenerateEditedImage = async () => {
        if (!editPrompt || !selectedPost) return;

        setIsGeneratingImage(true);
        setImageEditError(null);
        setEditedImageUrl(null);

        try {
            const newImage = await editImageFromUrl(selectedPost.photoUrl, editPrompt);
            setEditedImageUrl(newImage);
        } catch (error: any) {
            setImageEditError(error.message || 'Ocurrió un error desconocido.');
        } finally {
            setIsGeneratingImage(false);
        }
    };
    
    const handleGenerateSocialPost = async () => {
        if (!selectedPost) return;
        setIsGeneratingSocialPost(true);
        setSocialMediaText(null);
        try {
            const postText = await generateSocialMediaPost(selectedPost);
            setSocialMediaText(postText);
        } catch (error) {
            console.error("Error generating social media post:", error);
            showToast('No se pudo generar el anuncio.', 'error');
        } finally {
            setIsGeneratingSocialPost(false);
        }
    };
    
    const handleCopyToClipboard = () => {
        if (!socialMediaText) return;
        navigator.clipboard.writeText(socialMediaText)
            .then(() => showToast('Texto copiado al portapapeles!'))
            .catch(err => {
                console.error('Failed to copy text: ', err);
                showToast('No se pudo copiar el texto.', 'error');
            });
    };

    const handleSaveChanges = () => {
        if (!editedImageUrl || !selectedPost) return;

        // Update the post in the main posts list
        setPosts(prevPosts => prevPosts.map(p =>
            p.id === selectedPost.id ? { ...p, photoUrl: editedImageUrl } : p
        ));

        // Update the selected post as well to reflect change immediately
        setSelectedPost(prev => prev ? { ...prev, photoUrl: editedImageUrl } : null);

        // Reset editing state and close modal
        handleCloseModal();
        showToast('¡Imagen actualizada con éxito!', 'success');
    };

    const handleMapClick = (location: GeoPoint) => {
        if (!user) {
            setIsAuthModalOpen(true);
            showToast('Debes iniciar sesión para crear un reporte.', 'error');
            return;
        }
        setInitialPostLocation(location);
        setView('createPost');
    };

    const filteredPosts = posts
        .filter(post => filter === 'ALL' || post.type === filter)
        .filter(post => 
            breedFilter.trim() === '' || post.breed.toLowerCase().includes(breedFilter.toLowerCase().trim())
        )
        .filter(post =>
            colorFilter === '' || post.color.toLowerCase().includes(colorFilter.toLowerCase())
        )
        .filter(post =>
            sizeFilter === '' || post.size === sizeFilter
        )
        .filter(post => !showMyPostsOnly || (user && post.userId === user.uid));

    const filterSelectStyle = "bg-gray-700 text-white rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all w-full appearance-none";

    return (
        <div className="min-h-screen flex flex-col bg-background font-sans">
            <Header 
                user={user} 
                onAuthClick={() => setIsAuthModalOpen(true)}
                onLogout={handleLogout} 
                onCreatePost={() => setView('createPost')}
                onUpdateProfilePicture={handleUpdateProfilePicture}
            />
            
            <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
                {view === 'home' && (
                    <>
                        <div className="text-center mb-8">
                            <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight">Encuentra a tu amigo fiel</h1>
                            <p className="text-xl italic text-gray-400 mt-2">&ldquo;Porque Cada Latido Perdido Merece Volver a Casa&rdquo;</p>
                            <p className="text-lg text-gray-300 mt-4">Explora el mapa y los reportes para reunirte con tu mascota. <span className="font-semibold text-highlight">¡Haz clic en el mapa para reportar un avistamiento!</span></p>
                        </div>

                        <div className="mb-6 bg-dark-card p-4 rounded-lg shadow-lg space-y-4">
                            <div className="flex flex-wrap items-center gap-4">
                                <span className="font-bold text-gray-200">Tipo:</span>
                                <div className="flex gap-2">
                                    <button onClick={() => setFilter('ALL')} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${filter === 'ALL' ? 'bg-primary text-background' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>Todos</button>
                                    <button onClick={() => setFilter('LOST')} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${filter === 'LOST' ? 'bg-primary text-background' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>Perdidos</button>
                                    <button onClick={() => setFilter('FOUND')} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${filter === 'FOUND' ? 'bg-primary text-background' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>Encontrados</button>
                                </div>
                                {user && (
                                    <button
                                        onClick={() => setShowMyPostsOnly(!showMyPostsOnly)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${showMyPostsOnly ? 'bg-primary text-background' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                                    >
                                        <UserIcon className="h-5 w-5" />
                                        Mis Reportes
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 items-center">
                                <div className="relative sm:col-span-2 md:col-span-2 lg:col-span-2">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <SearchIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Buscar por raza..."
                                        value={breedFilter}
                                        onChange={(e) => setBreedFilter(e.target.value)}
                                        className="bg-gray-700 text-white rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all w-full"
                                        aria-label="Filtrar por raza"
                                    />
                                </div>
                                <div className="relative">
                                    <select value={colorFilter} onChange={(e) => setColorFilter(e.target.value)} className={filterSelectStyle} aria-label="Filtrar por color">
                                        <option value="">Color</option>
                                        <option value="Negro">Negro</option>
                                        <option value="Blanco">Blanco</option>
                                        <option value="Café">Café</option>
                                        <option value="Dorado">Dorado</option>
                                        <option value="Gris">Gris</option>
                                        <option value="Naranjo">Naranjo</option>
                                        <option value="Beige">Beige</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    </div>
                                </div>
                                <div className="relative">
                                    <select value={sizeFilter} onChange={(e) => setSizeFilter(e.target.value)} className={filterSelectStyle} aria-label="Filtrar por tamaño">
                                        <option value="">Tamaño</option>
                                        <option value="Pequeño">Pequeño</option>
                                        <option value="Mediano">Mediano</option>
                                        <option value="Grande">Grande</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    </div>
                                </div>
                                <button onClick={handleClearFilters} className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-full text-sm font-semibold hover:bg-gray-500 transition-colors">
                                    <XCircleIcon className="h-5 w-5" />
                                    Limpiar
                                </button>
                            </div>
                        </div>

                        <div className="h-[50vh] mb-8 rounded-lg overflow-hidden shadow-2xl border-4 border-primary/50 flex justify-center items-center bg-dark-card">
                           <MapView posts={filteredPosts} onMarkerClick={setSelectedPost} onMapClick={handleMapClick} />
                        </div>
                         {filteredPosts.length === 0 && view === 'home' && (
                            <div className="text-center py-10">
                                <p className="text-xl text-gray-400">No se encontraron resultados para tu búsqueda.</p>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredPosts.map(post => (
                                <PetCard key={post.id} post={post} onDetailsClick={() => setSelectedPost(post)} />
                            ))}
                        </div>
                    </>
                )}

                {view === 'createPost' && (
                    <PostForm 
                        onSubmit={handleCreatePost} 
                        onCancel={() => {
                            setView('home');
                            setInitialPostLocation(null);
                        }} 
                        isSubmitting={isSubmittingPost} 
                        submitText={submitButtonText}
                        initialLocation={initialPostLocation}
                    />
                )}
            </main>

            <Footer />

            {selectedPost && (
                <Modal onClose={handleCloseModal}>
                    <div className="p-4 text-white">
                        <div className="relative mb-4">
                            <img src={editedImageUrl || selectedPost.photoUrl} alt="Mascota" className="w-full h-64 object-cover rounded-lg transition-all duration-500" />
                            {isGeneratingImage && (
                                <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center rounded-lg">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                                    <p className="mt-4 text-white">La IA está trabajando...</p>
                                </div>
                            )}
                        </div>

                        {/* AI EDITING SECTION */}
                        {isEditingImage ? (
                            <div className="bg-background p-4 rounded-lg mb-4 space-y-3">
                                <h3 className="text-lg font-semibold text-highlight flex items-center gap-2">
                                    <SparklesIcon className="w-5 h-5" />
                                    Edición con IA
                                </h3>
                                {editedImageUrl ? (
                                    <div>
                                        <p className="text-sm text-gray-300 mb-3">¿Te gusta el resultado?</p>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <button
                                                onClick={handleSaveChanges}
                                                className="flex-1 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-500 transition-colors"
                                            >
                                                Sí, conservar cambios
                                            </button>
                                            <button
                                                onClick={() => { setEditedImageUrl(null); setEditPrompt(''); }}
                                                className="flex-1 bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <ArrowPathIcon className="w-5 h-5" />
                                                No, intentar de nuevo
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <input
                                            type="text"
                                            value={editPrompt}
                                            onChange={(e) => setEditPrompt(e.target.value)}
                                            placeholder="Ej: estilo van gogh, fondo de playa..."
                                            className="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                                            disabled={isGeneratingImage}
                                        />
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <button
                                                onClick={handleGenerateEditedImage}
                                                disabled={!editPrompt || isGeneratingImage}
                                                className="flex-1 bg-primary text-background font-bold py-2 px-4 rounded-lg hover:bg-highlight transition-colors disabled:bg-primary/50 disabled:cursor-not-allowed flex items-center justify-center"
                                            >
                                                {isGeneratingImage ? (
                                                    <>
                                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        <span>Generando...</span>
                                                    </>
                                                ) : 'Generar'}
                                            </button>
                                            <button
                                                onClick={() => setIsEditingImage(false)}
                                                className="flex-1 bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </>
                                )}
                                {imageEditError && <p className="text-red-400 text-sm mt-2">{imageEditError}</p>}
                            </div>
                        ) : (
                            <div className="flex justify-center mb-4">
                                <button
                                    onClick={() => setIsEditingImage(true)}
                                    className="flex items-center gap-2 bg-primary/20 text-primary font-bold py-2 px-5 rounded-full hover:bg-primary/40 transition-all duration-300 transform hover:scale-105"
                                >
                                    <SparklesIcon className="w-5 h-5" />
                                    Editar Imagen con IA
                                </button>
                            </div>
                        )}

                        <h2 className="text-3xl font-bold text-primary mb-2">{selectedPost.type === 'LOST' ? 'SE BUSCA' : 'ENCONTRADO'}</h2>
                        <p><strong className="text-highlight">Raza:</strong> {selectedPost.breed}</p>
                        <p><strong className="text-highlight">Color:</strong> {selectedPost.color}</p>
                        <p><strong className="text-highlight">Tamaño:</strong> {selectedPost.size}</p>
                        <p className="mt-2"><strong className="text-highlight">Descripción:</strong> {selectedPost.description}</p>
                        <p className="mt-2 text-sm text-gray-400">Reportado por {selectedPost.userName} el {selectedPost.createdAt.toLocaleDateString()}</p>
                        <div className="mt-4 h-48 rounded-lg overflow-hidden flex justify-center items-center bg-dark-card">
                           <MapView posts={[selectedPost]} onMarkerClick={() => {}} isStatic={true} />
                        </div>

                        {/* Social Media Post Generation */}
                        {selectedPost.type === 'LOST' && (
                             <div className="mt-6 pt-4 border-t border-gray-700">
                                <h3 className="text-lg font-semibold text-highlight mb-3">Comparte para Encontrarlo</h3>
                                {socialMediaText ? (
                                    <div className="space-y-3">
                                        <div className="bg-background p-3 rounded-md max-w-none whitespace-pre-wrap text-sm">
                                            {socialMediaText}
                                        </div>
                                        <button 
                                            onClick={handleCopyToClipboard}
                                            className="w-full flex items-center justify-center gap-2 bg-primary text-background font-bold py-2 px-4 rounded-lg hover:bg-highlight transition-colors"
                                        >
                                           <ClipboardCopyIcon className="w-5 h-5" />
                                            Copiar Texto
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleGenerateSocialPost}
                                        disabled={isGeneratingSocialPost}
                                        className="w-full flex items-center justify-center gap-2 bg-primary/80 text-background font-bold py-2 px-3 rounded-lg hover:bg-primary transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                                    >
                                        {isGeneratingSocialPost ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                <span>Creando anuncio...</span>
                                            </>
                                        ) : (
                                            <>
                                                <SparklesIcon className="w-5 h-5" />
                                                <span>Generar Anuncio para Redes Sociales</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="mt-6 pt-4 border-t border-gray-700">
                            <h3 className="text-lg font-semibold text-highlight mb-3">¿Necesitas ayuda?</h3>
                            <p className="text-sm text-gray-300 mb-4">
                                Encuentra recursos útiles cerca de la última ubicación conocida de la mascota.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <button
                                    onClick={() => handleFindNearbyPlaces('clínicas veterinarias')}
                                    className="w-full bg-primary/80 text-background font-bold py-2 px-3 rounded-lg hover:bg-primary transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed text-xs"
                                    disabled={!!loadingPlaceType}
                                >
                                    {loadingPlaceType === 'clínicas veterinarias' ? 'Buscando...' : 'Veterinarias'}
                                </button>
                                <button
                                    onClick={() => handleFindNearbyPlaces('tiendas de mascotas')}
                                    className="w-full bg-primary/80 text-background font-bold py-2 px-3 rounded-lg hover:bg-primary transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed text-xs"
                                    disabled={!!loadingPlaceType}
                                >
                                    {loadingPlaceType === 'tiendas de mascotas' ? 'Buscando...' : 'Tiendas'}
                                </button>
                                <button
                                    onClick={() => handleFindNearbyPlaces('parques para perros')}
                                    className="w-full bg-primary/80 text-background font-bold py-2 px-3 rounded-lg hover:bg-primary transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed text-xs"
                                    disabled={!!loadingPlaceType}
                                >
                                    {loadingPlaceType === 'parques para perros' ? 'Buscando...' : 'Parques'}
                                </button>
                            </div>
                            
                            {loadingPlaceType && !nearbyPlaces && (
                                <div className="flex justify-center items-center h-24">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                                </div>
                            )}

                            {nearbyPlaces && (
                                <div className="mt-4 text-left">
                                    <div className="bg-background p-3 rounded-md max-w-none">
                                        <SimpleMarkdownRenderer text={nearbyPlaces.text} />
                                    </div>
                                    {nearbyPlaces.sources.length > 0 && (
                                        <div className="mt-4">
                                            <h4 className="font-semibold text-gray-300 text-sm">Fuentes (Google Maps):</h4>
                                            <ul className="list-disc list-inside text-sm space-y-1 mt-1 text-gray-400">
                                                {nearbyPlaces.sources.map((source, index) => (
                                                    <li key={index}>
                                                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                            {source.title}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </Modal>
            )}

            {suggestedMatches.length > 0 && (
                 <Modal onClose={() => setSuggestedMatches([])} title="Posibles Coincidencias Encontradas">
                     <div className="p-4 text-white">
                        <p className="mb-4 text-center">Nuestra IA ha encontrado mascotas encontradas que podrían ser la tuya. ¡Échales un vistazo!</p>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                            {suggestedMatches.map(post => (
                                <PetCard key={post.id} post={post} onDetailsClick={() => setSelectedPost(post)} />
                            ))}
                        </div>
                     </div>
                 </Modal>
            )}

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {isAuthModalOpen && (
                <AuthModal
                    onClose={() => setIsAuthModalOpen(false)}
                    onLogin={handleLogin}
                    onRegisterSuccess={(message) => showToast(message, 'success')}
                />
            )}
            <Chatbot />
        </div>
    );
};

export default App;