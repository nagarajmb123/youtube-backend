import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    toggleVideoLike,
    likeAndStatus
} from "../controllers/like.controller.js"

const router = Router();

router.route("/videoLiked/:videoId").post(verifyJWT,toggleVideoLike);

router.route("/likeStatus/:videoId").get(verifyJWT,likeAndStatus);

export default router;