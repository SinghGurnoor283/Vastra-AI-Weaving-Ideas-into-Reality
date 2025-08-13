import puppeteer from 'puppeteer';
import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin Initialized.');
}

const db = admin.firestore();

async function scrapePinterest(browser, searchTerm) {
    console.log(`🚀 Scraping Pinterest for: "${searchTerm}"...`);
    
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    const pinterestUrl = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(searchTerm)}`;
    console.log(`Navigating to: ${pinterestUrl}`);
    
    await page.goto(pinterestUrl, { waitUntil: 'networkidle2' });

    console.log('Page loaded. Waiting for images...');
    await page.waitForSelector('div[data-grid-item="true"] img');

    console.log('Extracting and filtering image data...');
    const scrapedData = await page.evaluate(() => {
        const pins = [];
        const imageElements = document.querySelectorAll('div[data-grid-item="true"] img');
        
        imageElements.forEach(img => {
            const width = img.naturalWidth;
            const height = img.naturalHeight;

            // We only want images that are:
            // 1. Tall (portrait-oriented)
            // 2. A reasonable size (not tiny icons)
            const isGoodQuality = height > width && height > 400;

            const imageUrl = img.src;
            const description = img.alt;

            if (isGoodQuality && imageUrl && description && !description.includes('Avatar')) {
                pins.push({
                    imageUrl,
                    description,
                    source: 'Pinterest',
                });
            }
        });
        return pins;
    });

    console.log(`Scraped and filtered ${scrapedData.length} high-quality pins for "${searchTerm}".`);
    await page.close();
    return scrapedData;
}

async function saveData(data) {
    if (!data || data.length === 0) {
        console.log('No data to save.');
        return;
    }

    console.log(`📝 Saving ${data.length} total items to Firestore...`);
    const trendsCollection = db.collection('trends');
    
    const batch = db.batch();
    data.forEach(item => {
        const docRef = trendsCollection.doc();
        const itemWithTimestamp = {
            ...item,
            scrapedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        batch.set(docRef, itemWithTimestamp);
    });

    await batch.commit();
    console.log('✅ All data saved to Firestore successfully.');
}

async function main() {
    const searchTerms = [
        'indian wedding guest outfit inspiration',
        'pastel color lehenga for reception',
        'organza saree with designer blouse',
        'punjabi suit design for festivals',
        'mehendi ceremony outfit ideas',
        'south indian bridal saree look',
        'bandhani print anarkali suit',

        'groom reception outfit ideas men',
        'floral print kurta for men wedding',
        'men haldi ceremony outfit',
        'black sherwani for groom',
        'jodhpuri suit for men latest design',
        'men waistcoat with kurta pajama',

        'indo-western dress for women party',
        'long gown design for engagement',
        'crop top with palazzo pants ethnic',

        'men blazer for wedding guest',
        'asymmetric kurta design for men',
        'printed shirt for men diwali festival'
    ];

    let allScrapedData = [];
    const browser = await puppeteer.launch({ headless: true });

    for (const term of searchTerms) {
        try {
            const fashionTrends = await scrapePinterest(browser, term);
            allScrapedData = allScrapedData.concat(fashionTrends);
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2-second delay
        } catch (error) {
            console.error(`❌ An error occurred while scraping "${term}":`, error);
        }
    }
    
    await browser.close();

    if (allScrapedData.length > 0) {
        console.log('Clearing old trends from Firestore...');
        const snapshot = await db.collection('trends').get();
        const deleteBatch = db.batch();
        snapshot.docs.forEach(doc => deleteBatch.delete(doc.ref));
        await deleteBatch.commit();
        console.log('✅ Old trends cleared.');
        
        await saveData(allScrapedData);
    } else {
        console.log("No data was scraped. Nothing to save.");
    }
}

main();
