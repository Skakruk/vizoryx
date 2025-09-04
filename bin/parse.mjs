import { parse } from 'node-html-parser';
import { promises as fs } from 'fs';
import got from 'got';
import { CookieJar } from 'tough-cookie';
import imgCache from './cache/images.json' with { type: 'json' };

const machineryName = /^(?<total>\d+) (?<name>[A-z-0-9\/\s'"\(\).]+)/m;
const typeNameRegExp = /^(?!(Ukraine|Russia))(?<type>.+) \((\d+), of which (.+)\)/m;

const replaceTypeName = {
  'Engineering Vehicles': 'Engineering Vehicles and Equipment',
  'Radars': 'Radars And Communications Equipment',
  'Naval Ships': 'Naval Ships and Submarines',
  'Trucks, Vehicles, and Jeeps': 'Trucks, Vehicles, Jeeps, and Trains',
};

const cookieJar = new CookieJar();

process.env.PARSE_COOKIES = process.env.PARSE_COOKIES || '_ga=GA1.2.1732219516.1756449496; GOOGLE_ABUSE_EXEMPTION=ID=06f08c5ed85cfb76:TM=1757010984:C=r:IP=52.232.117.55-:S=YiDzEh6Rql3j738cwwv37B4; _gid=GA1.2.515201464.1757011000; displayCookieNotice=y';

// Optionally pre-seed cookies from env: PARSE_COOKIES ("key=value; key2=value2") and PARSE_COOKIE_DOMAIN
const seedCookies = (cookieJar) => {
  const cookieStr = process.env.PARSE_COOKIES;
  const domain = process.env.PARSE_COOKIE_DOMAIN || '.oryxspioenkop.com';
  if (!cookieStr) return;
  try {
    const parts = cookieStr.split(';').map(s => s.trim()).filter(Boolean);
    for (const p of parts) {
      // tough-cookie expects "key=value" and a current URL to scope; we use https with domain
      cookieJar.setCookieSync(p, `https://${domain.replace(/^\./, '')}/`);
    }
    console.log('[parse] Seeded cookies into jar for domain', domain);
  } catch (e) {
    console.warn('[parse] Failed to seed cookies from PARSE_COOKIES:', e?.message || e);
  }
};
seedCookies(cookieJar);

const client = got.extend({
  cookieJar,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'accept-language': 'en-US,en;q=0.9',
    'cache-control': 'no-cache',
    'pragma': 'no-cache',
    'dnt': '1',
    'priority': 'u=0, i',
    'referer': 'https://www.google.com/',
    'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
    'sec-ch-ua-arch': '"arm"',
    'sec-ch-ua-bitness': '"64"',
    'sec-ch-ua-full-version-list': '"Not;A=Brand";v="99.0.0.0", "Google Chrome";v="139.0.7258.155", "Chromium";v="139.0.7258.155"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-model': '""',
    'sec-ch-ua-platform': '"macOS"',
    'sec-ch-ua-platform-version': '"15.6.1"',
    'sec-ch-ua-wow64': '?0',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'cross-site',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
    // cookie header from -b
    'cookie': '_ga=GA1.2.1732219516.1756449496; GOOGLE_ABUSE_EXEMPTION=ID=06f08c5ed85cfb76:TM=1757010984:C=r:IP=52.232.117.55-:S=YiDzEh6Rql3j738cwwv37B4; _gid=GA1.2.515201464.1757011000; displayCookieNotice=y',
  },
});

// simple helper to respect delays and retry on 429/5xx
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const envInt = (name, def) => {
  const v = parseInt(process.env[name] || '', 10);
  return Number.isFinite(v) && v >= 0 ? v : def;
};
const BETWEEN_COUNTRIES_MS = envInt('PARSE_BETWEEN_COUNTRIES_MS', 6000);
const POSTIMG_BASE_DELAY_MS = envInt('PARSE_POSTIMG_BASE_DELAY_MS', 10);
const COUNTRY_MAX_RETRIES = envInt('PARSE_COUNTRY_MAX_RETRIES', 6);

async function fetchWithBackoff(url, maxRetries) {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await client.get(url, { throwHttpErrors: true });
    } catch (e) {
      attempt += 1;
      const status = e?.response?.statusCode || e?.response?.status;
      let retryAfter = e?.response?.headers?.['retry-after'];
      let waitMs = 0;
      if (retryAfter) {
        const asInt = parseInt(retryAfter, 10);
        waitMs = Number.isFinite(asInt) ? asInt * 1000 : 5000;
      } else {
        waitMs = Math.min(10000, 1000 * Math.pow(2, attempt));
      }
      if (status && (status === 429 || (status >= 500 && status < 600)) && attempt <= maxRetries) {
        console.warn(`[parse] ${status} on ${url}. Retry in ${waitMs}ms (attempt ${attempt}/${maxRetries})`);
        await sleep(waitMs);
        continue;
      }
      throw e;
    }
  }
}

const cleanText = text => text.trim().replace(/\u00a0/g, ' ');

(async () => {
  const pages = {
    'Ukraine': 'https://www.oryxspioenkop.com/2022/02/attack-on-europe-documenting-ukrainian.html',
    'Russia': 'https://www.oryxspioenkop.com/2022/02/attack-on-europe-documenting-equipment.html',
  };

  const output = [];

  for await (const country of Object.keys(pages)) {
    // brief pacing before each country fetch
    await sleep(BETWEEN_COUNTRIES_MS);

    const { body: html } = await fetchWithBackoff(pages[country], COUNTRY_MAX_RETRIES);
    const dom = parse(html);

    console.log('parsing', country);

    const mechanics = dom.querySelectorAll('h3')
      .filter(el => el && typeNameRegExp.test(cleanText(el.textContent)));

    for await (const el of mechanics) {
      let { type } = typeNameRegExp.exec(cleanText(el.textContent))?.groups;

      const statuses = ('total: ' + el.textContent)
        .replace(type, '')
        .replace('(', '')
        .replace(')', '')
        .replace('of which ', '')
        .trim()
        .split(',')
        .map(t => t.trim())
        .reduce((acc, t) => {
          const [statusType, count] = t.split(': ');
          acc[statusType] = Number(count?.trim());
          return acc;
        }, {});

      const listOfMechanics = el.querySelectorAll('+ ul li');

      const items = [];

      for await (const lEl of listOfMechanics) {
        const liText = lEl.textContent.trim().replace(/\u00a0/g, ' '); // nbsp
        const { total, name } = machineryName.exec(liText)?.groups ?? {};
        if (!name) continue;

        const links = lEl.querySelectorAll('a')
          .map(linkEl => ({
            url: linkEl.attrs.href,
            title: linkEl.textContent.replace('(', '').replace(')', ''),
          }));

        // Resolve links sequentially with delay to avoid Too Many Requests
        const maxRetries = 3;
        const baseDelayMs = POSTIMG_BASE_DELAY_MS; // delay between requests

        const itemLinks = [];
        for (const link of links) {
          if (link.url.toLowerCase().startsWith('https://postimg.cc/')) {
            if (imgCache[link.url]) {
              itemLinks.push({ title: link.title, url: imgCache[link.url] });
              continue;
            }

            console.log('getting correct image link for', link.url);

            let finalUrl = null;

            const { body } = await fetchWithBackoff(link.url, 3);
            const postimgDom = parse(body);
            const url = postimgDom.querySelector('#code_direct')?.attrs?.value;

            if (url) {
              imgCache[link.url] = url;
              finalUrl = url;
            }

            itemLinks.push({ title: link.title, url: finalUrl || link.url });
            await sleep(baseDelayMs);
          } else {
            itemLinks.push(link);
          }
        }

        items.push({
          total: Number(total),
          name: name.replace(':', ''),
          links: itemLinks,
        });
      }

      if (replaceTypeName[type]) {
        type = replaceTypeName[type];
      }

      if (output.find(o => o.type === type && o.country === country)) {
        output
          .forEach(o => {
            if (o.type === type && o.country === country) {
              o.statuses = {
                total: o.statuses.total + statuses.total,
                destroyed: o.statuses.destroyed + statuses.destroyed,
                captured: o.statuses.captured + statuses.captured,
                abandoned: o.statuses.abandoned + statuses.abandoned,
                damaged: o.statuses.damaged + statuses.damaged,
              }
              o.items = o.items.concat(items);
            }
          });
      } else {
        output.push({
          country,
          type,
          statuses,
          items,
        });
      }
    }

    // extra spacing after finishing a country
    await sleep(BETWEEN_COUNTRIES_MS);
  }

  await fs.writeFile('./src/data/detailed.json', JSON.stringify(output, null, 2));
  await fs.writeFile('./bin/cache/images.json', JSON.stringify(imgCache));
})();

