const client = require('./clientConnect')

const checkUniqueEmail = async(email) => {
    let query = "SELECT customer_id FROM customers WHERE email=$1"
    let values = [email]
    let result = await client.query(query, values)
    if (result.rowCount > 0) {
        return false
    } else {
        query = "SELECT seller_id FROM sellers WHERE email=$1"
        result = await client.query(query, values)
        if (result.rowCount > 0) {
            return false
        } else {
            query = "SELECT admin_id FROM admins WHERE email=$1"
            result = await client.query(query, values)
            if (result.rowCount > 0) {
                return false
            } else {
                return true
            }
        }
    }
}

module.exports = checkUniqueEmail