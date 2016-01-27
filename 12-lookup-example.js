var results = db.regions.aggregate( [ 
        { "$lookup" : { "from" : "cData", 
                        "localField" : "state", 
                        "foreignField" : "name", 
                        "as" : "popData" 
                      } 
        }/*,
        { "$unwind" : "$popData" },
        { "$project" : { "_id" : 0,
                         "state" : "$state",
                         "region" : "$region",
                         "areaKM" : "$popData.areaKM"
                       }
        }*/
        
]);
results.shellPrint();
