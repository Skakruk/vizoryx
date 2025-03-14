import { useEffect, useState } from 'react';
import DateRangePicker from '@wojtekmaj/react-daterange-picker';
import './styles.css';
import statsByDayDB from '../../data/byDay.json';

const dates = statsByDayDB.map(db => db.date);
const minDate = new Date(dates[0]);
const maxDate = new Date(dates[dates.length - 1]);

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

const DateRange = ({ onRangeChange }) => {
  const [value, onChange] = useState();

  useEffect(() => {
    onRangeChange(value);
  }, [value]);

  return (
    <div className="date-picker">
      <span className="range">
        {
          value ? (
            <>{dateFormatter.format(value[0])} - {dateFormatter.format(value[1])}</>
          ) : 'Whole time'
        }
      </span>
      <DateRangePicker
        onChange={onChange}
        value={value}
        minDate={minDate}
        maxDate={maxDate}
        minDetail="year"
        className="date-picker-input"
      />
    </div>

  )
}

export default DateRange;
