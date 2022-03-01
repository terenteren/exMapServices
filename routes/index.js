var express = require('express');
var router = express.Router();
const locationModel = require('../model/location');

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Express' });
});

router.get('/upload', (req, res, next) => {
  res.render('upload');
});

router.post('/location', (req, res, next) => {
  const {title, address, lat, lng} = req.body;
  let location = new locationModel();
  location.title = title;
  location.address = address;
  location.lat = lat;
  location.lng = lng;
  location.save().then(result => { // insert db
    console.log(result);
    res.json({
      message: "success",
    });
  }).catch(error => {
    console.log(error);
    res.json({
      message: "error",
    });
  });
});

router.get("/location", (req, res, next) => {
  // 조회한 데이터중 _id와 __v는 제외
  locationModel.find({}, {_id:0, __v:0}).then((result) => {
    console.log(result);
    res.json({
      message: "success",
      data: result,
    });
  }).catch(error => {
    res.json({
      message: "error",
    });
  });
});

module.exports = router;
