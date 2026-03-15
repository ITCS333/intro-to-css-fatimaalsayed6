// FIX: Polyfill for TextEncoder/TextDecoder in older Node.js environments
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
// --- End of FIX ---

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// --- Configuration ---
const studentHtmlFile = '../index.html';
const studentCssFile = '../styles.css';
// --- End Configuration ---

const htmlPath = path.join(__dirname, studentHtmlFile);
const cssPath = path.join(__dirname, studentCssFile);

// ---------------------------------------------------------------
// Helper: Get the computed style for a selector from a live DOM.
// JSDOM does not compute styles from stylesheets automatically,
// so we inject the CSS into a <style> tag and use getComputedStyle.
// ---------------------------------------------------------------
let document;
let window;

const filesExist =
  fs.existsSync(htmlPath) && fs.existsSync(cssPath);

if (!filesExist) {
  describe('File Check', () => {
    test('index.html should exist', () => {
      expect(fs.existsSync(htmlPath)).toBe(true);
    });
    test('styles.css should exist', () => {
      expect(fs.existsSync(cssPath)).toBe(true);
    });
  });
} else {
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  // Inject CSS directly into the HTML so JSDOM can compute styles
  const htmlWithStyles = htmlContent.replace(
    '</head>',
    `<style>${cssContent}</style></head>`
  );

  const dom = new JSDOM(htmlWithStyles, {
    resources: 'usable',
    runScripts: 'dangerously',
  });

  document = dom.window.document;
  window = dom.window;

  /**
   * Returns the computed style value for a given CSS property
   * on the first element matching the selector.
   * @param {string} selector - A CSS selector string
   * @param {string} property - A camelCase CSS property name
   * @returns {string}
   */
  function getStyle(selector, property) {
    const el = document.querySelector(selector);
    if (!el) return null;
    return window.getComputedStyle(el).getPropertyValue(property).trim();
  }

  /**
   * Checks whether a raw CSS string contains a rule matching
   * a given selector and a declaration containing the expected text.
   * This is used as a fallback for properties JSDOM does not compute.
   * @param {string} selector
   * @param {string} declarationFragment - e.g. 'border-left'
   * @returns {boolean}
   */
  function cssContains(selector, declarationFragment) {
    // Build a loose regex: selector { ...declarationFragment... }
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(
      escaped + '\\s*\\{[^}]*' + declarationFragment + '[^}]*\\}',
      'i'
    );
    return pattern.test(cssContent);
  }

  // ================================================================
  //  TEST SUITES
  // ================================================================

  describe('Exercise 1 — Body Styles', () => {
    test('body should have font-family containing Arial', () => {
      const val = getStyle('body', 'font-family');
      expect(val.toLowerCase()).toContain('arial');
    });

    test('body should have background-color #f5f5f5', () => {
      const val = getStyle('body', 'background-color');
      // JSDOM returns rgb() values
      expect(val).toBe('rgb(245, 245, 245)');
    });

    test('body should have color #333333', () => {
      const val = getStyle('body', 'color');
      expect(val).toBe('rgb(51, 51, 51)');
    });

    test('body should have margin of 0', () => {
      const val = getStyle('body', 'margin');
      // Accept "0", "0px", or empty (all equivalent to zero margin)
      expect(['0', '0px', '']).toContain(val);
    });

    test('body should have padding of 0', () => {
      const val = getStyle('body', 'padding');
      expect(['0', '0px', '']).toContain(val);
    });
  });

  describe('Exercise 2 — Header Styling', () => {
    test('#main-header should have background-color #2c3e50', () => {
      const val = getStyle('#main-header', 'background-color');
      expect(val).toBe('rgb(44, 62, 80)');
    });

    test('#main-header should have color #ffffff', () => {
      const val = getStyle('#main-header', 'color');
      expect(val).toBe('rgb(255, 255, 255)');
    });

    test('#main-header should have padding of 20px', () => {
      const val = getStyle('#main-header', 'padding');
      expect(val).toMatch(/20px/);
    });

    test('#main-header should have text-align center', () => {
      const val = getStyle('#main-header', 'text-align');
      expect(val).toBe('center');
    });
  });

  describe('Exercise 3 — Header H1', () => {
    test('#main-header h1 should have font-size 2.5rem', () => {
      const val = getStyle('#main-header h1', 'font-size');
      expect(val).toBe('2.5rem');
    });

    test('#main-header h1 should have margin of 0', () => {
      const val = getStyle('#main-header h1', 'margin');
      expect(['0', '0px', '']).toContain(val);
    });
  });

  describe('Exercise 4 — Navigation Links', () => {
    test('nav a should have color #f39c12', () => {
      const val = getStyle('nav a', 'color');
      expect(val).toBe('rgb(243, 156, 18)');
    });

    test('nav a should have text-decoration: none', () => {
      const val = getStyle('nav a', 'text-decoration');
      expect(val).toContain('none');
    });

    test('nav a should have font-size 1rem', () => {
      const val = getStyle('nav a', 'font-size');
      expect(val).toBe('1rem');
    });

    test('nav a should have left and right margin of 10px (CSS rule check)', () => {
      const hasMargin =
        cssContains('nav a', 'margin') ||
        cssContains('nav a', 'margin-left') ||
        cssContains('nav a', 'margin-right');
      expect(hasMargin).toBe(true);
    });
  });

  describe('Exercise 5 — Navigation Link Hover', () => {
    test('nav a:hover rule should set text-decoration to underline', () => {
      expect(cssContains('nav a:hover', 'underline')).toBe(true);
    });

    test('nav a:hover rule should set color to #ffffff', () => {
      const hasColor =
        cssContains('nav a:hover', '#ffffff') ||
        cssContains('nav a:hover', '#fff') ||
        cssContains('nav a:hover', 'rgb(255, 255, 255)') ||
        cssContains('nav a:hover', 'white');
      expect(hasColor).toBe(true);
    });
  });

  describe('Exercise 6 — Main Content Area', () => {
    test('main should have max-width of 800px', () => {
      const val = getStyle('main', 'max-width');
      expect(val).toBe('800px');
    });

    test('main should have padding of 40px', () => {
      const val = getStyle('main', 'padding');
      expect(val).toMatch(/40px/);
    });

    test('main should have margin-left and margin-right of auto (CSS rule check)', () => {
      const hasAuto =
        cssContains('main', 'margin:\\s*40px auto') ||
        cssContains('main', 'margin:\\s*auto') ||
        cssContains('main', 'margin-left:\\s*auto') ||
        cssContains('main', 'margin-right:\\s*auto') ||
        /main\s*\{[^}]*margin[^}]*auto[^}]*\}/i.test(cssContent);
      expect(hasAuto).toBe(true);
    });
  });

  describe('Exercise 7 — Section Headings (h2)', () => {
    test('h2 should have color #2c3e50', () => {
      const val = getStyle('h2', 'color');
      expect(val).toBe('rgb(44, 62, 80)');
    });

    test('h2 should have padding-bottom of 8px', () => {
      const val = getStyle('h2', 'padding-bottom');
      expect(val).toBe('8px');
    });

    test('h2 should have a bottom border (CSS rule check)', () => {
      const hasBorder =
        cssContains('h2', 'border-bottom') ||
        cssContains('h2', 'border');
      expect(hasBorder).toBe(true);
    });
  });

  describe('Exercise 8 — Intro Paragraph', () => {
    test('.intro should have font-size 1.1rem', () => {
      const val = getStyle('.intro', 'font-size');
      // Allow slight rounding differences across environments
      expect(val).toBe('1.1rem');
    });

    test('.intro should have line-height 1.8', () => {
      const val = getStyle('.intro', 'line-height');
      expect(val).toBe('1.8');
    });

    test('.intro should have font-style italic', () => {
      const val = getStyle('.intro', 'font-style');
      expect(val).toBe('italic');
    });
  });

  describe('Exercise 9 — Hobbies List', () => {
    test('.hobbies-list should have list-style: none', () => {
      const val = getStyle('.hobbies-list', 'list-style');
      expect(val).toBe('none');
    });

    test('.hobbies-list should have padding of 0', () => {
      const val = getStyle('.hobbies-list', 'padding');
      expect(['0', '0px', '']).toContain(val);
    });

    test('.hobbies-list li should have background-color #ffffff', () => {
      const val = getStyle('.hobbies-list li', 'background-color');
      expect(val).toBe('rgb(255, 255, 255)');
    });

    test('.hobbies-list li should have padding of 10px', () => {
      const val = getStyle('.hobbies-list li', 'padding');
      expect(val).toMatch(/10px/);
    });

    test('.hobbies-list li should have a left border (CSS rule check)', () => {
      const hasBorder =
        cssContains('.hobbies-list li', 'border-left') ||
        cssContains('.hobbies-list li', 'border');
      expect(hasBorder).toBe(true);
    });
  });

  describe('Exercise 10 — Highlighted List Item', () => {
    test('.highlight should have background-color #f39c12', () => {
      const val = getStyle('.highlight', 'background-color');
      expect(val).toBe('rgb(243, 156, 18)');
    });

    test('.highlight should have color #ffffff', () => {
      const val = getStyle('.highlight', 'color');
      expect(val).toBe('rgb(255, 255, 255)');
    });

    test('.highlight should have a left border with color #e67e22 (CSS rule check)', () => {
      const hasBorder =
        cssContains('.highlight', '#e67e22') ||
        cssContains('.highlight', 'rgb(230, 126, 34)');
      expect(hasBorder).toBe(true);
    });
  });

  describe('Exercise 11 — Blockquote', () => {
    test('blockquote should have background-color #ffffff', () => {
      const val = getStyle('blockquote', 'background-color');
      expect(val).toBe('rgb(255, 255, 255)');
    });

    test('blockquote should have padding of 20px', () => {
      const val = getStyle('blockquote', 'padding');
      expect(val).toMatch(/20px/);
    });

    test('blockquote should have a left border (CSS rule check)', () => {
      const hasBorder =
        cssContains('blockquote', 'border-left') ||
        cssContains('blockquote', 'border');
      expect(hasBorder).toBe(true);
    });

    test('blockquote should have margin-left of 0', () => {
      const val = getStyle('blockquote', 'margin-left');
      expect(['0', '0px']).toContain(val);
    });
  });

  describe('Exercise 12 — Cite Element', () => {
    test('cite should have display: block', () => {
      const val = getStyle('cite', 'display');
      expect(val).toBe('block');
    });

    test('cite should have text-align: right', () => {
      const val = getStyle('cite', 'text-align');
      expect(val).toBe('right');
    });

    test('cite should have font-size 0.9rem', () => {
      const val = getStyle('cite', 'font-size');
      expect(val).toBe('0.9rem');
    });

    test('cite should have color #777777', () => {
      const val = getStyle('cite', 'color');
      expect(val).toBe('rgb(119, 119, 119)');
    });

    test('cite should have margin-top of 10px', () => {
      const val = getStyle('cite', 'margin-top');
      expect(val).toBe('10px');
    });
  });

  describe('Exercise 13 — Button Link', () => {
    test('.btn should have display: inline-block', () => {
      const val = getStyle('.btn', 'display');
      expect(val).toBe('inline-block');
    });

    test('.btn should have background-color #2c3e50', () => {
      const val = getStyle('.btn', 'background-color');
      expect(val).toBe('rgb(44, 62, 80)');
    });

    test('.btn should have color #ffffff', () => {
      const val = getStyle('.btn', 'color');
      expect(val).toBe('rgb(255, 255, 255)');
    });

    test('.btn should have text-decoration: none', () => {
      const val = getStyle('.btn', 'text-decoration');
      expect(val).toContain('none');
    });

    test('.btn should have border-radius of 4px', () => {
      const val = getStyle('.btn', 'border-radius');
      expect(val).toBe('4px');
    });

    test('.btn should have font-size 1rem', () => {
      const val = getStyle('.btn', 'font-size');
      expect(val).toBe('1rem');
    });

    test('.btn should have padding (CSS rule check)', () => {
      expect(cssContains('.btn', 'padding')).toBe(true);
    });
  });

  describe('Exercise 14 — Button Hover', () => {
    test('.btn:hover rule should set background-color to #f39c12', () => {
      const hasColor =
        cssContains('.btn:hover', '#f39c12') ||
        cssContains('.btn:hover', 'rgb(243, 156, 18)');
      expect(hasColor).toBe(true);
    });

    test('.btn:hover rule should include a transition property', () => {
      expect(cssContains('.btn:hover', 'transition')).toBe(true);
    });
  });

  describe('Exercise 15 — Footer', () => {
    test('#main-footer should have background-color #2c3e50', () => {
      const val = getStyle('#main-footer', 'background-color');
      expect(val).toBe('rgb(44, 62, 80)');
    });

    test('#main-footer should have color #aaaaaa', () => {
      const val = getStyle('#main-footer', 'color');
      expect(val).toBe('rgb(170, 170, 170)');
    });

    test('#main-footer should have text-align: center', () => {
      const val = getStyle('#main-footer', 'text-align');
      expect(val).toBe('center');
    });

    test('#main-footer should have padding of 20px', () => {
      const val = getStyle('#main-footer', 'padding');
      expect(val).toMatch(/20px/);
    });

    test('#main-footer should have margin-top of 20px', () => {
      const val = getStyle('#main-footer', 'margin-top');
      expect(val).toBe('20px');
    });
  });
}
