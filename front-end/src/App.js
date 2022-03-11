import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './Login'
import Header from './Header'
import Footer from './Footer'
import YourList from './YourList' 

function App() {
  return (
    <div className="App">
      <Router>
        <Header />
        <main className="App-main">
          <Routes>
            <Route path="/" element={<Login />}></Route>
              <Route path = "/YourList" element = {<YourList />}> </Route>
          </Routes>
        </main>
        <Footer />
      </Router>
    </div>
  );
}

export default App;