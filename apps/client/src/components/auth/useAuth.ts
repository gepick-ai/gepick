export function useAuth() {
  function checkAuthState() {
    fetch(`http://localhost:3000/api/user`, {
      credentials: "include", // fetch won't send cookies unless you set credentials
    })
      .then(response => response.json())
      .then((data) => {
        window.localStorage.setItem("user", JSON.stringify(data))
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
      });
  }

  return {
    checkAuthState,
  }
}
