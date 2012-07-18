var Mu = require('mu2'),
    pump = require('util').pump,
    templates = [
      'header.html',
      'betablock.html',
      'itemlist.html',
      'transfer.html',
      'longform.html',
      'home.html',
      'loginorwelcome.html',
      'add_transfer.html',
      'add_freeform.html',
      'add_pub.html',
      'input.html',
      'footer.html'
    ],
    tlen = templates.length;

Mu.root = './templates';

while (tlen--) { 
  Mu.compile(templates[tlen], function(err, compiled){
    if (err) throw err;
  });
}

module.exports = function(res, content) {
  if (APP.config.baseDomain.match(/data/)) content.data.isData = true;
  content.data.copyright = content.data.copyright || APP.config.copyright || "2012";
  if (content.type && content.type == 'application/json') {
    res.writeHead(200, {'Content-Type':content.type});
    res.end(JSON.stringify(content.data));
  } else {      
    res.writeHead(200, {'Content-Type' : content.type || "text/html"});
    content.data.pageTitle = content.data.pageTitle || APP.config.defaults.pageTitle;
    pump(Mu.render(content.template, content.data), res);
    content = null;
  }
}