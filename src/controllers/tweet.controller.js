import { Tweet } from "../models/tweet.model.js";
import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const owner = req.user?._id;
    console.log(content);

    if (!content) {
        throw new ApiError(400, "Content is undefined!");
    }

    const tweet = await Tweet.create({
        content,
        owner
    });

    if (!tweet) {
        throw new ApiError(500, "Tweet is not created!");
    }
    return res.status(201).json(new ApiResponse(201, tweet, "Tweet created successfully!"));
});

const getUserTweet = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const tweet = await Tweet.find({ owner: userId });

    if (!tweet) {
        throw new ApiError(401, "Unauthorized request and failed to fetch!");
    }

    return res.status(200).json(new ApiResponse(200, tweet, "Fetched user tweet successfully!"));
});

const updateUserTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { newContent } = req.body;
    const userId = req.user?._id;

    if (!newContent) {
        throw new ApiError(400, "Content is undefined!");
    }

    const newTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        { content: newContent },
        { new: true, runValidators: true }
    );

    if (!newTweet) {
        throw new ApiError(500, "Unable to update the tweet!");
    }

    if (!newTweet.owner.equals(userId)) {
        throw new ApiError(401, "Only the owner can change the tweet!");
    }

    return res.status(201).json(new ApiResponse(201, newTweet, "Updated the tweet successfully!"));
});

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    const tweet = await Tweet.findById(tweetId);

    if (tweet.owner.equals(req.user._id)) {
        const deleteResponse = await Tweet.findByIdAndDelete(tweetId);
        if (!deleteResponse) {
            throw new ApiError(400, "Tweet not found!");
        }
        return res.status(200).json(new ApiResponse(200, deleteResponse, "Tweet deleted successfully!"));
    } else {
        throw new ApiError(400, "Only the owner can delete!");
    }
});

export {
    createTweet,
    getUserTweet,
    updateUserTweet,
    deleteTweet
};
