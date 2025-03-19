const pfp = document.getElementById("pfp-icon");
const slidingvenster = document.getElementById("slidingvenster");

pfp.addEventListener("click", () => {
  slidingvenster.classList.toggle("open");
});
