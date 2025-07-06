import PublicGoogleSheetsParser from 'public-google-sheets-parser';
import { promises as fs } from 'fs';

const spreadsheetId = '1bngHbR0YPS7XH1oSA1VxoL4R34z60SJcR3NxguZM9GI';
const parser = new PublicGoogleSheetsParser();

const replaceCategoryNames = {
  'engineering vehicles': 'engineering vehicles and equipment',
  'radars': 'radars and communications equipment',
  'mine-resistant ambush protected': 'mine-resistant ambush protected (mrap) vehicles',
  'trucks, vehicles and jeeps': 'trucks, vehicles, jeeps, and trains',
  'naval ships': 'naval ships and submarines',
  'multiple rocket launchers': 'rocket and missile artillery'
};

const parseSheet = async (sheetName) => {
  const items = await parser.parse(spreadsheetId, sheetName);
  return items.reduce((acc, item) => {
    const values = Object.keys(item)
      .filter(key => !['Date'].includes(key))
      .reduce((accKey, key) => {
        const [country, ...restNames] = key.split('_');

        if (!accKey[country]) {
          accKey[country] = {};
        }

        if (restNames.length > 0) {
          let categoryName = restNames.join(' ').toLowerCase();

          if (replaceCategoryNames[categoryName]) {
            categoryName = replaceCategoryNames[categoryName]
          }


          accKey[country][categoryName] = (accKey[country][categoryName] ?? 0) + item[key];
        }

        return accKey;
      }, {});

    const entry = {
      date: item.Date,
      ...values
    }

    acc.push(entry);

    return acc;
  }, []);
}

(async () => {
  const sheets = ['Totals', 'Destroyed', 'Damaged', 'Abandoned', 'Captured'];

  const [totals, destroyed, damaged, abandoned, captured] = await Promise.all(sheets.map(parseSheet));

  const finalItems = totals.map(item => {
    return {
      date: item.date,
      Russia: Object.keys(item.Russia).reduce((acc, category, idx, self) => {
        acc[category] = {
          totals: self[category],
          destroyed: destroyed.find(i => i.date === item.date).Russia?.[category] ?? 0,
          damaged: damaged.find(i => i.date === item.date).Russia?.[category] ?? 0,
          abandoned: abandoned.find(i => i.date === item.date).Russia?.[category] ?? 0,
          captured: captured.find(i => i.date === item.date).Russia?.[category] ?? 0,
        };
        return acc;
      }, {}),
      Ukraine: Object.keys(item.Ukraine).reduce((acc, category, self) => {
        acc[category] = {
          totals: self[category],
          destroyed: destroyed.find(i => i.date === item.date).Ukraine?.[category] ?? 0,
          damaged: damaged.find(i => i.date === item.date).Ukraine?.[category] ?? 0,
          abandoned: abandoned.find(i => i.date === item.date).Ukraine?.[category] ?? 0,
          captured: captured.find(i => i.date === item.date).Ukraine?.[category] ?? 0,
        };
        return acc;
      }, {}),
    };
  });

  await fs.writeFile('./src/data/byDay.json', JSON.stringify(finalItems, null, 2));
})();
