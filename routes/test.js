var express = require('express')
var router = express.Router()
const fs = require('fs')
const path = require('path')
const multer = require('multer')

var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './images/')
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)) //Appending .jpg
    }
})

var upload = multer({ dest: './images/', storage: storage })
const client = require('../utilities/clientConnect')



router.get('/read', (req, res) => {
    const query = "SELECT image AS data FROM tutorials WHERE true"
    client.query(query)
        .then(result => {
            res.contentType('jpeg')
            res.end(result.rows[0].data)
        })
        .catch(err => {
            console.log(err)
            res.sendStatus(500)
        })
})


router.post('/file', upload.single('cnic_image'), function(req, res, next) {
    // req.file is the `avatar` file
    // req.body will hold the text fields, if there were any

    // console.log(req.file, req.body)
    const finalfile = path.join(process.cwd(), req.file.destination, req.file.filename)
    console.log(req.body.name)
    res.send(finalfile)

    // fs.readFile(finalfile, 'hex', function(err, imgData) {
    //     if (err) {
    //         console.log(err)
    //     } else {
    //         imgData = '\\x' + imgData;
    //         const query = "UPDATE tutorials SET image=$1 WHERE true"
    //         const values = [imgData]
    //         client.query(query, values)
    //             .then(response => {
    //                 console.log(response)
    //                 res.sendStatus(201)
    //             })
    //             .catch(err => {
    //                 console.log(err)
    //                 res.sendStatus(500)
    //             })
    //     }
    // })

})

module.exports = router