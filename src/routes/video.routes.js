import { Router } from "express";
import {
    videoPublish ,
    getVideoById ,
    deleteVideo , 
    getAllVideos ,
    updateVideo ,
    getPrivateVideo ,
    togglePublishStatus
} from "../controllers/video.contrller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";




const router = Router();


router.route("/publish").post(
    verifyJWT,
    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumnail", maxCount: 1 }
    ]),
    videoPublish
);
router.route("/fetchVideo/:videoId").get(verifyJWT,getVideoById)

router.route("/delete/:videoId").delete(verifyJWT, deleteVideo)

router.route("/getAllVideos").get(verifyJWT, getAllVideos)

router.route("/toggleIsPublished/:videoId").patch(verifyJWT,togglePublishStatus)

router.route("/updateVideo/:videoId").patch(
    verifyJWT, 
    upload.single(
    "thumnail"
),
updateVideo
)

router.route("/getPrivateVideo").get(verifyJWT , getPrivateVideo)


export default router;

