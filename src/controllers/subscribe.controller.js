import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";

const toggleSubscribe = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    if (channelId === req.user?._id.toString()) {
        throw new ApiError(400, "You cannot subscribe to yourself!");
    }

    const subscribe = await Subscription.findOneAndDelete({ subscriber: req.user?._id, channel: channelId });
    if (subscribe) {
        return res.status(200).json(new ApiResponse(200, subscribe, "Successfully unsubscribed!"));
    } else {
        const newSubscribe = await Subscription.create({ subscriber: req.user?._id, channel: channelId });
        return res.status(201).json(new ApiResponse(201, newSubscribe, "Successfully subscribed!"));
    }
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID");
    }

    const channels = await Subscription.aggregate([
        {
            $match: {
                subscriber:new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $project: {
                            fullname: 1,
                            username: 1,
                            avatar: 1,
                            _id: 1
                        }
                    }
                ]
            }
        }
    ]);

    return res.status(200).json(new ApiResponse(200, channels, "Fetched subscribed channels!"));
});

export {
    toggleSubscribe,
    getSubscribedChannels
};
