import express from 'express';
import puppeteer from 'puppeteer-core';
import { executablePath } from 'puppeteer-core';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/events', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto('https://www.ff14.co.kr/news/event/', {
      waitUntil: 'domcontentloaded',
    });

    const events = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('.event_list a').forEach((el) => {
        const title = el.querySelector('.tit')?.innerText.trim() || '제목 없음';
        const date = el.querySelector('.date')?.innerText.trim() || '';
        const href = el.getAttribute('href') || '';
        const link = 'https://www.ff14.co.kr' + href;

        items.push({ title, date, link });
      });
      return items;
    });

    await browser.close();
    res.json(events);
  } catch (err) {
    console.error('크롤링 실패:', err);
    res.status(500).json({ error: '이벤트 불러오기 실패' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
