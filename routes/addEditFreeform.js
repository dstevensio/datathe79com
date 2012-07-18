var addEditFreeform = function addEditFreeform (req, res) {
  // Show the form for adding or editing an article/report/guide/etc

  var isEdit     = req.originalUrl.match(/\/edit\//),
      freeformId = req.params ? (req.params.id ? req.params.id : null) : null,
      pageTitle  = isEdit ? (freeformId ? "The 79: Edit Freeform Editorial Content" : "The 79: Edit Freeform Editorial Content") : "The 79: Add Freeform Editorial Content",
      heading    = isEdit ? (freeformId ? "Edit Freeform Editorial Content" : "Edit Freeform Editorial Content") : "Add Freeform Editorial Content",
      scripts    = [{"src":"/assets/js/freeforms.js"}],
      content    = commonUtils.createContentObj("add_freeform", req.loggedIn, pageTitle, heading, scripts), 
      sections   = Q.defer(),
      showOutput,
      getSiteSections;

  /* * * * * * * * * * * * * * * * * * * * * * * * * * 
   *                                                 *
   * THE GATHERING AND FORMATTING OF DATA AND SET UP *
   *                                                 *
   * * * * * * * * * * * * * * * * * * * * * * * * * */

  showOutput = function () {
    if (freeformId || !isEdit) {
      content.data.freeformList = false;
    }
    output(res, content);
  };

  getSiteSections = function () {
    client.zrange("sections", 0, -1, function (err, replies) { 
      commonUtils.redisArrayHandler(err, replies, sections); 
    });
    return sections.promise;
  };

  addSiteSections = function (sectionArr) {
    if (sectionArr && sectionArr.length) {
      var sectionsBox = [],
          len         = sectionArr.length,
          last        = len - 1;

      sectionArr.forEach(function (sec, i) {
        sectionsBox.push({"val":sec, "title":sec});

        if (i === last) {
          content.data.sections = sectionsBox;
        }
      });

    }
  };

  /* * * * * * * * * * * * * * * * * * * * * * * * * * 
   *                                                 *
   *             THE EXECUTION ORDER                 *
   *                                                 *
   * * * * * * * * * * * * * * * * * * * * * * * * * */

  Q.fcall(getSiteSections)
    .then(addSiteSections, commonUtils.logError)
    .fin(showOutput);  
};

module.exports = addEditFreeform;