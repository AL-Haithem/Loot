import mongoose from "mongoose"

const UserSchema = new mongoose.Schema(
  {
    username:{
      type: String,
      trim: true,
      minlength: [4,"Username must be at least 4 characters"],
      maxlength: [16,"Username cannot exceed 16 characters"],
      required:[true,"Username is required"]
    },
    email:{
      type: String,
      trim: true,
      required:[true,"Email is required"],
      unique: true,
      lowercase: true,
      select: false,
    },
    password:{
      type: String,
      select: false,
      required: [true,"Password is required"],
      minlength: [6,"Password must be at least 6 characters"]
    },
    rl:{
      type: String,
      enum:['user','admin','support'],
      default:'user',
      index: true,
      select: false,
    },
    IsActive:{
      type: Boolean,
      default: true,
      select: false,
    },
    IsBanned:{
      type: Boolean,
      default: false,
      select: false,
    },
    phone: Number,
    
    TokenVersion: {
      type: Number,
      default: 0,
      select: false
    },
    PassChangedAt: {
      type: Date,
      select: false
    },
    PassResetCode: {
      type : String,
      select: false
    },
    PassResetCodeExp: {
      type : Date,
      select: false
    },
    PassResetAttempts: {
      type : Number,
      default: 0,
      select: false
    },
    PassResetReqId: {
      type : String,
      select: false
    },
  },
  {timestamps:true}
)

const User = mongoose.model('User', UserSchema)
export default User
