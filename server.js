// server.js - Render에서 puppeteer-core 사용 최종 버전
import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());

app.get('/events', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath: '/usr/bin/chromium-browser', // Render 기본 제공 위치
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // User-Agent 설정 (크롤링 차단 방지)
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    );

    await page.goto('https://ff14.co.kr/news/event/', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    const events = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('.list_board.list_thumb li').forEach((el) => {
        const title = el.querySelector('.tit')?.innerText.trim() || '제목 없음';
        const date = el.querySelector('.date')?.innerText.trim() || '';
        const href = el.querySelector('a')?.getAttribute('href') || '';
        const link = 'https://ff14.co.kr' + href;

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
