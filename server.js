// GLOBALS
output      = require('./output');
commonUtils = require('./common_utils');
APP         = {};
client      = null;
Q           = require('q');

var router              = require('./routes'),
    connect             = require('connect'),
    http                = require('http'),
    fs                  = require('fs'),
    redis               = require('redis'),
    util                = require('util'),
    everyauth           = require('everyauth'),
    Promise             = everyauth.Promise,
    RedisStore          = require('connect-redis')(connect),
    authorizationCheck  = require('./authorizationCheck');

(function(){
  
  var config = fs.readFileSync(__dirname + '/config/conf.json');
  APP.config = JSON.parse(config.toString());
  config = null;

  client = redis.createClient(APP.config.redisPort);

  var sessionData = { 
        secret: APP.config.sessionSecret,
        key: "data79",  
        store: new RedisStore({ 
          client: client, 
          maxAge: 2592000000 // 30 DAYS, I THINK...
        })       
      };

  everyauth.twitter
    .myHostname(APP.config.baseDomain)
    .consumerKey(APP.config.twitterApp.key)
    .consumerSecret(APP.config.twitterApp.secret)
    .addToSession( function (sess, auth) {
      var promise = this.Promise()
        , _auth = sess.auth
        , mod = _auth[this.name];

      client.sismember("editors", auth.oauthUser["screen_name"], function (err, reply) {
        if (err) return promise.fail(err);

        if (reply) {
          _auth.loggedIn = true;
          _auth.userId || (_auth.userId = auth.user.id);
          mod.user = auth.oauthUser;
          mod.accessToken = auth.accessToken;
          mod.accessTokenSecret = auth.accessTokenSecret;
          // this._super() ?
          sess.save( function (err) {
            if (err) return promise.fail(err);
            promise.fulfill();
          });
        } else {
          _auth.loggedIn = false;
          promise.fulfill();
        }
      });  
      return promise;
    })
    .findOrCreateUser( function (session, accessToken, accessTokenSecret, twitterUserMetadata) {
      var promise = this.Promise();
      promise.fulfill({"user":twitterUserMetadata["screen_name"]});
      return promise;
    })
    .redirectPath('/');

  var app = connect()
    .use(connect.favicon())
    .use(connect.bodyParser())
    .use(connect.cookieParser())
    .use(connect.session(sessionData))
//    .use(connect.csrf())
    .use(everyauth.middleware())
    .use(authorizationCheck())
    .use(router);

  http.createServer(app).listen(APP.config.httpPort);

}());