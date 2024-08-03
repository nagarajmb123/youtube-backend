import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Function to toggle like on a video
const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Check if the user is authenticated
    if (!req.user?._id) {
        throw new ApiError(400, "User not authenticated!");
    }
    // console.log(req.user._id);
   
    // Find and delete the like if it exists
    const like = await Like.findOneAndDelete({ likedBy: req.user._id, video: videoId });

    if (like) {
        // Return a response indicating the video was unliked
        return res.status(200).json(new ApiResponse(200, like, "Successfully unliked!"));
    } else {
        // Create a new like if it does not exist
        const newLike = await Like.create({ likedBy: req.user._id, video: videoId });
        if (!newLike) {
            throw new ApiError(500, "Error during like!");
        }
        // Return a response indicating the video was liked
        return res.status(200).json(new ApiResponse(200, newLike, "Liked successfully!"));
    }
});

// Function to get like status of a video
const likeAndStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Check if the user is authenticated
    if (!req.user?._id) {
        throw new ApiError(400, "User not authenticated!");
    }

    // Aggregation pipeline to get the total likes and check if the current user has liked the video
    const pipeline = [
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $group: {
                _id: null,
                totalLikes: { $sum: 1 },
                likedByUsers: { $addToSet: "$likedBy" }
            }
        },
        {
            $project: {
                totalLikes: 1,
                likedByCurrentUser: { $in: [req.user._id, "$likedByUsers"] }
            }
        }
    ];

    // Execute the aggregation pipeline
    const likeStatus = await Like.aggregate(pipeline);

    if (!likeStatus) {
        throw new ApiError(500, "Error fetching like status!");
    }

    // Return the like status
    if (likeStatus.length > 0) {
        return res.status(200).json(new ApiResponse(200, likeStatus[0], "Like status fetched successfully!"));
    } else {
        return res.status(200).json(new ApiResponse(
            200,
            {
                "_id": null,
                "totalLikes": 0,
                "likedByCurrentUser": false
            },
            "Successfully fetched!"
        ));
    }
});

export {
    toggleVideoLike,
    likeAndStatus
};
