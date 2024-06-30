import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        username: {
            type: String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true,
        },
        email: {
            type: String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            
        },
        fullname: {
            type: String,
            required:true,
            unique:true,
            trim:true,
            index:true,
            
        },
        avatar:{
            type:String,//cloudinary url
            required: true
        },
        coverImage:{
            type:String,//cloudinary url
            
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref:"video"
            }
        ],
        password:{
            type:String,
            required:[true,'Password is required']
        },
        refreshToken:{
            type:String 
        }
    },
    {
        timestamps:true
    }
)

userSchema.pre("save",async function (next) {
    if(!this.isModified("password")) return next();


    this.password = await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
   return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullname:this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id:this._id,
          
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User = mongoose.model("User",userSchema)



/*

Why JWT is Needed:
Stateless Authentication: JWTs allow for stateless authentication, meaning the server does not need to store session information.
 Instead, all necessary user information is stored in the token itself.
Security: JWTs can securely transmit information between parties as they are signed using a secret key.

Generating Access Tokens: JWTs are generated when a user logs in or performs an action that requires authentication.
 These tokens are used to authenticate subsequent requests:

 Generating Refresh Tokens: Refresh tokens are used to obtain new access tokens without requiring the user to log in again.
  This helps maintain a seamless user experience:



Hashing Passwords: When a user creates or updates their password,
 bcrypt will hash the password before storing it in the database. 
 This is done in the pre("save") middleware:
Comparing Passwords: When a user logs in, 
bcrypt is used to compare the entered password with the stored hashed password:



*/