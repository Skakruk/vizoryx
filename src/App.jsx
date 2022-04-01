import ImagePreview, { ImagePreviewProvider } from './components/ImagePreview/ImagePreview';
import Head, { excludeFromTotals } from './components/Head/Head';
import './App.css';

function App() {
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
        <Head />
      </div>
      <ImagePreview />
      <p className="remark">
        * From ultimate count excluded: {excludeFromTotals.join(', ')}<br />
        Gains and delta <i>might</i> not be accurate since not all captured vehicles are confirmed to be operable and
        some of them could be recaptured<br />
        Created by <a target="_blank" href="http://twitter.com/skakruk">Skakruk</a>
      </p>
    </ImagePreviewProvider>
  )
}

export default App
