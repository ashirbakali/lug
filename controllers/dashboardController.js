const { User } = require('../model/user');
const { Travel } = require('../model/travel');
const { TravelRequest } = require('../model/TravelerRequest');

const { sendResponse } = require('../utils/sendResponse');
const { STATUS_CODES } = require('../utils/constants');
const { logger } = require('../utils/logger');

// get no of doctors, users, services & appoinments controller
exports.dashData = async (req, res) => {
    try {
        const travels = await Travel.countDocuments();
        const users = await User.countDocuments();
        const travelRequest = await TravelRequest.countDocuments();

        const pipeline = [
            {
                $group: {
                    _id: {
                        // year: { $year: '$createdAt' }, // Group by year
                        month: { $month: '$createdAt' } // Group by month
                    },
                    count: { $sum: 1 } // Count the number of users in each group
                }
            },
            {
                $sort: {
                    // '_id.year': 1,
                    '_id.month': 1
                }
            }
        ];
        const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const userChart = await User.aggregate(pipeline);
        const travelChart = await Travel.aggregate(pipeline);

        // Initialize counts for all months to 0
        const userCounts = Object.fromEntries(labels.map(month => [month, 0]));
        const travelCounts = Object.fromEntries(labels.map(month => [month, 0]));

        // Fill in the actual counts for each month
        userChart.forEach(item => {
            const monthName = labels[item._id.month - 1];
            userCounts[monthName ? monthName : item] = item.count ? item.count : 0;
        });

        travelChart.forEach(item => {
            const monthName = labels[item._id.month - 1];
            travelCounts[monthName] = item.count;
        });

        const userChartData = Object.entries(userCounts).map(([month, value]) => ({ month, value }));
        const travelChartData = Object.entries(travelCounts).map(([month, value]) => ({ month, value }));
        let userDataForChart = [], travelDataForChart = [];
        for (var i = 0; i < userChartData.length; i++) { userDataForChart.push(userChartData[i].value) }
        for (var i = 0; i < travelChartData.length; i++) { travelDataForChart.push(travelChartData[i].value) }

        const data = {
            data: [
                { heading: "Total Travel Posts", subHeading: "Travel Post By Users", data: travels },
                { heading: "Total Request Travel", subHeading: "Total Travel Requests By Users", data: travelRequest },
                { heading: "Total Users", subHeading: "Total Register Users", data: users }
            ],
            chartData: { month: labels, userChart: userDataForChart, travelChart: travelDataForChart }
        }

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "All Dashboard Data", data));

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}