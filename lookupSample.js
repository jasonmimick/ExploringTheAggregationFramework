db = db.getSisterDB("test");

db.orders.drop();
db.inventory.drop();

var items = [
{ "_id" : 1, "item" : "abc", "price" : 12, "quantity" : 2 },
{ "_id" : 2, "item" : "jkl", "price" : 20, "quantity" : 1 },
{ "_id" : 3  }
];

var result = db.orders.insert( items );
printjson(result);
db.orders.find().shellPrint();

var stock = [ 
{ "_id" : 1, "sku" : "abc", description: "product 1", "instock" : 120 },
{ "_id" : 2, "sku" : "def", description: "product 2", "instock" : 80 },
{ "_id" : 3, "sku" : "ijk", description: "product 3", "instock" : 60 },
{ "_id" : 4, "sku" : "jkl", description: "product 4", "instock" : 70 },
{ "_id" : 5, "sku": null, description: "Incomplete" },
{ "_id" : 6 }
];

result = db.inventory.insert( stock );
printjson( result );
db.inventory.find().shellPrint();

var lookup = { $lookup: {
                from: "inventory",
                localField: "item",
                foreignField: "sku",
                as: "inventory_docs" }
};

print("Simple $lookup");
var results = db.orders.aggregate([ lookup ]);

results.shellPrint();
var unwind = { $unwind : "$inventory_docs" };

var match = { $match : { "inventory_docs.instock" : { $exists : 1 } } };
var project = { $project : {
                _id : 0,
                "item" : 1,
                "price" : 1,
                "quantity" : 1,
                "inStock" : "$inventory_docs.instock" }
};
print("Unwound, matched, and projected $lookup");
results = db.orders.aggregate( [ lookup, unwind, match, project ] );

results.shellPrint();

