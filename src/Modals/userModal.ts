import mongoose from "mongoose";


const userSchema = new mongoose.Schema({
    username : {type : String , required: true , trim : true , toLowercase: true},
    email : {type: String , required: true , trim : true , toLowercase : true , unique : true},
    password: {type : String , required: true},
    role: {type : String , enum : ["admin" , "staff" , "student"] , default : "student"}
})


const User = mongoose.model("User" , userSchema);

export default User;