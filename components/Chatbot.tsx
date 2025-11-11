
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { ChatMessage } from '../types';
import { ChatBubbleOvalLeftEllipsisIcon, PaperAirplaneIcon, XCircleIcon } from './icons/Icons';

const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const initChat = () => {
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
                const chatSession = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: {
                        systemInstruction: "Eres un asistente virtual amigable y servicial para 'Latidos Cercanos'. Tu propósito es ayudar a los usuarios a navegar la aplicación, responder preguntas sobre mascotas perdidas/encontradas en Iquique, y ofrecer consejos generales sobre el cuidado de mascotas. Sé conciso y empático. Habla en español.",
                    },
                });
                setChat(chatSession);
                setMessages([
                    { role: 'model', text: '¡Hola! Soy tu asistente virtual. ¿Cómo puedo ayudarte hoy con tu mascota?' }
                ]);
            } catch(e) {
                console.error("Failed to initialize chatbot:", e);
                setMessages([
                    { role: 'model', text: 'Lo siento, el asistente virtual no está disponible en este momento.' }
                ]);
            }
        };
        initChat();
    }, []);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !chat || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', text: inputValue };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const result = await chat.sendMessageStream({ message: inputValue });
            
            let currentText = '';
            setMessages(prev => [...prev, { role: 'model', text: '' }]);

            for await (const chunk of result) {
                currentText += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text = currentText;
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Error sending message to Gemini:", error);
            setMessages(prev => [...prev, { role: 'model', text: 'Lo siento, ocurrió un error. Por favor, intenta de nuevo.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className={`fixed bottom-5 right-5 z-50 transition-transform duration-300 ${isOpen ? 'scale-0' : 'scale-100'}`}>
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-primary text-background rounded-full p-4 shadow-lg hover:bg-highlight focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label="Abrir chat de asistente virtual"
                >
                    <ChatBubbleOvalLeftEllipsisIcon className="h-8 w-8" />
                </button>
            </div>

            <div className={`fixed bottom-5 right-5 z-50 w-full max-w-sm h-[70vh] max-h-[500px] bg-dark-card rounded-xl shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}>
                {/* Header */}
                <div className="flex justify-between items-center p-3 border-b border-gray-700 bg-gray-800/50 rounded-t-xl">
                    <h3 className="text-lg font-bold text-primary">Asistente Virtual</h3>
                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                        <XCircleIcon className="w-7 h-7" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto bg-background/50">
                    <div className="space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs lg:max-w-sm px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-background rounded-br-none' : 'bg-gray-600 text-white rounded-bl-none'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="max-w-xs lg:max-w-sm px-4 py-2 rounded-2xl bg-gray-600 text-white rounded-bl-none">
                                    <div className="flex items-center space-x-1">
                                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input */}
                <div className="p-3 border-t border-gray-700">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Escribe tu mensaje..."
                            disabled={isLoading || !chat}
                            className="flex-1 bg-gray-700 text-white rounded-full py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                            aria-label="Mensaje para el asistente"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !inputValue.trim() || !chat}
                            className="bg-primary text-background rounded-full p-2 disabled:bg-primary/50 disabled:cursor-not-allowed hover:bg-highlight focus:outline-none"
                            aria-label="Enviar mensaje"
                        >
                            <PaperAirplaneIcon className="h-5 w-5" />
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default Chatbot;
