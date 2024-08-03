import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    toggleSubscribe,
    getSubscribedChannels
} from "../controllers/subscribe.controller.js"

const router = Router()

router.route("/toggleSubscribe/:channelId").post(verifyJWT,toggleSubscribe);

router.route("/getSubscribedChannels/:subscriberId").get(verifyJWT,getSubscribedChannels);

export default router;

