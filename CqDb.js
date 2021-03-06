const mongoose=require("mongoose");
const Schema = mongoose.Schema;
mongoose.connect("mongodb://localhost:27017/cq",{ useNewUrlParser: true});
const UserSchema = new mongoose.Schema({
   name:String,
   username: {
      type: String,
      unique: true,
      required: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
    } ,
   email: {
        type: String,
        unique: true,
        required: true,
        trim: true
      },
      dateofbirth: String,
      phone :String,
      gender :
      {
         type:String,
         enum :['male','femail','transgender']
      },
      city : String,
      new : Boolean,
      role : String,
      isdeleated :
      {
        type:String,
        enum:['activated','deactivated']
      },
      image: String,
      status : 
      {
        type:String,
        enum:['pending','confirmed'],
      },
      communities:[{type: Schema.Types.ObjectId, ref: 'communities'}],
});  //structore of collection users

const user = mongoose.model("users",UserSchema);

module.exports.user=user;

const communitiesSchma = mongoose.Schema(
  {
    name :
    {
      type: String,
      unique: true,
      required: true,
      trim: true
    },

    rule:
    {
      type:String,
      enum:['direct','permission'],
    },
    discription: String,
    isdeleated :String,
    owner: {type: Schema.Types.ObjectId, ref: 'users' },

    createDate: String,

    image: String,
    members:[ {type: Schema.Types.ObjectId, ref: 'users' }],

  }
);
const community = mongoose.model("communities", communitiesSchma);
module.exports.community=community;

const chat =new mongoose.Schema(
  {
    message :String,
    comunnity :[ {type: Schema.Types.ObjectId, ref: 'communities' }],
    member : {type: Schema.Types.ObjectId, ref: 'users' },
    comments:[],
  }
);