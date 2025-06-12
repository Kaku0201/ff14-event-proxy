import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// ✅ 루트 확인용 ping
app.get('/', (req, res) => {
  res.send('Server is alive!');
});

// ✅ 메모리 캐시 (초기값: 빈 배열)
let cachedEvents = [];
let lastUpdated = null;

// ✅ 크롤링 함수 정의
async function fetchEvents() {
  console.log(`[FETCH] 이벤트 크롤링 시작: ${new Date().toLocaleString('ko-KR')}`);
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
    cachedEvents = events;
    lastUpdated = new Date();
    console.log(`[CACHE] ${events.length}개 항목 캐싱됨`);
  } catch (err) {
    console.error('❌ 크롤링 실패:', err);
  }
}

// ✅ 최초 서버 시작 시 크롤링 실행
fetchEvents();

// ✅ 일정 주기(10분)마다 크롤링 갱신
setInterval(fetchEvents, 10 * 60 * 1000); // 10분

// ✅ 클라이언트 요청에 캐시된 데이터 반환
app.get('/events', (req, res) => {
  res.json({
    updatedAt: lastUpdated,
    events: cachedEvents,
  });
});

// ✅ 서버 시작
app.listen(PORT, () => {
  console.log(`[SERVER UP] ${new Date().toLocaleString('ko-KR')}`);
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
