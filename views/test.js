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