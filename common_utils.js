var util = require('util');

var logError, createContentObj, _multiFetch, getCanonicalVersion, redisArrayHandler, getAllClubs, getTodayAsDate, zeroPad, multiLineToObjArray, getTwitterId, logAction, multiFetch, getTwitterHandle;
var _shortYear;

logError = function logError (err) {
  console.log(err);
}

logAction = function logAction (twitterUserId, type, jsonPostBody) {
  client.incr("global:lastid:logsactions", function (err, actionId) {
    if (err) throw err;

    var multi  = client.multi(),
        prefix = "logs:actions:" + actionId,
        dt     = new Date();

    multi.set(prefix + ':datetime', dt.toUTCString());
    multi.set(prefix + ':user', twitterUserId);
    multi.set(prefix + ':type', type);
    multi.set(prefix + ':content', jsonPostBody);
    multi.exec(function (err, replies) {
      console.log("Logged " + util.inspect(replies));
    });

  });
};

getCanonicalVersion = function getCanonicalVersion (inputStr) {
  var inputStr = inputStr + "";
  inputStr = inputStr.replace(/[^A-Za-z0-9\-\s]/gi,'');
  inputStr = inputStr.replace(/\s/gi, '-');
  return inputStr.toLowerCase();
};

createContentObj = function createContentObj (templateStr, loggedIn, pageTitle, heading, scripts) {
  var defaultScripts = [
    {'src':"/assets/js/jquery-1.7.2.min.js"},
    {'src':"/assets/js/bootstrap-transition.js"},
    {'src':"/assets/js/bootstrap-alert.js"},
    {'src':"/assets/js/bootstrap-modal.js"},
    {'src':"/assets/js/bootstrap-datepicker.js"},    
    {'src':"/assets/js/bootstrap-dropdown.js"},
    {'src':"/assets/js/bootstrap-scrollspy.js"},
    {'src':"/assets/js/bootstrap-tab.js"},
    {'src':"/assets/js/bootstrap-tooltip.js"},
    {'src':"/assets/js/bootstrap-popover.js"},
    {'src':"/assets/js/bootstrap-button.js"},
    {'src':"/assets/js/bootstrap-collapse.js"},
    {'src':"/assets/js/bootstrap-carousel.js"},
    {'src':"/assets/js/bootstrap-typeahead.js"}
  ];

  scripts = defaultScripts.concat(scripts);

  var content = {
    "template": templateStr + '.html',
    "data"    : {
      "loggedIn"  : loggedIn || null,
      "pageTitle" : pageTitle,
      "heading"   : heading,
      "scripts"   : scripts,
      "logAction" : logAction
    }
  };
  return content;
};

redisArrayHandler = function redisArrayHandler (err, replies, Promise) {
  if (err) Promise.reject(err);

  var arr  = [],
      last = replies.length - 1;

  if (replies.length === 0) {
    Promise.resolve(arr);
  } else {
    replies.forEach(function (reply, i) {
      if (reply.match(/[{}]/)) reply = JSON.parse(reply);
      arr.push(reply);
      if (i === last) {
        Promise.resolve(arr);
      }
    });      
  }
};

getTwitterId = function getTwitterId (u) {
  return (u ? (u["id_str"] ? u["id_str"] : "0") : "0");
};

getTwitterHandle = function getTwitterHandle (u) {
  return (u ? (u["screen_name"] ? u["screen_name"] : "NOT FOUND") : "NOT FOUND");
};

getAllClubs = function getAllClubs (Promise) {
  client.zrange("clubs", 0, -1, function (err, replies) {
    redisArrayHandler(err, replies, Promise); 
  });
  return Promise.promise;
};

_shortYear = function _shortYear (year) {
  return (year+"").substr(2,2);
};

zeroPad = function zeroPad (n) {
  return (n < 10 ? "0"+n : ""+n); 
};

getTodayAsDate = function getTodayAsDate (Promise) {
  var dt      = new Date(),
      dateStr = [
        zeroPad(dt.getDate()),
        zeroPad(dt.getMonth() + 1),
        _shortYear(dt.getFullYear())
      ].join('/');

  Promise.resolve(dateStr);
};

multiLineToObjArray = function multiLineToObjArray (inputStr, leftKeyStr, rightKeyStr, divider, callback) {
  var divider   = divider || "\r\n",
      returnArr = [],
      _tmpArr   = inputStr.split(divider),
      len       = _tmpArr.length,
      last      = len - 1;

  if (len) {
    _tmpArr.forEach(function (item, i) {
      var _objParts = item.split(", "),
          _obj = {};

      _obj[leftKeyStr]  = _objParts[0];
      _obj[rightKeyStr] = _objParts[1];

      returnArr.push(_obj);
      if (i === last) {
        callback(returnArr);
      }
    });
  }
};

_multiFetch = function multipleMultiFetch (err, replies, Promise, keys, returnArray) {
  if (err) Promise.reject(err);

  var repliesLen  = replies.length,
      _obj        = {},
      returnArray = returnArray || null;

  if (repliesLen) {
    var len  = keys.length,
        last = len - 1;

    var groupCount = 0;
    replies.forEach(function (reply, i) {

      if (reply) {
        var key = keys[groupCount];

        if (key == "sources" || key == "rivals") {
          reply = JSON.parse("[" + reply + "]");
        }

        if (len > groupCount && keys[groupCount]) {
          var writeKey = keys[groupCount];

          if (reply && typeof reply === "object") {
            var outputStr = "";
            if (reply.hasOwnProperty('length')) {
              // Array
              var jlen  = reply.length,
                  jlast = jlen - 1;

              reply.forEach(function (item, j) {
                if (typeof item === "object") {
                  var props = Object.getOwnPropertyNames(item);
                  if (props && props.length === 2) {
                    outputStr += item[props[1]] + ", " + item[props[0]];
                  }
                } else {
                  outputStr += item + "\r\n";
                }
                if (jlast === j) {
                  //reply = outputStr;
                }
              });
            } else {
              // Object
              console.log ("FOUND AN OBJECT IN MULTIFETCH - DSUTILS 235");
              console.log(reply);
            }
          }

          _obj[writeKey] = (writeKey === 'date' || writeKey === 'sent') ? reply : reply;
        
        }
      }

      groupCount++;

      if (returnArray && groupCount === len) {
        groupCount = 0;
        returnArray.push(_obj);
        _obj = {};
      }

      if (last === i) {
        var resolution = returnArray ? returnArray : _obj;
        Promise.resolve(resolution);
      }

    });
  
  } else {
    Promise.resolve(_obj);
  }

};

multiFetch = function multiFetch (err, replies, Promise, keys) {
  if (err) Promise.reject(err);

  var repliesLen = replies.length,
      _obj       = {};

  if (repliesLen) {
    var len  = keys.length,
        last = len - 1;

    keys.forEach(function (key, i) {
      var writeKey = key;
      if (repliesLen > i && replies[i]) {
        var reply = replies[i];

        if (key == "playerMeta") {
          writeKey = "playerTwitter";
          var ob   = JSON.parse(reply);
          reply    = ob.twitter;
        }

        if (key == "sources" || key == "rivals") {
          reply = JSON.parse("[" + reply + "]");
        }

        if (typeof reply === "object") {
          var outputStr = "";
          if (reply.hasOwnProperty('length')) {
            // Array
            var jlen  = reply.length,
                jlast = jlen - 1;

            reply.forEach(function (item, j) {
              if (typeof item === "object") {
                var props = Object.getOwnPropertyNames(item);
                if (props && props.length === 2) {
                  outputStr += item[props[1]] + ", " + item[props[0]];
                }
              } else {
                outputStr += item + "\r\n";
              }
              if (jlast === j) {
                reply = outputStr;
              }
            });
          } else {
            // Object
            console.log ("FOUND AN OBJECT IN MULTIFETCH - COMMON UTILS 178");
            console.log(reply);
          }
        }

        _obj[writeKey] = reply;
      }
      if (last === i) {
        Promise.resolve(_obj);
      }

    });
  
  } else {
    Promise.resolve(_obj);
  }

};

var commonUtils = {
  'logError'            : logError,
  'createContentObj'    : createContentObj,
  'redisArrayHandler'   : redisArrayHandler,
  'getAllClubs'         : getAllClubs,
  'getTodayAsDate'      : getTodayAsDate,
  'zeroPad'             : zeroPad,
  'multiLineToObjArray' : multiLineToObjArray,
  'multiFetch'          : multiFetch,
  '_multiFetch'         : _multiFetch,
  'getCanonicalVersion' : getCanonicalVersion,
  'getTwitterId'        : getTwitterId,
  'getTwitterHandle'    : getTwitterHandle,
  'logAction'           : logAction
};

module.exports = commonUtils;