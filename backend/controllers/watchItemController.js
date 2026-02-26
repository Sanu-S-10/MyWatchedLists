import WatchItem from '../models/WatchItem.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

        // Fetch user's entire watch history to pass to Gemini
        const watchHistory = await WatchItem.find({ user: req.user._id }).lean();

        if (watchHistory.length === 0) {
            return res.json([]);
        }

        // Prepare the list of titles for Gemini to keep context small
        const validItems = watchHistory.map(item => ({
            _id: item._id.toString(),
            title: item.title,
            mediaType: item.mediaType
        }));

        // Initialize Gemini
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ message: 'GEMINI_API_KEY is not configured on the server.' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const systemInstruction = `You are a movie and TV series expert. The user wants to filter their personal watched list based on the prompt: "${prompt}". 
Here is their watched list in JSON format format: ${JSON.stringify(validItems)}.
Your task is to return ONLY a JSON array of "_id" strings from the provided list that match the user's prompt (e.g., if they asked for 'Christopher Nolan movies', return the _ids of movies he directed). 
Do NOT output any markdown blocks, explanations, or other text. ONLY the raw JSON array of strings. If none match, return [].`;

        const result = await model.generateContent(systemInstruction);
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
            matchedIds = [];
        }

        // Return the full objects for the matched IDs
        const filteredHistory = watchHistory.filter(item => matchedIds.includes(item._id.toString()));

        // Also sort them by watchDate descending like standard history
        filteredHistory.sort((a, b) => new Date(b.watchDate) - new Date(a.watchDate));

        res.json(filteredHistory);
    } catch (error) {
        console.error('AI Filter Error:', error);
        res.status(500).json({ message: 'Failed to process AI filter' });
    }
};

export { getWatchHistory, addWatchItem, updateWatchItem, deleteWatchItem, clearWatchHistory, aiFilterItems };
