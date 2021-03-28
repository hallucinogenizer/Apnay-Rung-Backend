const client = require('./clientConnect')

function isBlocked(req, res, next) {
    if (req.userObject.typeOfUser != "admin") {
        const query = `SELECT blocked FROM ${req.userObject.typeOfUser+'s'} WHERE ${req.userObject.typeOfUser+'_id'}=${req.userObject.id}`
        client.query(query)
            .then(result => {
                if (result.rows[0].blocked == false) {
                    next()
                } else {
                    res.sendStatus(403)
                        //403 forbidden
                }
            })
    } else {
        next()
    }
}

module.exports = isBlocked