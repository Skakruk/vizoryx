import { useState } from 'react';
import ImagePreview, { ImagePreviewProvider } from './components/ImagePreview/ImagePreview';
import ListView from './components/ListView/ListView';
import DateRange from './components/DateRange/DateRange';
import './App.css';

function App() {
  const [range, onRangeChange] = useState([]);
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
          </a>{' and '}
          <a
            target="_blank"
            rel="noopener"
            href="https://docs.google.com/spreadsheets/d/1bngHbR0YPS7XH1oSA1VxoL4R34z60SJcR3NxguZM9GI/edit#gid=812571385"
          >
            public sheet
          </a>{' '}
          compiled by <a target="_blank" href="https://twitter.com/oryxspioenkop">Oryx</a>
        </p>
        <DateRange onRangeChange={onRangeChange} />
        <ListView range={range} />
      </div>
      <ImagePreview />
      <p className="remark">
        Gains and delta <i>might</i> not be accurate since not all captured vehicles are confirmed to be operable and
        some of them could be recaptured<br />
        Created by <a target="_blank" href="http://twitter.com/skakruk">Skakruk</a><br />
        Built on {new Date(__BUILD_TIME__).toLocaleString()}
      </p>
    </ImagePreviewProvider>
  )
}

export default App
