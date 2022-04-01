import Ratio from '../Ratio/Ratio';
import Section from '../Section/Section';
import stats from '../../statistics.json';
import cls from './styles.module.css';
import classNames from 'classnames';

export const excludeFromTotals = ['man-portable air defence systems', 'anti-tank guided missiles'];
const formatNumber = new Intl.NumberFormat('en-US', {
  signDisplay: 'exceptZero',
});


const Head = () => {
  const commonSections = stats.reduce((acc, entry, idx, self) => {
    if (idx < self.findIndex((se, i) => i > idx && se.type.toLowerCase() === entry.type.toLowerCase())) {
      acc.push(entry.type.toLowerCase());
    }
    return acc;
  }, []);

  const otherSections = stats.reduce((acc, entry) => {
    if (!commonSections.includes(entry.type.toLowerCase())) {
      acc.push(entry.type.toLowerCase());
    }
    return acc;
  }, []);

  const { Russia: rusStats, Ukraine: ukrStats } = stats.reduce((acc, entry) => {
    if (!acc[entry.country]) {
      acc[entry.country] = {
        total: 0,
        captured: 0,
      };
    }
    if (!excludeFromTotals.includes(entry.type.toLowerCase())) {
      acc[entry.country].total += entry.statuses.total;
      acc[entry.country].captured += entry.statuses.captured ?? 0;
    }
    return acc;
  }, {});

  const rusDelta = (ukrStats.captured ?? 0) - rusStats.total;
  const ukrDelta = (rusStats.captured ?? 0) - ukrStats.total;

  return (
    <div className={cls.sections}>
      <section className={classNames(cls.section, cls.countryTotal)}>
        <div className={cls.columns}>
          <div className={cls.column}>
            <h2>Russia</h2>
            &nbsp;
            <span className={cls.total}>{formatNumber.format(-rusStats.total)}</span>
            {
              ukrStats.captured > 0 ? (
                <>
                  <span className={cls.gain} title="Captured from opposite side">+{ukrStats.captured}</span>
                  <span className={cls.delta}>&Delta; {formatNumber.format(rusDelta)}</span>
                </>
              ) : null
            }
          </div>
          <div className={classNames(cls.column, cls.columnCenter)}>
            <Ratio
              className={cls.ratio}
              left={rusStats.total}
              right={ukrStats.total}
            />
          </div>
          <div className={classNames(cls.column, cls.columnRight)}>
            <h2>Ukraine</h2>
            &nbsp;
            <span className={cls.total}>{formatNumber.format(-ukrStats.total)}</span>
            {
              rusStats.captured > 0 ? (
                <>
                  <span className={cls.gain} title="Captured from opposite side">+{rusStats.captured}</span>
                  <span className={cls.delta}>&Delta; {formatNumber.format(ukrDelta)}</span>
                </>
              ) : null
            }
          </div>
        </div>
      </section>
      {
        commonSections.map(sectionType => (
          <Section key={sectionType} type={sectionType} />
        ))
      }
      {
        otherSections.map(sectionType => (
          <Section key={sectionType} type={sectionType} />
        ))
      }
    </div>
  )
}
export default Head;
