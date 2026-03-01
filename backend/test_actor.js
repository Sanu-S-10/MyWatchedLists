import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function run() {
    const prompt = "David Dastmalchian movies";
    const cleanPrompt = prompt.replace(/\s+(movie|movies|film|films|series|tv|show|shows)$/i, '').trim();

    const TMDB_API_KEY = process.env.VITE_TMDB_API_KEY || process.env.TMDB_API_KEY;
    const personRes = await fetch(`https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanPrompt)}`);
    const personData = await personRes.json();

    if (personData.results && personData.results.length > 0) {
        const person = personData.results[0];
        console.log("Found person:", person.name, "Popularity:", person.popularity);

        const creditsRes = await fetch(`https://api.themoviedb.org/3/person/${person.id}/combined_credits?api_key=${TMDB_API_KEY}`);
        const creditsData = await creditsRes.json();

        const tmdbIds = new Set([
            ...(creditsData.cast || []).map(c => c.id),
            ...(creditsData.crew || []).map(c => c.id)
        ]);

        console.log("Total TMDB IDs for this person:", tmdbIds.size);
        // If the user's watch history tmdbId is in this set, it's a match!
        console.log("Is Late Night with the Devil (1111873) in here?", tmdbIds.has(1111873)); // 1111873 is TMDB ID for Late Night with the Devil
    } else {
        console.log("No person found");
    }
}
run();
