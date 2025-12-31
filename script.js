/*
  script.js has been refactored into modular files under /js:
    - /js/main.js        (Entrypoint that wires modules)
    - /js/carousel.js    (features carousel logic)
    - /js/reviews.js     (reviews rendering + carousel)
    - /js/form.js        (form handling & deadline logic)

  Tombstones below indicate where large functions were removed and moved into modules.
*/

// removed function featuresCarousel() {}
// removed function renderReviewsAndStars() {}
// removed function initFormSubmissionAndDeadlineHandling() {}

/* Minimal fallback to keep legacy references working if any script looked for `year` */
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();