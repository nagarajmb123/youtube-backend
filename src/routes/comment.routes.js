import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getVideoComment,
    addComment,
    updateComment,
    deleteComment
} from "../controllers/comment.controller.js"

const router = Router();

router.route("/addComment").post(verifyJWT ,addComment )

router.route("/getVideoComment/:videoId").get(verifyJWT, getVideoComment)

router.route("/updateComment/:commentId").patch(verifyJWT,updateComment )

router.route("/deleteComment/:commentId").delete(verifyJWT,deleteComment)

export default router;