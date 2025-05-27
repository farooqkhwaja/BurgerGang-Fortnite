document.addEventListener('DOMContentLoaded', function() {
    const addButton = document.querySelector('.utility-button img[alt="Add"]').parentElement;
    const pfpIcon = document.getElementById('pfp-icon');
    
    addButton.addEventListener('click', function(e) {
        e.preventDefault();
        const characterImage = document.querySelector('.character');
        if (characterImage) {
            // Update the profile picture with the current outfit's small icon
            const currentOutfitImage = document.querySelector('.item-slot .item-image');
            if (currentOutfitImage) {
                pfpIcon.src = currentOutfitImage.src;
                
                // Save the profile picture URL to localStorage
                localStorage.setItem('profilePicture', currentOutfitImage.src);
            }
        }
    });
}); 