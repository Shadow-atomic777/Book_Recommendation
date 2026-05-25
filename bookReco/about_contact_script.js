// Tab switching with smooth animation
const tabButtons = document.querySelectorAll(".tab-btn");
const sections = document.querySelectorAll(".section");

tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-target");
        sections.forEach(sec => {
            if(sec.id === target) sec.classList.add("active");
            else sec.classList.remove("active");
        });
    });
});

// Contact form submission
const contactForm = document.getElementById("contactForm");
const formMessage = document.getElementById("formMessage");

contactForm.addEventListener("submit", function(e){
    e.preventDefault();
    const name = document.getElementById("name").value;
    formMessage.textContent = `Thank you, ${name}! Your message has been sent.`;
    contactForm.reset();
});
