const client = require('./clientConnect')

//this excludes the currently logged in user from the unique email constraint check
const checkUniqueEmail2 = async(email, usertype, user_id) => {

    let query = "SELECT customer_id FROM customers WHERE email=$1"
    let values = [email]
    if (usertype == 'customer') {
        query += " AND customer_id != $2"
        values.push(user_id)
    }
    let result = await client.query(query, values)
    if (result.rowCount > 0) {
        return false
    } else {
        query = "SELECT seller_id FROM sellers WHERE email=$1"
        if (usertype == 'customer') {
            query += " AND seller_id != $2"
            values.push(user_id)
        }
        result = await client.query(query, values)
        if (result.rowCount > 0) {
            return false
        } else {
            query = "SELECT admin_id FROM admins WHERE email=$1"
            if (usertype == 'customer') {
                query += " AND admin_id != $2"
                values.push(user_id)
            }
            result = await client.query(query, values)
            if (result.rowCount > 0) {
                return false
            } else {
                return true
            }
        }
    }
}

module.exports = checkUniqueEmail2