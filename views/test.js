document.querySelector("#form").addEventListener("submit", (e) => {
    e.preventDefault()
    e.stopImmediatePropagation()
    fetch(document.querySelector("#form").action, {
        method: "POST",
        withCredentials: true,
        credentials: "include",
        headers: {
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTksIm5hbWUiOiJNb21pbmEgQW1lciIsInR5cGVPZlVzZXIiOiJzZWxsZXIiLCJpYXQiOjE2MTkxNzkyODd9.m8g80VZ7Ub6RJzOKZWq6vigNzyGe7CARrL03hBNvfb8`
        },
        body: new FormData(document.querySelector("#form"))
    }).then(response => {
        alert("Hi")
        console.log(response.json())
    }).catch(err => {
        console.log(err)
    })
})


document.querySelector("#form2").addEventListener("submit", (e) => {
    e.stopImmediatePropagation()
    e.preventDefault()
    fetch(document.querySelector("#form2").action, {
        method: "POST",
        withCredentials: true,
        credentials: "include",
        headers: {
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTUsIm5hbWUiOiJWYWZhIEJhdG9vbCIsInR5cGVPZlVzZXIiOiJzZWxsZXIiLCJpYXQiOjE2MTkxMjA5MDJ9.GaloR9PH0mSBJBwAIXoqZFRSY96HlEsQCqhnO23TzZE`
        },
        body: new FormData(document.querySelector("#form2"))
    }).then(response => {
        console.log(response)
        alert("Hi")
    }).catch(err => {
        console.log(err)
    })
})