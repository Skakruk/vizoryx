import './App.css';
import stats from './statistics.json';
import Section from './components/Section/Section';
import ImagePreview, { ImagePreviewProvider } from './components/ImagePreview/ImagePreview';

const excludeFromTotals = ['man-portable air defence systems', 'anti-tank guided missiles'];

function App() {
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

  const { Russia: rusTotal, Ukraine: ukrTotal } = stats.reduce((acc, entry) => {
    if (!acc[entry.country]) {
      acc[entry.country] = 0;
    }
    if (!excludeFromTotals.includes(entry.type.toLowerCase())) {
      acc[entry.country] += entry.statuses.total;
    }
    return acc;
  }, {});

  return (
    <ImagePreviewProvider>
      <div className="main">
        <h1>Visual confirmed losses</h1>
        <p className="description">Sourced from{' '}
          <a
            target="_blank"
            rel="noopener"
            href="https://www.oryxspioenkop.com/2022/02/attack-on-europe-documenting-equipment.html"
          >
            oryxspioenkop.com
          </a>{' '}
          compiled by <a target="_blank" href="https://twitter.com/oryxspioenkop">Oryx</a>
        </p>
        <div className="sections">
          <section className="section country-total">
            <div className="columns">
              <div className="column">
                <h2>Russia</h2>
                &nbsp;
                <span className="total">{rusTotal}</span>
              </div>
              <div className="column column-center">
                <span className="ratio" title="Ratio of losses">{
                  rusTotal > ukrTotal
                    ? `${Math.round(rusTotal / ukrTotal)} / 1`
                    : `1 / ${Math.round(ukrTotal / rusTotal)}`
                }</span>
              </div>
              <div className="column column-right">
                <h2>Ukraine</h2>
                &nbsp;
                <span className="total">{ukrTotal}</span>
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
      </div>
      <ImagePreview />
      <p className="remark">
        * From ultimate count excluded: {excludeFromTotals.join(', ')}<br />
        Gains and delta <i>might</i> not be accurate since not all captured vehicles are confirmed to be operable and some of them could be recapruted<br/>
        Created by <a target="_blank" href="http://twitter.com/skakruk">Skakruk</a>
      </p>
    </ImagePreviewProvider>
  )
}

export default App
