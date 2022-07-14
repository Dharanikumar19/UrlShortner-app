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


const { CloudTasksClient } = require('@google-cloud/tasks');

// Instantiates a client.
const client = new CloudTasksClient();

async function createHttpTask(name) {

  const project = "teleport-gcp-playground";
  const queue = "my-queue";
  const location = "us-central1";
  const url = `http://localhost:8080/delete/${name}`;
//   const payload = 'Hello World!';
  const inSeconds = 20;

  // Construct the fully qualified queue name.
  const parent = client.queuePath(project, location, queue);

  const task = {
    httpRequest: {
      httpMethod: 'GET',
      url,
    },
  };

//   if (payload) {
//     task.httpRequest.body = Buffer.from(payload).toString('base64');
//   }

  if (inSeconds) {
    task.scheduleTime = {
      seconds: inSeconds 
    };
  }

  // Send create task request.
  console.log('Sending task:');
  console.log(task);
  const request = {parent: parent, task: task};
  const [response] = await client.createTask(request);
  console.log(`Created task ${response.name}`);
}




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

    const query = datastore.createQuery('Url-task')
    const [entities] = await datastore.runQuery(query);
    
    const isUrlFound = entities.some(async element => {
        if (element.longUrl == req.body.longUrl) {
            element.name = element[Datastore.KEY].name;
            console.log(element.name)
            createHttpTask(element.name); 

            const taskKey = datastore.key([kind, uuidv4()])
        const urlTask = {
            key: taskKey,
            data: {
                created: new Date(),
                longUrl: req.body.longUrl,
                shortUrl: generateUrl(),
                done: false,
                priority: 5
            }
        }
        await datastore.save(urlTask);
        res.redirect("/")

        }else{
            const taskKey = datastore.key([kind, uuidv4()])
            const urlTask = {
                key: taskKey,
                data: {
                    created: new Date(),
                    longUrl: req.body.longUrl,
                    shortUrl: generateUrl(),
                    done: false,
                    priority: 5
                }
            }
            console.log("new url created")
            await datastore.save(urlTask);
            res.redirect("/")
        }
       
    });
    

})


app.get("/update/:name", async (req, res) => {

    const key = datastore.key([kind, req.params.name]);
    const [entities] = await datastore.get(key);
    entities.name = entities[Datastore.KEY].name;
    res.render("update", { urlData: entities })
})


app.post("/update/:name", async (req, res) => {

    const taskKey = datastore.key([kind, req.params.name]);

    const entity = {
        key: taskKey,
        data: {
            created: new Date(),
            longUrl: req.body.longUrl,
            shortUrl: generateUrl(),
            done: false,
            priority: 5
        }
    };
    await datastore.update(entity);
    res.redirect("/")
})



app.get("/delete/:name", async (req, res) => {
   console.log("url deleted")
    const taskKey = datastore.key([kind, req.params.name]); 

    await datastore.delete(taskKey);
    res.redirect("/")
})


app.get("/filterAssending", async (req, res) => {
    const query = datastore.createQuery('Url-task').order('created', {
        assending: true,
    });
    const [filterData] = await datastore.runQuery(query);
    const filterDataByAssending = filterData.map(item => {
        item.name = item[Datastore.KEY].name;
        return item;
    });
    res.render("filter", { filterDataByAssending, filterDataByDessending: null, filterDataByData: null })
})

app.get("/filterDescending", async (req, res) => {
    const query = datastore.createQuery('Url-task').order('created', {
        descending: true,
    });
    const [filterData] = await datastore.runQuery(query);
    const filterDataByDessending = filterData.map(item => {
        item.name = item[Datastore.KEY].name;
        return item;
    });
    res.render("filter", { filterDataByDessending, filterDataByAssending: null, filterDataByData: null })
})



app.get("/filterbyDate", async (req, res) => {
    const query = datastore.createQuery('Url-task').filter('created', '>', new Date('2022-07-04T20:00:00z'))
        .filter('created', '<', new Date('2022-07-07T20:00:00z')).filter('done', '=', false).filter('priority', '=', 4)
    const [filterData] = await datastore.runQuery(query);
    const filterDataByDate = filterData.map(item => {
        item.name = item[Datastore.KEY].name;
        return item;
    });
    res.render("filter", { filterDataByDate, filterDataByAssending: null, filterDataByDessending: null })
})


app.get("/filterbyPriority", async (req, res) => {
    const query = datastore.createQuery('Url-task').filter('priority', '=', 3).filter('created', '<', new Date('2022-07-05T00:00:00z'));
    const [filterData] = await datastore.runQuery(query);
    const filterDataByDate = filterData.map(item => {
        item.name = item[Datastore.KEY].name;
        return item;
    });

    res.render("filter", { filterDataByDate, filterDataByAssending: null, filterDataByDessending: null })
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

