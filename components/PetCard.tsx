
import React from 'react';
import { PetPost } from '../types';
import { LocationIcon } from './icons/Icons';

interface PetCardProps {
    post: PetPost;
    onDetailsClick: () => void;
}

const PetCard: React.FC<PetCardProps> = ({ post, onDetailsClick }) => {
    const isLost = post.type === 'LOST';

    return (
        <div className="bg-dark-card rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 flex flex-col">
            <div className="relative">
                <img src={post.photoUrl} alt={post.breed} className="w-full h-48 object-cover" />
                <div 
                    className={`absolute top-2 left-2 px-3 py-1 text-xs font-bold uppercase rounded-full text-background
                        ${isLost ? 'bg-primary' : 'bg-highlight'}`}
                >
                    {isLost ? 'Perdido' : 'Encontrado'}
                </div>
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-white mb-1">{post.breed}</h3>
                <p className="text-gray-300 text-sm mb-3 flex-grow">{post.description.substring(0, 70)}...</p>
                <div className="flex items-center text-gray-400 text-sm mb-4">
                    <LocationIcon className="w-4 h-4 mr-2 text-primary" />
                    <span>Visto por última vez cerca de Iquique</span>
                </div>
                <button 
                    onClick={onDetailsClick}
                    className="mt-auto w-full bg-primary text-background font-bold py-2 px-4 rounded-lg hover:bg-highlight transition-colors duration-300"
                >
                    Ver Detalles
                </button>
            </div>
        </div>
    );
};

export default PetCard;
