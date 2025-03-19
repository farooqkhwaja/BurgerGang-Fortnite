const pfp = document.querySelector("#pfp-icon");
const slidingvenster = document.getElementById("slidingvenster");

pfp.addEventListener("click", () => {
  slidingvenster.classList.toggle("open");
});
