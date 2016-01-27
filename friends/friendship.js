// http://www.census.gov/topics/population/genealogy/data/1990_census/1990_census_namefiles.html
// http://stackoverflow.com/questions/18894212/mongodb-using-as-a-graph-database-for-finding-friends-of-friends-for-exampl
// http://stackoverflow.com/questions/18391799/database-or-list-of-english-first-and-last-names
//
// http://stackoverflow.com/questions/14530234/how-do-i-randomly-merge-two-input-files-to-one-output-file-using-unix-tools
// Need to randomly merge the female and male first names!
// sort -R file1 file2 -o file3   
load("parallelTester.js");
db = db.getSisterDB("friendship");

var FOF = {
    loadData : function() {
        db.names.drop();
        db.friends.drop();
        var i=0;
        var lines = cat("./dist.all.first").split("\n");
        lines.forEach( function(line) {
            var name = line.split(" ")[0];
            db.friends.insert( { "_id" : i, "name" : name } );
            db.names.insert( { "_id" : i++, "name" : name } );
        });
        print("Loaded fresh names data. db.names.count()="+db.names.count());
    },

    // Given a person, sample some random number of friends
    buildFriends : function(who, maxFriends) {
        // note this could be zero!
        //var db = db.getSiblingDB("friendship");
        var m = new Mongo();
        var numFriends = Math.floor(Math.random()*maxFriends); 
        if ( numFriends==0 ) {
            return { "who" : who, "numFriends" : 0 };
        }
        var s1 = { "$sample" : { "size" : numFriends } };
        var g1 = {"$group":{"_id":1,"friends":{"$addToSet":"$name"}}};
        var friends = m.getDB("friendship").names.aggregate([s1,g1]).next();
        var r = { "who" : who, "numFriends" : numFriends, fs : friends.friends };
        m.getDB("friendship").friends.update( { "_id" : who._id}, 
                               { "$set" : { "friends" : friends.friends } });
        return r;
    },
    
    randomFriendshipData : function(numPeople,maxFriends) {
        var threads = [];
        var folksWithFriends = [];       // don't give same dude friends more than once
        var friendCount = db.friends.count();

        for(var i=0;i<numPeople;i++) {
            var rid =Math.floor( Math.random()*friendCount ); 
            //print(rid);
            var person = db.names.findOne( { "_id" : rid  });
            while ( folksWithFriends.indexOf(person._id) != -1 ) {
                person = db.names.findOne( { "_id" : Math.floor( Math.random()*friendCount ) });
            }
            folksWithFriends.push(person._id);
            var t = new ScopedThread(this.buildFriends,person,maxFriends);
            threads.push(t);
            t.start();
            if ( i%50===1 ) { 
                for(var i in threads) {
                    var t = threads[i];
                    t.join();
                    printjson(t.returnData());
                }
                threads = [];
                print("Built friends for " + i + " people. " + (numPeople-i) + " to go.");
            }
        }
    },

    friendsOfFriends : function(who) {
        var match = { "$match" : { "_id" : who } };
        var unwind = { "$unwind" : "$friends" };
        var lookup = { $lookup: { from: "friends",
                              localField: "friends",
                              foreignField: "name",
                              as: "friendsOfFriends" }
        };
        var unwind2 = { "$unwind" : "$friendsOfFriends" };
        var unwind3 = { "$unwind" : "$friendsOfFriends.friends" };
        var group = { "$group" : { "_id" : "$friendsOfFriends.friends" } };
        var project = { "$project" : { "friendOfFriend" : "$_id", "_id" : 0 } };

        var agg = [ match, unwind, lookup, unwind2, unwind3, group, project ];
        var results = db.friends.aggregate( agg );
        return results;
    },

    run : function(numPeople, maxFriends) {
        if ( arguments.length!=2 ) {
            print("usage: FOF.run(<numPeople>,<maxFriends>)");
            return;
        }
        this.loadData();
        this.randomFriendshipData(numPeople, maxFriends);
        var cursor = db.friends.find( { "friends" : { $exists : true } } );
        while ( cursor.hasNext() ) { 
            var p = cursor.next(); 
            print("Do " + p.name + '\'s '+ p.friends.length + " friends have friends?"); 
            var fof = this.friendsOfFriends(p._id); 
            if ( fof.hasNext() ) {
                print("YES!");
                fof.shellPrint();
            } else { 
                print("Sorry, nope.");
            }
        }
    }
}
