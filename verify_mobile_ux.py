from playwright.sync_api import sync_playwright, expect
import os

def verify(page):
    # 1. Day View
    page.goto("http://localhost:8080")
    page.wait_for_selector("#view-day")

    # Check "Dnes" title
    expect(page.locator("#view-day h1")).to_have_text("Dnes")
    page.screenshot(path="/home/jules/verification/1_day.png")
    print("Day view verified")

    # 2. Week View
    page.locator("#nav-btn-week").click()
    page.wait_for_selector("#view-week", state="visible")
    expect(page.locator("#view-week h1")).to_have_text("Týden")
    page.screenshot(path="/home/jules/verification/2_week.png")
    print("Week view verified")

    # 3. Month View
    page.locator("#nav-btn-month").click()
    page.wait_for_selector("#view-month", state="visible")
    # Title contains Year (e.g. "Říjen 2023")
    expect(page.locator("#view-month h1")).to_contain_text("20")
    page.screenshot(path="/home/jules/verification/3_month.png")
    print("Month view verified")

    # 4. Year View
    page.locator("#nav-btn-year").click()
    page.wait_for_selector("#view-year", state="visible")
    expect(page.locator("#view-year h1")).to_contain_text("Rok")
    page.screenshot(path="/home/jules/verification/4_year.png")
    print("Year view verified")

    # 5. Settings View
    page.locator("#nav-btn-settings").click()
    page.wait_for_selector("#view-settings", state="visible")
    expect(page.locator("#view-settings h1")).to_have_text("Nastavení")
    page.screenshot(path="/home/jules/verification/5_settings.png")
    print("Settings view verified")

if __name__ == "__main__":
    if not os.path.exists("/home/jules/verification"):
        os.makedirs("/home/jules/verification")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Mobile viewport
        context = browser.new_context(viewport={"width": 375, "height": 812})
        page = context.new_page()
        try:
            verify(page)
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
        finally:
            browser.close()
