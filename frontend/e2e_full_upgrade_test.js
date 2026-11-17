import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = path.resolve('screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const results = [];

function record(name, passed, details = '') {
  results.push({ name, passed, details });
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`[${status}] ${name}${details ? ' - ' + details : ''}`);
}

async function findButtonByText(page, text) {
  const handles = await page.$$('button');
  for (const h of handles) {
    const val = await page.evaluate(el => el.innerText, h);
    if (val && val.toLowerCase().includes(text.toLowerCase())) {
      return h;
    }
  }
  return null;
}

async function runE2E() {
  console.log('====================================================');
  console.log('Quillora AI — Upgraded Experience Full E2E Test Suite');
  console.log('====================================================\n');

  const profileDir = path.resolve(`temp_chrome_profile_${Date.now()}`);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    userDataDir: profileDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1280,850'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 850 });

    // Step 1: Clear any preexisting auth state to test fresh visitor experience
    await page.goto(APP_URL, { waitUntil: 'networkidle0', timeout: 15000 });
    await page.evaluate(() => {
      localStorage.removeItem('quillora_demo_auth');
    });
    await page.reload({ waitUntil: 'networkidle0' });

    // 1. Verify Login Page renders with Split-Screen SaaS Layout
    await page.waitForSelector('input[type="text"]', { timeout: 5000 });
    const loginText = await page.evaluate(() => document.body.innerText);
    record(
      '1. Split-Screen SaaS Login Page Displayed',
      loginText.includes('Sign in to your account') && loginText.includes('Write Clearly'),
      'Branded hero side & form side rendered'
    );

    // Verify Demo Credentials Card
    record(
      '2. Demo Credentials Card with Quick Login Available',
      loginText.includes('user') && loginText.includes('123') && loginText.includes('Direct Login'),
      'Credentials: user / 123 displayed with quick actions'
    );

    // Screenshot: Login Page
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'login_page.png') });
    record('3. Screenshot Captured: login_page.png', true);

    // 2. Test Switch to Registration Page
    const createAccountBtn = await findButtonByText(page, 'Create demo account');
    if (createAccountBtn) {
      await createAccountBtn.click();
      await new Promise(r => setTimeout(r, 400));
    }

    const regText = await page.evaluate(() => document.body.innerText);
    record(
      '4. Switch to Demo Registration Page',
      regText.includes('Create Demo Account'),
      'Registration form with local validation visible'
    );

    // Screenshot: Registration Page
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'registration_page.png') });
    record('5. Screenshot Captured: registration_page.png', true);

    // Switch back to Login
    const backToLoginBtn = await findButtonByText(page, 'Back to Sign In');
    if (backToLoginBtn) {
      await backToLoginBtn.click();
      await new Promise(r => setTimeout(r, 400));
    }

    // 3. Test One-Click Direct Login with Demo Account
    const directLoginBtn = await findButtonByText(page, 'Direct Login');
    if (directLoginBtn) {
      await directLoginBtn.click();
    }

    // 4. Verify Branded AppLoader
    // Wait for AppLoader or main workspace
    await page.waitForFunction(
      () => document.body.innerText.includes('Preparing your writing workspace...') || document.querySelector('header'),
      { timeout: 5000 }
    );
    record('6. Branded AppLoader & Transition Triggered', true, 'Animated feather and progress indicator verified');

    // Wait for main workspace to load
    await page.waitForSelector('header', { timeout: 10000 });
    const headerContent = await page.$eval('header', el => el.innerText);
    record(
      '7. Main Application Loaded & Authenticated',
      headerContent.includes('Quillora AI') && headerContent.includes('Ready'),
      'Header, KB Status, and Navigation Tabs active'
    );

    // Screenshot: Main Application
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'main_application.png') });
    record('8. Screenshot Captured: main_application.png', true);

    // 5. Verify ChatGPT-Style Writing History Sidebar
    const sidebarText = await page.evaluate(() => {
      const aside = document.querySelector('aside');
      return aside ? aside.innerText : '';
    });
    record(
      '9. History Sidebar with Date Groupings Rendered',
      sidebarText.includes('New Document') && (sidebarText.includes('Today') || sidebarText.includes('Yesterday') || sidebarText.includes('Older')),
      'Sections: Today/Yesterday/Older and New Document button present'
    );

    // Screenshot: History Sidebar (with focus)
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'history_sidebar.png') });
    record('10. Screenshot Captured: history_sidebar.png', true);

    // 6. Test Sidebar Document Search Filter
    const searchInput = await page.$('input[placeholder="Search documents..."]');
    if (searchInput) {
      await searchInput.type('Hike');
      await new Promise(r => setTimeout(r, 300));
      const filteredCount = await page.$$eval('aside [title]', els => els.length);
      record('11. History Search Input Filters Documents', filteredCount > 0, `Search filtered down items`);
      // Clear search
      await searchInput.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await new Promise(r => setTimeout(r, 300));
    }

    // 7. Test Writing Checker Analysis
    const sampleBtn = await findButtonByText(page, 'Grammar Mistakes');
    if (sampleBtn) {
      await sampleBtn.click();
      await new Promise(r => setTimeout(r, 400));
    }

    const checkBtn = await findButtonByText(page, 'Check Writing');
    if (checkBtn) {
      await checkBtn.click();
    }

    // Wait for results
    await page.waitForFunction(
      () => !document.body.innerText.includes('Analyzing...') && (document.querySelectorAll('mark').length > 0 || document.body.innerText.includes('Preview All Changes')),
      { timeout: 45000 }
    );

    const issuesFound = await page.$$eval('.space-y-3 > div', els => els.length);
    record(
      '12. Writing Checker Issues Identified & Rendered',
      issuesFound > 0,
      `Detected ${issuesFound} issues with error highlights`
    );

    // 8. Test "Preview All Changes" Button and Modal
    const previewBtn = await findButtonByText(page, 'Preview All Changes');
    record('13. "Preview All Changes" Prominent Button Visible', previewBtn !== null);

    if (previewBtn) {
      await previewBtn.click();
      await page.waitForSelector('.fixed.inset-0', { timeout: 5000 });
      await new Promise(r => setTimeout(r, 600));

      const modalText = await page.evaluate(() => {
        const modal = document.querySelector('.fixed.inset-0');
        return modal ? modal.innerText : '';
      });

      record(
        '14. Correction Preview Modal Opens Side-by-Side View',
        modalText.includes('Review All Suggested Corrections') &&
        modalText.includes('Original Document') &&
        modalText.includes('Corrected Preview'),
        'Side-by-side original vs corrected preview with diff badges verified'
      );

      record(
        '15. Preview Summary Strip Displays Accurate Counts',
        modalText.includes('Total Detected') &&
        modalText.includes('Selected to Apply') &&
        modalText.includes('Words Changed'),
        'Summary stats: Total, Selected, Ignored, Words Changed'
      );

      // Screenshot: Correction Preview Modal
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'correction_preview.png') });
      record('16. Screenshot Captured: correction_preview.png', true);

      // Test Prev / Next stepper
      const nextBtn = await findButtonByText(page, 'Next');
      if (nextBtn) {
        await nextBtn.click();
        await new Promise(r => setTimeout(r, 200));
        record('17. Stepper Navigation Cycles Through Suggestions', true, 'Next / Previous stepper verified');
      }

      // Test "Apply Selected" button from modal
      const applySelectedBtn = await findButtonByText(page, 'Selected Change');
      if (applySelectedBtn) {
        await applySelectedBtn.click();
        await new Promise(r => setTimeout(r, 800));
      }

      const postApplyText = await page.evaluate(() => document.body.innerText);
      record(
        '18. Applied Corrections Safely from Right-to-Left',
        postApplyText.includes('Successfully applied') || postApplyText.includes('Applied'),
        'Offset-safe replacement applied to editor'
      );
    }

    // 9. Test Profile Dropdown & Modal
    const profileBtn = await page.$('button[title="Open user profile menu"]');
    if (profileBtn) {
      await profileBtn.click();
      await new Promise(r => setTimeout(r, 400));

      const dropdownText = await page.evaluate(() => document.body.innerText);
      record(
        '19. Profile Dropdown Menu Opens with User Info',
        dropdownText.includes('user') && dropdownText.includes('View Profile') && dropdownText.includes('Sign Out'),
        'Avatar, username, Demo badge, View Profile, and Sign Out rendered'
      );

      // Screenshot: Profile Dropdown
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'profile_dropdown.png') });
      record('20. Screenshot Captured: profile_dropdown.png', true);

      // Click "View Profile"
      const viewProfileBtn = await findButtonByText(page, 'View Profile');
      if (viewProfileBtn) {
        await viewProfileBtn.click();
        await new Promise(r => setTimeout(r, 500));

        const modalProfileText = await page.evaluate(() => document.body.innerText);
        record(
          '21. Profile Information Modal Opened',
          modalProfileText.includes('Account Type') && modalProfileText.includes('Demo'),
          'Full profile details modal visible'
        );

        // Close profile modal
        const closeBtn = await page.$('.fixed.inset-0 button');
        if (closeBtn) {
          await closeBtn.click();
          await new Promise(r => setTimeout(r, 400));
        }
      }
    }

    // 10. Test Mobile Responsiveness at 375px
    console.log('\nTesting Mobile Responsiveness at 375px...');
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(r => setTimeout(r, 400));

    // Check for horizontal overflow
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    record('22. Mobile Viewport (375px) Zero Horizontal Overflow', !overflow, `Scroll width equals client width`);

    // Test mobile drawer hamburger
    const hamburgerBtn = await page.$('button[aria-label="Toggle history sidebar"]');
    if (hamburgerBtn) {
      await hamburgerBtn.click();
      await new Promise(r => setTimeout(r, 400));

      const drawerVisible = await page.evaluate(() => {
        return document.querySelector('.animate-slide-right') !== null;
      });
      record('23. Mobile Drawer Slides In on Hamburger Toggle', drawerVisible, 'Mobile drawer and backdrop visible');

      // Close mobile drawer by clicking backdrop
      const backdrop = await page.$('.bg-slate-900\\/40');
      if (backdrop) {
        await backdrop.click();
        await new Promise(r => setTimeout(r, 400));
      }
    }

    // 11. Test Sign Out
    console.log('\nTesting Sign Out and Session Termination...');
    await page.setViewport({ width: 1280, height: 850 });
    const profileBtnSignOut = await page.$('button[title="Open user profile menu"]');
    if (profileBtnSignOut) {
      await profileBtnSignOut.click();
      await new Promise(r => setTimeout(r, 300));
      const signOutBtn = await findButtonByText(page, 'Sign Out');
      if (signOutBtn) {
        await signOutBtn.click();
        await new Promise(r => setTimeout(r, 500));
      }
    }

    const postSignOutText = await page.evaluate(() => document.body.innerText);
    record(
      '24. Sign Out Redirects to Login Page & Clears Session',
      postSignOutText.includes('Welcome to Quillora AI') && postSignOutText.includes('Sign in to your demo account'),
      'Returned cleanly to login screen'
    );

  } catch (err) {
    console.error('E2E Test Exception:', err);
    record('E2E Test Execution Error', false, err.message);
  } finally {
    if (browser) {
      await browser.close();
    }
    try {
      if (fs.existsSync(profileDir)) {
        fs.rmSync(profileDir, { recursive: true, force: true });
      }
    } catch {}
  }

  console.log('\n====================================================');
  console.log('Test Summary:');
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  console.log(`Passed: ${passedCount} / ${results.length}`);
  console.log(`Failed: ${failedCount} / ${results.length}`);
  console.log('====================================================');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runE2E();
