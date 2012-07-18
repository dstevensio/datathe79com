var home = function (req, res) {
  // Show the landing screen after log in

  var content = {
    template: "input.html",
    data: {
      "loggedIn":  req.loggedIn,
      "pageTitle":'The 79: Data Entry',
      "message": "Oh a big hello from Connect with some stuff added."        
    }
  };

  if (req.loggedIn) {
    content.data.user = req.user["screen_name"];
    content.data.userName = req.user.name;
  }

  output(res, content);  

};

module.exports = home;