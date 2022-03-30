const { parse } = require('node-html-parser');
const https = require('https');
const { promises: fs } = require('fs');

// const titleRegEx = /(?<country>Russia|Ukraine) - (?<total>\d+), of which: destroyed: (?<destroyed>\d+), damaged: (?<damaged>\d+), abandoned: (?<abandoned>\d+), captured: (?<captured>\d+)/m;
const machineryName = /^(?<total>\d+) (?<name>.+): (?=.+)/m;
const typeNameRegExp = /^(?!(Ukraine|Russia))(?<type>.+) \((\d+), of which (.+)\)/m;

const downloadData = (url) => {
  return new Promise((resolve) => https.get(url, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      try {
        resolve(rawData);
      } catch (e) {
        console.error(e.message);
      }
    });
  }));
}

const run = async () => {
  const html = await downloadData('https://www.oryxspioenkop.com/2022/02/attack-on-europe-documenting-equipment.html');
  // const html = await fs.readFile('./tmp/index.html', 'utf8');

  const dom = parse(html);

  // const titles = dom.querySelectorAll('h3[style*="text-align: left;"] span[style*="color: red;"]')
  //   .map((el) => el.parentNode.textContent)
  //   .filter((value, index, self) => self.indexOf(value) === index)
  //   .map(title => ({ ...titleRegEx.exec(title).groups }));

  const ukraineEl = dom.querySelectorAll('h3 span[style*="color: red;"]')
    .find(el => el.textContent.startsWith('Ukraine'))
    .parentNode;

  const contentNode = ukraineEl.parentNode;
  const ukraineElIndex = contentNode.childNodes.findIndex(el => el === ukraineEl);

  const mechanics = dom.querySelectorAll('h3')
    .filter(el => el && typeNameRegExp.test(el.textContent))
    .map(el => {
      const { type } = typeNameRegExp.exec(el.textContent)?.groups;
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

      const elIndex = Math.max(
        contentNode.childNodes.findIndex(chEl => chEl === el),
        contentNode.childNodes.findIndex(chEl => chEl === el.parentNode)
      );

      let country = 'Russia';
      if (ukraineElIndex < elIndex) {
        country = 'Ukraine';
      }

      const listOfMechanics = el.querySelectorAll('+ ul li');

      const items = listOfMechanics.map(lEl => {
        const liText = lEl.textContent.trim().replace(/\u00a0/g, ' '); // nbsp
        const { total, name } = machineryName.exec(liText).groups;
        return {
          total: Number(total),
          name,
          links: lEl.querySelectorAll('a').map(linkEl => {
            return {
              status: linkEl.textContent.replace('(', '').replace(')', ''),
              link: linkEl.attrs.href,
            };
          })
        };
      });

      return {
        country,
        type,
        statuses,
        items,
      }
    });
    // .reduce((acc, obj) => {
    //   if (!acc[obj.country]) {
    //     acc[obj.country] = [];
    //   }
    //   acc[obj.country].push({
    //     type: obj.type,
    //     statuses: obj.statuses,
    //     items: obj.items,
    //   });
    //   return acc;
    // }, {});

  await fs.writeFile('./src/statistics.json', JSON.stringify(mechanics, null, 2))
}

run();

