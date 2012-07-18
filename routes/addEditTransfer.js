var addEditTransfer = function (req, res) {
  // Show the form for adding a transfer, editing a transfer, updating a transfer

  var isEdit     = req.originalUrl.match(/\/edit\//),
      transferId = req.params ? (req.params.id ? req.params.id : null) : null,
      pageTitle  = isEdit ? (transferId ? "The 79: Edit Transfer" : "The 79: Edit Transfers") : "The 79: Add Transfer",
      heading    = isEdit ? (transferId ? "Edit Transfer" : "Edit Transfers") : "Add Transfer",
      scripts    = [{"src":"/assets/js/transfers.js"}],
      content    = commonUtils.createContentObj("add_transfer", req.loggedIn, pageTitle, heading, scripts), 
      clubs      = Q.defer(),
      today      = Q.defer(),
      positions  = Q.defer(),
      transfer,
      transfers,
      showOutput,
      getAllPlayerPositions,
      getAllClubs,
      genericReplyHandler,
      passDate,
      addPlayerPositions,
      addClubDataSources,
      addTransferData,
      getAllTransfers,
      getTransferData,
      addTransfers;

  /* * * * * * * * * * * * * * * * * * * * * * * * * * 
   *                                                 *
   * THE GATHERING AND FORMATTING OF DATA AND SET UP *
   *                                                 *
   * * * * * * * * * * * * * * * * * * * * * * * * * */

  showOutput = function () {
    if (transferId || !isEdit) {
      content.data.transferList = false;
    }
    output(res, content);
  };

  getAllTransfers = function () {
    if (isEdit && !transferId) {
      transfers = Q.defer();
      client.zrange("transfers", 0, -1, function (err, replies) { 
        commonUtils.redisArrayHandler(err, replies, transfers); 
      });
      return transfers.promise;
    } else {
      return true; // No need to get these if we're adding a new transfer, so move on
    }
  };

  getTransferData = function () {
    if (transferId) {
      transfer = Q.defer();
      var multi  = client.multi(),
          prefix = "transfer:"+transferId;
      multi.get(prefix + ":date");
      multi.get(prefix + ":playerName");
      multi.get(prefix + ":playerMeta");
      multi.get(prefix + ":playerCurrentClub");
      multi.get(prefix + ":fee");
      multi.get(prefix + ":playerAge");
      multi.get(prefix + ":playerPosition");
      multi.zrange(prefix + ":sources", 0, -1);
      multi.zrange(prefix + ":rivals", 0, -1);
      multi.get(prefix + ":status");
      multi.zrange(prefix + ":updates", 0, -1);
      multi.exec(function(err, replies) {
        commonUtils.multiFetch(err, replies, transfer, ["date","playerName","playerMeta","playerCurrentClub","fee","playerAge","playerPosition","sources","rivals","status","updates"]);
        // return an object, add the object to content.data
      });
      return transfer.promise;
    } else {
      return true;
    }
  };

  getAllPlayerPositions = function () {
    client.zrange("positions", 0, -1, function (err, replies) {
      commonUtils.redisArrayHandler(err, replies, positions);
    });
    return positions.promise;
  };

  addClubDataSources = function (clubArr) {
    content.data.clubDataSources = JSON.stringify(clubArr);
  };

  addPlayerPositions = function (positionsArr) {
    content.data.playerPositions = JSON.stringify(positionsArr);
  };

  addTransfers = function (transfersArr) {
    content.data.transferList = true;
    content.data.transfers = transfersArr;
  };

  addTransferData = function (player) {
    if (typeof player === 'object') {
      var props = Object.getOwnPropertyNames(player);      
      for (var i in props) {
        content.data[props[i]] = player[props[i]];
      }
      content.data.transferId = transferId;
    }
  };

  passDate = function (dateStr) {
    content.data.transferDetailDate = dateStr;
  };

  /* * * * * * * * * * * * * * * * * * * * * * * * * * 
   *                                                 *
   *             THE EXECUTION ORDER                 *
   *                                                 *
   * * * * * * * * * * * * * * * * * * * * * * * * * */

  Q.fcall(function(){ return commonUtils.getAllClubs(clubs); })
    .then(addClubDataSources, commonUtils.logError)
    .then(getAllTransfers)
    .then(addTransfers, commonUtils.logError)
    .then(getTransferData)
    .then(addTransferData, commonUtils.logError)
    .then(function(){ commonUtils.getTodayAsDate(today); return today.promise; })
    .then(passDate, commonUtils.logError)
    .then(getAllPlayerPositions)
    .then(addPlayerPositions, commonUtils.logError)
    .fin(showOutput);
};

module.exports = addEditTransfer;