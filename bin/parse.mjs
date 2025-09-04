import { parse } from 'node-html-parser';
import { promises as fs } from 'fs';
import got from 'got';
import imgCache from './cache/images.json' with { type: 'json' };

const machineryName = /^(?<total>\d+) (?<name>[A-z-0-9\/\s'"\(\).]+)/m;
const typeNameRegExp = /^(?!(Ukraine|Russia))(?<type>.+) \((\d+), of which (.+)\)/m;

const replaceTypeName = {
  'Engineering Vehicles': 'Engineering Vehicles and Equipment',
  'Radars': 'Radars And Communications Equipment',
  'Naval Ships': 'Naval Ships and Submarines',
  'Trucks, Vehicles, and Jeeps': 'Trucks, Vehicles, Jeeps, and Trains',
};

const client = got.extend({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.google.com/",
  },
});

// simple helper to respect delays and retry on 429/5xx
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const envInt = (name, def) => {
  const v = parseInt(process.env[name] || '', 10);
  return Number.isFinite(v) && v >= 0 ? v : def;
};
const BETWEEN_COUNTRIES_MS = envInt('PARSE_BETWEEN_COUNTRIES_MS', 6000);
const BETWEEN_MECHANICS_MS = envInt('PARSE_BETWEEN_MECHANICS_MS', 400);
const BETWEEN_ITEMS_MS = envInt('PARSE_BETWEEN_ITEMS_MS', 150);
const POSTIMG_BASE_DELAY_MS = envInt('PARSE_POSTIMG_BASE_DELAY_MS', 1200);
const COUNTRY_MAX_RETRIES = envInt('PARSE_COUNTRY_MAX_RETRIES', 4);

async function fetchWithBackoff(url) {
  let attempt = 0;
  while (attempt <= COUNTRY_MAX_RETRIES) {
    try {
      const res = await client.get(url, { throwHttpErrors: true });
      return res;
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
      if (status && (status === 429 || (status >= 500 && status < 600)) && attempt <= COUNTRY_MAX_RETRIES) {
        console.warn(`[parse] ${status} on ${url}. Retry in ${waitMs}ms (attempt ${attempt}/${COUNTRY_MAX_RETRIES})`);
        await sleep(waitMs);
        continue;
      }
      throw e;
    }
  }
}

const cleanText = text => text.trim().replace(/\u00a0/g, ' ');
const resolveWithDelay = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const pages = {
    'Ukraine': 'https://www.oryxspioenkop.com/2022/02/attack-on-europe-documenting-ukrainian.html',
    'Russia': 'https://www.oryxspioenkop.com/2022/02/attack-on-europe-documenting-equipment.html',
  };

  const output = [];

  for await (const country of Object.keys(pages)) {
    // brief pacing before each country fetch
    await sleep(BETWEEN_COUNTRIES_MS);

    const { body: html } = await fetchWithBackoff(pages[country]);
    const dom = parse(html);

    const mechanics = dom.querySelectorAll('h3')
      .filter(el => el && typeNameRegExp.test(cleanText(el.textContent)));

    for await (const el of mechanics) {
      await sleep(BETWEEN_MECHANICS_MS);
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
        await sleep(BETWEEN_ITEMS_MS);
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
            let attempt = 0;
            let success = false;
            let finalUrl = null;
            while (attempt < maxRetries && !success) {
              try {
                const { body } = await client.get(link.url);
                const postimgDom = parse(body);
                const url = postimgDom.querySelector('#code_direct')?.attrs?.value;
                if (url) {
                  imgCache[link.url] = url;
                  finalUrl = url;
                  success = true;
                } else {
                  throw new Error('Direct image url not found');
                }
              } catch (e) {
                attempt += 1;
                const backoff = baseDelayMs * Math.pow(2, attempt);
                console.warn(`Failed to resolve ${link.url} (attempt ${attempt}/${maxRetries}): ${e.message}`);
                if (attempt < maxRetries) {
                  await resolveWithDelay(backoff);
                }
              }
            }

            itemLinks.push({ title: link.title, url: finalUrl || link.url });
            await resolveWithDelay(baseDelayMs);
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

