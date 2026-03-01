import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const validItems = [
    { _id: "1", title: "John Wick: Chapter 2", mediaType: "movie", releaseYear: 2017 },
    { _id: "2", title: "It Chapter Two", mediaType: "movie", releaseYear: 2019 },
    { _id: "3", title: "Blade Runner 2049", mediaType: "movie", releaseYear: 2017 },
    { _id: "4", title: "Late Night with the Devil", mediaType: "movie", releaseYear: 2024 },
    { _id: "5", title: "The Suicide Squad", mediaType: "movie", releaseYear: 2021 }
];

const prompt = "David Dastmalchian movie";
const systemInstruction = `You are a movie and TV series expert. The user wants to filter their personal watched list based on the prompt: "${prompt}". 
Here is their watched list in JSON format: ${JSON.stringify(validItems)}.
Your task is to return ONLY a JSON array of "_id" strings from the provided list that exactly match the user's prompt.
CRITICAL INSTRUCTIONS AGAINST HALLUCINATIONS:
- If the user asks for a specific actor or actress, you MUST critically verify if that person is actually in the cast of the movie. Do not guess. If you are not 100% certain, DO NOT include it. Use the releaseYear to identify the exact movie.
- E.g. David Dastmalchian was NOT in John Wick or It Chapter Two. Do not include movies they didn't act in.

Do NOT output any markdown blocks, explanations, or other text. ONLY the raw JSON array of strings. If none match, return [].`;

async function testModel(modelName) {
    console.log("Testing model:", modelName);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(systemInstruction);
        console.log("RESULT:", result.response.text());
    } catch (e) {
        console.error("ERROR:", e.message);
    }
}

async function run() {
    await testModel("gemini-2.5-flash");
    await testModel("gemini-2.0-flash");
    await testModel("gemini-2.5-flash-lite");
    await testModel("gemini-3-flash-preview");
    await testModel("gemma-3-27b-it");
}

run();
