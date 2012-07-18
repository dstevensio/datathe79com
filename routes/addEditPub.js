var addEditPub = function (req, res) {
  // Add or Edit a pub for fans
  var isEdit      = req.originalUrl.match(/\/edit\//),
      pubId       = req.params ? (req.params.id ? req.params.id : null) : null,
      pub         = Q.defer(),
      pubIds      = Q.defer(),
      pubs        = Q.defer(),
      pageTitle   = isEdit ? (pubId ? "The 79: Edit Pub" : "The 79: Edit Pubs") : "The 79: Add Pub",
      heading     = isEdit ? (pubId ? "Edit Pub" : "Edit Pubs") : "Add Pub",
      content     = commonUtils.createContentObj('add_pub', req.loggedIn, "The 79: Add/Edit Pub", "Add/Edit Pub", []),
      fetchPubs,
      fetchPub,
      processPubs,
      addPubs,
      addPub,
      showOutput;

  showOutput = function () {
    if (!content.data.pubs) content.data.pubs = true;
    output(res, content);
    return true;
  };

  fetchPubs = function fetchPubs () {
    if (isEdit && !pubId) {
      console.log("FETCH PUBS");
      client.zrange("pubs", 0, -1, function (err, replies) {
        commonUtils.redisArrayHandler(err, replies, pubIds);
      });
      return pubIds.promise;
    } else {
      if (pubId) {
        pubIds.resolve([pubId]);
        return pubIds.promise;
      } else {
        return true;
      }
    }
  };

  fetchPub = function fetchPub () {
    if (isEdit && pubId) {
      pubIds.resolve([pubId]);
      return pubIds.promise;
    } else {
      return true;
    }
  };

  processPubs = function processPubs (pubArr) {
    console.log("processPubs");
    console.log(pubArr);
    if (pubArr && pubArr.length) {
      var multi = client.multi(),
          keys = ["id", "name", "address", "googleMapLink", "detail"];

      pubArr.forEach(function (p, i) {
        var commonStr = "pub:"+p;
        keys.forEach(function (key, j) {
          multi.get(commonStr + ":" + key);
        });
      });

      multi.exec(function (err, replies) {
        commonUtils._multiFetch(err, replies, pubs, keys, []);
      });

      return pubs.promise;
    } else {
      return true;
    }
  };

  addPubs = function addPubs (pubsArr) {
    content.data.pubList = isEdit ? !pubId : false;
    content.data.pubs = pubsArr;

    console.log(content.data.pubs);
    return true;
  };

  Q.fcall(fetchPubs)
    .then(processPubs, commonUtils.logError)
    .then(addPubs)
    .then(fetchPub)
    .fin(showOutput);

};

module.exports = addEditPub;