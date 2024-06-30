import {asyncHandler} from "../utils/asyncHandler.js"

import {ApiError} from "../utils/ApiError.js"

import {User} from "../models/user.model.js"

import {uploadOnCloudinary} from "../utils/cloudinary.js"

import {ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler( async (req,res)=>{
    // res.status(200).json({
    //     message:"Nagaraj is hero"
    // })
/*
    STEPS:
     get user details from frontend
     validation - not empty{eg:ckecking email fromat like it as @ is there or not ckeking by using string method include}
     check if user already exist
     check for images,check for avatar
     upload them to cloudinary, avatar
     create user object - create entry in db
     remove password and refresh token field from response
    check for user creation
    return response or error message
 */


   const {fullname,email,username,password} = req.body
   console.log("email:",email);
   
//    if(fullname === "")
//     {
//         throw new ApiError(400,"fullname is required")
//     }

        if(
            [fullname,email,username,password].some((field)=> field?.trim() === "")
        ){
            throw new ApiError(400," All fields are requied ");
        }

      const existedUser =  User.findOne({
            $or:[{ username } , { email }]
        })

        if(existedUser){
            throw new ApiError(409,
                 "User with email or username is already exists")
        }
       const avatarLocalPath = req.files?.avatar[0]?.path;
       const coverImageLocalPath = req.files?.coverImage[0]?.path;
       
       if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required");
       }
       
      const avatar = await uploadOnCloudinary(avatarLocalPath)
      const coverImage = await uploadOnCloudinary(coverImageLocalPath)

      if(!avatar)
        {
            throw new ApiError(400,"Avatar file is required"); 
        }

       const user = await User.create({
            fullname,
            avatar:avatar.url,
            coverImage:coverImage?.url || "",
            email,
            password,
            username:username.tolowerCase()
        })

      const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
      )

      if(!createdUser){
        throw new ApiError(500," something went wrong while registering the user")
      }

      return res.status(201).json(
        new ApiResponse(200,createdUser," user registered successfully ")
      )
})

export  {registerUser}
