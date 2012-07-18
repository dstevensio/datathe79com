var postDataHandler = function (req, res) {

  var postBody = req.body,
      transferInsert = Q.defer();

  if (postBody.isPub === 'yes') {

    var savePub = function savePub (newId) {
      var multi  = client.multi(),
          prefix = "pub:" + newId,
          dt     = new Date();

      multi.set(prefix + ":date", dt.toUTCString());
      multi.set(prefix + ":id", newId);
      multi.set(prefix + ":name", postBody.Name);
      multi.set(prefix + ":address", postBody.address);
      multi.set(prefix + ":googleMapLink", postBody.googleMapLink);
      multi.set(prefix + ":detail", postBody.Detail);
      multi.zadd("pubs", 0, newId);
      multi.exec(function (err, replies) {
        if (err) throw err;

        res.writeHead(302, {"Location":"/"});
        res.end();

      });

    };

    if (postBody.pubId) {
      savePub(postBody.pubId);
    } else {
      client.incr("global:lastid:pubs", function (err, newId) {
        savePub(newId);
      });
    }

  } else if (postBody.isTransferUpdate === 'yes') {

    var multi  = client.multi(),
        prefix = "transfer:"+postBody.transferId;

    multi.set(prefix+":status", postBody.updateStatus);
    multi.zadd(prefix+":updates", 0, JSON.stringify({"date":postBody.updateDate, "title":postBody.updateTitle, "url":postBody.updateLink}));
    multi.exec(function (err, replies) {
      if (err) throw err;

      commonUtils.logAction(commonUtils.getTwitterId(req.user), 'updateTransfer', JSON.stringify(postBody));

      res.writeHead(302, {"Location":"/"});
      res.end();

    });

  } else if (postBody.isTransfer === 'yes') {

    var saveTransfer = function saveTransfer (newId) {
      var multi  = client.multi(),
          prefix = "transfer:"+newId;

      var seojuice = commonUtils.getCanonicalVersion(postBody.playerName);

      multi.set(prefix + ":id", newId);
      multi.set(prefix + ":date", postBody.transferDate);
      multi.set(prefix + ":playerName", postBody.playerName);
      if (postBody.playerTwitter) multi.set(prefix + ":playerMeta", JSON.stringify({"twitter":postBody.playerTwitter}));
      multi.set(prefix + ":playerCurrentClub", postBody.currentClub);
      multi.set(prefix + ":fee", postBody.Fee);
      multi.set(prefix + ":playerAge", postBody.Age);
      multi.set(prefix + ":playerPosition", postBody.position);
      multi.set(prefix + ":seojuice", seojuice);

      multi.zadd("transfers", 0, JSON.stringify({"id":newId, "playerName":postBody.playerName}));

      commonUtils.multiLineToObjArray(postBody.Sources, 'sourceName', 'url', null, function (_sourcesArr) {
        if (_sourcesArr && _sourcesArr.length) {
          _sourcesArr.forEach(function (_source, i) {
            multi.zadd(prefix + ":sources", 0, JSON.stringify(_source));
          });
        }
      });

      commonUtils.multiLineToObjArray(postBody.Rivals, 'clubName', 'url', null, function (_rivalsArr) {
        if (_rivalsArr && _rivalsArr.length) {
          _rivalsArr.forEach(function (_rival, i) {
            multi.zadd(prefix + ":rivals", 0, JSON.stringify(_rival));
          });
        }
      });

      multi.set(prefix + ":status", postBody.Status);
      multi.exec(function (err, replies) {
        if (err) throw err;

        commonUtils.logAction(commonUtils.getTwitterId(req.user), 'addTransfer', JSON.stringify(postBody));

        res.writeHead(302, {"Location":"/edit/transfer/"+newId+"#success"});
        res.end();

      });
    };

    if (postBody.transferId) {
      saveTransfer(postBody.transferId);
    } else {
      client.incr("global:lastid:transfers", function (err, newId) {
        saveTransfer(newId);
      });
    }

  } else if (postBody.isFreeform === "yes") {

    // ARTICLE/GUIDE/REPORT/ETC
    var saveFreeform = function saveFreeform (fId) {

      var multi  = client.multi(),
          prefix = "longform:"+fId,
          dt     = new Date(),
          user   = req.user || null,
          author = commonUtils.getTwitterHandle(user);

      var seojuice = commonUtils.getCanonicalVersion(postBody.Title);

      multi.set(prefix + ":id", fId);
      multi.set(prefix + ":date", dt.toUTCString());
      multi.set(prefix + ":author", author);
      multi.set(prefix + ":title", postBody.Title);
      multi.set(prefix + ":body", postBody.freeformContent);
      multi.set(prefix + ":seojuice", seojuice);
      multi.zadd(postBody.Section, 0, fId);
      multi.zadd("longforms", 0, fId);
      multi.exec(function (err, replies) {
        if (err) throw err;

        commonUtils.logAction(commonUtils.getTwitterId(req.user), 'addTransfer', JSON.stringify(postBody));

//        res.writeHead(302, {"Location":"/edit/freeform/"+fId+"#success"});
        res.writeHead(302, {"Location":"/#success"});
        res.end();
      });
    };

    if (postBody.freeformId) {
      saveFreeform(postBody.freeformId);
    } else {
      client.incr("global:lastid:longforms", function (err, newId) {
        saveFreeform(newId);
      });
    }

  }

};

module.exports = postDataHandler;