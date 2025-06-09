const cron = require('node-cron');

const { SERVICES } = require('../utils/constants');
const { TravelRequest } = require('../model/TravelerRequest');
const { sendNotification } = require('../services/fcmTokenService');

let cronJobs = [];

// send notification to user(the one post the travel) if there is any pending travel requests
exports.startJob = async () => {
    try {
        // get current time
        const currentDate = new Date();
        const travelRequests = await TravelRequest.find({
            service: SERVICES.IDLE
        }).populate([
            { path: 'travelerId', select: 'fcmToken' },
            { path: 'travelerpostId', select: 'arrivalDate' }
        ]);

        if (travelRequests) {
            // Then, filter the results based on arrivalDate being less than the current date
            const filteredTravelRequests = travelRequests?.filter(travel => {
                return travel?.travelerpostId && travel?.travelerpostId?.arrivalDate > currentDate;
            });

            const cronJob = cron.schedule('0 0 * * *', () => {
                const notifiedTokens = new Set();

                filteredTravelRequests?.forEach((user) => {
                    const fcmToken = user?.travelerId?.fcmToken;
                    if (fcmToken && !notifiedTokens.has(fcmToken)) {
                        sendNotification(fcmToken, 'Travel Request is Pending', 'Travel Request is Pending, Action Required');
                        notifiedTokens.add(fcmToken);
                    }
                });
            });

            cronJobs.push(cronJob);
            cronJob.start();
        }
        console.info('Cron Job Started');

    } catch (error) {
        console.error(error.message);
    }
}

exports.stopJob = () => {
    cronJobs.forEach(cronJob => { cronJob.stop() });
    cronJobs = []
    console.log("cronJobs stopped");
}