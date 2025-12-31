/* Entrypoint: initialize features carousel, reviews, and form behaviors */
import { initFeaturesCarousel } from './carousel.js';
import { initReviewsCarousel } from './reviews.js';
import { initForm } from './form.js';

document.addEventListener('DOMContentLoaded', () => {
  // Set year (kept here so year update stays near UI init)
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  initFeaturesCarousel();
  initReviewsCarousel();
  initForm();

  // Wire header/hero quote button scrolling to contact
  const heroQuote = document.getElementById('heroQuote');
  const quoteBtn = document.getElementById('quoteBtn');
  const contact = document.getElementById('contact');
  const scrollToContact = (e) => {
    e?.preventDefault();
    if (contact) contact.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  if (heroQuote) heroQuote.addEventListener('click', scrollToContact);
  if (quoteBtn) quoteBtn.addEventListener('click', scrollToContact);
});