document.querySelector("#form").addEventListener("submit", (e) => {
    e.preventDefault()
    e.stopImmediatePropagation()
    fetch(document.querySelector("#form").action, {
        method: "POST",
        withCredentials: true,
        credentials: "include",
        headers: {
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTQsIm5hbWUiOiJyb2hhbiIsInR5cGVPZlVzZXIiOiJzZWxsZXIiLCJpYXQiOjE2MTgwNTY1NTl9.tLCUDNdB0thVcK58QLx6itWMSW6FNYssLahnWueLrF0`
        },
        body: new FormData(document.querySelector("#form"))
    }).then(response => {
        alert("Hi")
        console.log(response)
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
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIsIm5hbWUiOiJ0YWltb29yIiwidHlwZU9mVXNlciI6InNlbGxlciIsImlhdCI6MTYxODA1NjQzNn0.a-ZvwfeqfE8xmRtAYgEJr28NBeEqzeh7pz-QfPs1mA0`
        },
        body: new FormData(document.querySelector("#form2"))
    }).then(response => {
        console.log(response)
        alert("Hi")
    }).catch(err => {
        console.log(err)
    })
})