import WatchItem from '../models/WatchItem.js';

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

export { getWatchHistory, addWatchItem, updateWatchItem, deleteWatchItem, clearWatchHistory };
