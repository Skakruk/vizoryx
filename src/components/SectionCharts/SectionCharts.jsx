import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import statsByDayDB from '../../statisticsByDay.json';
import cls from './styles.module.css';

const findData = (country, category) => {
  return statsByDayDB.map(day => {
    return {
      date: day.date,
      ...day[country][category],
    }
  });
}

const colors = [
  '#FF6E40',
  '#EEFF41',
  '#90CAF9',
  '#00E676'
];

const lossTypes = ['destroyed', 'damaged', 'abandoned', 'captured'].map((type, idx) => ({
  name: type,
  color: colors[idx]
}));

const toPercent = (decimal, fixed = 0) => `${(decimal * 100).toFixed(fixed)}%`;

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

const yAxisToPercent = (decimal) => toPercent(decimal, 0);
const xAxisFormatter = (dateStr) => dateStr ? dateFormatter.format(new Date(dateStr)) : '';

const getPercent = (value, total) => {
  const ratio = total > 0 ? value / total : 0;

  return toPercent(ratio, 2);
};

const renderTooltipContent = ({ payload, label }) => {
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

const SectionCharts = ({ type }) => {
  const rusData = findData('Russia', type);
  const ukrData = findData('Ukraine', type);

  return (
    <div className={cls.chartsWrapper}>
      <h4>Russia</h4>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          width={500}
          height={200}
          data={rusData}
          stackOffset="expand"
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
          <YAxis tickFormatter={yAxisToPercent} />
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
      <h4>Ukraine</h4>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          width={500}
          height={200}
          data={ukrData}
          stackOffset="expand"
          syncId={`chart-${type}`}
          margin={{
            left: -25,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={xAxisFormatter} />
          <YAxis tickFormatter={yAxisToPercent} />
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
    </div>

  );
}

export default SectionCharts;
