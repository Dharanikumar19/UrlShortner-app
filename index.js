const express = require("express")
const app = express()
const mongoose = require('mongoose')
const URI = "mongodb+srv://urlShortner:urlShortner@cluster0.bbiin.mongodb.net?retryWrites=true&w=majority"
const path = require("path") 

const {UrlModel} = require("./models/urlSchema")

app.set("view engine", "ejs")
app.use(express.urlencoded({ extended: true }))

mongoose.connect(URI, {
    useNewUrlParser : true,
    useUnifiedTopology : true
}, err => {
    if(err) throw err;
    console.log("database connected successfully")
})


app.get("/", (req,res) => {
    
    let allUrl = UrlModel.find(function(err, result){
        res.render('main',{
            urlData : result
        })
    })
   
})

app.post("/create", (req,res) => {

    let urlShort = new UrlModel({
        longUrl : req.body.longUrl,
        shortUrl : generateUrl()
    })
    urlShort.save((error, data)=> {
        if(error) throw error;
        res.redirect("/")
    })
})

app.get("/update/:id", (req,res) => {
    UrlModel.findOneAndUpdate({_id : req.params.id},req.body, {new : true},(err, updData)=>{
        if(err) throw err
       res.render("update", { urlData : updData})
    })
} )

app.post("/update/:id", (req,res) => {
    UrlModel.findByIdAndUpdate({_id : req.params.id},req.body,(err, updData)=>{
        if(err) throw err
        res.redirect("/")
    })
} )



app.get("/delete/:id", (req,res) => {
        UrlModel.findByIdAndDelete({_id : req.params.id},(err, delData)=>{
            if(err) throw err
            res.redirect("/")
        })
} )

function generateUrl() {
    let random = ''
    let characters = "ABCDEFRGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890"
    let charLen = characters.length

     for(let i=0; i<=7;i++){
        random += characters.charAt(
            Math.floor(Math.random() * charLen)
        )
     }
     return random
}

app.get('/submit', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/form.html'));
  });


app.post('/submit', (req, res) => {
    console.log({
      name: req.body.name,
      message: req.body.message
    });
    res.send('Thanks for your message!');
  });

const PORT = process.env.PORT || 8080
app.listen(PORT , () => {console.log("Server is runnig on port " + PORT)})