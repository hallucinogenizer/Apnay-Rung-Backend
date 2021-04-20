const jwt = require('jsonwebtoken')

function authenticateJWT(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(" ")[1]

    if (token == null) {
        console.log("Token not found")
        return res.status(401).send("Authorization Token not found in request.")
    } else {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, userObject) => {

            if (err) {
                console.log(token)
                return res.status(403).send("Invalid authorization token.")
                    //403 means authentication was present in header but it was wrong
            } else {
                req.userObject = userObject
                next()
            }
        })
    }
}

module.exports = authenticateJWT