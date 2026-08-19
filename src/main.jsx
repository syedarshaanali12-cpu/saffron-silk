import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles.css';
import './admin.css';

class RenderBoundary extends React.Component {
  constructor(props){super(props);this.state={error:null}}
  static getDerivedStateFromError(error){return {error}}
  componentDidCatch(error,info){console.error('Saffron & Silk render error',error,info)}
  render(){if(this.state.error)return <div className="loading"><h1>Saffron & Silk</h1><p>Something went wrong while rendering the site.</p><pre style={{whiteSpace:'pre-wrap',maxWidth:720}}>{String(this.state.error?.message||this.state.error)}</pre></div>;return this.props.children}
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <RenderBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </RenderBoundary>
);
