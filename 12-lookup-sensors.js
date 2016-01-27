var db = db.getSiblingDB("look")

var results = db.data.aggregate( [ 
        { "$lookup" : {
                "from" : "keys",
                "localField" : "k",
                "foreignField" : "_id",
                "as" : "name" }
        },
        { "$unwind" : "$name" },
        { "$project" : {
                "k" : "$k",
                "name" : "$name.name",
                "v" : "$v" }
        },
        { "$group" : {
                "_id" : "$name",
                "aveValue" : { "$avg" : "$v" }
                }
        },
        { "$project" : { 
                "_id" : 0,
                "name" : "$_id",
                "aveValue" : "$aveValue" }
        }
]);

results.shellPrint();
