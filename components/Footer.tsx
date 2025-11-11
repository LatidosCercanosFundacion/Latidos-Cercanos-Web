import React from 'react';
import { EnvelopeIcon, PhoneIcon, GlobeAltIcon } from './icons/Icons';

const Footer: React.FC = () => {
    return (
        <footer className="bg-dark-card mt-8 py-8">
            <div className="container mx-auto px-4 text-center text-gray-400">
                <p className="text-lg italic">&ldquo;Porque Cada Latido Perdido Merece Volver a Casa&rdquo;</p>
                
                <div className="mt-6 flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8 text-sm">
                    <a href="tel:+56977518446" className="flex items-center gap-2 hover:text-primary transition-colors duration-300">
                        <PhoneIcon className="w-5 h-5" />
                        <span>+56 9 7751 8446</span>
                    </a>
                    <a href="mailto:info.latidos.cercanos@gmail.com" className="flex items-center gap-2 hover:text-primary transition-colors duration-300">
                        <EnvelopeIcon className="w-5 h-5" />
                        <span>info.latidos.cercanos@gmail.com</span>
                    </a>
                    <div className="flex items-center gap-2">
                         <GlobeAltIcon className="w-5 h-5" />
                         <span>Iquique, Tarapacá, Chile (CP 1100000)</span>
                    </div>
                </div>

                <p className="text-sm mt-6">&copy; {new Date().getFullYear()} Latidos Cercanos. Todos los derechos reservados.</p>
            </div>
        </footer>
    );
};

export default Footer;