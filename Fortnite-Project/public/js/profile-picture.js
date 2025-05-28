document.addEventListener('DOMContentLoaded', function() {
    const addButton = document.querySelector('.add-to-pfp');
    const pfpIcon = document.getElementById('pfp-icon');
    
    addButton.addEventListener('click', function(e) {
        e.preventDefault();
        const characterImage = document.querySelector('.character');
        if (characterImage) {
            const currentOutfitImage = document.querySelector('.item-slot .item-image');
            if (currentOutfitImage) {
                pfpIcon.src = currentOutfitImage.src;
                
                localStorage.setItem('profilePicture', currentOutfitImage.src);
            }
        }
    });
}); 