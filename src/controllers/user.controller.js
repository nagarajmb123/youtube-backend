import {asyncHandler} from "../utils/asyncHandler.js"

import {ApiError} from "../utils/ApiError.js"

import {User} from "../models/user.model.js"

import {uploadOnCloudinary} from "../utils/cloudinary.js"

import {ApiResponse } from "../utils/ApiResponse.js"

import jwt from "jsonwebtoken"


const generateAccessAndRefreshTokens = async ( userId)=>{
  try {
      const user =  await User.findById(userId)
      const accessToken = user.generateAccessToken()
      const RefreshToken = user.generateRefreshToken()

      user.refreshToken = RefreshToken
      await user.save({ validateBeforeSave:false})

      return { accessToken , RefreshToken }

  } catch (error) {
      throw new ApiError(500, " something went wrong while generating refresh and Acess token")
  }
}


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
   console.log("req.body:", req.body);
    
//    if(fullname === "")
//     {
//         throw new ApiError(400,"fullname is required")
//     }

        if(
            [fullname,email,username,password].some((field)=> field?.trim() === "")
        ){
            throw new ApiError(400," All fields are requied ");
        }

      const existedUser = await User.findOne({
            $or:[{ username } , { email }]
        })
        console.log("existedUser: ", existedUser);
        if(existedUser){
            throw new ApiError(409,
                 "User with email or username is already exists")
        }



        
        console.log("req.files:", req.files);
       const avatarLocalPath = req.files?.avatar[0]?.path;
      //  const coverImageLocalPath = req.files?.coverImage[0]?.path;


       let coverImageLocalPath;
       if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
       }


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
          avatar: avatar.url,
          coverImage: coverImage?.url || "",
          email,
          password,
          username: (typeof username === 'string') ? username.toLowerCase() : username
      });
      

      const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
      )
      console.log("created : ", createdUser);



      if(!createdUser){
        throw new ApiError(500," something went wrong while registering the user")
      }

      return res.status(201).json(
        new ApiResponse(200,createdUser," user registered successfully ")
      )
})


//login for user

const loginUser = asyncHandler( async (req,res)=>{
  /* 
            note:"Async Handler: asyncHandler is used to wrap the loginUser function, ensuring that any errors are caught and passed to the Express error handling middleware."
      req body(take data from this)
      using username or email
      find the user
      password check
      access and refresh have generate and send to user
      send using cookie
  */ 

  const { email, username , password } = req.body

  if(!(email || username)){
    throw new ApiError(400 ,"  username or email is required ")
  }

  const user =  await User.findOne({ 
    $or : [{username},{email}]
  })

  if(!user){
    throw new ApiError(404," User does not exist ")
  }

 const isPasswordValid =  await user.isPasswordCorrect(password)

  if(!isPasswordValid){
   throw new ApiError(401," Invalid user credentails ")
  } 

  const {accessToken , RefreshToken } = await
   generateAccessAndRefreshTokens(user._id);

   const loggedInUser = await User.findOne(user._id).
   select("-password -refreshToken")

   const options = {
    httpOnly:true,
    secure: true
   }

   return res
   .status(200)
   .cookie("accessToken ", accessToken , options)
   .cookie("refreshToken ", RefreshToken , options)
   .json(
    new ApiResponse(
      200,
      {
        user: loggedInUser, accessToken , RefreshToken
      },
      " User logged in Successfully "
    )
   )


})
 
//logout user

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
      req.user._id,
      {
          $set: {
              refreshToken: undefined
          }
      },
      {
          new: true
      }
  );

  const options = {
      httpOnly: true,
      secure: true
  };

  res.clearCookie("accessToken", options);
  res.clearCookie("refreshToken", options);

  return res
  .status(200)
  .json(new ApiResponse(200, {}, "User logged out"));
});

const refreshAccessToken = asyncHandler ( async (req,res)=>{

    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if(incomingRefreshToken){
        throw new ApiError(401, " unathorized request ")
    }

    try {
      const decodedToken =  jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
      )
  
      const user = await User.findById(decodedToken?._id)
  
      if(!user){
        throw new ApiError(401, " invalid refresh token ")
      }
  
      if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401," refresh token is expired or used ")
      }
  
      const options = {
        httpOnly : true,
        secure : true
      }
  
      const {accessToken ,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
  
      return res
      .status(200)
      .cookie("accessToken", accessToken,options)
      .cookie("refreshToken",newRefreshToken,options)
      .json(
        new ApiResponse(
            200,
            {accessToken,refreshToken : newRefreshToken}
            ," Access token refreshed "
        )
      )
    } catch (error) {
        throw new ApiError(401 , error?.message || " invalid refresh token")
    }

})



export  { 
  registerUser , loginUser, logoutUser,refreshAccessToken
}
