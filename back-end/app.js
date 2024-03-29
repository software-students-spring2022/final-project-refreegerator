require('dotenv').config({ silent: true }) // load environmental variables from a hidden file named .env
const express = require('express') // CommonJS import style!
const morgan = require('morgan') // middleware for nice logging of incoming HTTP requests
const cors = require('cors') 
const mongoose = require('mongoose')
const jsonData = require('./recipes.json')

var chai = require('chai'), chaiHttp = require('chai-http');

chai.use(chaiHttp);

const app = express() // instantiate an Express object
app.use(morgan('dev', { skip: (req, res) => process.env.NODE_ENV === 'test' })) // log all incoming requests, except when in unit test mode.  morgan has a few logging default styles - dev is a nice concise color-coded style
app.use(cors()) // allow cross-origin resource sharing

app.use(express.json()) // decode JSON-formatted incoming POST data
app.use(express.urlencoded({ extended: true })) // decode url-encoded incoming POST data
const userData= require('./temp_data/user.json'); 
const itemData= require('./temp_data/items.json'); 
const fs = require('fs');
const _ = require("lodash") // the lodash module has some convenience functions for arrays that we use to sift through our mock user data... you don't need this if using a real database with user info
const jwt = require("jsonwebtoken")
const passport = require("passport")
app.use(passport.initialize())

const { jwtOptions, jwtStrategy } = require("./jwt-config.js") // import setup options for using JWT in passport
passport.use(jwtStrategy)

mongoose
  .connect(`${process.env.DB_CONNECTION_STRING}`)
  .then(data => console.log(`Connected to MongoDB`))
  .catch(err => console.error(`Failed to connect to MongoDB: ${err}`))

const {User} = require('./models/User')
const {Item} = require('./models/Item')

app.post('/save', async (req, res)=>{
    const data = {
        username: req.body.name,
        password: req.body.pass
    }
    if (!data.username || !data.password){
      res
        .status(401)
        .json({ success: false, message: `no username or password supplied.` })
    }
    const username1 = data.username
    /*
    const user = User.find({ username: username1 })*/
    const retrieve = async() => {
      const user = await User.findOne({username: username1})
      console.log(user)
      if (!user) {
        // no user found with this name... send an error
        res
          //.status(401)
          .json({ success: false, message: `user not found: ${username1}.` })
      }
      else if(data.password==user.password){
        const payload = {id : user.id}
        const token = jwt.sign(payload, jwtOptions.secretOrKey) // create a signed token
      res.json({ success: true, username: user.username, token: token }) // send the token to the client to store
        } else {
          // the password did not match
          res
          //.status(401)
          .json({ success: false, message: "passwords did not match" })
        }
    }
    retrieve();

})

app.post('/create/save', async (req, res)=>{
    const data = {
        username: req.body.name,
        password: req.body.pass,
    }
    try{
      const user= await User.findOne({username: data.username})
      console.log(user)
      if (user){
        return res.status(401).json({
          success: false,
          message: 'username already exists'
        })
      }
      const newUser = await User.create({
        username: data.username,
        password: data.password,
        preferences: {
          notification: "0",
          suggest: true,
          auto: true
        }
      })
      const payload = {id : newUser.id}
      const token = jwt.sign(payload, jwtOptions.secretOrKey)
      return res.json({
          success: true,
          username: data.username,
          token: token
        })
    }
    catch(err){
      console.error(err)
    }
})

app.get('/userlist', passport.authenticate("jwt", { session: false }), async (req, res)=>{
    //const d = itemData;
    console.log("so far so good");
    console.log(req.query.username)
    let data = await Item.find({username: req.query.username})
    //console.log(d);
    console.log(data)
    res.json({
      d_: data,
      success: true});
})

app.get('/profileform', async(req,res)=>{
    const username = req.query.username;
    console.log(username);
    const retrieve = async() => {
      const user = await User.findOne({username: username})
      console.log(user)
      console.log(user.preferences)
      res.json({
        preferences: user.preferences
      })
    }
    retrieve();

})


app.post('/profile/save', async (req, res) => {
  const data = {
    days: req.body.days,
    suggest: req.body.suggest,
    auto: req.body.auto,
    username: req.body.username
  }
  const update = {
    $set: {
      preferences: {
        notification: data.days,
        suggest: data.suggest,
        auto: data.auto
      }
    },
  }
  await User.updateOne({username: req.body.username}, update)
  console.log(data)
  res.json(data)
})
app.get('/add', async(req,res)=>{
  const username = req.query.username;
  console.log(username);
  const retrieve = async() => {
    const user = await User.findOne({username: username})
    console.log(user)
    console.log(user.preferences)
    res.json({
      preferences: user.preferences
    })
  }
  retrieve();
})


//adding item
app.post('/add/save', async (req, res) => {

  const data = {
    expdatestr: req.body.expdatestr,
    name: req.body.name,
    category: req.body.category,
    username: req.body.username
  }
  console.log("username is ", data.username)
  console.log('data here: ' + data)
  console.log('done')
  try{
    const item = await Item.create({
      username: data.username,
      category: data.category,
      name: data.name,
        expdatestr: data.expdatestr,
    })
    return res.json({
      item: item,
      status: 'all good',
    })
  } catch (err) {
    console.error(err)
    return res.status(400).json({
      error: err,
      status: 'failed to save item to database',
    })
  }
})

/*app.post('/add/save', async (req, res) => {
  const data = {
    inputs: req.body.inputs
  }
  itemData.push(req.body.inputs);
    fs.writeFile('./temp_data/items.json', JSON.stringify(itemData), function(err) {
        if (err) {
            console.log(err);
        }
    });
    console.log(itemData);
  res.json(data)
})*/
// app.post('/edit/save', async (req, res) => {
//   const data = {
//     inputs: req.body.inputs
//   }
//   console.log(data)
//   res.json(data)
// })

app.get("/logout", function (req, res) {
  res.json({
    success: true,
    message:
      "logged out",
  })
})

app.get('/api/kroger', async (req, res) => {
  const {itemName, zipCode} = req.query;

  const response = await getKrogerItem(itemName, zipCode).catch((err) => {
    console.log(err);
    res.status(500).send(err);
  });

  res.status(200).json(response).send();

})
// app.post('/recipes', async(req, res) => {
//   const data = {
//     inputs: req.body.inputs
//   }
//   const itemName = inputs.itemName;
//   result = jsonData.filter(
//     function(data){ return data.itemName == itemName }
//   )
//   res.json(result)
// })
app.get('/UserList/rec', function(req, res) {
  // const data = {
  //   inputs: req.body.inputs
  // }
  
  const foodName = req.query.itemName;
  console.log(`itemName: ${foodName}`);
  // console.log(req);
  result = jsonData.filter(
    function(data){ return data.itemName == foodName } 
  )
  // console.log(req);
  console.log("Greg!");
  res.json(result);
  
});
module.exports = app


//for editing an item
app.post("/edit/save", async(req, res) => {
  const olditem = req.body.oldobj
  const newitem = req.body.newobj
  try{
      const updateItem = await Item.findOneAndUpdate(olditem, newitem )
    res.json(updateItem)
  } catch(e){
  console.log("Couldn't Find Item");
  res.status(500)
}
})
//for deleting an item
app.post("/delete", async(req, res) => {
  const item = req.body
    console.log(item)
  try{
      const deleteItem = await Item.findOneAndDelete(item )
  } catch(e){
    console.log("Cannot find Item");
  }
})
