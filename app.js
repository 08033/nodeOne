//---------------------------------------------------------------------------------------------
//----Import:
const express = require('express')
const { MongoClient } = require('mongodb')
//---------------------------------------------------------------------------------------------
//----Declaration:
const dbName = 'people'
const uri = `mongodb://localhost:27017/${dbName}`
const mongoClient = new MongoClient(uri)

const app = express()

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.use(express.urlencoded({
    extended: true
}))

app.use(express.json());
//---------------------------------------------------------------------------------------------
//----Helper functions:
async function connectDB() {
    await mongoClient.connect()
}

async function findDocuments(collection) {
    let allValues = ''
    try {
        //await mongoClient.connect()        
        var cursor = await mongoClient.db(dbName).collection(collection).find({})
        /*await cursor.forEach(        
            doc => console.log(doc)
        );*/

        allValues = cursor.toArray();
        //console.log(allValues);
    }
    catch (e) {
        console.error(e)
    }
    finally {
        //await mongoClient.close()
        return allValues;
    }
}

async function createListing(collection, newListing) {
    result = ''
    try {
        //await mongoClient.connect()
        result = await mongoClient.db(dbName).collection(collection).insertOne(newListing);
        console.log(`New listing created with the following id: ${result.insertedId}`);
    }
    catch (e) {
        console.error(e)
    }
    finally {
        //await mongoClient.close()
        return result;
    }
}

async function upsertListingByName(nameOfListing, updatedListing, collection) {
    let res = ''
    try {
        //mongoClient.connect()
        await mongoClient.db(dbName).collection(collection)
            .updateOne({ name: nameOfListing },
                { $set: { name: updatedListing.name, age: updatedListing.age, dob: updatedListing.dob } },
                { upsert: true }).then(result => {
                    res = result
                    console.log(`${result.matchedCount} document(s) matched the query criteria.`);
                    if (result.upsertedCount > 0) {
                        console.log(`One document was inserted with the id ${result.upsertedId._id}`);
                    } else {
                        console.log(`${result.modifiedCount} document(s) was/were updated.`);
                    }
                });
    }
    catch (e) {
        console.error(e)
    }
    finally {
        //mongoClient.close()
        return res;
    }
}

async function deleteListingByName(nameOfListing, collection) {
    let result = ''
    try {
        //mongoClient.connect()
        result = await mongoClient.db(dbName).collection(collection)
            .deleteOne({ name: nameOfListing });

        console.log(`${result.deletedCount} document(s) was/were deleted.`);
    }
    catch (e) {
        console.error(e)
    }
    finally {
        //mongoClient.close()
        return result;
    }
}


//---------------------------------------------------------------------------------------------
//----Endpoints:
app.get('/', (req, res) => {
    res.send('nodeOne server started')
})

app.route('/person').get((req, res) => {

    //obj = findDocuments('details')
    findDocuments('details').then(obj => {
        ret = {};

        if (obj)
            ret = new responseObject('200', 'All people fetched', obj) //success
        else
            ret = new responseObject('204', 'No person found', obj) //No-content

        res.send(ret)
    })
    //res.send('get all people')    

}).post((reqq, ress) => {
    createListing('details', reqq.body).then(r => {
        let ret = {}
        if (r.insertedId)
            ret = new responseObject('201', 'person created', reqq.body) //created
        else
            ret = new responseObject('204', 'Person not created', reqq.body) //No-content

        ress.json(ret)
    })
    //ress.send('inserted person')    
}).put((requ, resu) => {

    upsertListingByName(requ.body.name, requ.body, 'details').then(obj => {
        if (obj)
            ret = new responseObject('200', 'person upserted', requ.body) //updated
        else
            ret = new responseObject('204', 'Person not update', requ.body) //No-content

        resu.send(ret)
    })

    //resu.send('person upsert (update?:insert)')    
}).delete((reqd, resd) => {
    deleteListingByName(reqd.body.name, 'details').then(obj => {
        if (obj.deletedCount)
            ret = new responseObject('200', 'person deleted', obj) //deleted
        else
            ret = new responseObject('204', 'Person not delete', obj) //No-content

        resd.send(ret)
    })
    //resd.send('person deleted')    
})

//---------------------------------------------------------------------------------------------
//----Express application load:
connectDB().then(r => {
    app.listen(3001, () => {
        console.log('nodeOne server ready')
    })
})

//---------------------------------------------------------------------------------------------
//-----Model Class
class responseObject {
    statusCode = 0
    message = ''
    data = {}
    constructor(s, m, d) {
        this.statusCode = s
        this.message = m,
            this.data = d
    }
}