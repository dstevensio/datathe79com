var router 				    = require("route66"),
	  home   				    = require("./routes/home"),
	  addEditTransfer		= require("./routes/addEditTransfer"),
    addEditFreeform   = require("./routes/addEditFreeform"),
    postDataHandler   = require("./routes/postDataHandler"),
    addEditPub        = require("./routes/addEditPub");

router.get('/',                   home);
router.get('/add/transfer',       addEditTransfer);
router.get('/edit/transfers',     addEditTransfer);
router.get('/edit/transfer/:id',  addEditTransfer);
router.get('/add/freeform',       addEditFreeform);
router.get('/edit/freeforms',     addEditFreeform);
router.get('/edit/freeform/:id',  addEditFreeform);
router.get('/add/pub',            addEditPub);
router.get('/edit/pubs',          addEditPub);
router.get('/edit/pub/:id',       addEditPub);


router.post('/save/transfer',     postDataHandler);
router.post('/update/transfer',   postDataHandler);
router.post('/save/freeform',     postDataHandler);
router.post('/save/pub',          postDataHandler);

module.exports = router;