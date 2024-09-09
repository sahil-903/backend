import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler( async (re, res) => {
    res.status(200).json({
        message: "sahil is great"
    })
})

export { registerUser };