
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { PetPost, GeoPoint, GroundedResponse, GroundingSource } from '../types';

// FIX: Initialize GoogleGenAI with API_KEY directly from environment variables and remove redundant checks, per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * Converts a File object to a base64 string and gets its mime type.
 * @param file The file to convert.
 * @returns A promise that resolves to an object containing the base64 string and mime type.
 */
const fileToBase64 = async (file: File): Promise<{ base64: string, mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve({ base64: base64String, mimeType: file.type });
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};


/**
 * Fetches an image from a URL and converts it to a base64 string and gets its mime type.
 * @param imageUrl The URL of the image to convert.
 * @returns A promise that resolves to an object containing the base64 string and mime type.
 */
const imageUrlToBase64 = async (imageUrl: string): Promise<{ base64: string, mimeType: string }> => {
    // A proxy might be needed for CORS issues in a real production environment.
    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    const mimeType = blob.type;
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve({ base64: base64String, mimeType });
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
    });
};

/**
 * Generates a pet description by analyzing an image.
 * @param file The image file of the pet.
 * @returns A promise that resolves to an object containing the pet's breed, color, size, and description.
 */
export const generatePetDescriptionFromImage = async (
    file: File
): Promise<{ breed: string; color: string; size: string; description: string }> => {
    const model = 'gemini-2.5-flash';
    try {
        const { base64, mimeType } = await fileToBase64(file);

        const prompt = "Analiza la imagen de esta mascota y descríbela. Identifica la raza (si no estás seguro, usa 'Mestizo' y sugiere posibles razas dominantes), el color principal, el tamaño aproximado ('Pequeño', 'Mediano', 'Grande'), y una breve descripción de cualquier característica distintiva (ej. manchas, collar, etc.).";

        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            data: base64,
                            mimeType: mimeType,
                        },
                    },
                ],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        breed: { type: Type.STRING, description: "La raza de la mascota." },
                        color: { type: Type.STRING, description: "El color principal de la mascota." },
                        size: { type: Type.STRING, description: "El tamaño estimado (Pequeño, Mediano, Grande)." },
                        description: { type: Type.STRING, description: "Una breve descripción de señas particulares." },
                    },
                    required: ["breed", "color", "size", "description"],
                },
            },
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error calling Gemini API for description generation:", error);
        throw new Error("No se pudo generar la descripción. Inténtalo de nuevo.");
    }
};


/**
 * Edits an image from a URL using a text prompt with the Gemini 2.5 Flash Image model.
 * @param imageUrl The URL of the image to edit.
 * @param prompt The text prompt describing the desired edit.
 * @returns A promise that resolves to a data URL (base64) of the edited image.
 */
export const editImageFromUrl = async (
    imageUrl: string, 
    prompt: string
): Promise<string> => {
    const model = 'gemini-2.5-flash-image';
    try {
        const { base64, mimeType } = await imageUrlToBase64(imageUrl);

        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: prompt,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }

        throw new Error("No image data found in the API response.");

    } catch (error) {
        console.error("Error calling Gemini API for image editing:", error);
        throw new Error("No se pudo generar la imagen editada. Por favor, revisa la consola para más detalles y vuelve a intentarlo.");
    }
};

/**
 * Gets AI-powered suggestions for matching a lost pet with found pets.
 * @param lostPet The details of the newly reported lost pet.
 * @param foundPets A list of all available found pets to search through.
 * @returns A promise that resolves to an array of matching pet post IDs.
 */
export const getSuggestions = async (lostPet: PetPost, foundPets: PetPost[]): Promise<string[]> => {
    if (foundPets.length === 0) {
        return [];
    }

    const model = 'gemini-2.5-flash';
    
    // Simplify the data sent to the model to avoid unnecessary details
    const simplifiedLostPet = {
        breed: lostPet.breed,
        color: lostPet.color,
        size: lostPet.size,
        description: lostPet.description,
        location: lostPet.location,
    };

    const simplifiedFoundPets = foundPets.map(p => ({
        id: p.id,
        breed: p.breed,
        color: p.color,
        size: p.size,
        description: p.description,
        location: p.location,
    }));
    
    const prompt = `
        Eres un asistente experto en encontrar mascotas perdidas en Iquique, Chile. Tu tarea es analizar una mascota PERDIDA recién reportada y compararla con una lista de mascotas ENCONTRADAS para encontrar las coincidencias más probables.

        Considera los siguientes factores para la coincidencia, en orden de importancia:
        1. Raza: Razas exactas o muy similares son indicadores fuertes.
        2. Color: Coincidencia en colores primarios.
        3. Descripción: Busca marcas identificativas únicas mencionadas (ej. 'mancha en el ojo izquierdo', 'cojea un poco', 'lleva un collar rojo').
        4. Tamaño: Compara descripciones como 'pequeño', 'mediano', 'grande'.
        5. Proximidad Geográfica: Es un factor, pero las mascotas pueden moverse. Una coincidencia fuerte en descripción física que esté más lejos es mejor que una coincidencia débil muy cercana.

        Mascota PERDIDA reportada:
        ${JSON.stringify(simplifiedLostPet)}

        Lista de mascotas ENCONTRADAS disponibles:
        ${JSON.stringify(simplifiedFoundPets)}

        Basado en tu análisis, devuelve un objeto JSON con las IDs de las 3 coincidencias más probables de la lista de mascotas ENCONTRADAS. Las IDs deben estar ordenadas de la más probable a la menos probable. Si no hay coincidencias plausibles, devuelve un array vacío.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        matches: {
                            type: Type.ARRAY,
                            description: "An array of IDs of the most likely matching found pet posts.",
                            items: {
                                type: Type.STRING,
                                description: "The ID of a matching found pet post.",
                            },
                        },
                    },
                    required: ['matches'],
                },
            },
        });
        
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        
        return result.matches || [];

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return [];
    }
};

/**
 * Gets nearby places using Google Maps grounding.
 * @param location The geographic point to search around.
 * @param placeType The type of place to search for (e.g., "clínicas veterinarias").
 * @returns A promise that resolves to an object with the response text and grounding sources.
 */
export const getNearbyPlaces = async (location: GeoPoint, placeType: string): Promise<GroundedResponse> => {
    const model = 'gemini-2.5-flash';
    const prompt = `Genera una lista de "${placeType}" cercanos a la ubicación proporcionada en Iquique, Chile.
Para cada lugar, formatea la salida como una lista markdown de la siguiente manera:
- **Nombre del Lugar**
  Dirección completa del lugar

No incluyas ninguna introducción o conclusión, solo la lista.`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                tools: [{ googleMaps: {} }],
                toolConfig: {
                    retrievalConfig: {
                        latLng: {
                            latitude: location.lat,
                            longitude: location.lng
                        }
                    }
                }
            },
        });

        const text = response.text;
        const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        const sources: GroundingSource[] = rawChunks
            .flatMap((chunk: any) => {
                const results: GroundingSource[] = [];
                if (chunk.maps?.uri) {
                    results.push({ uri: chunk.maps.uri, title: chunk.maps.title });
                }
                if (chunk.maps?.placeAnswerSources?.reviewSnippets) {
                    chunk.maps.placeAnswerSources.reviewSnippets.forEach((snippet: any) => {
                        if(snippet.uri) {
                             results.push({ uri: snippet.uri, title: snippet.title || chunk.maps.title || "Ver reseña" });
                        }
                    });
                }
                return results;
            })
            .filter((source: GroundingSource | null): source is GroundingSource => source !== null)
            // Remove duplicates by URI
            .filter((value, index, self) =>
              index === self.findIndex((t) => t.uri === value.uri)
            );

        return { text, sources };

    } catch (error) {
        console.error("Error calling Gemini API with Maps Grounding:", error);
        return { 
            text: "Hubo un error al buscar lugares cercanos. Por favor, inténtalo de nuevo.",
            sources: [] 
        };
    }
};

/**
 * Generates a social media post text for a lost pet.
 * @param pet The pet post details.
 * @returns A promise that resolves to the generated social media text.
 */
export const generateSocialMediaPost = async (pet: PetPost): Promise<string> => {
    const model = 'gemini-2.5-flash';
    const prompt = `
        Eres un miembro compasivo de la comunidad de Iquique, Chile, y estás ayudando a encontrar una mascota perdida.
        Crea una publicación para redes sociales (Facebook, Instagram) basada en los siguientes detalles.
        Usa un tono de urgencia pero esperanzador. Incluye emojis relevantes y hashtags para maximizar la visibilidad.
        Sé conciso y directo. Termina con un llamado a la acción claro.

        Detalles de la mascota:
        - Tipo: ${pet.type === 'LOST' ? 'Perdido' : 'Encontrado'}
        - Raza: ${pet.breed}
        - Color: ${pet.color}
        - Tamaño: ${pet.size}
        - Descripción: ${pet.description}
        - Visto por última vez: Cerca de la ubicación en el mapa en Iquique.

        Ejemplo de formato:
        ¡SE BUSCA! 🆘 PERRITO PERDIDO EN IQUIQUE
        
        Nombre/Raza: [Raza]
        Color: [Color]
        Tamaño: [Tamaño]
        Señas particulares: [Descripción]
        
        Se perdió el [Fecha] cerca de [Referencia de ubicación general].
        
        ¡Por favor, si lo ves, contacta a [Número/Forma de contacto]! Ayúdanos a que vuelva a casa. 🙏
        
        #MascotaPerdida #Iquique #SeBusca #PerroPerdidoIquique #[Raza] #Chile #PorFavorCompartir
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API for social media post:", error);
        throw new Error("No se pudo generar la publicación.");
    }
};
