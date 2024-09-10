import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken;
        user.save({validateBeforeSave: false})

        return {accessToken, refreshToken};
    } catch (error) {
        throw new ApiError(500, "Something wnet wrong while refresh and access tokens")
    }
}
const registerUser = asyncHandler( async (req, res) => {
    //get user details from frontend

    const { fullName, email, username, password} = req.body
    console.log(email);
    
    // validation - not empty

    if([fullName, email, username, password].some( (field) => field?.trim() === "" )) {
        throw new ApiError(400, "All fields are required")
    }
    // user already exist: check with username, email for uniquic name
    const existedUser = await User.findOne({
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
    const coverImage = await uploadOnCloudinary(coverImageLocalPAth);
    
    // create user object - create entry in db
    if(!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage.url || "",
        email,
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

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data

    const {email, username, password} = req.body;
    // username or email
    if(!username || !password) {
        throw new ApiError(400, "username or password is required");
    }
    
    // find the user
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user) {
        throw new ApiError(404, "User doesn't exists");
    }

    // password  check
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    // access and refresh token generation
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    // send cookies
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken,  options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req, res) => {
    User.findByIdAndUpdate(req.user._id,
        {
            $set: 
            {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out Successful"))
})

export { registerUser, loginUser, logoutUser };