import "@testing-library/jest-dom/vitest";

// Polyfill for Radix UI components in jsdom
// Radix UI uses pointer capture and scrollIntoView which aren't available in jsdom
if (typeof Element !== 'undefined') {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = function () {
      return false;
    };
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = function () {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = function () {};
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = function () {};
  }
}
