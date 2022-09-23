/*function checkAuth(req, res, next) {

    if (getToken(req)) {
        next()https://www.w3schools.com/react/react_class.asp
    } else {
        res.status(403).send("Unauthorized")
    }
}*/
const { MongoClient } = require("mongodb");
const admin = require("firebase-admin")
const config = require("../config.js");
const serviceAccount = config.firebase
const mongoConfig = config.mongo

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const uri = mongoConfig.uri;

class DatabaseClient {

    constructor(client) {
        this.client = client
        // create a cache so there are less requests to db
    }

    async insertOne(collection, document) {
        try {
            await this.client.connect()
            const col = this.client.db("project").collection(collection)
            return await col.insertOne(document)
        }
        finally {
            await this.client.close()
        }
    }

    async find(collection, document) {
        try {
            await this.client.connect()
            const col = this.client.db("project").collection(collection)
            const doc = await col.findOne(document)
            return doc
        }
        finally {
            await this.client.close()
        }
    }
}

const client = new MongoClient(uri);

/*(async function() {
    try {
        await client.connect()
        console.log(1)
        col = client.db("project").collection("users")
        console.log(2)
        const doc = await col.findOne({ uid: "qGRBC1gsvNSzyrNQfto6706IUXC3" })
        console.log(doc)
    }
    finally {
        await client.close()
    }
})()*/

const dbClient = new DatabaseClient(client)

function authorise(routeLevel, tokenRequired) {
    return async function(req, res, next) {
        if (routeLevel === undefined && !tokenRequired) {
            next()
        } else {
            const { authtoken } = req.headers

            try {
                const decodedToken = await admin.auth().verifyIdToken(authtoken)
                const user = await dbClient.find("users", { uid: decodedToken.uid })
                if (user) {
                    const { level } = user
                    if (level >= (routeLevel || 0)) {
                        req.userData = user
                        next()
                    } else {
                        //res.status(403).send("Unauthorised")
                        res.json({ message: "You are not authorised to access this route" })
                    }
                } else {
                    if (decodedToken && tokenRequired && routeLevel === undefined) {
                        req.userToCreate = decodedToken
                        next()
                    }
                }
            }
            catch (e) {
                res.json({ message: "There was a problem authorising the user" })
            }
        }
    }
}

exports.DatabaseClient = dbClient
exports.authorise = authorise