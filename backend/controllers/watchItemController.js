import WatchItem from '../models/WatchItem.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const isQuotaOrRateLimitError = (error) => {
    const message = error?.message || '';
    return error?.status === 429 || /quota|too many requests|rate limit/i.test(message);
};

const isLikelyProductionCompanyQuery = (prompt) => {
    if (/production company|produced by|production from|studio|production studio|distributed by/i.test(prompt)) {
        return true;
    }

    const suffixMatch = prompt.trim().toLowerCase().match(/^(.+?)\s+(movie|movies|film|films|series|tv|show|shows)$/i);
    if (!suffixMatch) {
        return false;
    }

    const candidate = suffixMatch[1].trim();
    const excluded = new Set([
        'action', 'drama', 'comedy', 'romance', 'horror', 'thriller', 'crime', 'mystery',
        'adventure', 'fantasy', 'animation', 'anime', 'documentary', 'sci-fi', 'science fiction',
        'family', 'history', 'war', 'music', 'musical', 'western', 'sport', 'sports', 'biography'
    ]);

    if (!candidate || excluded.has(candidate)) {
        return false;
    }

    return candidate.split(/\s+/).length <= 4;
};

const filterByHeuristics = (prompt, watchHistory) => {
    const lowerPrompt = prompt.toLowerCase().trim();
    const tokens = lowerPrompt
        .replace(/[^a-z0-9\s&'-]/g, ' ')
        .split(/\s+/)
        .filter(Boolean)
        .filter(token => !['show', 'shows', 'movie', 'movies', 'series', 'tv', 'the', 'a', 'an', 'by', 'from'].includes(token));

    const wantsMovie = /\bmovie|movies|film|films\b/i.test(lowerPrompt);
    const wantsSeries = /\bseries|tv|show|shows\b/i.test(lowerPrompt);
    const wantsAnime = /\banime\b/i.test(lowerPrompt);
    const wantsAnimation = /\banimat(ed|ion)?\b/i.test(lowerPrompt);

    let filtered = watchHistory.filter(item => {
        if (wantsMovie && item.mediaType !== 'movie') return false;
        if (wantsSeries && item.mediaType !== 'series') return false;
        if (wantsAnime && item.subType !== 'anime') return false;
        if (wantsAnimation && !['animation', 'anime'].includes(item.subType)) return false;
        return true;
    });

    if (tokens.length > 0) {
        filtered = filtered.filter(item => {
            const title = (item.title || '').toLowerCase();
            const genres = Array.isArray(item.genres) ? item.genres.join(' ').toLowerCase() : '';
            const originCountry = (item.originCountry || '').toLowerCase();
            return tokens.every(token =>
                title.includes(token) ||
                genres.includes(token) ||
                originCountry.includes(token)
            );
        });
    }

    filtered.sort((a, b) => new Date(b.watchDate) - new Date(a.watchDate));
    return filtered;
};

// @desc    Get user watch history
// @route   GET /api/watch-history
// @access  Private
const getWatchHistory = async (req, res) => {
    const watchHistory = await WatchItem.find({ user: req.user._id }).sort({ watchDate: -1 });
    res.json(watchHistory);
};

// @desc    Add a new item to watch history
// @route   POST /api/watch-history
// @access  Private
const addWatchItem = async (req, res) => {
    const {
        tmdbId,
        mediaType,
        subType,
        title,
        posterPath,
        originCountry,
        releaseDate,
        genres,
        rating,
        userNotes,
        isFavorite,
        watchDate,
        watchTimeMinutes,
        runtime,
        seasons,
        episodes,
        episodeDuration,
        watchedSeasons,
        watchedEpisodes,
    } = req.body;

    // Check if already exists for this user
    const alreadyExists = await WatchItem.findOne({ user: req.user._id, tmdbId, mediaType });

    if (alreadyExists) {
        return res.status(400).json({ message: 'Item already in watch history' });
    }

    const watchItem = new WatchItem({
        user: req.user._id,
        tmdbId,
        mediaType,
        subType: subType || 'live_action',
        title,
        posterPath,
        originCountry,
        releaseDate,
        genres,
        rating,
        userNotes,
        isFavorite,
        watchDate,
        watchTimeMinutes,
        runtime,
        seasons,
        episodes,
        episodeDuration,
        watchedSeasons: watchedSeasons || [],
        watchedEpisodes: watchedEpisodes || [],
    });

    const createdItem = await watchItem.save();
    res.status(201).json(createdItem);
};

// @desc    Update a watch item
// @route   PUT /api/watch-history/:id
// @access  Private
const updateWatchItem = async (req, res) => {
    const { rating, userNotes, isFavorite, watchDate, watchedSeasons, watchedEpisodes, watchTimeMinutes } = req.body;

    const watchItem = await WatchItem.findById(req.params.id);

    if (watchItem) {
        // Check if item belongs to user
        if (watchItem.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (rating !== undefined) watchItem.rating = rating;
        if (userNotes !== undefined) watchItem.userNotes = userNotes;
        if (isFavorite !== undefined) watchItem.isFavorite = isFavorite;
        if (watchDate !== undefined) watchItem.watchDate = watchDate;

        // Update TV Series specific data
        if (watchedSeasons !== undefined) watchItem.watchedSeasons = watchedSeasons;
        if (watchedEpisodes !== undefined) watchItem.watchedEpisodes = watchedEpisodes;
        if (watchTimeMinutes !== undefined) watchItem.watchTimeMinutes = watchTimeMinutes;

        const updatedItem = await watchItem.save();
        res.json(updatedItem);
    } else {
        res.status(404).json({ message: 'Watch Item not found' });
    }
};

// @desc    Delete a watch item
// @route   DELETE /api/watch-history/:id
// @access  Private
const deleteWatchItem = async (req, res) => {
    const watchItem = await WatchItem.findById(req.params.id);

    if (watchItem) {
        // Check if item belongs to user
        if (watchItem.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await watchItem.deleteOne();
        res.json({ message: 'Watch Item removed' });
    } else {
        res.status(404).json({ message: 'Watch Item not found' });
    }
};

// @desc    Clear all watch history for current user, optionally by media type
// @route   DELETE /api/watch-history
// @access  Private
const clearWatchHistory = async (req, res) => {
    const { mediaType } = req.query;
    let query = { user: req.user._id };

    if (mediaType) {
        // mediaType can be a single string or comma-separated values
        const types = mediaType.split(',').map(t => t.trim());
        query.mediaType = { $in: types };
    }

    const result = await WatchItem.deleteMany(query);
    res.json({ message: 'Watch history cleared', deletedCount: result.deletedCount || 0 });
};

// @desc    Filter watch history using Google Gemini AI
// @route   POST /api/watch-history/ai-filter
// @access  Private
const aiFilterItems = async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ message: 'Prompt is required' });
        }

        // Fetch user's entire watch history
        const watchHistory = await WatchItem.find({ user: req.user._id }).lean();

        if (watchHistory.length === 0) {
            return res.json([]);
        }

        // Check if user is asking about production company
        const isProductionCompanyQuery = isLikelyProductionCompanyQuery(prompt);
        
        if (isProductionCompanyQuery) {
            return await filterByProductionCompany(prompt, watchHistory, res);
        }

        const heuristicFallback = filterByHeuristics(prompt, watchHistory);

        // Otherwise use Gemini for general filtering
        const validItems = watchHistory.map(item => ({
            _id: item._id.toString(),
            title: item.title,
            mediaType: item.mediaType
        }));

        // Initialize Gemini
        if (!process.env.GEMINI_API_KEY) {
            res.set('X-AI-Filter-Mode', 'basic');
            return res.json(heuristicFallback);
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const systemInstruction = `You are a movie and TV series expert. The user wants to filter their personal watched list based on the prompt: "${prompt}". 
Here is their watched list in JSON format: ${JSON.stringify(validItems)}.
Your task is to return ONLY a JSON array of "_id" strings from the provided list that match the user's prompt (e.g., if they asked for 'action movies', return the _ids of action movies). 
Do NOT output any markdown blocks, explanations, or other text. ONLY the raw JSON array of strings. If none match, return [].`;

        let result;
        try {
            result = await model.generateContent(systemInstruction);
        } catch (error) {
            if (isQuotaOrRateLimitError(error)) {
                console.warn('Gemini quota/rate limit reached, using heuristic fallback.');
                res.set('X-AI-Filter-Mode', 'basic');
                return res.json(heuristicFallback);
            }
            throw error;
        }
        let textResult = result.response.text().trim();

        // Clean up markdown optionally returned by Gemini
        if (textResult.startsWith('\`\`\`json')) {
            textResult = textResult.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
        } else if (textResult.startsWith('\`\`\`')) {
            textResult = textResult.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
        }

        let matchedIds = [];
        try {
            matchedIds = JSON.parse(textResult);
            if (!Array.isArray(matchedIds)) {
                matchedIds = [];
            }
        } catch (e) {
            console.error('Failed to parse Gemini response as JSON:', textResult);
            matchedIds = heuristicFallback.map(item => item._id.toString());
        }

        // Return the full objects for the matched IDs
        const filteredHistory = watchHistory.filter(item => matchedIds.includes(item._id.toString()));

        // Sort by watchDate descending
        filteredHistory.sort((a, b) => new Date(b.watchDate) - new Date(a.watchDate));

        res.set('X-AI-Filter-Mode', 'ai');
        res.json(filteredHistory);
    } catch (error) {
        console.error('AI Filter Error:', error);
        res.status(500).json({ message: 'Failed to process AI filter' });
    }
};

// Helper function to filter by production company from TMDB
const filterByProductionCompany = async (prompt, watchHistory, res) => {
    try {
        const TMDB_API_KEY = process.env.VITE_TMDB_API_KEY || process.env.TMDB_API_KEY;
        if (!TMDB_API_KEY) {
            return res.status(500).json({ message: 'TMDB API key is not configured' });
        }

        // Extract media type from prompt
        let mediaTypeFilter = null;
        if (/\bmovie|film\b/i.test(prompt)) {
            mediaTypeFilter = 'movie';
        } else if (/\bseries|tv|show\b/i.test(prompt)) {
            mediaTypeFilter = 'series';
        }

        // Extract production company name from prompt - handle multiple patterns
        let companyName = '';
        
        // Pattern 1: "production company XXXX", "produced by XXXX", etc.
        const companyNameMatch = prompt.match(/(?:production company|produced by|production from|studio|production studio|distributed by)\s+(.+?)(?:\s+movies?|\s+series?|\s+tv|\s+shows?|\s+films?|$)/i);
        if (companyNameMatch) {
            companyName = companyNameMatch[1].trim();
        } else {
            // Pattern 2: Simple format like "A24 Movie" or "Disney Series"
            // Remove media type suffixes and clean up
            companyName = prompt
                .replace(/\s+(movie|movies|film|films|series|tv|show|shows|content)$/i, '')
                .replace(/production company|produced by|production from|studio|production studio|distributed by/gi, '')
                .trim();
        }

        if (!companyName || companyName.length === 0) {
            return res.json([]);
        }

        // Search TMDB for the production company
        const searchUrl = `https://api.themoviedb.org/3/search/company?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(companyName)}`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();

        if (!searchData.results || searchData.results.length === 0) {
            return res.json([]);
        }

        const companyId = searchData.results[0].id;
        const companyNameLower = companyName.toLowerCase().trim();

        // Helper function to check if a production company matches our target
        const isTargetCompany = (productionCompany) => {
            if (!productionCompany) return false;
            
            const pcName = productionCompany.name ? productionCompany.name.toLowerCase().trim() : '';
            const pcId = productionCompany.id;
            
            // Exact ID match is most reliable
            if (pcId === companyId) return true;
            
            // Normalize company names for better matching
            const normalizeCompanyName = (name) => {
                return name.toLowerCase()
                    .replace(/\s+/g, ' ')  // normalize spaces
                    .replace(/films?$/, '')  // remove 'film' or 'films' suffix
                    .replace(/production$/i, '')  // remove 'production' suffix
                    .replace(/studios?$/i, '')  // remove 'studio' or 'studios' suffix
                    .trim();
            };
            
            const normalizedPcName = normalizeCompanyName(pcName);
            const normalizedTarget = normalizeCompanyName(companyNameLower);
            
            // Check for exact match after normalization
            if (normalizedPcName === normalizedTarget) return true;
            
            // Check if names match closely (accounting for variations)
            if (normalizedTarget.includes(normalizedPcName) || normalizedPcName.includes(normalizedTarget)) {
                // Only accept if both are significant lengths (avoid false positives)
                if (normalizedTarget.length >= 2 && normalizedPcName.length >= 2) {
                    return true;
                }
            }
            
            return false;
        };

        const filteredHistory = [];

        // Check each item in watch history individually against TMDB
        for (const item of watchHistory) {
                        // Skip if media type filter is specified and doesn't match
                        if (mediaTypeFilter && item.mediaType !== mediaTypeFilter) {
                            continue;
                        }

            try {
                const itemUrl = `https://api.themoviedb.org/3/${item.mediaType === 'movie' ? 'movie' : 'tv'}/${item.tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=production_companies`;
                const itemRes = await fetch(itemUrl);
                
                if (!itemRes.ok) continue;
                
                const itemData = await itemRes.json();

                if (itemData.production_companies && Array.isArray(itemData.production_companies)) {
                    // Check if any production company matches our target
                    const hasTargetCompany = itemData.production_companies.some(pc => isTargetCompany(pc));
                    
                    if (hasTargetCompany) {
                        filteredHistory.push(item);
                    }
                }
            } catch (e) {
                console.error(`Failed to check production companies for ${item.title}:`, e.message);
                // Silently continue if individual item lookup fails
            }
        }

        // Sort by watchDate descending
        filteredHistory.sort((a, b) => new Date(b.watchDate) - new Date(a.watchDate));

        res.json(filteredHistory);
    } catch (error) {
        console.error('Production Company Filter Error:', error);
        res.status(500).json({ message: 'Failed to filter by production company' });
    }
};

export { getWatchHistory, addWatchItem, updateWatchItem, deleteWatchItem, clearWatchHistory, aiFilterItems };
