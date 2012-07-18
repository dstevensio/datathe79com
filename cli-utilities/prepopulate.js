// CAREFUL! THIS POPULATES A REDIS DATASTORE WITH THE DEFAULT DATA. NOT TO BE EXPOSED OUT TO THE WEB INTERFACE VIA A ROUTE
// AND WATCH OUT FOR RUNNING THIS MORE THAN ONCE ON AN INDIVIDUAL REDIS INSTANCE!

var fs    = require('fs'),
    redis = require('redis'),
    Q     = require('q'),
    data  = require('./data/prepopulatedData');

(function(){
  
  var config = fs.readFileSync(__dirname + '/../config/conf.json');
  var conf = JSON.parse(config.toString());

  var client = redis.createClient(conf.redisPort);

  var prepopClubs = function () {
    // PRE-POPULATE A BUNCH OF CLUBS
  };

  var prepopPositions = function () {

    // PRE-POPULATE SOME OBVIOUS POSITIONS
    console.log("=========================\nPOSITIONS:");
    var multi     = client.multi(),
        positions = data.positions,
        len       = positions.length,
        last      = len - 1;

    console.log("1. adding " + len + " positions");
    positions.forEach(function (position, i) {
      multi.zadd("positions", 0, position);
      if (i === last) {
        multi.exec(function (err, replies) {
          if (err) throw err;

          console.log("2. added " + replies.length + " positions");
        });
      }
    });
  };

  var prepopCategories = function () {
    // PRE-POPULATE SITE CATEGORIES
    console.log("=========================\nCATEGORIES:");
    var multi     = client.multi(),
        cats      = data.categories,
        len       = cats.length,
        last      = len - 1;

    console.log("1. adding " + len + " categories");
    cats.forEach(function (cat, i) {
      multi.zadd("sections", 0, cat);
      if (i === last) {
        multi.exec(function (err, replies) {
          if (err) throw err;

          console.log("2. added " + replies.length + " categories/sections");
          process.exit();
        });
      }
    });
  };

  // prepopClubs();
  // prepopPositions();
  prepopCategories();
  

}());