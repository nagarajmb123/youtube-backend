import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createTweet,
    getUserTweet,
    updateUserTweet,
    deleteTweet
} from "../controllers/tweet.controller.js"

const router = Router();

router.route("/createTweet").post(verifyJWT, createTweet);
router.route("/getUserTweet/:userId").get(verifyJWT, getUserTweet);
router.route("/updateUserTweet/:tweetId").patch(verifyJWT, updateUserTweet);
router.route("/deleteTweet/:tweetId").delete(verifyJWT, deleteTweet);

export default router;
