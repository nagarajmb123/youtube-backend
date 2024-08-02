import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { deleteFileFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";

const videoPublish = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    console.log("reqbody: ", req.body);
    console.log("reqfiles: ", req.files);

    if (!req.files || !req.files.videoFile || !req.files.videoFile[0] || !req.files.videoFile[0].path) {
        throw new ApiError(400, "Video local path is not available!");
    }
    if (!req.files || !req.files.thumnail || !req.files.thumnail[0] || !req.files.thumnail[0].path) {
        throw new ApiError(400, "Thumbnail local path is not available!");
    }

    const videoLocalPath = req.files.videoFile[0].path;
    const thumnailLocalPath = req.files.thumnail[0].path;
    const owner = req.user?._id;

    const videoUrl = await uploadOnCloudinary(videoLocalPath);
    console.log("videoUrl:", videoUrl);
    const thumnailUrl = await uploadOnCloudinary(thumnailLocalPath);
    console.log("thumnailUrl:", thumnailUrl);

    if (!videoUrl || !thumnailUrl) {
        throw new ApiError(400, "Video URL and thumbnail URL not found, any problem during uploading on cloud");
    }

    const video = await Video.create({
        videoFile: videoUrl.url,
        thumnail: thumnailUrl.url,
        title,
        description,
        owner,
        duration: videoUrl.duration,
    });

    if (!video) {
        throw new ApiError(400, "Any problem during creating video!");
    }

    return res.status(200).json(new ApiResponse(201, video, "Video is created successfully!"));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
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
                            avatar: 1,
                            _id: 1
                        }
                    }
                ]
            }
        }
    ]);

    if (!video.length) {
        throw new ApiError(501, "Video not found in the database!");
    }

    return res.status(201).json(new ApiResponse(202, video, "Video successfully fetched!"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(501, "Video not found to delete!");
    }

    const videoFileId = video.videoFile.split('/').pop().replace(/\.[^/.]+$/, '');
    const thumnailId = video.thumnail.split('/').pop().replace(/\.[^/.]+$/, '');

    const deleteResponse = await Video.findByIdAndDelete(videoId);

    if (!deleteResponse) {
        throw new ApiError(500, "Fail to delete the video!");
    }

    try {
        const videoDeleteRes = await deleteFileFromCloudinary(videoFileId, "video");
        const thumnailDeleteRes = await deleteFileFromCloudinary(thumnailId);
        console.log('Cloudinary deletion results:', videoDeleteRes, thumnailDeleteRes);
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
    }

    return res.status(201).json(new ApiResponse(201, deleteResponse, "Video deleted successfully!"));
});


const getAllVideos = asyncHandler(async(req,res)=>{
    
    const {page = 1,limit = 10,userId = ""} = req.query;
    console.log("query: ", req.query);
    
    const skip =(page -1)*limit;
    const pipeline = [
        {
            $match:{
                isPublished:true,
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $project:{
                            fullname:1,
                            username:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $skip:skip
        },
        {
            $limit:parseInt(limit)
        }
    ]

    if(userId){
        pipeline.splice(2,0,{
            $match:{
                "owner._id":new mongoose.Types.ObjectId(userId)
            }
        });
    }

    const allVideos = await Video.aggregate(pipeline);
    if(!allVideos){
        throw new ApiError(401,"could not get all videos!")
    }
    return res.status(200).json(new ApiResponse(200,allVideos,"All videos successfully fetched!"))
})

const updateVideo = asyncHandler(async(req,res)=>{
    const {videoId} = req.params;
    const { title, description } = req.body;
    console.log("reqbody: ", req.body);
    const thumnail = req.file?.path
    console.log(thumnail);
    
    const oldVideoFile = await Video.findById(videoId);
    console.log(oldVideoFile);
    const publicId = oldVideoFile.thumnail.split('/').pop().replace(/\.[^/.]+$/, '');

    

    if(req.user._id.equals(oldVideoFile.owner))
    {
        const thumnailCloudinary = await uploadOnCloudinary(thumnail);

        if(!thumnailCloudinary){
            throw new ApiError(501,"unable to update on cloudinary!");

        }
        console.log("nail",thumnailCloudinary.url)
        const newVideoFile = await Video.findByIdAndUpdate(
            videoId,
            {
                $set:{
                    title:title,
                    description:description,
                    thumnail:thumnailCloudinary?.url
                }
            }
        )

        if(!newVideoFile){
            throw new ApiError(501,"unable to update new videofile")
        }
        const response = await deleteFileFromCloudinary(publicId)
        console.log(response)

        return res.status(201).json(new ApiResponse(201,newVideoFile,"updated video successfully!"));
    }else{
        throw new ApiError(400,"only owner can update!");
    }
    

})

const getPrivateVideo = asyncHandler(async(req,res)=>{
    const video = await Video.aggregate(
        [
            {
                $match:{
                    isPublished:false,
                }
            },
            {
                $lookup:{
                    from:"users",
                    localField:"owner",
                    foreignField:"_id",
                    as:"owner",
                    pipeline:[
                        {
                            $project:{
                                fullname:1,
                                username:1,
                                avatar:1
                            }
                        }
                    ]
                }
            },
            {
                $match:{
                    "owner._id":new mongoose.Types.ObjectId(req?.user?._id)
                }
            }
        ]
    )

    if(video.length === 0){
        throw new ApiError(404,"no private is found!");
    }

    return res.status(201).json(new ApiResponse(200,video,"private video is fetched successfully!"))
})


const togglePublishStatus = asyncHandler(async(req,res)=>{
    const {videoId} = req.params;

    const oldVideoFile = await Video.findById(videoId);

    if(req.user._id.equals(oldVideoFile.owner))
    {
        const newVideoFile = await Video.findByIdAndUpdate(
            videoId,
            {
                $set:{
                    isPublished:!oldVideoFile?.isPublished
                }
            }
        )
        if(!newVideoFile){
            throw new ApiError(404,"failed to update Published!")
        }

        return res.status(201).json(new ApiResponse(200,newVideoFile,"video is toggled successfully!"));
    }else{
        throw new ApiError(404,"only owner can update!")
    }
})




export { 
      videoPublish,
      getVideoById,
      deleteVideo,
      getAllVideos ,
      updateVideo ,
      getPrivateVideo ,
      togglePublishStatus
 };
