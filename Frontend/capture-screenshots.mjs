import puppeteer from 'puppeteer';
import { mkdir } from 'fs/promises';

const BASE = 'http://localhost:5173';
const OUT = './guide-screenshots';

await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

// 1. Overview Dashboard
console.log('Capturing Overview...');
await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 1500));
await page.screenshot({ path: `${OUT}/01-overview.png`, fullPage: false });

// 2. Projects List
console.log('Capturing Projects...');
await page.goto(`${BASE}/projects`, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 1000));
await page.screenshot({ path: `${OUT}/02-projects-list.png`, fullPage: false });

// 3. Add Project Modal
console.log('Capturing Add Project modal...');
await page.evaluate(() => {
  document.querySelectorAll('button').forEach(b => {
    if (b.textContent.includes('Add project')) b.click();
  });
});
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: `${OUT}/03-add-project-modal.png`, fullPage: false });

// Close modal
await page.keyboard.press('Escape');
await new Promise(r => setTimeout(r, 500));

// 4. Questions Page (empty)
console.log('Capturing Questions page...');
const projectRow = await page.$('table tbody tr');
if (projectRow) {
  const questionsBtn = await page.$('table tbody tr button[title="Questions"]');
  if (questionsBtn) await questionsBtn.click();
}
await new Promise(r => setTimeout(r, 1500));
await page.screenshot({ path: `${OUT}/04-questions-empty.png`, fullPage: false });

// 5. Add Question Modal (empty)
console.log('Capturing Add Question modal...');
await page.evaluate(() => {
  document.querySelectorAll('button').forEach(b => {
    if (b.textContent.includes('Add question')) b.click();
  });
});
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: `${OUT}/05-add-question-modal.png`, fullPage: false });

// 6. Add Question Modal (filled)
console.log('Filling question form...');
const inputs = await page.$$('dialog input');
if (inputs.length >= 3) {
  await inputs[0].click({ clickCount: 3 });
  await inputs[0].type('Who won the 2023 Cricket World Cup?');
  await inputs[1].click({ clickCount: 3 });
  await inputs[1].type('India');
  await inputs[2].click({ clickCount: 3 });
  await inputs[2].type('Australia');
}
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: `${OUT}/06-add-question-filled.png`, fullPage: false });

// Submit the question
console.log('Submitting question...');
await page.evaluate(() => {
  document.querySelectorAll('dialog button').forEach(b => {
    if (b.textContent.trim() === 'Add question' && !b.textContent.includes('Cancel')) b.click();
  });
});
await new Promise(r => setTimeout(r, 1500));

// 7. Questions Page (with data)
console.log('Capturing Questions with data...');
await page.screenshot({ path: `${OUT}/07-questions-with-data.png`, fullPage: false });

// 8. Connect Game Modal
console.log('Capturing Connect Game modal...');
await page.evaluate(() => {
  document.querySelectorAll('button').forEach(b => {
    if (b.textContent.includes('Connect a game')) b.click();
  });
});
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: `${OUT}/08-connect-game.png`, fullPage: false });

// Close modal
await page.keyboard.press('Escape');
await new Promise(r => setTimeout(r, 500));

// 9. Admins Page
console.log('Capturing Admins...');
await page.goto(`${BASE}/admins`, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 1000));
await page.screenshot({ path: `${OUT}/09-admins.png`, fullPage: false });

// 10. Settings Page
console.log('Capturing Settings...');
await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 1000));
await page.screenshot({ path: `${OUT}/10-settings.png`, fullPage: true });

await browser.close();
console.log('All screenshots captured!');
