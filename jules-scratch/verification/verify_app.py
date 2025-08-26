from playwright.sync_api import sync_playwright

def run():
    print("Starting verification script...")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:3000", timeout=60000)
        page.screenshot(path="jules-scratch/verification/verification.png")
        browser.close()
    print("Verification script finished.")

run()
