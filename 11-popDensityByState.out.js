var cursor = db.cData.aggregate(
  [{$match : {"data.totalPop" : {"$gt" : 1000000}}},
   {$unwind : "$data"},  
   {$sort : {"data.year" : 1}},
   {$group : {"_id" : "$name",
              "pop1990" : {"$first" : "$data.totalPop"},
              "pop2010" : {"$last" : "$data.totalPop"},
              "areaM" : {"$first" : "$areaM"},
              "division" : {"$first" : "$division"}}},
   {$group : {"_id" : "$division",
              "totalPop1990" : {"$sum" : "$pop1990"},
              "totalPop2010" : {"$sum" : "$pop2010"},
              "totalAreaM" : {"$sum" : "$areaM"}}},
   {$match : {"totalAreaM" : {"$gt" : 100000}}},
   {$project : {"_id" : 0,
                "division" : "$_id",
                "density1990" : {"$divide" : ["$totalPop1990", "$totalAreaM"]},
                "density2010" : {"$divide" : ["$totalPop2010", "$totalAreaM"]},
                "denDelta" : {"$subtract" : [{"$divide" : ["$totalPop2010", "$totalAreaM"]},
                                             {"$divide" : ["$totalPop1990", "$totalAreaM"]}]},
                "totalAreaM" : 1,
                "totalPop1990" : 1,
                "totalPop2010" : 1}},
   {$sort : {"denDelta" : -1}}]
)
cursor.shellPrint();

