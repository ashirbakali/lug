var axios = require('axios');
const { Location } = require('../model/location');

const { sendResponse } = require('../utils/sendResponse');
const { STATUS_CODES } = require('../utils/constants');
const { logger } = require('../utils/logger');

// Add cities for specific country controller
exports.addCities = async (req, res) => {
    try {
        var data = { country: req.body.country };
        var cities = [], countries = [];

        var counConfig = {
            method: 'get',
            maxBodyLength: Infinity,
            url: 'https://countriesnow.space/api/v0.1/countries',
            headers: {}
        };

        await axios(counConfig).then(function (response) {
            countries = response.data.data;
        }).catch(function (error) {
            console.log(error);
        });

        var config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://countriesnow.space/api/v0.1/countries/cities',
            headers: {},
            data: data
        };

        await axios(config).then(function (response) {
            cities = response.data.data
        }).catch(function (error) {
            console.log(error);
        });
        const result = await Location.updateOne(data, { $set: { cities: cities } });

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Location", result));

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(true, error.message));
    }
}

// Cities and countries data
// exports.filterLocation = async (req, res) => {
//     try {
//         const search = req.query.search?.trim();
//         Location.aggregate([
//             {
//                 $addFields: {
//                     cities: {
//                         $filter: {
//                             input: "$cities",
//                             as: "city",
//                             cond: { $regexMatch: { input: "$$city", regex: search, options: "i" } }
//                         }
//                     }
//                 }
//             },
//             {
//                 $match: {
//                     $or: [
//                         { "cities": { $exists: true, $ne: [] } }, // filter out documents where cities array is empty or doesn't exist
//                         { "country": { $regex: search, $options: "i" } }
//                     ]
//                 }
//             }
//         ]).exec().then(result => {
//             // Handle result
//             const formattedResult = result.map(item => {
//                 if (item.cities && item.cities.length > 0) {
//                     return item.cities.map(city => `${city}, ${item.country}`);
//                 } else {
//                     return `${item.country}`;
//                 }
//             }).flat(); // Flatten the array

//             res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Get Results", formattedResult));
//         }).catch(err => {
//             // Handle error
//             res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(true, "Something Went Wrong", err));
//         });


//     } catch (error) {
//         logger.error(error.message);
//         res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(true, error.message));
//     }
// }

exports.filterLocation = async (req, res) => {
    try {
        const search = req.query.search?.trim();
        if (!search) {
            return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Search query is required"));
        }

        const result = await Location.aggregate([
            {
                $addFields: {
                    cities: {
                        $filter: {
                            input: "$cities",
                            as: "city",
                            cond: {
                                $regexMatch: {
                                    input: "$$city",
                                    regex: `^${search}`,
                                    options: "i"
                                }
                            }
                        }
                    }
                }
            },
            {
                $match: {
                    $or: [
                        { cities: { $exists: true, $ne: [] } },
                        { country: { $regex: `^${search}`, $options: "i" } }
                    ]
                }
            },
            // Optionally add a limit:
            // { $limit: 20 }
        ]);

        const formattedResult = result.flatMap(item =>
            item.cities.length > 0
                ? item.cities.map(city => `${city}, ${item.country}`)
                : [`${item.country}`]
        );

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Get Results", formattedResult));
    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}
