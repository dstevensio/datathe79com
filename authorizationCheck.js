exports = module.exports = function authorizationCheck(options){
  return function authorizationCheck(req, res, next) {

    var sess      = req.session,
        loggedIn  = sess && sess.auth ? sess.auth.loggedIn : false,
        user      = sess && sess.auth && sess.auth.twitter ? sess.auth.twitter.user : null;

    if (!loggedIn && req.originalUrl != '/') {
      console.log("NOT LOGGED IN - " + req.originalUrl);
      res.writeHead(303, {'Location':'/auth/twitter'});
      res.end();
    } else {      
      req.loggedIn = loggedIn;
      req.user     = user;
      if (req.originalUrl === '/') req.originalUrl = '/home';
      next();
    }

  }
};