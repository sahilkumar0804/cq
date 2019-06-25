const express=require("express");
const bodyParser=require("body-parser");
const app= express();
const session=require("express-session")
const multer=require("multer");
const mongoose=require("mongoose");
const nodemailer=require("nodemailer");
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(session(
   {
      secret: 'secret',
      resave: true,
      saveUninitialized :true
   }
));
app.use(express.static("image"))
//MULTER
var path="";
var storage =multer.diskStorage({
  destination:(req,file,cb)=>{
      cb(null ,'./image')
   },
filename: function (req,file,cb)
{
   var arr=file.mimetype;
   arr=arr.split("/");
   arr=arr[1];
   path=req.session.email+"."+arr;
   cb(null,path);
}
});
var upload =multer({storage :storage});

app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
// mongo connection 
const database=require("./CqDb");

const user=database.user;

const community=database.community;
let auth=(req,res,next)=>
{
     if(req.session.login)
          next();
     else
        return res.render("login",{invalid:""});
}

app.get("/",function(req ,res )
{
   if(req.session.login)
   {
         res.redirect("/home");
   }
   else
   {
     return res.render("login", {invalid:""});
   }
});


app.post("/",(req,res)=>
{
   let username=req.body.username;
   let password=req.body.password;
   user.findOne({username:{$eq: username},password :{$eq :password}},(error,data)=>
   {
      if(error)
          res.send("data base connectivity error");
      if(data)
      {
         if(data.isdeleated == 'deactivated' )
         {  
            return res.render("404");
        }
         else{
               req.session.login=true;
               req.session.userName=data.username;
               req.session.name=data.name;
               req.session.role=data.role;
               req.session.email=data.email;
               req.session.userid=data._id;
               console.log(data._id);
               req.session.img=data.image;
            if(data.new)
            {
                 return res.render("editinformation",{data: data,role:req.session.role,name:req.session.name});
            }
            else
              return  res.redirect("/home");
         }

      }
      else
        res.render("login",{invalid:"<center><div class='alert alert-danger' style='width:90%;'>Username/Password incorrect</div></center>"});
   }
);
});

app.post("/update",upload.single("image"),(req,res)=>
{
    
    user.updateOne({email:{$eq :req.session.email}},
    {
       $set :
       {
          new :false,
          phone:req.body.phone,
          city:req.body.city,
          dateofbirth: req.body.dob,
          gender:req.body.gender,
          name:req.body.name,
          image: path,
       }
      },(err)=>
     {
         if(err)
           throw err;
         else
            res.redirect("/home");
     }
    );
});

app.get("/logout",(req,res)=>
{
   req.session.destroy();
   res.render("login",{invalid :""});
});

app.get("/home",auth,(req,res)=>
{
   user.findOne({username:{$eq: req.session.userName}},(error,data)=>
   {
           if(error)
                res.send("data base error");
      res.render("personal",{data : data ,role :req.session.role ,name :req.session.name,img:req.session.img});
   });
});
app.get("/adduser",auth,(req,res)=>
{
   res.render("adduser",{incorect :"",role :req.session.role ,name :req.session.name,img:req.session.img});
});

app.post("/adduser",(req,res)=>
{
   user.find({userName :{$eq: req.body.username}},(err,data)=>
   {
      if(!data)
         res.render("adduser",{incorect:"<center><div class='alert alert-danger' style='width:90%;'>Username already exists</div></center>",role :req.session.role ,name :req.session.name}); 
      else
      {
         //mail
         smtpTrans = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: "skumar2577.ca17@chitkara.edu.in",
                pass: "5321@sahil"
            }
        });
        mailOpts = {
            from: 'sahil2577.ca17@chitkara.edu.in',
            to: req.body.email,
            subject: "initation for Cq",
            text: "you are invited  by sahil kumar for Cq ",
        };
        smtpTrans.sendMail(mailOpts, function (err, response2715) {
            if (err) {
                res.send(err);
            } else {
              //  res.send('success');
            }
        });
         new user({
           // _id=new mongoose.Types.ObjectId(),
            name:req.body.name,
            username:req.body.username,
            email:req.body.email,
            password: req.body.password,
            city: req.body.city,
            role: req.body.role,
            dateofbirth: "",
            new : true,
            status: 'pending',
            phone: req.body.phone,
            gender : "male",
            isdeleated: 'activated'
         }).save();
         res.render("adduser",{incorect:"<center><div class='alert alert-success' style='width:90%;'>User added</div></center>",img:req.session.img,role :req.session.role ,name :req.session.name}); 
      
      }
   });
} );

app.get("/changepassword",auth,(req,res)=>
{
   res.render("changepassword",{incorect:"",role :req.session.role ,name :req.session.name,img:req.session.img});
});

app.post("/changepassword",(req,res)=>
{
   user.findOne({username:{$eq: req.session.userName}},(error,data)=>
   {
      if(data.password == req.body.oldpass)
           {
              user.updateOne({username:{$eq: req.session.userName}},{$set :{password :req.body.newpass}},(err)=>
              {
                  if(err)
                    throw err;
                 else
                 res.render("changepassword",{incorect:"<center><div class='alert alert-success' style='width:90%;'>Password changed</div></center>",role :req.session.role ,name :req.session.name});
               }
              );
           }
      else{
         res.render("changepassword",{incorect:"<center><div class='alert alert-danger' style='width:90%;'>old password not matched</div></center>",role :req.session.role ,name :req.session.name});
      }
   });

});

app.get("/userlist",auth,(req,res)=>
{
   
    res.render("userlist",{role :req.session.role ,name :req.session.name,img:req.session.img});  

});
//data table for user list in our websiteeee...... usng agex with post request....
app.post("/userlist",(req,res)=>
{
   // for odering of data according to coloumssss....
     var sort ={};
   let order=req.body.order[0];
   if(order.column == '0')
      {
         if(order.dir == 'asc')
            sort={ "name":1};
         else 
         sort={ "name":-1};
      }
   else if(order.column == '1')
   {
      if(order.dir == 'asc')
         sort={ "email":1};
      else
         sort={ "email": -1};
   }
   else if(order.column == '2')
   {
      if(order.dir == 'asc')
      sort={ "city": 1};
      else
      sort={ "city":-1};
   }
   else 
     sort={ "name":1};
////  count of record
var total=0;         // no. of total recrds ...
   // counting of total recorsds in a collection...  . .
  user.countDocuments({},(err,count)=>{
      if(!err){
         total =count;
      }
   });
   
   //for searching....
   if (req.body.search.value)
   {
      var regex=new RegExp(req.body.search.value, "i");
      searchStr = { $or: [{'name':regex },{'email': regex},{'city': regex }] };
   }
   else
   {
      searchStr={};
   }
   var t=0
 
   // data base fetching .....
   user.find(searchStr,null,{skip :Number(req.body.start),limit :Number(req.body.length),sort :sort},(err,data)=>
   {
      if(err)
        throw err;

        user.countDocuments(searchStr,(err,count)=>
        {
           res.send({"recordsTotal" :  total, "recordsFiltered": count ,data});
        });
   }
   );
   
   
}
);
app.post("/statuschange",(req,res)=>
{
 if(req.body.status =='activated')
          var status ='deactivated';
  else
          status ='activated';
         user.updateOne({_id :req.body.userid},{$set:{isdeleated : status}},(err)=>
         {
               if(err)
                  res.send(err);
               else
                 res.send("updated");
         })
});

//mail
app.post("/sendmail", (req, res) => {
   console.log(req.body);
   let mailOpts, smtpTrans;
   smtpTrans = nodemailer.createTransport({
       host: 'smtp.gmail.com',
       port: 465,
       secure: true,
       auth: {
           user: "skumar2577.ca17@chitkara.edu.in",
           pass: "5321@sahil"
       }
   });
   mailOpts = {
       from: 'sahil2577.ca17@chitkara.edu.in',
       to: "sahilkumar.0804@gmail.com",
       subject: req.body.subject,
       text: req.body.message,
   };
   smtpTrans.sendMail(mailOpts, function (err, response2715) {
       if (err) {
           res.send(err);
       } else {
           res.send('success');
       }
   });
});


//update user
app.post("/updateuser",(req,res)=>
{
   if(req.body.username != "" &&req.body.city !="" && req.body.phone!="")
       {
           user.updateOne({_id:req.body.userid},{$set :{username :req.body.username , city:req.body.city , phone:req.body.phone, acton :req.body.action }},(err)=>
           {
                     if(err)
                       res.send("data base errr");
                     else
                       res.send("successfuly updated");
           });
       }
   });

 /// communites rendring........
  
app.get("/c",(req,res)=>
{
        res.render("community/communitespanel.ejs",{role :req.session.role,name :req.session.name});
});

app.get("/createcommunity",(req,res)=>
{
   res.render("community/createcommunity.ejs",{incorect:"",role :"comm",name :"sahil"});
});

//use my communities
app.post("/communityinfo",(req,res)=>
{
  
      community.find( {$or: [{ owner :(req.session.userid)},{ members: {$in : [req.session.userid]}}],},(err,data)=>
      {
         if(data.length!=0)
            {
                res.send(data);
            }
           else
                res.send("empty");
      });
});

//user community search
app.get("/search",(req,res)=>
{
   res.render("community/communitysearch",{role:req.session.role,name: req.session.name});
});

app.post("/search",(req,res)=>
{
   var exp={$and: [{ owner :{$not : { $eq: req.session.userid  } } },{ members: {$nin : [req.session.userid]}}] };
  if(req.body.str)
  {
   var regex=new RegExp(req.body.str, "i");
     exp.$and.push({"name" :regex});
  }
   community.find( exp,(err,data)=>
   {
         if(data.length!=0)
         {
             res.send(data);
         }
         else
             res.send("empty");
   });
});

//join community
app.post("/join",(req,res)=>
{
   console.log(req.body.id);
   community.findOne({_id : req.body.id},(err,data)=>
   {
      if(err)
         throw err;
     else{
      data.members.push(req.session.userid);
      data.save();
      res.send(true);
     }
   });
});
app.post("/createcommunity",(req,res)=>
{
  
     community.findOne({name:{$eq : req.body.name}},(err,data)=>
     {
         if(data)
            res.render("community/createcommunity.ejs",{incorect:"already exists",role :"comm",name :"sahil"});
         else
           {
              new community ({
                 name :req.body.name,
                 owner :req.session.userid,
                 rule :req.body.type,
                 createDate :new Date().toDateString("en"),
                 isdeleated: "activated",
                 discription: req.body.desc,

              }).save();
                res.render("community/createcommunity.ejs",{incorect:"sucessfuly created",role :"comm",name :"sahil"});  
           }
     });
});

//cummunity list
app.get("/communitylist",(req,res)=>
{
     res.render("communitylist",{role :req.session.role ,name :req.session.name,img:req.session.img});
});
app.post("/communitylist",(req,res)=>
{
   var sort ={};
  let order=req.body.order[0];
   if(order.column == '0')
      {
         if(order.dir == 'asc')
            sort={ "name":1};
         else 
         sort={ "name":-1};
      }
   else if(order.column == '1')
   {
      if(order.dir == 'asc')
         sort={ "owner":1};
      else
         sort={ "owner": -1};
   }
   else if(order.column == '2')
   {
      if(order.dir == 'asc')
       sort={ "createdate": 1};
      else
       sort={ "createdate":-1};
   }
   else 
     sort={ "name":1};
////  count of record
var total=0;         // no. of total recrds ...
   // counting of total recorsds in a collection...  . .
  community.countDocuments({},(err,count)=>{
      if(!err){
         total =count;
      }
   });
   
   //for searching....
   if (req.body.search.value)
   {
      var regex=new RegExp(req.body.search.value, "i");
      searchStr = { $or: [{'name':regex },{'rule': regex }] };  //
   }
   else
   {
      searchStr={};
   }
   var t=0
 
       community.find(searchStr,null,{ limit:Number(req.body.length),skip:Number(req.body.start),sort:sort}).populate(
       {
          path :"owner",
          select :"name"
       }
       ).exec((err,data)=>
      {
            if(err)
              throw err;
             else{
               community.countDocuments(searchStr,(err,count)=>
               {
                  res.send({"recordsTotal" :  total, "recordsFiltered": count ,data});
               });
             }
      });
   
});

app.get("/community/:id",(req,res)=>
{
   var id=req.params.id;
    
   
});
// invalid routs
// app.get('*', function (req, res) { 
//    res.redirect("/home");
// });

app.listen(8000,()=>
{
console.log("8000");
});