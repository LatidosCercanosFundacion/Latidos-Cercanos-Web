
import React, { useRef } from 'react';
import { User } from '../types';
import { PawIcon, GoogleIcon, PlusIcon, CameraIcon } from './icons/Icons';

interface HeaderProps {
    user: User | null;
    onAuthClick: () => void;
    onLogout: () => void;
    onCreatePost: () => void;
    onUpdateProfilePicture: (photoUrl: string) => void;
}

const Header: React.FC<HeaderProps> = ({ user, onAuthClick, onLogout, onCreatePost, onUpdateProfilePicture }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleProfileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    onUpdateProfilePicture(reader.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <header className="bg-dark-card shadow-lg sticky top-0 z-50">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <PawIcon className="w-8 h-8 text-primary" />
                    <h1 className="text-2xl font-bold text-white tracking-wider">
                        Latidos <span className="text-primary">Cercanos</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            <button 
                                onClick={onCreatePost}
                                className="flex items-center gap-2 bg-primary text-background font-bold py-2 px-4 rounded-full hover:bg-highlight transition-all duration-300 transform hover:scale-105"
                            >
                                <PlusIcon className="w-5 h-5" />
                                <span className="hidden sm:inline">Nuevo Reporte</span>
                            </button>
                            <div className="flex items-center gap-2">
                                <div 
                                    className="relative group cursor-pointer" 
                                    onClick={handleProfileClick} 
                                    title="Cambiar foto de perfil"
                                >
                                    <img 
                                        src={user.photoURL || ''} 
                                        alt={user.displayName || 'User'} 
                                        className="w-10 h-10 rounded-full border-2 border-primary object-cover" 
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 rounded-full flex justify-center items-center transition-all duration-300">
                                        <CameraIcon className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleFileChange} 
                                        className="hidden" 
                                        accept="image/png, image/jpeg"
                                    />
                                </div>
                                <button onClick={onLogout} className="text-gray-300 hover:text-white transition-colors duration-300 text-sm">Salir</button>
                            </div>
                        </>
                    ) : (
                        <button 
                            onClick={onAuthClick} 
                            className="bg-primary text-background font-bold py-2 px-4 rounded-lg hover:bg-highlight transition-colors duration-300"
                        >
                            Ingresar / Registrarse
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
