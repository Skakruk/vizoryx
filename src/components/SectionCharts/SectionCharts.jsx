import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import statsByDayDB from '../../data/byDay.json';
import cls from './styles.module.css';

const statuses = ['captured', 'destroyed', 'damaged', 'abandoned'];

const findData = (country, category, range) => {
  return statsByDayDB
    .filter(day => {
      if (range) {
        const date = new Date(day.date);
        return date >= range[0] && date <= range[1];
      }
      return true;
    })
    .map((day, _, stats) => {
      if (range) {
        const startDay = stats[0][country][category];
        return {
          date: day.date,
          ...(statuses.reduce((acc, status) => {
            acc[status] = day[country][category][status] - startDay[status];
            return acc;
          }, {})),
        }
      } else {
        return {
          date: day.date,
          ...day[country][category],
        }
      }
    });
}

const colors = [
  '#FF6E40',
  '#EEFF41',
  '#90CAF9',
  '#00E676'
];

const lossTypes = ['destroyed', 'damaged', 'abandoned', 'captured']
  .map((type, idx) => ({
    name: type,
    color: colors[idx]
  }));

const toPercent = (decimal, fixed = 0) => `${(decimal * 100).toFixed(fixed)}%`;

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

const xAxisFormatter = (dateStr) => dateStr ? dateFormatter.format(new Date(dateStr)) : '';

const getPercent = (value, total) => {
  const ratio = total > 0 ? value / total : 0;

  return toPercent(ratio, 2);
};

const renderTooltipContent = ({ payload, label }) => {
  if (!payload) return null;

  const total = payload.reduce((result, entry) => result + entry.value, 0);
  return (
    <div className={cls.tooltip}>
      <p className={cls.tooltipTotal}>{`${xAxisFormatter(label)} (Total: ${total})`}</p>
      <ul className={cls.tooltipList}>
        {payload.map((entry, index) => {
          const lossType = lossTypes.find(t => t.name === entry.name);
          return (
            <li key={`item-${index}`} style={{ color: lossType.color }}>
              {`${entry.name}: ${entry.value} `}
              <span>{getPercent(entry.value, total)}</span>
            </li>
          )
        })}
      </ul>
    </div>
  );
};

const renderColorfulLegendText = (value) => {
  const { color } = lossTypes.find(t => t.name === value);
  return <span style={{ color }}>{value}</span>;
};

const hasData = (data) => {
  return data.some(d => {
    return lossTypes.map(({ name }) => name).some(type => d[type] > 0);
  })
}

const SectionCharts = ({ type, range }) => {
  const rusData = findData('Russia', type, range);
  const ukrData = findData('Ukraine', type, range);

  return (
    <div className={cls.chartsWrapper}>
      {
        hasData(rusData) ? (
          <>
            <h4>Russia</h4>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart
                width={500}
                height={200}
                data={rusData}
                syncId={`chart-${type}`}
                margin={{
                  left: -25,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={xAxisFormatter}
                />
                <YAxis />
                <Tooltip content={renderTooltipContent} />
                {
                  lossTypes.map(t => (
                    <Area
                      key={t.name}
                      isAnimationActive={false}
                      type="monotone"
                      fill={t.color}
                      dataKey={t.name}
                      stackId="1"
                      fillOpacity={.9}
                      stroke="#666"
                    />
                  ))
                }
              </AreaChart>
            </ResponsiveContainer>
          </>

        ) : null
      }
      {
        hasData(ukrData) ? (
          <>
            <h4>Ukraine</h4>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart
                width={500}
                height={200}
                data={ukrData}
                syncId={`chart-${type}`}
                margin={{
                  left: -25,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={xAxisFormatter} />
                <YAxis />
                <Tooltip content={renderTooltipContent} />
                <Legend formatter={renderColorfulLegendText} />
                {
                  lossTypes.map(t => (
                    <Area
                      key={t.name}
                      isAnimationActive={false}
                      type="monotone"
                      fill={t.color}
                      dataKey={t.name}
                      stackId="1"
                      fillOpacity={.9}
                      stroke="#666"
                    />
                  ))
                }
              </AreaChart>
            </ResponsiveContainer>
          </>
        ) : null
      }
    </div>
  );
}

export default SectionCharts;
