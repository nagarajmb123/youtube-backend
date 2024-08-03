import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.body;
    const skip = (page - 1) * limit;

    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            fullname: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $skip: skip
        },
        {
            $limit: limit
        }
    ]);

    if (!comments.length) {
        throw new ApiError(404, "Unable to find the comments!");
    }

    return res.status(200).json(new ApiResponse(200, comments, "Fetched the comments successfully!"));
});

const addComment = asyncHandler(async (req, res) => {
    const {comment ,videoId } = req.body;
    console.log(req.body);
    
    console.log("Request Body:", req.body);

    if (!comment || typeof comment !== 'string' || !comment.trim()) {
        throw new ApiError(400, "No content in comment");
    }

    const commentResponse = await Comment.create({
        content: comment,
        video: videoId,
        owner: req.user?._id
    });

    if (!commentResponse) {
        throw new ApiError(501, "Error in creating the comment!");
    }

    return res.status(201).json(new ApiResponse(201, commentResponse, "Comment created successfully!"));
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { newComment } = req.body;

    if (!newComment) {
        throw new ApiError(400, "No new content in comment!");
    }

    const comment = await Comment.findById(commentId);

    if (!comment.owner.equals(req.user?._id)) {
        throw new ApiError(401, "Only owner can update the comment!");
    }

    const newCommentRes = await Comment.findByIdAndUpdate(
        commentId,
        { content: newComment },
        { new: true, runValidators: true }
    );

    if (!newCommentRes) {
        throw new ApiError(500, "Error during updating comment!");
    }

    return res.status(200).json(new ApiResponse(200, newCommentRes, "Updated the comment successfully!"));
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);

    if (!comment.owner.equals(req.user?._id)) {
        throw new ApiError(401, "Only owner of the comment can delete!");
    }

    const deleteCommentRes = await Comment.findByIdAndDelete(commentId);

    if (!deleteCommentRes) {
        throw new ApiError(500, "Error during deleting the comment!");
    }

    return res.status(200).json(new ApiResponse(200, deleteCommentRes, "Deleted the comment successfully!"));
});

export {
    getVideoComment,
    addComment,
    updateComment,
    deleteComment
};
