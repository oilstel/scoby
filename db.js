const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;
const dbname = "arena_site_gen";
const url = "mongodb://localhost:27017";
const mongoOptions = {
    useNewUrlParser : true,
    useUnifiedTopology: true
};

const state = {
    db : null
};

const connect = (cb) => {
    if(state.db)
        cb();
    else{
        MongoClient.connect(url,mongoOptions,(err,client) => {
            if(err)
                cb(err);
            else{
                state.db = client.db(dbname);
                cb();
            }
        });
    }
}

const getPrimaryKey = (_id) => {
    return ObjectID(_id);
}

const getDB = () => {
    return state.db;
}

module.exports = {getDB,connect,getPrimaryKey};