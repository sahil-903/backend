import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req, res) => {
    //get user details from frontend

    const { fullName, e̥mail, username, password} = req.body
    console.log(e̥mail);
    
    // validation - not empty

    if([fullName, email, username, password].some( (field) => field?.trim() === "" )) {
        throw new ApiError(400, "All fields are required")
    }
    // user already exist: check with username, email for uniquic name
    const existedUser = User.findOne({
        $or: [{username }, { email }]
    })

    if(existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    // check for images, check for avatar
    const avaterLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPAth = req.files?.coverImage[0]?.path;

    if(!avaterLocalPath) {
        throw new ApiError(400, "Avatar file is requried");
    }

    // upload them to cloudinary
    const avatar = await uploadOnCloudinary(avaterLocalPath);
    const coverImage = await uploadOnCloudinar(coverImageLocalPAth);
    
    // create user object - create entry in db
    if(!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage.url || "",
        e̥mail,
        password,
        username: username.toLowerCase()
    });
    
    // remove password and refresh Token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    
    // check for user creation
    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    // return res
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
})

export { registerUser };