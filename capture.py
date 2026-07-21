import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1440, "height": 1080})
        await page.goto("https://www.orangecharger.com/solutions/incentives/westlight-energy", wait_until="domcontentloaded", timeout=60000)
        
        # Disable fixed and sticky positioning to prevent navbar from floating down
        await page.evaluate("""
            () => {
                const style = document.createElement('style');
                style.innerHTML = `
                    * {
                        scroll-behavior: auto !important;
                    }
                `;
                document.head.appendChild(style);
                
                // Find and fix the navbar to the top
                const elements = document.querySelectorAll('*');
                for (let el of elements) {
                    const compStyle = window.getComputedStyle(el);
                    if (compStyle.position === 'fixed' || compStyle.position === 'sticky') {
                        el.style.setProperty('position', 'absolute', 'important');
                        // if it's the header, make sure it stays at the top
                        if (el.tagName.toLowerCase() === 'header' || el.tagName.toLowerCase() === 'nav' || compStyle.zIndex > 10) {
                            el.style.setProperty('top', '0', 'important');
                        }
                    }
                }
            }
        """)

        # Smooth scroll to the bottom to trigger all lazy-loaded elements
        await page.evaluate("""
            async () => {
                await new Promise((resolve) => {
                    let totalHeight = 0;
                    let distance = 500;
                    let timer = setInterval(() => {
                        let scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;

                        if (totalHeight >= scrollHeight) {
                            clearInterval(timer);
                            resolve();
                        }
                    }, 250);
                });
            }
        """)
        
        # Wait an extra 8 seconds for HubSpot and avatars to render
        await page.wait_for_timeout(8000)
        
        # Take full page screenshot
        await page.screenshot(path="orange_website.jpg", full_page=True)
        await browser.close()

asyncio.run(main())
