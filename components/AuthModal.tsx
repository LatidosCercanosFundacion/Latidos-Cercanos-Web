
import React, { useState } from 'react';
import { GoogleIcon, EyeIcon, EyeSlashIcon, EnvelopeIcon, UserIcon, XCircleIcon } from './icons/Icons';

interface AuthModalProps {
    onClose: () => void;
    onLogin: () => void;
    onRegisterSuccess: (message: string) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLogin, onRegisterSuccess }) => {
    const [view, setView] = useState<'login' | 'register' | 'forgotPassword'>('login');
    const [showPassword, setShowPassword] = useState(false);

    const handleGoogleLogin = () => {
        onLogin();
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (view === 'register') {
            onRegisterSuccess("¡Registro exitoso! Ahora puedes iniciar sesión.");
            setView('login');
        } else if (view === 'login') {
            onLogin(); 
        } else {
            alert('Si tu correo está registrado, recibirás un enlace de recuperación pronto.');
            setView('login');
        }
    };
    
    const inputBaseStyle = "w-full bg-gray-700 text-white rounded-md p-3 pl-10 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary transition-all";

    const renderLogin = () => (
        <>
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Bienvenido de Vuelta</h3>
            <form onSubmit={handleFormSubmit} className="space-y-4">
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input type="email" placeholder="Correo Electrónico" className={inputBaseStyle} required />
                </div>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                    </div>
                    <input type={showPassword ? 'text' : 'password'} placeholder="Contraseña" className={inputBaseStyle} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white">
                        {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                </div>
                <div className="text-right">
                    <button type="button" onClick={() => setView('forgotPassword')} className="text-sm text-primary hover:underline">¿Olvidaste tu contraseña?</button>
                </div>
                <button type="submit" className="w-full bg-primary text-background font-bold py-3 rounded-lg hover:bg-highlight transition-colors">Ingresar</button>
            </form>
            <div className="flex items-center my-6">
                <div className="flex-grow border-t border-gray-600"></div>
                <span className="flex-shrink mx-4 text-gray-400">O</span>
                <div className="flex-grow border-t border-gray-600"></div>
            </div>
            <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-gray-200 transition-all duration-300">
                <GoogleIcon className="w-5 h-5" />
                Continuar con Google
            </button>
            <p className="mt-6 text-center text-sm text-gray-400">
                ¿No tienes una cuenta? <button onClick={() => setView('register')} className="font-semibold text-primary hover:underline">Regístrate</button>
            </p>
        </>
    );

    const renderRegister = () => (
         <>
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Crea tu Cuenta</h3>
            <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input type="text" placeholder="Nombre Completo" className={inputBaseStyle} required />
                </div>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input type="email" placeholder="Correo Electrónico" className={inputBaseStyle} required />
                </div>
                <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                    </div>
                    <input type={showPassword ? 'text' : 'password'} placeholder="Contraseña" className={inputBaseStyle} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white">
                        {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                </div>
                <button type="submit" className="w-full bg-primary text-background font-bold py-3 rounded-lg hover:bg-highlight transition-colors mt-2">Crear Cuenta</button>
            </form>
            <p className="mt-6 text-center text-sm text-gray-400">
                ¿Ya tienes una cuenta? <button onClick={() => setView('login')} className="font-semibold text-primary hover:underline">Ingresa</button>
            </p>
        </>
    );

    const renderForgotPassword = () => (
         <>
            <h3 className="text-2xl font-bold text-white mb-2 text-center">Recuperar Contraseña</h3>
            <p className="text-gray-400 text-center mb-6 text-sm">Ingresa tu correo y te enviaremos un enlace para restablecerla.</p>
            <form onSubmit={handleFormSubmit} className="space-y-4">
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input type="email" placeholder="Correo Electrónico" className={inputBaseStyle} required />
                </div>
                <button type="submit" className="w-full bg-primary text-background font-bold py-3 rounded-lg hover:bg-highlight transition-colors mt-2">Enviar Enlace</button>
            </form>
            <p className="mt-6 text-center text-sm text-gray-400">
                <button onClick={() => setView('login')} className="font-semibold text-primary hover:underline">Volver a Ingresar</button>
            </p>
        </>
    );
    
    const renderContent = () => {
        switch(view) {
            case 'login': return renderLogin();
            case 'register': return renderRegister();
            case 'forgotPassword': return renderForgotPassword();
            default: return renderLogin();
        }
    };
    
    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 transition-opacity duration-300"
            onClick={onClose}
        >
            <div 
                className="bg-dark-card rounded-lg shadow-2xl w-full max-w-md relative transform transition-transform duration-300 scale-95 animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
                    aria-label="Cerrar modal"
                >
                    <XCircleIcon className="w-8 h-8"/>
                </button>
                <div className="p-8">
                     {renderContent()}
                </div>
            </div>
            <style>{`
                @keyframes scale-in {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-scale-in {
                    animation: scale-in 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default AuthModal;
