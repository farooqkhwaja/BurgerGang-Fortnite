function showPopup(message, duration = 3000) {
    const popup = document.getElementById('popup');
    const popupMessage = document.getElementById('popup-message');
    
    popupMessage.textContent = message;
    
    popup.classList.add('show');
    
    if (duration) {
        setTimeout(() => {
            closePopup();
        }, duration);
    }
}

function closePopup() {
    const popup = document.getElementById('popup');
    popup.classList.remove('show');
}

document.addEventListener('click', function(event) {
    const popup = document.getElementById('popup');
    const popupContent = document.querySelector('.popup-content');
    
    if (event.target === popup) {
        closePopup();
    }
});