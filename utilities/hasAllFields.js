function hasAllFields(fields, req_body) {
    let allGood = true
    let errors = {
        missingFields: [],
        wrongFields: [],
        longFields: [],
        emptyFields: []
    }
    for (let field in fields) {
        if (!Object.hasOwnProperty.bind(req_body)(field)) {
            allGood = false
            errors.missingFields.push(field)
        } else if (typeof req_body[field] != fields[field][0]) {
            allGood = false
            console.log(typeof req_body[field])
            errors.wrongFields.push(field)
        } else if (fields[field][1] != -1 && req_body[field].length > fields[field][1]) {
            allGood = false
            errors.longFields.push(field)
        } else if (fields[field][2] == "notempty" && req_body[field].length == 0) {
            allGood = false
            errors.emptyFields.push(field)
        }
    }
    return (allGood ? true : errors)
}

constraints = {
    name: ["string", 100, "notempty"],
    email: ["string", 100, "notempty"],
    password: ["string", -1, "notempty"],
    boolean: ["boolean", -1, ""],
    image: ["string", 1000, ""]
}

module.exports = { hasAllFields, constraints }