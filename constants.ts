
import { PetPost, User } from './types';

// Center of Iquique, Chile
export const IQUIQUE_CENTER = { lat: -20.2139, lng: -70.1525 };

export const MOCK_USER: User = {
    uid: '12345abcde',
    displayName: 'Marc Ewin',
    email: 'marc.ewin@example.com',
    photoURL: 'https://picsum.photos/id/237/100/100',
};

export const MOCK_POSTS: PetPost[] = [
    {
        id: 'post_1',
        type: 'LOST',
        userId: 'user_a',
        userName: 'Ana',
        photoUrl: 'https://picsum.photos/id/1025/400/300', // Pug
        breed: 'Pug',
        color: 'Beige con máscara negra',
        size: 'Pequeño',
        description: 'Se llama Pipo, es muy amigable pero se asusta con los ruidos fuertes. Llevaba un collar azul.',
        location: { lat: -20.220, lng: -70.145 },
        createdAt: new Date('2024-07-19T10:00:00Z'),
    },
    {
        id: 'post_2',
        type: 'FOUND',
        userId: 'user_b',
        userName: 'Carlos',
        photoUrl: 'https://picsum.photos/id/219/400/300', // Gato naranjo
        breed: 'Mestizo',
        color: 'Naranjo atigrado',
        size: 'Mediano',
        description: 'Gato muy dócil encontrado cerca del supermercado. Parece bien cuidado, debe tener familia.',
        location: { lat: -20.235, lng: -70.138 },
        createdAt: new Date('2024-07-20T15:30:00Z'),
    },
    {
        id: 'post_3',
        type: 'LOST',
        userId: 'user_c',
        userName: 'Maria',
        photoUrl: 'https://picsum.photos/id/1062/400/300', // Labrador
        breed: 'Labrador Retriever',
        color: 'Dorado',
        size: 'Grande',
        description: 'Responde al nombre de Max. Se perdió en la playa Cavancha. Es muy juguetón y tiene una pequeña cicatriz en la oreja derecha.',
        location: { lat: -20.246, lng: -70.149 },
        createdAt: new Date('2024-07-20T08:00:00Z'),
    },
    {
        id: 'post_4',
        type: 'FOUND',
        userId: 'user_d',
        userName: 'Javier',
        photoUrl: 'https://picsum.photos/id/1025/400/300', // Pug - Potential Match for post_1
        breed: 'Pug',
        color: 'Crema',
        size: 'Pequeño',
        description: 'Encontré este perrito asustado en el parque. Tenía un collar azul pero sin placa. Muy amistoso.',
        location: { lat: -20.222, lng: -70.146 },
        createdAt: new Date('2024-07-19T18:00:00Z'),
    },
];
