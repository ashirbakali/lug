
exports.paginate = async (model, query, options, populateOptions) => {
    const { limit, sort = { _id: -1 } } = query;

    try {
        let query = model.find(options);

        // Apply population options if provided
        if (populateOptions) { query = query.populate(populateOptions) }

        const results = await query.sort(sort).limit(limit).exec();
        const total = await model.countDocuments(options).exec();

        return { results, totalResults: total }

    } catch (error) {
        throw new Error(error.message);
    }
}