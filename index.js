const express = require("express")
const app = express()

const path = require("path")
const { v4: uuidv4 } = require('uuid');


const { Datastore } = require('@google-cloud/datastore');


const datastore = new Datastore({
    projectId: 'teleport-gcp-playground',
});

const kind = 'Url-task';


app.set("view engine", "ejs")
app.use(express.urlencoded({ extended: true }))




app.get("/", async (req, res) => {
    const query = datastore.createQuery('Url-task')
    const [entities] = await datastore.runQuery(query);
    const entity = entities.map(item => {
        item.name = item[Datastore.KEY].name;
        return item;
      });
    
    res.render('main', { entity })
})




app.post("/create", async (req, res) => {

    const taskKey = datastore.key([kind, uuidv4()])

    const urlTask = {
        key: taskKey,
        data: {
            created: new Date(),
            longUrl: req.body.longUrl,
            shortUrl: generateUrl()
        }
    }
    await datastore.save(urlTask);
    res.redirect("/")
})


app.get("/update/:name", async (req, res) => {

    const m = { name: req.params.name }
    let name = m.name
    const key = datastore.key([kind, name]);
    const [entities] = await datastore.get(key);
    entities.name = entities[Datastore.KEY].name;    
    res.render("update", { urlData : entities})
})


app.post("/update/:name", async (req, res) => {
    const m = { name: req.params.name }
    let name = m.name
    const taskKey = datastore.key([kind, name]);

    const entity = {
      key: taskKey,
      data: {
        created: new Date(),
        longUrl: req.body.longUrl,
        shortUrl: generateUrl()
    }
    };
  
    await datastore.update(entity);
    res.redirect("/")
})



app.get("/delete/:name", async (req, res) => {

    let m = {name : req.params.name}
     let name = m.name
    const taskKey = datastore.key([kind, name]);
    await datastore.delete(taskKey);
    res.redirect("/")
})


function generateUrl() {
    let random = ''
    let characters = "ABCDEFRGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890"
    let charLen = characters.length

    for (let i = 0; i <= 7; i++) {
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
app.listen(PORT, () => { console.log("Server is runnig on port " + PORT) })

