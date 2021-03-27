const jwt = require('jsonwebtoken')

function authenticateJWT(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(" ")[1]

    if (token == null) return res.sendStatus(401)
        //401 status code means authentication is not present in the header of the request
    else {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, userObject) => {
            if (err) return res.sendStatus(403)
                //403 means authentication was present in header but it was wrong
            else {
                req.userObject = userObject
                next()
            }
        })
    }
}

module.exports = authenticateJWT